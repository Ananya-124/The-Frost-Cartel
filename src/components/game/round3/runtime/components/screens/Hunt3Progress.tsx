import { useState } from 'react';
import type { Hunt3ActionResult, Hunt3Actor, Hunt3State } from '../../../../../../types/hunt3.types';
import styles from './Hunt3Progress.module.css';

interface Props { state: Hunt3State | null; actor: Hunt3Actor; message: string; working: boolean; onAction: (action: { type: string; id: string; value?: unknown }) => Promise<Hunt3ActionResult> }
const ORDER_OPTIONS = ['source', 'ground', 'return', 'low-tone', 'phase-two', 'silence', 'arrival', 'warning', 'anchor', 'coil:west', 'lens:center', 'braid:ground', 'core:east'];
const selectSequence = (count: number, options: string[], initial: string[] = []) => Array.from({ length: count }, (_, i) => initial[i] ?? options[0]);
export default function Hunt3Progress({ state, actor, message, working, onAction }: Props) {
  const [sequence, setSequence] = useState<string[]>([]);
  const [location, setLocation] = useState('observation-room');
  const [condition, setCondition] = useState('frequency-low');
  const [reading, setReading] = useState<'withdrawal' | 'surge'>('withdrawal');
  const [profile, setProfile] = useState(['temperature-cold', 'light-dark', 'frequency-low']);
  const [resonance, setResonance] = useState({ frequency: 'high', phase: 'one', carrier: 'audible' });
  const [cadence, setCadence] = useState([2, 1, 2]);
  if (!state) return <div className={styles.loading}>Restoring the shared containment investigation…</div>;
  const run = (type: string, id: string, value?: unknown) => { if (!working) void onAction({ type, id, value }); };
  const editor = (count: number, initial: string[] = []) => {
    const current = sequence.length === count ? sequence : selectSequence(count, ORDER_OPTIONS, initial.length ? [...initial].reverse() : []);
    return <div className={styles.sequence}>{current.map((item, i) => <label key={i}>Position {i + 1}<select value={item} disabled={working} onChange={(e) => setSequence(current.map((entry, j) => j === i ? e.target.value : entry))}>{ORDER_OPTIONS.map((option) => <option key={option}>{option}</option>)}</select></label>)}</div>;
  };
  const submit = (id: string, current: string[] = sequence) => run('submit', id, { sequence: current });
  const currentSeal = (['power', 'resonance', 'memory'] as const).find((s) => !state.seals[s].disabled);
  const nextBossActor = state.stage === 4 ? (state.boss.step % 2 === 0 ? 'archivist' : 'tracker') : null;
  return <section className={styles.root} aria-label="Hunt III progress">
    <header><div><small>ROUND III · FINAL CONTAINMENT</small><h2>{['The Entity’s Trail', 'Break the Three Seals', 'The Bait Protocol', 'Final Containment'][state.stage - 1]}</h2></div><strong>STAGE {state.stage}/4</strong></header>
    <div className={styles.status} aria-live="polite">{message || `Server-confirmed score: ${state.score} · Entity state: ${state.stage === 1 ? 'roaming' : state.stage === 2 ? 'safeguards active' : state.stage === 3 ? 'approaching containment' : state.boss.captured ? 'captured' : 'attacking'}`}</div>
    <div className={styles.progress}>Stage awards: {state.scoreBreakdown.stage1}/250 · {state.scoreBreakdown.stage2}/400 · {state.scoreBreakdown.stage3}/350 · {state.scoreBreakdown.stage4}/500 · Hidden evidence {state.optional.complete ? '100/100' : 'undiscovered'}</div>

    {state.stage === 1 && <section className={styles.task}><h3>Track the roaming entity</h3><p>{actor === 'archivist' ? 'Compare the old sighting ledger, containment observations and facility report. Their entries point toward the last verified location.' : 'Search the Future for the cold ash, drag marks and broken compass disturbance. The physical traces converge, but do not explain when the entity moved.'}</p>
      <div className={styles.actions}>{(actor === 'archivist' ? ['sighting-ledger', 'containment-observation', 'old-facility-report'] : ['cold-ash', 'drag-marks', 'shattered-compass']).map((id) => <button key={id} disabled={working || state.evidence[actor].includes(id)} onClick={() => run('interact', id)}>Examine {id.replaceAll('-', ' ')}</button>)}</div>
      <label>Proposed location<select value={location} onChange={(e) => setLocation(e.target.value)}><option value="observation-room">Observation Room</option><option value="generator-room">Generator Room</option><option value="archive">Archive</option></select></label>
      <button disabled={working || state.evidence[actor].length < 3} onClick={() => run('submit', 'trail-location', { location })}>Submit private trail finding</button>
      <small>Archivist finding: {state.trail.archivist ? 'submitted' : 'awaiting'} · Tracker finding: {state.trail.tracker ? 'submitted' : 'awaiting'}</small>
    </section>}

    {state.stage === 2 && <section className={styles.task}><h3>Disable three distinct safeguards</h3><p>Each seal needs a Past diagram interpretation and a separate Future-side physical configuration. Verified parts are secured independently.</p>
      <div className={styles.seals}>{(['power', 'resonance', 'memory'] as const).map((seal) => <div key={seal}><b>{seal.toUpperCase()} SEAL</b><span>{state.seals[seal].disabled ? 'DISABLED' : `Past ${state.seals[seal].archive ? '✓' : '○'} · Future ${state.seals[seal].physical.length ? '✓' : '○'}`}</span>
        {actor === 'archivist' && <button disabled={working || state.seals[seal].archive} onClick={() => run('interact', `${seal}-diagram`)}>Study {seal} diagram</button>}
        {actor === 'tracker' && <><button disabled={working || state.seals[seal].physical.length > 0} onClick={() => run('interact', `${seal}-mechanism`)}>Inspect {seal} mechanism</button>{!state.seals[seal].disabled && state.seals[seal].physical.length > 0 && <>
          {seal === 'power' && <SequenceSelect count={3} options={['source', 'ground', 'return']} values={sequence} setValues={setSequence} />}
          {seal === 'resonance' && <div className={styles.sequence}>{(['frequency', 'phase', 'carrier'] as const).map((key) => <label key={key}>{key}<select value={resonance[key]} onChange={(e) => setResonance({ ...resonance, [key]: e.target.value })}>{(key === 'frequency' ? ['high', 'low'] : key === 'phase' ? ['one', 'two'] : ['audible', 'muted']).map((option) => <option key={option}>{option}</option>)}</select></label>)}</div>}
          {seal === 'memory' && <div className={styles.sequence}>{cadence.map((beat, i) => <label key={i}>Pulse {i + 1}<button type="button" onClick={() => setCadence(cadence.map((value, j) => j === i ? (value === 1 ? 2 : 1) : value))}>{beat === 1 ? 'short' : 'long'}</button></label>)}</div>}
          <button disabled={working || (seal === 'power' ? sequence.length !== 3 : false)} onClick={() => run('submit', `seal-${seal}`, seal === 'power' ? { sequence } : seal === 'resonance' ? { settings: resonance } : { cadence })}>Configure {seal} seal</button>
        </>}</>}
      </div>)}</div>
      <div className={styles.actions}>{actor === 'archivist' ? <button disabled={working || state.actions.includes('component-catalog')} onClick={() => run('interact', 'component-catalog')}>Compare parts with equipment catalogue</button> : [...COMPONENTS, 'shattered-glass', 'scorched-lattice'].map((part) => <button key={part} disabled={working || state.components.includes(part)} onClick={() => run('interact', `recover-${part}`)}>Recover {part.replaceAll('-', ' ')}</button>)}</div>
      <small>Secured parts: {state.components.length}/4 · seals stable: {Object.values(state.seals).filter((s) => s.disabled).length}/3</small>
    </section>}

    {state.stage === 3 && <section className={styles.task}><h3>Rebuild, test, lure and weaken</h3><p>The Past blueprint is a reference only. The Tracker must place each recovered part at the physical apparatus independently.</p>
      <div className={styles.actions}>{actor === 'archivist' ? <><button disabled={working || state.evidence.archivist.includes('apparatus-blueprint')} onClick={() => run('interact', 'apparatus-blueprint')}>Examine apparatus blueprint</button><button disabled={working || state.weakness.archive} onClick={() => run('interact', 'weakness-notes')}>Compare historical reaction notes</button></> : <><button disabled={working} onClick={() => run('interact', 'test-station')}>Inspect controlled test station</button><button disabled={working || !state.weakness.lure} onClick={() => run('interact', 'disruptor')}>Apply vulnerability pulse ({state.weakness.weakened}/3)</button></>}</div>
      {state.apparatus.archive !== null && <><b>{actor === 'archivist' ? 'Decode blueprint placement' : 'Place recovered apparatus components'}</b>{editor(4, ['coil:west', 'lens:center', 'braid:ground', 'core:east'])}<button disabled={working || sequence.length !== 4} onClick={() => submit('apparatus')}>{actor === 'archivist' ? 'Submit Past blueprint reading' : 'Configure Future apparatus'}</button></>}
      {actor === 'tracker' && <div className={styles.trial}><b>Controlled environmental trial</b><select value={condition} onChange={(e) => setCondition(e.target.value)}><option value="frequency-low">Low frequency</option><option value="light-dark">Darkness</option><option value="temperature-cold">Cold</option></select><select value={reading} onChange={(e) => setReading(e.target.value as 'withdrawal' | 'surge')}><option value="surge">Entity surges</option><option value="withdrawal">Entity withdraws</option></select><button disabled={working} onClick={() => run('submit', 'weakness-trial', { condition, reading })}>Run trial</button><small>Verified response trials: {state.weakness.trials.filter((t) => t.endsWith(':withdrawal') || t.endsWith('light-dark:surge')).length}/3</small></div>}
      {state.weakness.archive && actor === 'archivist' && <>
        <b>Submit the combined vulnerability profile</b>
        {profile.map((v, i) => <label key={i}>Finding {i + 1}<select value={v} onChange={(e) => setProfile(profile.map((old, j) => i === j ? e.target.value : old))}>{['frequency-low', 'light-dark', 'temperature-cold'].map((x) => <option key={x}>{x}</option>)}</select></label>)}
        <button disabled={working || !(['frequency-low:withdrawal', 'light-dark:surge', 'temperature-cold:withdrawal'].every((trial) => state.weakness.trials.includes(trial)))} onClick={() => run('submit', 'weakness-conclusion', { profile })}>Verify vulnerability with Tracker&apos;s readings</button>
      </>}
      {state.weakness.discovered && <><button disabled={working || state.weakness.lure > 0} onClick={() => run('interact', 'lure-control')}>Activate chamber lure</button><small>Lure {state.weakness.lure ? 'active' : 'off'} · entity weakened {state.weakness.weakened}/3</small></>}
    </section>}

    {state.stage === 4 && <section className={styles.task}><h3>Capture the weakened entity</h3><p>{state.boss.warning ?? 'Containment warning approaching.'}</p><strong>Containment stability {state.boss.stability}/6 · Next control: {nextBossActor === 'archivist' ? 'Archivist · Past' : 'Tracker · Future'}</strong><button disabled={working || nextBossActor !== actor} onClick={() => run('interact', state.boss.step < 6 ? ['hold-record', 'ground-current', 'release-memory', 'vent-pressure', 'lock-sequence', 'close-containment'][state.boss.step] : 'close-containment')}>{nextBossActor === actor ? `Perform ${state.boss.step < 6 ? ['hold-record', 'ground-current', 'release-memory', 'vent-pressure', 'lock-sequence', 'close-containment'][state.boss.step].replaceAll('-', ' ') : 'final control'}` : 'Partner’s control required'}</button></section>}
    {state.completed && <div className={styles.complete} role="status">CONTAINMENT COMPLETE · Hunt III score {state.score}/1,800. The entity has been captured.</div>}
  </section>;
}

const COMPONENTS = ['induction-coil', 'prism-lens', 'grounding-braid', 'memory-core'];
function SequenceSelect({ count, options, values, setValues }: { count: number; options: string[]; values: string[]; setValues: (value: string[]) => void }) {
  const current = values.length === count && values.every((v) => options.includes(v)) ? values : [...options].reverse();
  return <div className={styles.sequence}>{Array.from({ length: count }, (_, i) => <label key={i}>Connection {i + 1}<select value={current[i]} onChange={(e) => setValues(current.map((v, j) => i === j ? e.target.value : v))}>{options.map((option) => <option key={option}>{option}</option>)}</select></label>)}</div>;
}
