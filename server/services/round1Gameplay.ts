import { randomInt } from 'node:crypto';
import type { Pool, PoolClient } from 'pg';
import { Round1Service } from '../../src/services/round1Service.ts';
import type { Round1TeamSessionState, StageId } from '../../src/types/round1.types.ts';
import { recordCreditEventInTransaction, recordScoreEventInTransaction } from '../../database/postgres/ledger.ts';
import { withPostgresTransaction } from '../../database/postgres/transaction.ts';

export class Round1GameError extends Error {
  readonly status: number;
  constructor(message: string, status = 400) { super(message); this.status = status; this.name = 'Round1GameError'; }
}

type Round1Config = {
  durationMinutes: number;
  stage1: ReturnType<Round1Service['getStage1Config']>;
  stage2: ReturnType<Round1Service['getStage2Config']>;
  stage3: ReturnType<Round1Service['getStage3Config']>;
  lifecycle: 'not_started' | 'running' | 'paused' | 'completed';
  pausedGlobalTimer?: boolean;
};

const defaults = (): Round1Config => {
  const service = new Round1Service();
  return { durationMinutes: service.getDurationMinutes(), stage1: service.getStage1Config(), stage2: service.getStage2Config(), stage3: service.getStage3Config(), lifecycle: 'not_started' };
};

export async function getRound1Config(pool: Pool): Promise<Round1Config> {
  await pool.query(`INSERT INTO round1_configuration(singleton_id,configuration) VALUES(1,'{}'::jsonb) ON CONFLICT DO NOTHING`);
  const result = await pool.query<{ configuration: Partial<Round1Config> }>('SELECT configuration FROM round1_configuration WHERE singleton_id=1');
  const base = defaults();
  const stored = result.rows[0]?.configuration ?? {};
  return {
    ...base, ...stored,
    stage1: { ...base.stage1, ...(stored.stage1 ?? {}), trials: stored.stage1?.trials ?? base.stage1.trials },
    stage2: { ...base.stage2, ...(stored.stage2 ?? {}), images: base.stage2.images, targets: base.stage2.targets },
    stage3: { ...base.stage3, ...(stored.stage3 ?? {}), grave1: { ...base.stage3.grave1, ...(stored.stage3?.grave1 ?? {}) }, grave2: { ...base.stage3.grave2, ...(stored.stage3?.grave2 ?? {}) }, grave3: { ...base.stage3.grave3, ...(stored.stage3?.grave3 ?? {}) }, finalGate: { ...base.stage3.finalGate, ...(stored.stage3?.finalGate ?? {}) } },
  };
}

function validateConfigPatch(stage: 'stage1' | 'stage2' | 'stage3', patch: unknown): Record<string, unknown> {
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) throw new Round1GameError('Configuration object is required.');
  const values = patch as Record<string, unknown>;
  const allowed = stage === 'stage1' ? ['title','description','instructions','isReadyForPublication']
    : stage === 'stage2' ? ['hintDeduction','incorrectClickPenalty'] : ['correctCode','acceptedAnswer','incorrectAnswerPenalty'];
  if (Object.keys(values).some((key) => !allowed.includes(key))) throw new Round1GameError('Configuration contains unsupported fields.');
  if (stage === 'stage1') {
    for (const key of ['title','description','instructions']) if (key in values && (typeof values[key] !== 'string' || !(values[key] as string).trim() || (values[key] as string).length > 500)) throw new Round1GameError(`${key} must be a non-empty string of at most 500 characters.`);
    if ('isReadyForPublication' in values && typeof values.isReadyForPublication !== 'boolean') throw new Round1GameError('isReadyForPublication must be boolean.');
  } else if (stage === 'stage2') {
    for (const key of ['hintDeduction','incorrectClickPenalty']) if (key in values && (!Number.isInteger(values[key]) || Number(values[key]) < 0 || Number(values[key]) > (key === 'hintDeduction' ? 50 : 25))) throw new Round1GameError(`${key} is outside its allowed range.`);
  } else {
    if ('correctCode' in values && (typeof values.correctCode !== 'string' || !/^\d{1,8}$/.test(values.correctCode))) throw new Round1GameError('Coffer code must contain 1–8 digits.');
    if ('acceptedAnswer' in values && (typeof values.acceptedAnswer !== 'string' || !values.acceptedAnswer.trim() || values.acceptedAnswer.length > 120)) throw new Round1GameError('Accepted answer must contain 1–120 characters.');
    if ('incorrectAnswerPenalty' in values && (!Number.isInteger(values.incorrectAnswerPenalty) || Number(values.incorrectAnswerPenalty) < 0 || Number(values.incorrectAnswerPenalty) > 50)) throw new Round1GameError('Incorrect answer penalty must be between 0 and 50.');
  }
  return values;
}

export async function updateRound1Config(pool: Pool, adminId: string, stage: 'stage1'|'stage2'|'stage3', input: unknown): Promise<Round1Config> {
  const patch = validateConfigPatch(stage, input);
  const current = await getRound1Config(pool);
  const next: Round1Config = { ...current };
  if(stage==='stage3'){
    const {correctCode,acceptedAnswer,incorrectAnswerPenalty}=patch as {correctCode?:string;acceptedAnswer?:string;incorrectAnswerPenalty?:number};
    next.stage3={...current.stage3,grave2:{...current.stage3.grave2,...(correctCode===undefined?{}:{correctCode})},finalGate:{...current.stage3.finalGate,...(acceptedAnswer===undefined?{}:{acceptedAnswer:acceptedAnswer.trim().toUpperCase()})},...(incorrectAnswerPenalty===undefined?{}:{incorrectAnswerPenalty})};
  }else next[stage]={...current[stage],...patch} as never;
  await pool.query('UPDATE round1_configuration SET configuration=$1::jsonb,updated_by=$2,updated_at=now() WHERE singleton_id=1', [JSON.stringify(next),adminId]);
  return next;
}

const stageNumber = (stage: StageId): number => stage === 'stage-1' ? 1 : stage === 'stage-2' ? 2 : 3;
const norm = (text: string): string => text.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
export type Round1TimingMetrics = Record<string, number>;

async function measure<T>(metrics: Round1TimingMetrics | undefined, label: string, operation: () => Promise<T>): Promise<T> {
  const startedAt = performance.now();
  try { return await operation(); }
  finally { if (metrics) metrics[label] = (metrics[label] ?? 0) + performance.now() - startedAt; }
}

async function loadGame(client: PoolClient, teamId: string, metrics?: Round1TimingMetrics, lockRows = true): Promise<{ game: Round1Service; session: Round1TeamSessionState; rows: { stage_id: number; status: string; score: number; max_score: number; state: Record<string, unknown> }[]; teamName: string; totalCredits: number; config: Round1Config }> {
  const rowLock = lockRows ? ' FOR UPDATE' : '';
  const team=await measure(metrics,'teamQueryMs',()=>client.query<{ team_name: string; score: number; max_credits: number; total_credits: number }>(`SELECT team_name,score,max_credits,total_credits FROM teams WHERE id=$1${rowLock}`,[teamId]));
  const rows=await measure(metrics,'stageStateQueryMs',()=>client.query<{ stage_id: number; status: string; score: number; max_score: number; state: Record<string, unknown> }>(`SELECT stage_id,status,score,max_score,state FROM round1_stage_progress WHERE team_id=$1 ORDER BY stage_id${rowLock}`,[teamId]));
  const progress=await measure(metrics,'progressionQueryMs',()=>client.query<{ status: string; time_spent_seconds: number }>(`SELECT status,time_spent_seconds FROM round_progress WHERE team_id=$1 AND round_id=1${rowLock}`,[teamId]));
  const cfg=await measure(metrics,'configurationLoadMs',()=>getRound1ConfigForClient(client));
  if (!team.rowCount) throw new Round1GameError('Team not found.',404);
  if (rows.rowCount !== 3 || !progress.rowCount) throw new Round1GameError('Round 1 team records are not initialized.',409);
  if (!['IN_PROGRESS'].includes(progress.rows[0].status)) throw new Round1GameError('Round 1 is locked or not active for this team.',423);
  const initializationStartedAt=performance.now();
  const game = new Round1Service();
  game.updateStage1Config(cfg.stage1); game.updateStage2Config(cfg.stage2); game.updateStage3Config(cfg.stage3); game.setDurationMinutes(cfg.durationMinutes);
  const persisted = (rows.rows.find((r) => r.state?.round1Session)?.state?.round1Session as Round1TeamSessionState | undefined);
  const session = persisted ?? game.snapshotTeamSession(teamId,team.rows[0].team_name);
  session.teamId=teamId; session.teamName=team.rows[0].team_name; session.credits=team.rows[0].score;
  session.totalDurationMinutes=cfg.durationMinutes;
  for(const row of rows.rows){
    const id=`stage-${row.stage_id}` as StageId; const item=session.stages[id];
    item.status=(item.status==='skipped'?'skipped':row.status.toLowerCase()) as typeof item.status; item.earnedCredits=row.score;
    item.rewardCredits=row.max_score;
  }
  session.scoreTransactions = session.scoreTransactions ?? [];
  game.restoreTeamSession(session);
  if(metrics)metrics.initializationMs=performance.now()-initializationStartedAt;
  return {game,session,rows:rows.rows,teamName:team.rows[0].team_name,totalCredits:team.rows[0].total_credits,config:cfg};
}

async function getRound1ConfigForClient(client: PoolClient): Promise<Round1Config> {
  const result = await client.query<{ configuration: Partial<Round1Config> }>('SELECT configuration FROM round1_configuration WHERE singleton_id=1');
  const base=defaults(), stored=result.rows[0]?.configuration??{};
  return { ...base,...stored,stage1:{...base.stage1,...(stored.stage1??{})},stage2:{...base.stage2,...(stored.stage2??{}),images:base.stage2.images,targets:base.stage2.targets},stage3:{...base.stage3,...(stored.stage3??{}),grave1:{...base.stage3.grave1,...(stored.stage3?.grave1??{})},grave2:{...base.stage3.grave2,...(stored.stage3?.grave2??{})},grave3:{...base.stage3.grave3,...(stored.stage3?.grave3??{})},finalGate:{...base.stage3.finalGate,...(stored.stage3?.finalGate??{})}} };
}

export async function getTeamRound1State(pool: Pool, teamId: string, metrics?: Round1TimingMetrics) {
  const serviceStartedAt=performance.now();
  try {
    // This display-only read previously used five serial SELECTs inside a
    // transaction. A single aggregate statement is both cheaper and gives the
    // client a consistent snapshot; gameplay mutations retain their row locks.
    const result=await measure(metrics,'stateQueryMs',()=>pool.query<{
      team_name:string; score:number; total_credits:number; max_credits:number;
      progress_status:string|null; configuration:Partial<Round1Config>|null;
      round_is_active:boolean|null; duration_seconds:number|null; start_time:Date|null;
      stage_rows:{stage_id:number;status:string;score:number;max_score:number;state:Record<string,unknown>}[];
    }>(`SELECT t.team_name,t.score,t.total_credits,t.max_credits,p.status AS progress_status,
        c.configuration,r.is_active AS round_is_active,r.duration_seconds,r.start_time,
        COALESCE((SELECT jsonb_agg(jsonb_build_object('stage_id',s.stage_id,'status',s.status,
          'score',s.score,'max_score',s.max_score,'state',s.state) ORDER BY s.stage_id)
          FROM round1_stage_progress s WHERE s.team_id=t.id),'[]'::jsonb) AS stage_rows
      FROM teams t
      LEFT JOIN round_progress p ON p.team_id=t.id AND p.round_id=1
      LEFT JOIN round1_configuration c ON c.singleton_id=1
      LEFT JOIN rounds r ON r.round_id=1
      WHERE t.id=$1`,[teamId]));
    const row=result.rows[0];
    if(!row)throw new Round1GameError('Team not found.',404);
    if(row.stage_rows.length!==3||!row.progress_status)throw new Round1GameError('Round 1 team records are not initialized.',409);
    if(row.progress_status==='LOCKED'){
      await pool.query("UPDATE round_progress SET status='IN_PROGRESS', updated_at=now() WHERE team_id=$1 AND round_id=1",[teamId]);
      row.progress_status='IN_PROGRESS';
    }
    const base=defaults(),stored=row.configuration??{};
    const config:Round1Config={...base,...stored,
      stage1:{...base.stage1,...(stored.stage1??{}),trials:stored.stage1?.trials??base.stage1.trials},
      stage2:{...base.stage2,...(stored.stage2??{}),images:base.stage2.images,targets:base.stage2.targets},
      stage3:{...base.stage3,...(stored.stage3??{}),grave1:{...base.stage3.grave1,...(stored.stage3?.grave1??{})},grave2:{...base.stage3.grave2,...(stored.stage3?.grave2??{})},grave3:{...base.stage3.grave3,...(stored.stage3?.grave3??{})},finalGate:{...base.stage3.finalGate,...(stored.stage3?.finalGate??{})}},
    };
    const initializationStartedAt=performance.now();
    const game=new Round1Service();
    game.updateStage1Config(config.stage1);game.updateStage2Config(config.stage2);game.updateStage3Config(config.stage3);game.setDurationMinutes(config.durationMinutes);
    const persisted = (row.stage_rows.find((s) => s.state?.round1Session)?.state?.round1Session as Round1TeamSessionState | undefined);
    const session = persisted ?? game.snapshotTeamSession(teamId, row.team_name);
    const stageCreditsSum = row.stage_rows.reduce((sum, r) => sum + Number(r.score || 0), 0);
    const authoritativeScore = Math.max(Number(row.score || 0), stageCreditsSum);
    session.teamId = teamId;
    session.teamName = row.team_name;
    session.credits = authoritativeScore;
    session.totalDurationMinutes = config.durationMinutes;
    for(const stageRow of row.stage_rows){
      const id=`stage-${stageRow.stage_id}` as StageId;const item=session.stages[id];
      item.status=(item.status==='skipped'?'skipped':stageRow.status.toLowerCase()) as typeof item.status;
      item.earnedCredits=stageRow.score;item.rewardCredits=stageRow.max_score;
    }
    session.scoreTransactions=session.scoreTransactions??[];
    game.restoreTeamSession(session);

    // Each squad gets their own timer starting exactly when they enter Round 1
    if (!session.roundStartTime || !session.roundDeadline) {
      const now = new Date();
      session.roundStartTime = now.toISOString();
      session.roundDeadline = new Date(now.getTime() + config.durationMinutes * 60 * 1000).toISOString();
      session.status = 'active';
      game.restoreTeamSession(session);
      await pool.query(
        "UPDATE round1_stage_progress SET state=jsonb_set(COALESCE(state, '{}'::jsonb), '{round1Session}', $1::jsonb, true), updated_at=now() WHERE team_id=$2 AND stage_id=1",
        [JSON.stringify(session), teamId]
      );
      await pool.query(
        "UPDATE round_progress SET status='IN_PROGRESS', updated_at=now() WHERE team_id=$1 AND round_id=1 AND status!='COMPLETED'",
        [teamId]
      );
    }

    if(metrics)metrics.initializationMs=performance.now()-initializationStartedAt;
    const deadline=session.roundDeadline?new Date(session.roundDeadline).getTime():null;
    const teamRemaining=deadline===null?config.durationMinutes*60:Math.max(0,Math.floor((deadline-Date.now())/1000));
    const remainingSeconds=config.lifecycle==='paused'&&typeof session.pausedRemainingSeconds==='number'
      ?session.pausedRemainingSeconds:teamRemaining;
    const endsAt=config.lifecycle==='paused'?null:deadline===null?null:new Date(deadline).toISOString();
    const roundAcceptsPlay=true;
    return {session,remainingSeconds,endsAt,roundActive:roundAcceptsPlay,score:session.credits,totalCredits:row.total_credits,
      stages:row.stage_rows.map(({stage_id,status,score,max_score,state})=>({stageId:stage_id,status,score,maxScore:max_score,state})),config};
  } finally {if(metrics)metrics.serviceTotalMs=performance.now()-serviceStartedAt;}
}

export type Round1Action = { actionId:string; type:string; [key:string]:unknown };

export async function performRound1Action(pool: Pool, teamId: string, action: Round1Action) {
  if (typeof action.actionId!=='string'||action.actionId.length<8||action.actionId.length>120) throw new Round1GameError('A valid actionId is required.');
  return withPostgresTransaction(pool,async(client)=>{
    if (!(await client.query('SELECT 1 FROM teams WHERE id=$1 FOR UPDATE',[teamId])).rowCount) throw new Round1GameError('Team not found.',404);
    const old=await client.query<{response:unknown}>('SELECT response FROM round1_action_events WHERE team_id=$1 AND action_id=$2',[teamId,action.actionId]);
    if(old.rowCount)return { ...(old.rows[0].response as object),duplicate:true };
    const {game,session,rows,config,totalCredits:initialTotalCredits}=await loadGame(client,teamId);
    const live=await client.query<{is_active:boolean;duration_seconds:number;start_time:Date|null}>('SELECT is_active,duration_seconds,start_time FROM rounds WHERE round_id=1 FOR SHARE');
    if(config.lifecycle==='paused'||config.lifecycle==='completed')throw new Round1GameError('Round 1 timer is not accepting gameplay actions.',423);
    const stage=(id:StageId)=>session.stages[id];
    let result:Record<string,unknown>={success:true};
    const beforeTx=session.scoreTransactions.length;
    if (!session.roundStartTime || !session.roundDeadline) {
      game.beginRound1(teamId, session.teamName);
    }
    const teamRemaining=game.getTimeRemainingSeconds(teamId);
    if(teamRemaining<=0){
      session.status='expired';session.roundEndTime??=new Date().toISOString();
      const snapshot=game.snapshotTeamSession(teamId,session.teamName);
      await client.query("UPDATE round1_stage_progress SET state=jsonb_build_object('round1Session',$2::jsonb),updated_at=now() WHERE team_id=$1",[teamId,JSON.stringify(snapshot)]);
        const expired={success:false,expired:true,message:'Round 1 timer has expired.',session:snapshot,score:snapshot.credits,totalCredits:initialTotalCredits};
      await client.query('INSERT INTO round1_action_events(team_id,action_id,action_type,response) VALUES($1,$2,$3,$4::jsonb)',[teamId,action.actionId,action.type,JSON.stringify(expired)]);
      return expired;
    }
    if(!session.roundStartTime&&action.type!=='begin')game.beginRound1(teamId,session.teamName);
    switch(action.type){
      case 'begin': { const updated=game.beginRound1(teamId,session.teamName); result={success:true,session:updated}; break; }
      case 'enter': { const id=action.stageId as StageId; if(!['stage-1','stage-2','stage-3'].includes(id))throw new Round1GameError('Unknown stage.'); if(!['available','in_progress','skipped'].includes(stage(id).status))throw new Round1GameError('This stage is not available.',423); result={success:true,session:game.enterStage(teamId,id)};break; }
      case 'skip': { const id=action.stageId as StageId; if(!['stage-1','stage-2','stage-3'].includes(id))throw new Round1GameError('Unknown stage.'); result={success:true,session:game.skipStage(teamId,id)};break; }
      case 'stage1.begin': {
        if(!config.stage1.isReadyForPublication)throw new Round1GameError('Stage 1 has not been published for play.',423);
        const trialIndex=Number(action.trialIndex); const start=game.beginStage1Attempt(teamId,trialIndex);
        if(!start.ok)throw new Round1GameError(`Trial cannot start: ${start.reason}.`,409);
        const target=randomInt(0,config.stage1.trials?.[trialIndex]?.pumpkins??1);
        session.stage1State.activeTrial=trialIndex; session.stage1State.activeTarget=target;
        result={success:true,attemptsUsed:start.attemptsUsed,skullId:target,state:session.stage1State}; break;
      }
      case 'stage1.guess': {
        const trialIndex=Number(action.trialIndex), guess=Number(action.guessId);
        if(session.stage1State.activeTrial!==trialIndex||!Number.isInteger(session.stage1State.activeTarget)||!Number.isInteger(guess))throw new Round1GameError('No active trial or invalid guess.',409);
        const resolved=game.resolveStage1Trial(teamId,trialIndex,guess===session.stage1State.activeTarget);
        session.stage1State.activeTrial=undefined; session.stage1State.activeTarget=undefined;
        result={...resolved,state:session.stage1State};break;
      }
      case 'stage2.discover': {
        const target=norm(String(action.targetId??'')),image=String(action.imageId??'');
        const valid=config.stage2.images.some((item)=>item.id===image&&item.hotspots.some((h)=>norm(h.targetId)===target));
        if(!valid)throw new Round1GameError('This object is not a configured discovery for that image.',409);
        result={success:true,...game.registerStage2Discovery(teamId,target,image),state:session.stage2State};break;
      }
      case 'stage2.missed': result={success:true,...game.recordPenalty(teamId,'stage-2','Incorrect artifact click in search board')};break;
      case 'stage2.hint': { const hints=Number(session.stage2State.usedHintsCount); const target=config.stage2.targets.find((item)=>!session.stage2State.foundTargetIds.some((found)=>norm(found)===norm(item.id)));if(!target)throw new Round1GameError('No undiscovered targets remain.',409);const image=config.stage2.images.find((item)=>item.hotspots.some((hotspot)=>norm(hotspot.targetId)===norm(target.id)));result={success:true,targetId:target.id,imageId:image?.id,...game.useHint(teamId,'stage-2',`Hint ${hints+1}`),state:session.stage2State};break; }
      case 'stage3.placeBone': {const slot=String(action.slotId),bone=String(action.boneId);if(!['slot_head','slot_chest','slot_legs'].includes(slot)||!['bone_skull','bone_rib','bone_femur'].includes(bone))throw new Round1GameError('Unknown bone or grave slot.',409);result={success:true,...game.placeBone(teamId,slot,bone),state:session.stage3State};break;}
      case 'stage3.readBook': game.markGrave1BookRead(teamId);result={success:true};break;
      case 'stage3.moveSkeleton': if(!session.stage3State.grave1BookRead)throw new Round1GameError('Read the ancient book before moving the remains.',409);game.shiftGrave1Skeleton(teamId);result={success:true};break;
      case 'stage3.solveRiddle': result={success:true,...game.solveGrave1Riddle(teamId,String(action.answer??'')),state:session.stage3State};break;
      case 'stage3.unlockChest': if(!session.stage3State.grave1RiddleSolved)throw new Round1GameError('Solve the keeper riddle before opening the chest.',409);result={success:true,...game.unlockGrave1Chest(teamId),state:session.stage3State};break;
      case 'stage3.dig': {const soilId=String(action.soilId);if(!config.stage3.grave2.soilLocations.some((soil)=>soil.id===soilId))throw new Round1GameError('Unknown excavation site.',409);result={success:true,...game.digSoil(teamId,soilId),state:session.stage3State};break;}
      case 'stage3.unlockCoffer': result={success:true,...game.unlockGrave2Coffer(teamId,String(action.code??'')),state:session.stage3State};break;
      case 'stage3.rotateRune': {const ringIndex=Number(action.ringIndex);if(!Number.isInteger(ringIndex)||ringIndex<0||ringIndex>2||!['cw','ccw'].includes(String(action.direction)))throw new Round1GameError('Invalid rune-ring action.');result={success:true,...game.rotateRuneRing(teamId,ringIndex,action.direction as 'cw'|'ccw'),state:session.stage3State};break;}
      case 'stage3.finalAnswer': if(!session.stage3State.grave1ChestUnlocked||!session.stage3State.grave2CofferUnlocked||!session.stage3State.grave3Unlocked)throw new Round1GameError('Complete all three grave discoveries before attempting the final gate.',409);result={success:true,...game.submitFinalEscapeAnswer(teamId,String(action.answer??'')),state:session.stage3State};break;
      default: throw new Round1GameError('Unknown Round 1 action.');
    }
    const updated=game.snapshotTeamSession(teamId,session.teamName);
    // Score events, stage rows, action response and round completion share this transaction.
    const newTransactions=updated.scoreTransactions.slice(beforeTx);
    let totalCredits=initialTotalCredits;
    for(let index=0;index<newTransactions.length;index++){
      const tx=newTransactions[index]; const n=stageNumber(tx.stageId as StageId);
      const stageRow=rows.find((row)=>row.stage_id===n)!;
      const cap=Math.max(0,stageRow.max_score-stageRow.score);
      const requested=tx.deltaCredits>0?Math.min(tx.deltaCredits,cap):tx.deltaCredits;
      if(requested!==0){
        const saved=await recordScoreEventInTransaction(client,{teamId,roundId:1,stageId:n,delta:requested,sourceEventId:`${action.actionId}:${index}`,reason:tx.reason,details:{actionType:action.type}});
        if(saved.delta!==0){
          const wallet=await recordCreditEventInTransaction(client,{teamId,roundId:1,delta:saved.delta,transactionType:'round1_gameplay',referenceId:`${action.actionId}:${index}`,details:{actionType:action.type,reason:tx.reason}});
          totalCredits=wallet.balance;
        }
        updated.credits=saved.score;
        stageRow.score=Math.max(0,stageRow.score+saved.delta);
        const stageState=updated.stages[`stage-${n}` as StageId]; stageState.earnedCredits=stageRow.score;
        if(saved.delta!==0)result.creditsAwarded=(Number(result.creditsAwarded??0)+saved.delta);
      }
    }
    const stageIds=['stage-1','stage-2','stage-3'] as const;
    for(let i=0;i<stageIds.length;i++){
      const id=stageIds[i],row=rows[i],p=updated.stages[id];
      const dbStatus=p.status==='in_progress'?'IN_PROGRESS':p.status==='completed'?'COMPLETED':p.status==='skipped'?'AVAILABLE':p.status==='available'?'AVAILABLE':'LOCKED';
      await client.query(`UPDATE round1_stage_progress SET status=$3,score=$4,time_spent_seconds=$5,completed_at=CASE WHEN $3='COMPLETED' THEN COALESCE(completed_at,now()) ELSE completed_at END,state=$6::jsonb,updated_at=now() WHERE team_id=$1 AND stage_id=$2`,[teamId,row.stage_id,dbStatus,row.score,p.activeTimeSeconds,JSON.stringify(i===0?{round1Session:updated}:i===1?{round1Session:updated}: {round1Session:updated})]);
    }
    await client.query(`UPDATE round_progress SET time_spent_seconds=$2,updated_at=now() WHERE team_id=$1 AND round_id=1`,[teamId,updated.roundStartTime?Math.max(0,Math.floor((Date.now()-new Date(updated.roundStartTime).getTime())/1000)):0]);
    const completed=stageIds.every((id)=>updated.stages[id].status==='completed');
    if(completed){
      await client.query(`UPDATE round_progress SET status='COMPLETED',completed_at=COALESCE(completed_at,now()),updated_at=now() WHERE team_id=$1 AND round_id=1 AND status='IN_PROGRESS'`,[teamId]);
      await client.query(`INSERT INTO progression_audit_history(actor_type,team_id,entity_type,entity_id,previous_state,new_state,action_performed,reason) VALUES('SYSTEM',$1,'ROUND',1,'IN_PROGRESS','COMPLETED','COMPLETE','All Round 1 stages completed')`,[teamId]);
      await client.query(`UPDATE round_progress SET eligible_at=COALESCE(eligible_at,now()),updated_at=now() WHERE team_id=$1 AND round_id=2`,[teamId]);
      await client.query(`INSERT INTO progression_audit_history(actor_type,team_id,entity_type,entity_id,previous_state,new_state,action_performed,reason) SELECT 'SYSTEM',$1,'ROUND',2,status,status,'MARK_ELIGIBLE','Round 1 completed' FROM round_progress WHERE team_id=$1 AND round_id=2`,[teamId]);
    }
    const response={...result,session:updated,score:updated.credits,totalCredits,completed};
    await client.query('INSERT INTO round1_action_events(team_id,action_id,action_type,response) VALUES($1,$2,$3,$4::jsonb)',[teamId,action.actionId,action.type,JSON.stringify(response)]);
    await client.query('INSERT INTO activity_history(id,team_id,action,details,source_event_id) VALUES($1,$2,$3,$4::jsonb,$5) ON CONFLICT(team_id,source_event_id) DO NOTHING',[`round1-${action.actionId}`,teamId,`ROUND1_${action.type.toUpperCase().replaceAll('.','_')}`,JSON.stringify({result}),action.actionId]);
    return response;
  });
}

export async function setRound1Timer(pool:Pool,adminId:string,action:'start'|'pause'|'resume'|'end'){
  return withPostgresTransaction(pool,async(client)=>{
    // Match gameplay's team-first lock order so a global pause cannot deadlock an in-flight action.
    await client.query('SELECT id FROM teams ORDER BY id FOR UPDATE');
    const cfg=await client.query<{configuration:Round1Config}>('SELECT configuration FROM round1_configuration WHERE singleton_id=1 FOR UPDATE');
    const current=await client.query<{duration_seconds:number;is_active:boolean;start_time:Date|null}>('SELECT duration_seconds,is_active,start_time FROM rounds WHERE round_id=1 FOR UPDATE');
    if(!current.rowCount)throw new Round1GameError('Round 1 settings are not initialized.',503);
    const configuration=cfg.rows[0]?.configuration??defaults();
    if(action==='start'){
      if(current.rows[0].is_active||configuration.lifecycle==='paused')throw new Round1GameError('Round 1 cannot be started from its current timer state.',409);
      const seconds=Number(configuration.durationMinutes??22)*60;
      await client.query('UPDATE rounds SET is_active=true,duration_seconds=$1,start_time=now(),updated_at=now() WHERE round_id=1',[seconds]);
      await client.query("UPDATE round1_configuration SET configuration=jsonb_set(configuration - 'pausedGlobalTimer','{lifecycle}','\"running\"'::jsonb,true),updated_by=$1,updated_at=now() WHERE singleton_id=1",[adminId]);
      await client.query("UPDATE round_progress SET status='IN_PROGRESS', updated_at=now() WHERE round_id=1 AND status != 'COMPLETED'");
      await client.query("UPDATE round_progress SET status='IN_PROGRESS', updated_at=now() WHERE round_id=1 AND status != 'COMPLETED'");
    }else if(action==='pause'){
      if(!current.rows[0].is_active&&!['not_started','running'].includes(configuration.lifecycle))throw new Round1GameError('Round 1 is not running.',409);
      const sessions=await client.query<{team_id:string;state:Record<string,unknown>}>('SELECT team_id,state FROM round1_stage_progress WHERE stage_id=1 FOR UPDATE');
      for(const row of sessions.rows){
        const session=row.state?.round1Session as Round1TeamSessionState|undefined;if(!session)continue;
        session.pausedRemainingSeconds=session.roundDeadline?Math.max(0,Math.floor((new Date(session.roundDeadline).getTime()-Date.now())/1000)):Number(configuration.durationMinutes??22)*60;
        session.status='paused';
        await client.query("UPDATE round1_stage_progress SET state=jsonb_build_object('round1Session',$2::jsonb),updated_at=now() WHERE team_id=$1",[row.team_id,JSON.stringify(session)]);
      }
      if(current.rows[0].is_active){
        const secs=current.rows[0].start_time?Math.max(0,current.rows[0].duration_seconds-Math.floor((Date.now()-current.rows[0].start_time.getTime())/1000)):0;
        await client.query('UPDATE rounds SET is_active=false,duration_seconds=$1,updated_at=now() WHERE round_id=1',[secs]);
      }
      await client.query("UPDATE round1_configuration SET configuration=jsonb_set(jsonb_set(configuration,'{lifecycle}','\"paused\"'::jsonb,true),'{pausedGlobalTimer}',$2::jsonb,true),updated_by=$1,updated_at=now() WHERE singleton_id=1",[adminId,JSON.stringify(current.rows[0].is_active)]);
    }else if(action==='resume'){
      if(configuration.lifecycle!=='paused')throw new Round1GameError('Round 1 is not paused.',409);
      const sessions=await client.query<{team_id:string;state:Record<string,unknown>}>('SELECT team_id,state FROM round1_stage_progress WHERE stage_id=1 FOR UPDATE');
      for(const row of sessions.rows){
        const session=row.state?.round1Session as Round1TeamSessionState|undefined;if(!session)continue;
        const remaining=session.pausedRemainingSeconds;if(typeof remaining==='number')session.roundDeadline=new Date(Date.now()+remaining*1000).toISOString();
        delete session.pausedRemainingSeconds;session.status='active';
        await client.query("UPDATE round1_stage_progress SET state=jsonb_build_object('round1Session',$2::jsonb),updated_at=now() WHERE team_id=$1",[row.team_id,JSON.stringify(session)]);
      }
      if(configuration.pausedGlobalTimer)await client.query('UPDATE rounds SET is_active=true,start_time=now(),updated_at=now() WHERE round_id=1');
      await client.query("UPDATE round1_configuration SET configuration=jsonb_set(configuration - 'pausedGlobalTimer','{lifecycle}','\"running\"'::jsonb,true),updated_by=$1,updated_at=now() WHERE singleton_id=1",[adminId]);
      await client.query("UPDATE round_progress SET status='IN_PROGRESS', updated_at=now() WHERE round_id=1 AND status != 'COMPLETED'");
    }else{
      if(configuration.lifecycle==='completed')throw new Round1GameError('Round 1 has already ended.',409);
      await client.query('UPDATE rounds SET is_active=false,start_time=NULL,updated_at=now() WHERE round_id=1');
      await client.query("UPDATE round1_configuration SET configuration=jsonb_set(configuration - 'pausedGlobalTimer','{lifecycle}','\"completed\"'::jsonb,true),updated_by=$1,updated_at=now() WHERE singleton_id=1",[adminId]);
      await client.query("UPDATE round_progress SET status='COMPLETED', completed_at=COALESCE(completed_at, now()), updated_at=now() WHERE round_id=1 AND status != 'COMPLETED'");
      await client.query("UPDATE round_progress SET eligible_at=COALESCE(eligible_at, now()), updated_at=now() WHERE round_id=2");
    }
    return {success:true,action};
  });
}

/** Set the authoritative Round 1 running state. Desired-state semantics make admin retries safe. */
export async function setRound1TimerActive(pool:Pool,adminId:string,isActive:boolean):Promise<{success:true;isActive:boolean;changed:boolean}>{
  return withPostgresTransaction(pool,async(client)=>{
    // Keep the same team-first lock order as gameplay/timer transitions.
    await client.query('SELECT id FROM teams ORDER BY id FOR UPDATE');
    const cfg=await client.query<{configuration:Round1Config}>('SELECT configuration FROM round1_configuration WHERE singleton_id=1 FOR UPDATE');
    const current=await client.query<{duration_seconds:number;is_active:boolean;start_time:Date|null}>('SELECT duration_seconds,is_active,start_time FROM rounds WHERE round_id=1 FOR UPDATE');
    if(!current.rowCount||!cfg.rowCount)throw new Round1GameError('Round 1 settings are not initialized.',503);
    const configuration=cfg.rows[0].configuration??defaults();
    const running=current.rows[0].is_active;
    if(isActive&&running)return {success:true,isActive,changed:false};
    if(isActive&&configuration.lifecycle==='running'&&!running)return {success:true,isActive,changed:false};
    if(!isActive&&(configuration.lifecycle==='paused'||configuration.lifecycle==='completed'))return {success:true,isActive,changed:false};
    if(isActive){
      if(configuration.lifecycle==='paused'){
        const sessions=await client.query<{team_id:string;state:Record<string,unknown>}>('SELECT team_id,state FROM round1_stage_progress WHERE stage_id=1 FOR UPDATE');
        for(const row of sessions.rows){
          const session=row.state?.round1Session as Round1TeamSessionState|undefined;if(!session)continue;
          const remaining=session.pausedRemainingSeconds;
          if(typeof remaining==='number')session.roundDeadline=new Date(Date.now()+remaining*1000).toISOString();
          delete session.pausedRemainingSeconds;session.status='active';
          await client.query("UPDATE round1_stage_progress SET state=jsonb_build_object('round1Session',$2::jsonb),updated_at=now() WHERE team_id=$1",[row.team_id,JSON.stringify(session)]);
        }
        if(configuration.pausedGlobalTimer)await client.query('UPDATE rounds SET is_active=true,start_time=now(),updated_at=now() WHERE round_id=1');
      }else{
        const seconds=Number(configuration.durationMinutes??22)*60;
        await client.query('UPDATE rounds SET is_active=true,duration_seconds=$1,start_time=now(),updated_at=now() WHERE round_id=1',[seconds]);
      }
      await client.query("UPDATE round1_configuration SET configuration=jsonb_set(configuration - 'pausedGlobalTimer','{lifecycle}','\"running\"'::jsonb,true),updated_by=$1,updated_at=now() WHERE singleton_id=1",[adminId]);
      await client.query("UPDATE round_progress SET status='IN_PROGRESS', updated_at=now() WHERE round_id=1 AND status != 'COMPLETED'");
    }else{
      const sessions=await client.query<{team_id:string;state:Record<string,unknown>}>('SELECT team_id,state FROM round1_stage_progress WHERE stage_id=1 FOR UPDATE');
      for(const row of sessions.rows){
        const session=row.state?.round1Session as Round1TeamSessionState|undefined;if(!session)continue;
        session.pausedRemainingSeconds=session.roundDeadline?Math.max(0,Math.floor((new Date(session.roundDeadline).getTime()-Date.now())/1000)):Number(configuration.durationMinutes??22)*60;
        session.status='paused';
        await client.query("UPDATE round1_stage_progress SET state=jsonb_build_object('round1Session',$2::jsonb),updated_at=now() WHERE team_id=$1",[row.team_id,JSON.stringify(session)]);
      }
      if(running){
        const seconds=current.rows[0].start_time?Math.max(0,current.rows[0].duration_seconds-Math.floor((Date.now()-current.rows[0].start_time.getTime())/1000)):0;
        await client.query('UPDATE rounds SET is_active=false,duration_seconds=$1,updated_at=now() WHERE round_id=1',[seconds]);
      }
      await client.query("UPDATE round1_configuration SET configuration=jsonb_set(jsonb_set(configuration,'{lifecycle}','\"paused\"'::jsonb,true),'{pausedGlobalTimer}',$2::jsonb,true),updated_by=$1,updated_at=now() WHERE singleton_id=1",[adminId,JSON.stringify(running)]);
    }
    return {success:true,isActive,changed:true};
  });
}
