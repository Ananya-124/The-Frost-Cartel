import { useState } from 'react';
import type { Hunt3ActionResult, Hunt3Actor, Hunt3State } from '../../../../../../types/hunt3.types';
import styles from './Hunt3Progress.module.css';

interface Props { state: Hunt3State | null; actor: Hunt3Actor; message: string; working: boolean; onAction: (action: { type: string; id: string; value?: unknown }) => Promise<Hunt3ActionResult> }
const ORDER_OPTIONS = ['source', 'ground', 'return', 'low-tone', 'phase-two', 'silence', 'arrival', 'warning', 'anchor', 'coil:west', 'lens:center', 'braid:ground', 'core:east'];
const selectSequence = (count: number, options: string[], initial: string[] = []) => Array.from({ length: count }, (_, i) => initial[i] ?? options[0]);
export default function Hunt3Progress({ state, actor, message, working, onAction }: Props) {
  const [sequence, setSequence] = useState<string[]>([]);
  const [sealAnswers, setSealAnswers] = useState<Record<'power' | 'resonance' | 'memory', string[]>>({
    power: ['return', 'ground', 'source'],
    resonance: ['silence', 'phase-two', 'low-tone'],
    memory: ['anchor', 'warning', 'arrival'],
  });
  const [location, setLocation] = useState(actor === 'archivist' ? 'west-wing' : 'broken-compass');
  const [condition, setCondition] = useState('frequency-low');
  const [reading, setReading] = useState<'withdrawal' | 'surge'>('withdrawal');
  const [profile, setProfile] = useState(['temperature-cold', 'light-dark', 'frequency-low']);
  const [journalOpen, setJournalOpen] = useState(false);
  if (!state) return <div className={styles.loading}>Restoring the shared containment investigation…</div>;
  const run = (type: string, id: string, value?: unknown) => { if (!working) void onAction({ type, id, value }); };
  const editor = (count: number, initial: string[] = []) => {
    const current = sequence.length === count ? sequence : selectSequence(count, ORDER_OPTIONS, initial.length ? [...initial].reverse() : []);
    return <div className={styles.sequence}>{current.map((item, i) => <label key={i}>Position {i + 1}<select value={item} disabled={working} onChange={(e) => setSequence(current.map((entry, j) => j === i ? e.target.value : entry))}>{ORDER_OPTIONS.map((option) => <option key={option}>{option}</option>)}</select></label>)}</div>;
  };
  const submit = (id: string, current: string[] = sequence) => run('submit', id, { sequence: current });
  const nextBossActor = state.stage === 4 ? (state.boss.step % 2 === 0 ? 'archivist' : 'tracker') : null;
  return <section className={`${styles.root} ${actor === 'archivist' ? styles.archivistPanel : styles.trackerPanel}`} aria-label={`Hunt III ${actor} progress`}>
    <header><div><small>ROUND III · FINAL CONTAINMENT</small><h2>{['The Entity’s Trail', 'Break the Three Seals', 'The Bait Protocol', 'Final Containment'][state.stage - 1]}</h2></div><strong>STAGE {state.stage}/4</strong></header>
    <div className={styles.status} aria-live="polite">{message || `Server-confirmed score: ${state.score} · Entity state: ${state.stage === 1 ? 'roaming' : state.stage === 2 ? 'safeguards active' : state.stage === 3 ? 'approaching containment' : state.boss.captured ? 'captured' : 'attacking'}`}</div>
    <div className={styles.progress}>Stage awards: {state.scoreBreakdown.stage1}/250 · {state.scoreBreakdown.stage2}/400 · {state.scoreBreakdown.stage3}/350 · {state.scoreBreakdown.stage4}/500 · Hidden evidence {state.optional.complete ? '100/100' : 'undiscovered'} · Maximum 1,600</div>

    {state.stage === 1 && <section className={styles.task}><h3>Track the roaming entity</h3><p>{actor === 'archivist' ? 'Archive and Observation room, Past: compare the sighting ledger, containment observations and facility report to infer the last known wing.' : 'Main hall, Future: examine the cold ash, drag marks and shattered compass to infer the physical trace signature. Your partner’s records provide the time and map context.'}</p>
      <small>Walk to each named object and press {actor === 'archivist' ? 'E' : 'Enter'}. Then enter your own deduction below; the entity is located only when both investigators’ submissions agree. Evidence examined: {state.evidence[actor].length}/3.</small>
      <label>{actor === 'archivist' ? 'Last known wing' : 'Physical trace signature'}<select value={location} onChange={(e) => setLocation(e.target.value)}>{actor === 'archivist' ? <><option value="west-wing">West wing</option><option value="north-wing">North wing</option><option value="east-wing">East wing</option></> : <><option value="broken-compass">Broken compass</option><option value="cold-star">Cold star</option><option value="drag-loop">Drag loop</option></>}</select></label>
      <button disabled={working || state.evidence[actor].length < 3} onClick={() => run('submit', 'trail-location', { location })}>Submit private trail finding</button>
      <small>Archivist finding: {state.trail.archivist ? 'submitted' : 'awaiting'} · Tracker finding: {state.trail.tracker ? 'submitted' : 'awaiting'}</small>
    </section>}

    {state.stage === 2 && <section className={styles.task}><h3>Disable three distinct safeguards</h3><p>The Archivist must interpret each Past diagram and submit its three-part order. The Tracker must inspect that seal’s Future mechanism, independently enter the same order, and recover the four usable components. Compare the shared evidence before either submission.</p>
      <div className={styles.seals}>{(['power', 'resonance', 'memory'] as const).map((seal) => <div key={seal}><b>{seal.toUpperCase()} SEAL</b><span>{state.seals[seal].disabled ? 'DISABLED' : `Past ${state.seals[seal].archive ? '✓' : '○'} · Future ${state.seals[seal].physical.length ? '✓' : '○'}`}</span>
        {actor === 'archivist' &&         <small>Archive, Communications room or Observation room, Past: press E at the {seal} diagram, deduce its order from the annotations, then submit it below.</small>}
        {actor === 'archivist' && state.evidence.archivist.includes(`${seal}-diagram`) && !state.seals[seal].archive && <>
          <SequenceSelect count={3} options={seal === 'power' ? ['source', 'ground', 'return'] : seal === 'resonance' ? ['low-tone', 'phase-two', 'silence'] : ['arrival', 'warning', 'anchor']} values={sealAnswers[seal]} setValues={(values) => setSealAnswers({ ...sealAnswers, [seal]: values })} />
          <button disabled={working} onClick={() => run('submit', `seal-${seal}-archive`, { sequence: sealAnswers[seal] })}>Submit Past {seal} interpretation</button>
        </>}
        {actor === 'tracker' && <small>{seal === 'power' ? 'Generator room, communications room or Observation room, Future' : seal === 'resonance' ? 'Communications room, Future' : 'Observation room, Future'}: press Enter at the mechanism before configuring it. {state.seals[seal].physical.length ? 'Mechanism examined.' : 'Awaiting inspection.'}</small>}
        {actor === 'tracker' && !state.seals[seal].disabled && state.seals[seal].physical.length > 0 && <>
          <SequenceSelect count={3} options={seal === 'power' ? ['source', 'ground', 'return'] : seal === 'resonance' ? ['low-tone', 'phase-two', 'silence'] : ['arrival', 'warning', 'anchor']} values={sealAnswers[seal]} setValues={(values) => setSealAnswers({ ...sealAnswers, [seal]: values })} />
          <button disabled={working} onClick={() => run('submit', `seal-${seal}`, { sequence: sealAnswers[seal] })}>Configure {seal} seal</button>
        </>}
      </div>)}</div>
      <small>{actor === 'archivist' ? 'Archive, Past: inspect the component catalogue and identify which four named parts belong in the rig.' : 'Generator, Examination, Communications and Observation rooms, Future: recover the coil, lens, braid and core. The shattered glass and scorched lattice in the Main hall are decoys.'}</small>
      <small>Secured parts: {state.components.length}/4 · seals stable: {Object.values(state.seals).filter((s) => s.disabled).length}/3</small>
    </section>}

    {state.stage === 3 && <section className={styles.task}><h3>Rebuild, test, lure and weaken</h3><p>The Archivist reconstructs the apparatus layout from the Past blueprint and interprets the reaction notes. The Tracker independently places the recovered parts, tests environmental conditions, and reports what the entity does.</p>
      <small>{actor === 'archivist' ? 'Containment room, Past: press E at the blueprint, solve and submit its four-part layout. Then use the Experiment room notes to verify the Tracker’s readings and submit the vulnerability profile.' : 'Containment room and Experiment room, Future: press Enter at the rig and test station, place all four parts, then test frequency, light and temperature one at a time. Record each response for the Archivist to compare with the Past notes.'}</small>
      {(actor === 'archivist' ? state.evidence.archivist.includes('apparatus-blueprint') : state.apparatus.archive !== null && state.actions.includes('physical-apparatus')) && <><b>{actor === 'archivist' ? 'Decode blueprint placement' : 'Place recovered apparatus components'}</b>{editor(4, ['coil:west', 'lens:center', 'braid:ground', 'core:east'])}<button disabled={working || sequence.length !== 4} onClick={() => submit('apparatus')}>{actor === 'archivist' ? 'Submit Past blueprint reading' : 'Configure Future apparatus'}</button></>}
      {actor === 'tracker' && state.actions.includes('test-station') && <div className={styles.trial}><b>Controlled environmental trial</b><select value={condition} onChange={(e) => setCondition(e.target.value)}><option value="frequency-low">Low frequency</option><option value="light-dark">Darkness</option><option value="temperature-cold">Cold</option></select><select value={reading} onChange={(e) => setReading(e.target.value as 'withdrawal' | 'surge')}><option value="surge">Entity surges</option><option value="withdrawal">Entity withdraws</option></select><button disabled={working} onClick={() => run('submit', 'weakness-trial', { condition, reading })}>Run trial</button><small>Verified response trials: {state.weakness.trials.filter((t) => t.endsWith(':withdrawal') || t.endsWith('light-dark:surge')).length}/3</small></div>}
      {state.weakness.archive && actor === 'archivist' && <>
        <b>Submit the combined vulnerability profile</b>
        {profile.map((v, i) => <label key={i}>Finding {i + 1}<select value={v} onChange={(e) => setProfile(profile.map((old, j) => i === j ? e.target.value : old))}>{['frequency-low', 'light-dark', 'temperature-cold'].map((x) => <option key={x}>{x}</option>)}</select></label>)}
        <button disabled={working || !(['frequency-low:withdrawal', 'light-dark:surge', 'temperature-cold:withdrawal'].every((trial) => state.weakness.trials.includes(trial)))} onClick={() => run('submit', 'weakness-conclusion', { profile })}>Verify vulnerability with Tracker&apos;s readings</button>
      </>}
      {state.weakness.discovered && <><button disabled={working || state.weakness.lure > 0} onClick={() => run('interact', 'lure-control')}>Activate chamber lure</button><small>Lure {state.weakness.lure ? 'active' : 'off'} · entity weakened {state.weakness.weakened}/3</small></>}
    </section>}

    {state.stage === 4 && <section className={styles.task}><h3>Capture the weakened entity</h3><p>{state.boss.warning ?? 'Containment warning approaching.'}</p><strong>Containment room · Stability {state.boss.stability}/6 · Next control: {nextBossActor === 'archivist' ? 'Archivist · Past' : 'Tracker · Future'}</strong><small>{nextBossActor === actor ? 'Walk to the control named in this warning in your timeline and press E within 12 seconds. The roles alternate; read the next warning after each successful action.' : 'Your partner must operate the named control in their timeline before the sequence advances. Stay ready for your turn.'}</small></section>}
    {state.completed && <div className={styles.complete} role="status">CONTAINMENT COMPLETE · Hunt III score {state.score}/1,600. The entity has been captured.</div>}
    <details className={styles.journal} open={journalOpen} onToggle={(event) => setJournalOpen(event.currentTarget.open)}>
      <summary><span>Shared evidence journal</span><b>{state.journal?.length ?? 0} FINDINGS</b></summary>
      <p className={styles.journalGuide}>Both timelines can review these findings. Use verified clues to support your submission; collecting evidence alone does not complete a task.</p>
      {[...(state.journal ?? [])].reverse().map((entry) => <article key={entry.id}>
        <small><span>{entry.actor === 'team' ? 'TEAM' : entry.actor.toUpperCase()}</span> · {entry.location} · {entry.relatedObjective} {entry.verified && <b className={styles.verified}>VERIFIED</b>}</small>
        <b>{entry.title}</b><p>{entry.content}</p>
      </article>)}
      {!state.journal?.length && <p className={styles.emptyJournal}>No evidence recorded yet. Examine the named objects in the active stage, then return here to compare findings.</p>}
    </details>
  </section>;
}

function SequenceSelect({ count, options, values, setValues }: { count: number; options: string[]; values: string[]; setValues: (value: string[]) => void }) {
  const current = values.length === count && values.every((v) => options.includes(v)) ? values : [...options].reverse();
  return <div className={styles.sequence}>{Array.from({ length: count }, (_, i) => <label key={i}>Connection {i + 1}<select value={current[i]} onChange={(e) => setValues(current.map((v, j) => i === j ? e.target.value : v))}>{options.map((option) => <option key={option}>{option}</option>)}</select></label>)}</div>;
}
