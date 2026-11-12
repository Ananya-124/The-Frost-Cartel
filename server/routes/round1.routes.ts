import { Router, type Response } from 'express';
import { postgresPool } from '../../database/postgres/pool.ts';
import { requireAdminAuth, requireTeamAuth, type AuthenticatedRequest } from '../middleware/auth.ts';
import { getRound1Config, getTeamRound1State, performRound1Action, Round1GameError, setRound1Timer, updateRound1Config, type Round1Action, type Round1TimingMetrics } from '../services/round1Gameplay.ts';

export const round1Router=Router();
const failure=(res:Response,error:unknown)=>{
  if(error instanceof Round1GameError){res.status(error.status).json({success:false,message:error.message});return;}
  console.error('[Round 1 PostgreSQL]',error);res.status(503).json({success:false,message:'Round 1 service is temporarily unavailable.'});
};
const team=(req:AuthenticatedRequest)=>{if(!req.team)throw new Round1GameError('Team authentication required.',401);return req.team.id;};
const pool=()=>{if(!postgresPool)throw new Round1GameError('PostgreSQL gameplay service is unavailable.',503);return postgresPool;};
const asyncRoute=(fn:(req:AuthenticatedRequest,res:Response)=>Promise<unknown>)=>(req:AuthenticatedRequest,res:Response)=>{void fn(req,res).catch((e)=>failure(res,e));};

round1Router.get('/state',requireTeamAuth,asyncRoute(async(req,res)=>{
  const requestStartedAt=performance.now();
  const timings:Round1TimingMetrics|undefined=process.env.ROUND1_PERF_LOG==='1'?{}:undefined;
  const value=await getTeamRound1State(pool(),team(req),timings);
  const responseStartedAt=performance.now();
  const config=value.config;
  const {riddleAnswer:_riddleAnswer,...grave1Base}=config.stage3.grave1;
  const grave1={...grave1Base,slots:grave1Base.slots.map(({acceptedBoneId:_acceptedBoneId,...slot})=>slot)};
  const {correctCode:_correctCode,...grave2}=config.stage3.grave2;
  const {acceptedAnswer:_acceptedAnswer,...finalGate}=config.stage3.finalGate;
  const publicStage3={...config.stage3,grave1,grave2,grave3:{...config.stage3.grave3,runeRings:config.stage3.grave3.runeRings.map(({correctSymbol:_correctSymbol,...ring})=>ring)},finalGate};
  const session=structuredClone(value.session);session.stage1State.activeTarget=undefined;
  res.json({success:true,round:{id:1,name:'The Graveyard Escape',isActive:value.roundActive,totalDurationSeconds:config.durationMinutes*60,remainingSeconds:value.remainingSeconds,endsAt:value.endsAt},team:{score:value.score,totalCredits:value.totalCredits,maxCredits:req.team?.maxCredits??500,isPaused:req.team?.isPaused??false},session,stages:value.stages.map(({state:_privateState,...stage})=>stage),config:{stage1:config.stage1,stage2:config.stage2,stage3:publicStage3}});
  if(timings)console.info(`[Round 1 timing] GET /state ${JSON.stringify({...timings,responseBuildMs:performance.now()-responseStartedAt,totalServerMs:performance.now()-requestStartedAt})}`);
}));

round1Router.post('/actions',requireTeamAuth,asyncRoute(async(req,res)=>{
  const id=team(req);
  if(!req.body||typeof req.body!=='object'||typeof req.body.type!=='string')throw new Round1GameError('Action type is required.');
  const result=await performRound1Action(pool(),id,req.body as Round1Action);
  res.json({success:true,...result});
}));

// The legacy completion contract accepted client-computed points. Refuse it so it
// cannot continue awarding scores; stage completion now follows validated actions.
round1Router.post('/stage/complete',requireTeamAuth,(_req,res)=>res.status(410).json({success:false,message:'Client-submitted stage completion is retired. Use validated Round 1 actions.'}));

const adminRouter=Router();
adminRouter.use(requireAdminAuth);
adminRouter.get('/config',asyncRoute(async(_req,res)=>res.json({success:true,configuration:await getRound1Config(pool())})));
adminRouter.patch('/config/duration',asyncRoute(async(req,res)=>{
  if(!req.admin)throw new Round1GameError('Administrator authentication required.',401);
  const minutes=Number(req.body?.durationMinutes);
  if(!Number.isInteger(minutes)||minutes<20||minutes>25)throw new Round1GameError('Round duration must be 20–25 minutes.');
  const p=pool();
  const result=await p.query('UPDATE round1_configuration SET configuration=jsonb_set(configuration,\'{durationMinutes}\',$1::jsonb,true),updated_by=$2,updated_at=now() WHERE singleton_id=1 RETURNING configuration',[JSON.stringify(minutes),req.admin.id]);
  res.json({success:true,configuration:result.rows[0]?.configuration});
}));
adminRouter.patch('/config/:stage',asyncRoute(async(req,res)=>{
  if(!req.admin)throw new Round1GameError('Administrator authentication required.',401);
  const stage=String(req.params.stage);
  if(!['stage1','stage2','stage3'].includes(stage))throw new Round1GameError('Unknown configuration group.');
  const configuration=await updateRound1Config(pool(),req.admin.id,stage as 'stage1'|'stage2'|'stage3',req.body);
  res.json({success:true,configuration});
}));
adminRouter.post('/timer/:action',asyncRoute(async(req,res)=>{
  const action=String(req.params.action); if(!['start','pause','resume','end'].includes(action))throw new Round1GameError('Unknown timer transition.');
  if(!req.admin)throw new Round1GameError('Administrator authentication required.',401);
  res.json(await setRound1Timer(pool(),req.admin.id,action as 'start'|'pause'|'resume'|'end'));
}));
round1Router.use('/admin',adminRouter);
