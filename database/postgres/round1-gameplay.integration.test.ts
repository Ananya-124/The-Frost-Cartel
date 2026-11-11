// @vitest-environment node
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { afterAll,beforeAll,describe,expect,it } from 'vitest';
import { Pool } from 'pg';
import { runMigrations } from './migration-runner.ts';
import { getRound1Config,getTeamRound1State,performRound1Action,setRound1Timer,setRound1TimerActive,updateRound1Config, type Round1TimingMetrics } from '../../server/services/round1Gameplay.ts';

const url=process.env.PG_TEST_DATABASE_URL;
const suite=url?describe:describe.skip;
let owner:Pool, pool:Pool, schema:string, seq=0;
async function team(name:string,globalTimer=true){const id=`r1-${++seq}-${randomUUID()}`;await pool.query('INSERT INTO teams(id,team_name,password_hash,salt) VALUES($1,$2,$3,$4)',[id,name,'hash','salt']);await pool.query("UPDATE round_progress SET status='IN_PROGRESS' WHERE team_id=$1 AND round_id=1",[id]);if(globalTimer)await pool.query('UPDATE rounds SET is_active=true,start_time=now(),duration_seconds=1320 WHERE round_id=1');else{await pool.query('UPDATE rounds SET is_active=false,start_time=NULL,duration_seconds=1320 WHERE round_id=1');await pool.query("UPDATE round1_configuration SET configuration=jsonb_set(configuration - 'pausedGlobalTimer','{lifecycle}','\"not_started\"'::jsonb,true) WHERE singleton_id=1");}return id;}
const action=(type:string,fields:Record<string,unknown>={})=>({actionId:randomUUID(),type,...fields});

suite('PostgreSQL Round 1 server-authoritative gameplay',()=>{
  beforeAll(async()=>{const parsed=new URL(url!);if(!['localhost','127.0.0.1','::1'].includes(parsed.hostname))throw new Error('Remote PostgreSQL is refused.');owner=new Pool({connectionString:url});schema=`r1_game_${randomUUID().replaceAll('-','')}`;await owner.query(`CREATE SCHEMA "${schema}"`);pool=new Pool({connectionString:url,options:`-c search_path=${schema}`});await runMigrations(pool,path.resolve('database/postgres/migrations'));await pool.query("UPDATE rounds SET is_active=true WHERE round_id=1");},30000);
  afterAll(async()=>{await pool?.end();if(schema)await owner?.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);await owner?.end();});

  it('keeps safe config singleton, validates admin patches, and persists settings',async()=>{
    await pool.query("INSERT INTO admins(id,username,password_hash,salt) VALUES('r1-admin','r1-admin','hash','salt')");
    const initial=await getRound1Config(pool);expect(initial.stage1.trials?.map(t=>t.reward)).toEqual([40,60]);
    await expect(updateRound1Config(pool,'r1-admin','stage2',{hintDeduction:999})).rejects.toMatchObject({status:400});
    await expect(updateRound1Config(pool,'r1-admin','stage3',{correctCode:'oops'})).rejects.toMatchObject({status:400});
    const saved=await updateRound1Config(pool,'r1-admin','stage3',{correctCode:'5555',acceptedAnswer:'DARK NIGHT',incorrectAnswerPenalty:12});
    expect(saved.stage3.grave2.correctCode).toBe('5555');expect(saved.stage3.finalGate.acceptedAnswer).toBe('DARK NIGHT');
    expect((await getRound1Config(pool)).stage3.grave2.correctCode).toBe('5555');
    expect((await pool.query('SELECT count(*)::int AS n FROM round1_configuration')).rows[0].n).toBe(1);
  });

  it('allows a fresh team to enter and skip without an admin timer start, without scoring or penalties',async()=>{
    const id=await team('Skip before admin start',false);
    const initial=await getTeamRound1State(pool,id);
    expect(initial.roundActive).toBe(true);
    expect(initial.remainingSeconds).toBe(1320);
    const entered=await performRound1Action(pool,id,action('enter',{stageId:'stage-1'}));
    expect(entered.success).toBe(true);
    const skipped=await performRound1Action(pool,id,action('skip',{stageId:'stage-1'}));
    expect(skipped).toMatchObject({success:true,score:0,totalCredits:500});
    expect(skipped.session.stages['stage-1'].status).toBe('skipped');
    await expect(performRound1Action(pool,id,action('skip',{stageId:'stage-9'}))).rejects.toMatchObject({status:400});
    expect((await pool.query('SELECT score FROM teams WHERE id=$1',[id])).rows[0].score).toBe(0);
    expect((await pool.query('SELECT total_credits FROM teams WHERE id=$1',[id])).rows[0].total_credits).toBe(500);
    expect((await pool.query('SELECT count(*)::int AS n FROM score_transactions WHERE team_id=$1',[id])).rows[0].n).toBe(0);
    expect((await pool.query('SELECT count(*)::int AS n FROM credit_transactions WHERE team_id=$1',[id])).rows[0].n).toBe(0);
    expect((await pool.query('SELECT status FROM round_progress WHERE team_id=$1 AND round_id=1',[id])).rows[0].status).toBe('IN_PROGRESS');
  });

  it('measures the Round 1 state-read pipeline against isolated PostgreSQL',async()=>{
    const id=await team('State timing');
    const timings:Round1TimingMetrics={};
    const started=performance.now();
    await getTeamRound1State(pool,id,timings);
    const totalMs=performance.now()-started;
    console.info(`[Round 1 local PostgreSQL timing] state-read ${JSON.stringify({...timings,observedTotalMs:totalMs})}`);
    expect(totalMs).toBeGreaterThanOrEqual(0);
    expect(timings).toMatchObject({teamQueryMs:expect.any(Number),stageStateQueryMs:expect.any(Number),progressionQueryMs:expect.any(Number),configurationLoadMs:expect.any(Number),timerQueryMs:expect.any(Number)});
  });

  it('preserves per-team pause and resume when no global admin timer has started',async()=>{
    const id=await team('Per-team pause',false),adminId=`pause-admin-${randomUUID()}`;
    await pool.query('INSERT INTO admins(id,username,password_hash,salt) VALUES($1,$2,$3,$4)',[adminId,adminId,'hash','salt']);
    await performRound1Action(pool,id,action('enter',{stageId:'stage-1'}));
    expect((await setRound1TimerActive(pool,adminId,false)).changed).toBe(true);
    await expect(performRound1Action(pool,id,action('skip',{stageId:'stage-1'}))).rejects.toMatchObject({status:423});
    expect((await setRound1TimerActive(pool,adminId,true)).isActive).toBe(true);
    const skipped=await performRound1Action(pool,id,action('skip',{stageId:'stage-1'}));
    expect(skipped.session.stages['stage-1'].status).toBe('skipped');
    expect((await getTeamRound1State(pool,id)).roundActive).toBe(true);
  });

  it('validates the pumpkin guess on the server and does not trust a forged won flag',async()=>{
    const id=await team('Pumpkin');
    const started=await performRound1Action(pool,id,action('stage1.begin',{trialIndex:0})) as {skullId:number};
    const wrong=(started.skullId+1)%5;
    const forged=await performRound1Action(pool,id,action('stage1.guess',{trialIndex:0,guessId:wrong,won:true})) as {success:boolean;creditsAwarded?:number};
    expect(forged.success).toBe(false);expect(forged.creditsAwarded??0).toBe(0);
    const next=await performRound1Action(pool,id,action('stage1.begin',{trialIndex:0})) as {skullId:number};
    const event=action('stage1.guess',{trialIndex:0,guessId:next.skullId,won:false,points:999999});
    const [first,retry]=await Promise.all([performRound1Action(pool,id,event),performRound1Action(pool,id,event)]);
    expect(retry).toMatchObject({duplicate:true});
    expect((await pool.query('SELECT score FROM teams WHERE id=$1',[id])).rows[0].score).toBe(40);
    expect((await pool.query('SELECT total_credits FROM teams WHERE id=$1',[id])).rows[0].total_credits).toBe(540);
    expect((await pool.query('SELECT count(*)::int AS n FROM score_transactions WHERE team_id=$1',[id])).rows[0].n).toBe(1);
    expect((await pool.query("SELECT delta FROM credit_transactions WHERE team_id=$1 AND round_id=1 AND transaction_type='round1_gameplay'",[id])).rows.map((row)=>row.delta)).toEqual([40]);
    expect(first).toMatchObject({success:true,score:40});
  });

  it('applies team and stage score caps to validated trial rewards',async()=>{
    const id=await team('Score cap');
    await pool.query('UPDATE teams SET score=490 WHERE id=$1',[id]);
    await pool.query('UPDATE round_progress SET score=490,max_score=500 WHERE team_id=$1 AND round_id=1',[id]);
    const started=await performRound1Action(pool,id,action('stage1.begin',{trialIndex:0})) as {skullId:number};
    const earned=await performRound1Action(pool,id,action('stage1.guess',{trialIndex:0,guessId:started.skullId}));
    expect(earned).toMatchObject({score:500,creditsAwarded:10});
    expect((await pool.query('SELECT score FROM round1_stage_progress WHERE team_id=$1 AND stage_id=1',[id])).rows[0].score).toBe(10);
    expect((await pool.query('SELECT score FROM teams WHERE id=$1',[id])).rows[0].score).toBe(500);
    expect((await pool.query('SELECT delta,new_score FROM score_transactions WHERE team_id=$1 AND round_id=1',[id])).rows).toEqual([{delta:10,new_score:500}]);
    expect((await pool.query("SELECT delta,balance_after FROM credit_transactions WHERE team_id=$1 AND round_id=1 AND transaction_type='round1_gameplay'",[id])).rows).toEqual([{delta:10,balance_after:510}]);
  });

  it('leaves Round 1 rewards uncapped when round_progress.max_score is zero',async()=>{
    const id=await team('Unlimited score');await pool.query('UPDATE teams SET score=490 WHERE id=$1',[id]);
    // New-team initialization uses max_score=0 to represent no configured cap.
    const started=await performRound1Action(pool,id,action('stage1.begin',{trialIndex:0})) as {skullId:number};
    const earned=await performRound1Action(pool,id,action('stage1.guess',{trialIndex:0,guessId:started.skullId}));
    expect(earned).toMatchObject({score:530,creditsAwarded:40});
    expect((await pool.query('SELECT max_score,score FROM round_progress WHERE team_id=$1 AND round_id=1',[id])).rows[0]).toEqual({max_score:0,score:40});
    expect((await pool.query('SELECT delta,new_score FROM score_transactions WHERE team_id=$1 AND round_id=1',[id])).rows).toEqual([{delta:40,new_score:530}]);
  });

  it('rejects invalid stage-two discoveries and isolates persisted state between teams',async()=>{
    const a=await team('Stage two A'),b=await team('Stage two B');
    await expect(performRound1Action(pool,a,action('stage2.discover',{targetId:'forged-relic',imageId:'img_01'}))).rejects.toMatchObject({status:409});
    const cfg=await getRound1Config(pool);const image=cfg.stage2.images.find(i=>i.hotspots.length)!;const hotspot=image.hotspots[0];
    await performRound1Action(pool,a,action('stage2.discover',{targetId:hotspot.targetId,imageId:image.id}));
    const sa=await pool.query<{state:Record<string,unknown>}>("SELECT state FROM round1_stage_progress WHERE team_id=$1 AND stage_id=1",[a]);
    const sb=await pool.query<{state:Record<string,unknown>}>("SELECT state FROM round1_stage_progress WHERE team_id=$1 AND stage_id=1",[b]);
    expect(sa.rows[0].state.round1Session).toBeDefined();expect(sb.rows[0].state).toEqual({});
  });

  it('awards Stage 2 only for configured image targets and caps its score at 150',async()=>{
    const id=await team('All relics');const cfg=await getRound1Config(pool);
    for(const target of cfg.stage2.targets){
      const image=cfg.stage2.images.find((candidate)=>candidate.hotspots.some((spot)=>spot.targetId===target.id));
      expect(image).toBeDefined();
      await performRound1Action(pool,id,action('stage2.discover',{targetId:target.id,imageId:image!.id,points:99999}));
    }
    const rows=await pool.query('SELECT score,status FROM round1_stage_progress WHERE team_id=$1 AND stage_id=2',[id]);
    expect(rows.rows[0]).toMatchObject({score:150,status:'COMPLETED'});
    expect((await pool.query('SELECT score FROM teams WHERE id=$1',[id])).rows[0].score).toBe(150);
    expect((await pool.query('SELECT total_credits FROM teams WHERE id=$1',[id])).rows[0].total_credits).toBe(650);
    expect((await pool.query('SELECT count(*)::int AS n FROM score_transactions WHERE team_id=$1',[id])).rows[0].n).toBe(1);
  });

  it('hands the default Round 1 hint deduction to the wallet and keeps wrong-click penalty at zero',async()=>{
    const id=await team('Default wallet rules');
    await pool.query('UPDATE teams SET score=100 WHERE id=$1',[id]);
    await pool.query('UPDATE round_progress SET score=100 WHERE team_id=$1 AND round_id=1',[id]);
    const hint=await performRound1Action(pool,id,action('stage2.hint')) as {deduction:number};
    expect(hint.deduction).toBe(15);
    const missed=await performRound1Action(pool,id,action('stage2.missed')) as {penalty:number};
    expect(missed.penalty).toBe(0);
    expect((await pool.query('SELECT total_credits FROM teams WHERE id=$1',[id])).rows[0].total_credits).toBe(485);
    expect((await pool.query('SELECT delta FROM credit_transactions WHERE team_id=$1 AND round_id=1',[id])).rows.map((row)=>row.delta)).toEqual([-15]);
  });

  it('charges configured Stage 2 hint and incorrect-click penalties from the server settings',async()=>{
    await pool.query("INSERT INTO admins(id,username,password_hash,salt) VALUES('penalty-admin','penalty-admin','hash','salt') ON CONFLICT DO NOTHING");
    await updateRound1Config(pool,'penalty-admin','stage2',{hintDeduction:15,incorrectClickPenalty:5});
    const id=await team('Hints');await pool.query('UPDATE teams SET score=100 WHERE id=$1',[id]);await pool.query('UPDATE round_progress SET score=100 WHERE team_id=$1 AND round_id=1',[id]);
    const hint=await performRound1Action(pool,id,action('stage2.hint')) as {deduction:number;targetId:string;imageId:string};
    expect(hint).toMatchObject({deduction:15,targetId:'pumpkin',imageId:'img_01'});
    await performRound1Action(pool,id,action('stage2.missed'));
    expect((await pool.query('SELECT score FROM teams WHERE id=$1',[id])).rows[0].score).toBe(80);
    expect((await pool.query('SELECT delta FROM score_transactions WHERE team_id=$1 ORDER BY created_at',[id])).rows.map((row)=>row.delta)).toEqual([-15,-5]);
    expect((await pool.query('SELECT total_credits FROM teams WHERE id=$1',[id])).rows[0].total_credits).toBe(480);
    expect((await pool.query("SELECT delta FROM credit_transactions WHERE team_id=$1 AND round_id=1 ORDER BY created_at",[id])).rows.map((row)=>row.delta)).toEqual([-15,-5]);
  });

  it('validates Stage 3 answers and requires all three grave discoveries before the final gate',async()=>{
    const id=await team('Graveyard');
    await expect(performRound1Action(pool,id,action('stage3.unlockChest'))).rejects.toMatchObject({status:409});
    const wrong=await performRound1Action(pool,id,action('stage3.solveRiddle',{answer:'WATER'}));expect(wrong).toMatchObject({success:false});
    await performRound1Action(pool,id,action('stage3.readBook'));
    await performRound1Action(pool,id,action('stage3.moveSkeleton'));
    expect(await performRound1Action(pool,id,action('stage3.solveRiddle',{answer:'ASH'}))).toMatchObject({success:true});
    await performRound1Action(pool,id,action('stage3.unlockChest'));
    await expect(performRound1Action(pool,id,action('stage3.finalAnswer',{answer:'THE EMBER RETURNS'}))).rejects.toMatchObject({status:409});
    await performRound1Action(pool,id,action('stage3.unlockCoffer',{code:'1749'}));
    for(const [ringIndex,count] of [[0,1],[1,2],[2,2]] as const)for(let i=0;i<count;i++)await performRound1Action(pool,id,action('stage3.rotateRune',{ringIndex,direction:'cw'}));
    const final=await performRound1Action(pool,id,action('stage3.finalAnswer',{answer:'THE EMBER RETURNS'}));
    expect(final).toMatchObject({success:true,score:250});
    expect((await pool.query('SELECT score,status FROM round1_stage_progress WHERE team_id=$1 AND stage_id=3',[id])).rows[0]).toMatchObject({score:250,status:'COMPLETED'});
  });

  it('persists pause/resume state and expires the team timer before accepting actions',async()=>{
    await pool.query("INSERT INTO admins(id,username,password_hash,salt) VALUES('timer-admin','timer-admin','hash','salt') ON CONFLICT DO NOTHING");
    const id=await team('Timer');
    await performRound1Action(pool,id,action('begin'));
    await setRound1Timer(pool,'timer-admin','pause');
    const paused=await pool.query<{state:Record<string,unknown>}>('SELECT state FROM round1_stage_progress WHERE team_id=$1 AND stage_id=1',[id]);
    expect((paused.rows[0].state.round1Session as {pausedRemainingSeconds?:number}).pausedRemainingSeconds).toBeGreaterThan(0);
    await expect(performRound1Action(pool,id,action('stage2.hint'))).rejects.toMatchObject({status:423});
    await setRound1Timer(pool,'timer-admin','resume');
    await pool.query("UPDATE rounds SET start_time=now()-interval '30 minutes',duration_seconds=60 WHERE round_id=1");
    const expired=await performRound1Action(pool,id,action('stage2.hint'));
    expect(expired).toMatchObject({success:false,expired:true});
    expect((await pool.query('SELECT count(*)::int AS n FROM score_transactions WHERE team_id=$1',[id])).rows[0].n).toBe(0);
  });

  it('completes all three stages atomically and marks Round 2 eligible while it stays locked',async()=>{
    const id=await team('Full Round One');
    await performRound1Action(pool,id,action('begin'));
    for(let trialIndex=0;trialIndex<2;trialIndex++){
      const start=await performRound1Action(pool,id,action('stage1.begin',{trialIndex})) as {skullId:number};
      await performRound1Action(pool,id,action('stage1.guess',{trialIndex,guessId:start.skullId}));
    }
    const cfg=await getRound1Config(pool);
    for(const target of cfg.stage2.targets){const image=cfg.stage2.images.find((candidate)=>candidate.hotspots.some((spot)=>spot.targetId===target.id))!;await performRound1Action(pool,id,action('stage2.discover',{targetId:target.id,imageId:image.id}));}
    await performRound1Action(pool,id,action('stage3.readBook'));
    await performRound1Action(pool,id,action('stage3.moveSkeleton'));
    await performRound1Action(pool,id,action('stage3.solveRiddle',{answer:'ASH'}));
    await performRound1Action(pool,id,action('stage3.unlockChest'));
    await performRound1Action(pool,id,action('stage3.unlockCoffer',{code:'1749'}));
    for(const [ringIndex,count] of [[0,1],[1,2],[2,2]] as const)for(let i=0;i<count;i++)await performRound1Action(pool,id,action('stage3.rotateRune',{ringIndex,direction:'cw'}));
    await performRound1Action(pool,id,action('stage3.finalAnswer',{answer:'THE EMBER RETURNS'}));
    const [round,next,teamScore]=await Promise.all([
      pool.query('SELECT status FROM round_progress WHERE team_id=$1 AND round_id=1',[id]),
      pool.query('SELECT status,eligible_at FROM round_progress WHERE team_id=$1 AND round_id=2',[id]),
      pool.query('SELECT score,total_credits FROM teams WHERE id=$1',[id]),
    ]);
    expect(round.rows[0].status).toBe('COMPLETED');
    expect(next.rows[0].status).toBe('LOCKED');expect(next.rows[0].eligible_at).toBeTruthy();
    expect(teamScore.rows[0]).toMatchObject({score:500,total_credits:1000});
    expect((await pool.query("SELECT count(*)::int AS n FROM progression_audit_history WHERE team_id=$1 AND action_performed='COMPLETE' AND entity_type='ROUND' AND entity_id=1",[id])).rows[0].n).toBe(1);
  });

  it('rolls back puzzle state when its score-ledger write fails',async()=>{
    const id=await team('Rollback');
    await performRound1Action(pool,id,action('stage1.begin',{trialIndex:0}));
    await pool.query(`CREATE FUNCTION reject_round1_score() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'forced ledger failure'; END $$`);
    await pool.query('CREATE TRIGGER reject_round1_score BEFORE INSERT ON score_transactions FOR EACH ROW EXECUTE FUNCTION reject_round1_score()');
    const guessId=(await pool.query<{state:Record<string,unknown>}>("SELECT state FROM round1_stage_progress WHERE team_id=$1 AND stage_id=1",[id])).rows[0].state;
    const session=guessId.round1Session as {stage1State:{activeTarget:number}};
    await expect(performRound1Action(pool,id,action('stage1.guess',{trialIndex:0,guessId:session.stage1State.activeTarget}))).rejects.toThrow('forced ledger failure');
    expect((await pool.query('SELECT score FROM teams WHERE id=$1',[id])).rows[0].score).toBe(0);
    expect((await pool.query('SELECT count(*)::int AS n FROM round1_action_events WHERE team_id=$1',[id])).rows[0].n).toBe(1);
    await pool.query('DROP TRIGGER reject_round1_score ON score_transactions');await pool.query('DROP FUNCTION reject_round1_score()');
  });

  it('rolls back Round 1 progress and score when the wallet-ledger write fails',async()=>{
    const id=await team('Wallet rollback');
    const start=await performRound1Action(pool,id,action('stage1.begin',{trialIndex:0})) as {skullId:number};
    await pool.query(`CREATE FUNCTION reject_round1_credit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'forced wallet ledger failure'; END $$`);
    await pool.query('CREATE TRIGGER reject_round1_credit BEFORE INSERT ON credit_transactions FOR EACH ROW EXECUTE FUNCTION reject_round1_credit()');
    await expect(performRound1Action(pool,id,action('stage1.guess',{trialIndex:0,guessId:start.skullId}))).rejects.toThrow('forced wallet ledger failure');
    expect((await pool.query('SELECT score,total_credits FROM teams WHERE id=$1',[id])).rows[0]).toMatchObject({score:0,total_credits:500});
    expect((await pool.query('SELECT score,status FROM round1_stage_progress WHERE team_id=$1 AND stage_id=1',[id])).rows[0]).toMatchObject({score:0,status:'IN_PROGRESS'});
    expect((await pool.query('SELECT count(*)::int AS n FROM score_transactions WHERE team_id=$1',[id])).rows[0].n).toBe(0);
    expect((await pool.query('SELECT count(*)::int AS n FROM round1_action_events WHERE team_id=$1',[id])).rows[0].n).toBe(1);
    await pool.query('DROP TRIGGER reject_round1_credit ON credit_transactions');await pool.query('DROP FUNCTION reject_round1_credit()');
  });
});
