import { useEffect, useState, type FormEvent } from 'react';
import type { Hunt2ActionResult, Hunt2Actor, Hunt2Challenge, Hunt2Input, Hunt2State } from '../../../../../../types/hunt2.types';
import styles from './Hunt2Progress.module.css';

interface Pending { actor: Hunt2Actor; kind: Hunt2Input }
interface Props { state: Hunt2State | null; pending: Pending | null; message: string; working: boolean; onHint: (actor: Hunt2Actor) => void; onSubmit: (actor: Hunt2Actor, kind: Hunt2Input, value: unknown) => Promise<Hunt2ActionResult>; onClose: () => void; onContinue: () => void }
const TITLES: Record<Hunt2Challenge, string> = { 1: 'The Room That Never Existed', 2: 'The Three Identities', 3: 'The Broken Memory', 4: 'The Memory Anchor', 5: 'The Final Memory' };
const CONTEXT: Record<Hunt2Challenge, string> = {
  1: 'The same hall exists in both timelines, but the Future has four doors where the Past had one passage.',
  2: 'Three figures occupy the experiment chamber. Their bodies look alike; compare original movement with Future traces.',
  3: 'The experimental room has been rearranged. The Past memory preserves the positions the Future must regain.',
  4: 'Three anchors imitate the same object. Only one repeats the pattern witnessed during the original experiment.',
  5: 'The true anchor is exposed. Preserve the original memory while the Future containment sequence is completed.',
};
const OBJECTIVES: Record<Hunt2Challenge, Record<Hunt2Actor, string>> = {
  1: { archivist: 'Inspect the original hall memory and identify the genuine exit position.', tracker: 'Inspect the four Future doors and open the position validated by the Archivist.' },
  2: { archivist: 'Review the original movement and submit the real entity’s distinguishing trait.', tracker: 'Inspect all three physical traces, then select the figure matching the verified trait.' },
  3: { archivist: 'Review and submit the original four-object arrangement.', tracker: 'Inspect the displaced furniture and reconstruct the Future room in that order.' },
  4: { archivist: 'Recover the anchor’s activation rhythm from the original experiment.', tracker: 'Inspect all three anchors, then activate the one matching the verified rhythm.' },
  5: { archivist: 'Restore and maintain the original event sequence, then prepare the memory control.', tracker: 'Use the verified sequence to activate all three containment mechanisms, then prepare the exposed anchor.' },
};
const TASKS: Record<Hunt2Challenge, Record<Hunt2Actor, readonly [string, string][]>> = {
  1: { archivist: [['originalDoorRoomInspected', 'Original room memory inspected'], ['genuineDoorIdentified', 'Genuine exit identified']], tracker: [['genuineExitOpened', 'Validated passage opened']] },
  2: { archivist: [['manifestationMemoryViewed', 'Original movement reviewed'], ['characteristicValidated', 'Identity trait verified']], tracker: [['manifestationsInspected', 'Three physical traces inspected'], ['genuineManifestationSelected', 'Genuine figure selected']] },
  3: { archivist: [['originalLayoutViewed', 'Original room memory reviewed'], ['originalArrangementSubmitted', 'Arrangement verified']], tracker: [['furnitureInspected', 'Four displaced objects inspected'], ['roomReconstructed', 'Room reconstructed']] },
  4: { archivist: [['anchorSequenceViewed', 'Original experiment reviewed'], ['activationPatternValidated', 'Pattern verified']], tracker: [['anchorsInspected', 'Three anchors inspected'], ['trueAnchorActivated', 'True anchor activated']] },
  5: { archivist: [['finalMemoryViewed', 'Final memory reviewed'], ['finalSequenceValidated', 'Event sequence verified'], ['memoryMaintained', 'Original memory stabilized'], ['archivistReady', 'Past control prepared']], tracker: [['containmentMechanismsReady', 'Three mechanisms activated'], ['trackerReady', 'Future control prepared']] },
};
function isDone(state: Hunt2State, key: string): boolean { if (key === 'manifestationsInspected') return state.inspectedManifestations.length === 3; if (key === 'furnitureInspected') return state.inspectedFurniture.length === 4; if (key === 'anchorsInspected') return state.inspectedAnchors.length === 3; return state.subtasks[key] === true; }
function status(state: Hunt2State, actor: Hunt2Actor): string { if (state.completed) return 'COMPLETED'; return TASKS[state.currentChallenge][actor].every(([key]) => isDone(state, key)) ? 'WAITING FOR PARTNER' : 'ACTIVE'; }
function totalScore(state: Hunt2State): number { const b = state.scoreBreakdown; return b.exit + b.identity + b.reconstruction + b.anchor + b.final + b.optional - b.penalties; }

export default function Hunt2Progress({ state, pending, message, working, onHint, onSubmit, onClose, onContinue }: Props) {
  const [boardOpen, setBoardOpen] = useState(false); const [boardActor, setBoardActor] = useState<Hunt2Actor>('archivist');
  const [clockNow, setClockNow] = useState(0); const [single, setSingle] = useState(''); const [order, setOrder] = useState(['', '', '', '']);
  const hasState = state !== null; const stateCompleted = state?.completed ?? false;
  useEffect(() => { if (!hasState || stateCompleted) return; const initialize = window.setTimeout(() => setClockNow(Date.now()), 0); const timer = window.setInterval(() => setClockNow(Date.now()), 500); return () => { window.clearTimeout(initialize); window.clearInterval(timer); }; }, [hasState, stateCompleted]);
  useEffect(() => { const reset = window.setTimeout(() => { setSingle(''); setOrder(['', '', '', '']); }, 0); return () => window.clearTimeout(reset); }, [pending?.kind, pending?.actor, state?.currentChallenge]);
  const submit = async (event: FormEvent) => {
    event.preventDefault(); if (!pending) return;
    let value: Record<string, unknown>;
    if (pending.kind === 'door') value = { kind: 'door', door: Number(single) };
    else if (pending.kind === 'characteristic') value = { kind: 'characteristic', characteristic: single };
    else if (pending.kind === 'manifestation') value = { kind: 'manifestation', manifestation: single };
    else if (pending.kind === 'arrangement') value = { kind: 'arrangement', order };
    else if (pending.kind === 'anchor-pattern') value = { kind: 'anchor-pattern', pattern: single };
    else if (pending.kind === 'anchor') value = { kind: 'anchor', anchor: single };
    else value = { kind: 'final-sequence', order };
    await onSubmit(pending.actor, pending.kind, value);
  };
  if (!state) return <div className={styles.loading}>Restoring the shared Hunt II memory…</div>;
  const challenge = state.currentChallenge;
  const next = challenge === 1 ? 'Archivist identifies the door; Tracker opens that same Future passage.' : challenge === 2 ? 'The Archivist’s trait and Tracker’s matching manifestation must agree.' : challenge === 3 ? 'The original layout and all four Future object placements must match.' : challenge === 4 ? 'The Past activation rhythm must match the selected physical anchor.' : 'Maintain the Past memory and prepare the Future mechanisms before synchronized activation.';
  const visible = state.observations.filter((entry) => entry.verified || entry.discoveredBy === 'team' || entry.discoveredBy === boardActor);
  const distorted = Math.max(state.entityState.falseCorridorUntil ?? 0, state.entityState.decoyHiddenUntil ?? 0, state.entityState.trueAnchorHiddenUntil ?? 0) > clockNow;
  return <>
    <div className={styles.panels}>{(['archivist', 'tracker'] as const).map((actor) => <section key={actor} className={`${styles.panel} ${actor === 'tracker' ? styles.future : ''}`}>
      <header><span>{actor === 'archivist' ? 'ARCHIVIST · PAST' : 'TRACKER · FUTURE'}</span><b>{status(state, actor)}</b></header>
      <small>HUNT II · THE FALSE MEMORY · CHALLENGE {challenge}/5</small><h2>{TITLES[challenge]}</h2><p>{OBJECTIVES[challenge][actor]}</p>
      <ul>{TASKS[challenge][actor].map(([key, label]) => <li className={isDone(state, key) ? styles.done : ''} key={key}><span>{isDone(state, key) ? '✓' : '○'}</span>{label}</li>)}</ul>
      <footer><span>Partner: {status(state, actor === 'archivist' ? 'tracker' : 'archivist')}</span><span>Your Hunt II score: {totalScore(state)} · Team {state.completed ? 5 : challenge - 1}/5</span></footer>
      <small className={styles.unlock}>NEXT: {next}</small><button className={styles.hint} disabled={working || (state.hintUses[String(challenge)] ?? 0) >= 2} onClick={() => onHint(actor)}>Memory hint · 25 points</button>
    </section>)}</div>
    <div className={styles.toolbar}><button onClick={() => setBoardOpen((open) => !open)}>Shared memory board · {state.observations.length}</button>{message && <span role="status">{message}</span>}<span>TEAM SCORE {state.score} · PENALTIES {state.penalties}</span>
      <details><summary>Score breakdown</summary><span>Exit {state.scoreBreakdown.exit} · Identity {state.scoreBreakdown.identity} · Reconstruction {state.scoreBreakdown.reconstruction} · Anchor {state.scoreBreakdown.anchor} · Final {state.scoreBreakdown.final} · Optional {state.scoreBreakdown.optional} · Penalties −{state.scoreBreakdown.penalties}</span></details>
    </div>
    {boardOpen && <aside className={styles.board}><button className={styles.close} onClick={() => setBoardOpen(false)}>Close</button><h2>Shared Memory Board</h2>
      <div className={styles.filters}><button aria-pressed={boardActor === 'archivist'} onClick={() => setBoardActor('archivist')}>Archivist view</button><button aria-pressed={boardActor === 'tracker'} onClick={() => setBoardActor('tracker')}>Tracker view</button></div>
      <h3>CHALLENGE {challenge}: {TITLES[challenge]}</h3><p>{CONTEXT[challenge]}</p>{visible.length ? [...visible].reverse().map((entry) => <article key={entry.id}><small>{entry.location} · {entry.discoveredBy.toUpperCase()} · {entry.verified ? 'VERIFIED' : 'UNVERIFIED'}</small><h3>{entry.title}</h3><p>{entry.content}</p></article>) : <p>No memory observations recorded yet.</p>}
    </aside>}
    {distorted && <div className={styles.distortion} role="status">FALSE MEMORY DISTORTION · THE ROOM IS REFORMING</div>}
    {challenge === 5 && state.syncDeadline !== null && !state.completed && <div className={styles.countdown} role="timer">FINAL MEMORY WINDOW · {Math.max(0, Math.ceil((state.syncDeadline - clockNow) / 1000))}s</div>}
    {pending && <div className={styles.scrim}><form className={styles.dialog} onSubmit={(event) => { void submit(event); }}><button type="button" className={styles.close} onClick={onClose}>Close</button>
      <small>CHALLENGE {challenge} · {pending.actor === 'archivist' ? 'ARCHIVIST / PAST' : 'TRACKER / FUTURE'}</small>
      <h2>{pending.kind === 'door' ? 'Identify the original passage' : pending.kind === 'characteristic' ? 'Submit the identity trait' : pending.kind === 'manifestation' ? 'Select the matching manifestation' : pending.kind === 'arrangement' ? 'Reconstruct the room memory' : pending.kind === 'anchor-pattern' ? 'Submit the anchor rhythm' : pending.kind === 'anchor' ? 'Select the genuine anchor' : 'Restore the final event sequence'}</h2>
      <p>{CONTEXT[challenge]} Work from your observations and your partner’s verified discovery.</p>
      {pending.kind === 'door' && <label>Which numbered door matches the Past?<select value={single} onChange={(event) => setSingle(event.target.value)} required><option value="">Select a door…</option>{[1,2,3,4].map((n) => <option key={n} value={n}>Door {n}</option>)}</select></label>}
      {pending.kind === 'characteristic' && <label>Distinguishing property<select value={single} onChange={(event) => setSingle(event.target.value)} required><option value="">Choose a property…</option><option value="no shadow">No shadow</option><option value="reversed reflection">Reversed reflection</option><option value="normal footprints">Normal footprint trail</option></select></label>}
      {pending.kind === 'manifestation' && <label>Which figure matches the verified trait?<select value={single} onChange={(event) => setSingle(event.target.value)} required><option value="">Select a manifestation…</option>{['A','B','C'].map((n) => <option key={n} value={`manifestation${n}`}>Manifestation {n}</option>)}</select></label>}
      {pending.kind === 'anchor-pattern' && <label>Observed activation rhythm<select value={single} onChange={(event) => setSingle(event.target.value)} required><option value="">Select the rhythm…</option><option value="single pulse">Single pulse</option><option value="pulse pause double pulse">Pulse · pause · double pulse</option><option value="double pulse pause">Double pulse · pause</option></select></label>}
      {pending.kind === 'anchor' && <label>Which anchor matches the rhythm?<select value={single} onChange={(event) => setSingle(event.target.value)} required><option value="">Choose an anchor…</option>{['A','B','C'].map((n) => <option key={n} value={`memoryAnchor${n}`}>Memory anchor {n}</option>)}</select></label>}
      {(pending.kind === 'arrangement' || pending.kind === 'final-sequence') && <div className={styles.sequence}>{order.map((item,index) => <label key={index}>{pending.kind === 'arrangement' ? `Position ${index+1}` : `Event ${index+1}`}<select value={item} onChange={(event) => setOrder((old) => old.map((part,i) => i === index ? event.target.value : part))} required><option value="">Select…</option>{(pending.kind === 'arrangement' ? [['chair','Chair'],['mirror','Mirror'],['table','Table'],['lamp','Experimental lamp']] : [['arrival','Subject arrives'],['alarm','Warning alarm'],['containment-failure','Containment fails']]).map(([key,label]) => <option key={key} value={key}>{label}</option>)}</select></label>)}</div>}
      <button className={styles.submit} disabled={working}>{working ? 'Checking memory…' : 'Submit for verification'}</button>
    </form></div>}
    {state.completed && <div className={styles.completed} role="status"><b>TRUE MEMORY ANCHOR DESTROYED</b><span>Hunt II complete · Score {state.score}</span><button onClick={onContinue}>Continue to Hunt III</button></div>}
  </>;
}
