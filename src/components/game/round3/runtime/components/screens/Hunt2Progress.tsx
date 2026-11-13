import { Fragment, useEffect, useRef, useState, type FormEvent } from 'react';
import type { Hunt2ActionResult, Hunt2Actor, Hunt2Challenge, Hunt2Input, Hunt2State } from '../../../../../../types/hunt2.types';
import styles from './Hunt2Progress.module.css';

interface Pending { actor: Hunt2Actor; kind: Hunt2Input }
interface Props { state: Hunt2State | null; pending: Pending | null; message: string; working: boolean; onHint: (actor: Hunt2Actor) => void; onOpenInput: (actor: Hunt2Actor, kind: Hunt2Input) => void; onSubmit: (actor: Hunt2Actor, kind: Hunt2Input, value: unknown) => Promise<Hunt2ActionResult>; onClose: () => void; onContinue: () => void }
const TITLES: Record<Hunt2Challenge, string> = { 2: 'The Hidden Weakness', 3: 'The Broken Memory', 4: 'The Memory Anchor', 5: 'The Final Memory' };
const CONTEXT: Record<Hunt2Challenge, string> = {
  2: 'Test the entity’s vulnerability through controlled containment trials, then synchronize the Past and Future controls.',
  3: 'The archive and chamber disagree. Identify which identity records were duplicated, displaced, substituted or fragmented before reconnecting the six components.',
  4: 'Reality is collapsing around the hidden anchor. Map four live nodes, combine Past design with Future conditions, then hold the alternating pulse cadence.',
  5: 'The true anchor is exposed. Preserve the original memory while the Future containment sequence is completed.',
};
const OBJECTIVES: Record<Hunt2Challenge, Record<Hunt2Actor, string>> = {
  2: { archivist: 'Review the contradictory containment reports, then calibrate the verified vulnerability after the Tracker arms the device.', tracker: 'Run controlled frequency, light and temperature trials, submit the observed profile, then arm containment.' },
  3: { archivist: 'Compare damaged identity records, duplicated entries and fragmented voices; reconnect their historical relationships at the shared restoration board.', tracker: 'Search the corrupted Future chambers for displaced, duplicated and substituted components, then restore their physical connections.' },
  4: { archivist: 'Read the original circuit diagram and flow record. Configure the Past alignment, then initiate the synchronization pulse.', tracker: 'Map the four Future node conditions, configure the physical repairs, then complete the alternating stabilization cadence.' },
  5: { archivist: 'Restore and maintain the original event sequence, then prepare the memory control.', tracker: 'Use the verified sequence to activate all three containment mechanisms, then prepare the exposed anchor.' },
};
function fieldGuide(challenge: Hunt2Challenge, actor: Hunt2Actor): string[] {
  if (challenge === 2) {
    return actor === 'archivist'
      ? [
          'Experiment Room (Past): Inspect the Containment Experiment Archive on the top-left wall. (If it only displays baseline memo, wait for the Tracker to finish 2 trials, then inspect the archive again to reveal the failed bright/warm reports).',
          'Submit Conclusion: Click "Submit historical conclusion" below and select "Reject bright and warm conclusions as compromised".',
          'Underground Containment (Past): After the Tracker arms containment, go to Past Containment and press E at the Historical Calibration Console within 10 seconds. No clock time is entered.',
        ]
      : [
          'Experiment Room (Future): Run at least 4 trials across the Resonance, Light, and Temperature stations.',
          'Submit Profile: Click "Submit experimental profile" below and select Frequency = Low, Light = Dark, Temperature = Cold.',
          'Underground Containment (Future): Interact with "Containment Control" to arm the device (giving the Archivist 10 seconds to calibrate).',
        ];
  }
  if (challenge === 3) {
    return actor === 'archivist'
      ? [
          'Inspect 3 Past records: Damaged Photo (Archive), Duplicated Ledger (Observation Room), Fragmented Recording (Communications Room).',
          'Shared Restoration Board (Observation Room): Submit historical relations (Photo: original source, Ledger: duplicate, Recording: fragmented voice, Keepsake: before test, Shadow: original identity, Name: Subject Zero).',
          'Underground Containment (Past): Activate the Historical Memory Synchronizer (Tracker must restore within 10s).',
        ]
      : [
          'Inspect 3 Future traces: Unstable Chamber (Research Lab), Substituted Symbols (Main Hall), Displaced Keepsake (Underground Containment).',
          'Shared Restoration Board (Observation Room): Submit Future placements (Photo: entry, Ledger: archive, Recording: resonance, Keepsake: center, Shadow: mirror, Name: anchor).',
          'Underground Containment (Future): Activate the Environmental Restoration Mechanism within 10s of the Archivist’s sync.',
        ];
  }
  if (challenge === 4) {
    return actor === 'archivist'
      ? [
          'Underground Containment (Past): Inspect Anchor Experiment Memory, Energy-Flow Record, and alignment nodes B & D.',
          'Submit Alignment: Node A = East feed, Node B = West return, Node C = Central ground, Node D = Outer loop.',
          'Cadence Pulse Sequence: When Tracker initiates, alternate pulses: pulse Node B (2nd pulse) and Node D (4th pulse).',
        ]
      : [
          'Underground Containment (Future): Inspect and map all 4 live nodes: Node A, Node B, Node C, and Node D.',
          'Submit Node Repairs: Node A = Stabilize surge, Node B = Reverse to forward, Node C = Reconnect ground, Node D = Hold stable.',
          'Cadence Pulse Sequence: Engage Future Anchor Control, then pulse Node A (1st pulse) and Node C (3rd pulse) in alternating order.',
        ];
  }
  return actor === 'archivist'
    ? [
        'Observation Room (Past): Inspect Final Memory Projector and verify sequence: Arrival → Warning alarm → Containment fails.',
        'Observation Room (Past): Interact with projector again to stabilize the memory.',
        'Observation Room (Past): Prepare Memory Stabilization Console for synchronized activation.',
      ]
    : [
        'Underground Containment (Future): Activate 3 mechanisms in order: Mechanism B (Arrival) → Mechanism A (Warning) → Mechanism C (Fail-safe).',
        'Underground Containment (Future): Prepare Exposed Memory Anchor.',
        'Final Activation: Both players activate their prepared controls together within the 10-second window.',
      ];
}
const TASKS: Record<Hunt2Challenge, Record<Hunt2Actor, readonly [string, string][]>> = {
  2: { archivist: [['weaknessArchiveReviewed', 'Baseline and failed reports reviewed'], ['weaknessHistoricalSubmitted', 'Historical conclusion submitted'], ['hiddenWeaknessComplete', '10-second calibration completed']], tracker: [['weaknessTrialsComplete', 'At least four controlled trials completed'], ['weaknessExperimentalSubmitted', 'Experimental profile submitted'], ['hiddenWeaknessComplete', 'Containment calibrated']] },
  3: { archivist: [['brokenArchiveEvidence', 'Three Past records examined'], ['brokenHistoricalSubmitted', 'Historical relationships confirmed'], ['brokenMemoryComplete', 'Synchronized restoration complete']], tracker: [['brokenFutureEvidence', 'Three Future traces examined'], ['brokenStructureSubmitted', 'Six chamber placements confirmed'], ['brokenMemoryComplete', 'Synchronized restoration complete']] },
  4: { archivist: [['anchorPastRecords', 'Diagram and energy-flow record examined'], ['anchorArchivistConfigured', 'Historical alignment submitted'], ['memoryAnchorComplete', 'Final stabilization cadence held']], tracker: [['anchorNodesMapped', 'Four live nodes mapped'], ['anchorTrackerConfigured', 'Physical node repairs submitted'], ['memoryAnchorComplete', 'Final stabilization cadence held']] },
  5: { archivist: [['finalMemoryViewed', 'Final memory reviewed'], ['finalSequenceValidated', 'Event sequence verified'], ['memoryMaintained', 'Original memory stabilized'], ['archivistReady', 'Past control prepared']], tracker: [['containmentMechanismsReady', 'Three mechanisms activated'], ['trackerReady', 'Future control prepared']] },
};
function isDone(state: Hunt2State, key: string): boolean { if (key === 'anchorPastRecords') return state.memoryAnchor.archivistEvidence.includes('diagram') && state.memoryAnchor.archivistEvidence.includes('flow'); if (key === 'anchorNodesMapped') return state.memoryAnchor.trackerEvidence.length === 4; if (key === 'weaknessTrialsComplete') return state.hiddenWeakness.experiments.length >= 4; if (key === 'weaknessArchiveReviewed') return state.hiddenWeakness.archiveEvidence.includes('contradictions'); if (key === 'brokenArchiveEvidence') return state.brokenMemory.archivistEvidence.length === 3; if (key === 'brokenFutureEvidence') return state.brokenMemory.trackerEvidence.length === 3; return state.subtasks[key] === true; }
function requiredCluesCollected(state: Hunt2State, actor: Hunt2Actor): boolean {
  if (state.currentChallenge === 2) return actor === 'archivist' ? isDone(state, 'weaknessArchiveReviewed') : isDone(state, 'weaknessTrialsComplete');
  if (state.currentChallenge === 3) return actor === 'archivist' ? isDone(state, 'brokenArchiveEvidence') : isDone(state, 'brokenFutureEvidence');
  if (state.currentChallenge === 4) return actor === 'archivist' ? isDone(state, 'anchorPastRecords') : isDone(state, 'anchorNodesMapped');
  return actor === 'archivist' ? isDone(state, 'finalMemoryViewed') : isDone(state, 'containmentMechanismsReady');
}
function nextAction(state: Hunt2State, challenge: Hunt2Challenge, actor: Hunt2Actor): string | null {
  if (challenge === 2) {
    if (actor === 'archivist' && isDone(state, 'weaknessArchiveReviewed') && !state.subtasks.weaknessHistoricalSubmitted) return 'Archive evidence reviewed. Click "Submit historical conclusion" below to reject flawed bright & warm reports.';
    if (actor === 'tracker' && isDone(state, 'weaknessTrialsComplete') && !state.subtasks.weaknessExperimentalSubmitted) return '4 trials completed! Submit the three-part experimental profile (select Low, Dark, Cold) from the task panel.';
    if (actor === 'archivist' && state.subtasks.weaknessHistoricalSubmitted && !state.subtasks.hiddenWeaknessComplete) return 'Historical conclusion submitted! Wait for Tracker to arm containment in Underground Containment, then interact with the Historical Calibration Console within 10s.';
    if (actor === 'tracker' && state.subtasks.weaknessExperimentalSubmitted && !state.subtasks.hiddenWeaknessComplete) return 'Experimental profile verified! Go to Underground Containment and interact with Containment Control to arm it (Archivist has 10s to calibrate).';
  }
  if (challenge === 3) {
    if (actor === 'archivist' && isDone(state, 'brokenArchiveEvidence') && !state.subtasks.brokenHistoricalSubmitted) return 'All 3 Past records collected. Open the Restoration Board below to submit historical relationships.';
    if (actor === 'tracker' && isDone(state, 'brokenFutureEvidence') && !state.subtasks.brokenStructureSubmitted) return 'All 3 Future traces collected. Open the Restoration Board below to submit chamber placements.';
    if (actor === 'archivist' && state.subtasks.brokenHistoricalSubmitted && !state.subtasks.brokenMemoryComplete) return 'Past reconstruction submitted! Go to Underground Containment and activate the Historical Memory Synchronizer.';
    if (actor === 'tracker' && state.subtasks.brokenStructureSubmitted && !state.subtasks.brokenMemoryComplete) return 'Future placements submitted! In Underground Containment, activate the Environmental Restoration Mechanism within 10s of Archivist.';
  }
  if (challenge === 4) {
    if (actor === 'archivist' && isDone(state, 'anchorPastRecords') && !state.subtasks.anchorArchivistConfigured) return 'Past records collected. Click "Configure Historical Alignment" below to submit.';
    if (actor === 'tracker' && isDone(state, 'anchorNodesMapped') && !state.subtasks.anchorTrackerConfigured) return 'All 4 nodes mapped! Click "Configure Physical Node Repairs" below to submit.';
    if (actor === 'archivist' && state.subtasks.anchorArchivistConfigured && !state.subtasks.memoryAnchorComplete) return 'Historical alignment verified. When Tracker initiates the pulse, alternate on Node B (2nd) and Node D (4th).';
    if (actor === 'tracker' && state.subtasks.anchorTrackerConfigured && !state.subtasks.memoryAnchorComplete) return 'Repairs verified. In Underground Containment, initiate synchronization at Future Anchor Control, then pulse Node A (1st) and Node C (3rd).';
  }
  if (challenge === 5) {
    if (actor === 'archivist' && isDone(state, 'finalMemoryViewed') && !state.subtasks.finalSequenceValidated) return 'Final memory viewed. Click "Submit Final Event Sequence" below to verify.';
    if (actor === 'tracker' && isDone(state, 'containmentMechanismsReady') && !state.subtasks.trackerReady) return 'All 3 mechanisms active. Interact with the Exposed Memory Anchor in Containment to prepare.';
    if (actor === 'archivist' && state.subtasks.finalSequenceValidated && !state.subtasks.archivistReady) return 'Sequence verified! Stabilize the memory at the projector, then prepare the Past console in Observation Room.';
    if (actor === 'tracker' && state.subtasks.archivistReady && !state.subtasks.trackerReady) return 'Archivist has prepared! Prepare the Exposed Memory Anchor, then activate together within 10s.';
  }
  return null;
}
function status(state: Hunt2State, actor: Hunt2Actor): string { if (state.completed) return 'COMPLETED'; return TASKS[state.currentChallenge][actor].every(([key]) => isDone(state, key)) ? 'WAITING FOR PARTNER' : 'ACTIVE'; }
function totalScore(state: Hunt2State): number { return state.score; }

export default function Hunt2Progress({ state, pending, message, working, onHint, onOpenInput, onSubmit, onClose, onContinue }: Props) {
  const [tasksOpen, setTasksOpen] = useState<Record<Hunt2Actor, boolean>>({ archivist: false, tracker: false });
  const [panelOpen, setPanelOpen] = useState<Record<Hunt2Actor, boolean>>({ archivist: false, tracker: false });
  const [boardOpen, setBoardOpen] = useState(false); const [boardActor, setBoardActor] = useState<Hunt2Actor>('archivist');
  const [clockNow, setClockNow] = useState(0); const [single, setSingle] = useState(''); const [order, setOrder] = useState(['', '', '', '', '', '']);
  const [profile, setProfile] = useState({ frequency: '', light: '', temperature: '' });
  const [bannerVisible, setBannerVisible] = useState(false);

  useEffect(() => {
    if (!message) {
      setBannerVisible(false);
      return;
    }
    setBannerVisible(true);
    const timer = setTimeout(() => {
      setBannerVisible(false);
    }, 6000);
    return () => clearTimeout(timer);
  }, [message]);
  const panelReadiness = useRef<{ challenge: Hunt2Challenge | null; archivist: boolean; tracker: boolean }>({ challenge: null, archivist: false, tracker: false });
  const hasState = state !== null; const stateCompleted = state?.completed ?? false;
  useEffect(() => { if (!hasState || stateCompleted) return; const initialize = window.setTimeout(() => setClockNow(Date.now()), 0); const timer = window.setInterval(() => setClockNow(Date.now()), 1000); return () => { window.clearTimeout(initialize); window.clearInterval(timer); }; }, [hasState, stateCompleted]);
  useEffect(() => { const reset = window.setTimeout(() => { setSingle(''); setOrder(['', '', '', '', '', '']); setProfile({ frequency: '', light: '', temperature: '' }); }, 0); return () => window.clearTimeout(reset); }, [pending?.kind, pending?.actor, state?.currentChallenge]);
  useEffect(() => {
    if (!state || state.completed) return;
    const challengeChanged = panelReadiness.current.challenge !== state.currentChallenge;
    const wasReady = challengeChanged ? { archivist: false, tracker: false } : panelReadiness.current;
    const ready = {
      archivist: requiredCluesCollected(state, 'archivist'),
      tracker: requiredCluesCollected(state, 'tracker'),
    };
    for (const actor of ['archivist', 'tracker'] as const) {
      if (ready[actor] && !wasReady[actor]) {
        setTasksOpen((open) => ({ ...open, [actor]: true }));
        setPanelOpen((open) => ({ ...open, [actor]: true }));
      }
    }
    panelReadiness.current = { challenge: state.currentChallenge, ...ready };
  }, [state]);
  const submit = async (event: FormEvent) => {
    event.preventDefault(); if (!pending) return;
    let value: Record<string, unknown>;
    if (pending.kind === 'broken-historical' || pending.kind === 'broken-structure') value = { kind: pending.kind, order: order.slice(0, 6) };
    else if (pending.kind === 'weakness-history') value = { kind: pending.kind, conclusion: single };
    else if (pending.kind === 'weakness-frequency' || pending.kind === 'weakness-light' || pending.kind === 'weakness-temperature') value = { kind: 'weakness-experiment', variable: pending.kind.replace('weakness-', ''), setting: single };
    else if (pending.kind === 'weakness-conclusion') value = { kind: pending.kind, profile };
    else if (pending.kind === 'anchor-history-config' || pending.kind === 'anchor-physical-config') value = { kind: pending.kind, order: order.slice(0, 4) };
    else value = { kind: 'final-sequence', order: order.slice(0, 3) };
    await onSubmit(pending.actor, pending.kind, value);
  };
  if (!state) return <div className={styles.loading}>Restoring the shared Hunt II memory…</div>;
  const challenge = state.currentChallenge;
  const progressNumber = challenge - 1;
  const title = TITLES[challenge];
  const next = challenge === 2 ? 'Arm containment in the Future, then calibrate it in the Past.' : challenge === 3 ? 'Both six-component reconstructions are required before Past-first synchronization.' : challenge === 4 ? 'Complete the Future–Past–Future–Past sequence to stabilize the anchor.' : 'Maintain the Past memory and prepare the Future mechanisms before synchronized activation.';
  const visible = state.observations.filter((entry) => entry.verified || entry.discoveredBy === 'team' || entry.discoveredBy === boardActor);
  const distorted = Math.max(state.entityState.falseCorridorUntil ?? 0, state.entityState.trueAnchorHiddenUntil ?? 0) > clockNow;
  return <>
    {(['archivist', 'tracker'] as const).map((actor) => <Fragment key={actor}>
    <button
      className={`${styles.taskToggle} ${actor === 'archivist' ? styles.pastToggle : styles.trackerToggle}`}
      type="button"
      aria-expanded={tasksOpen[actor] && panelOpen[actor]}
      aria-controls={`hunt2-objectives-${actor}`}
      onClick={(e) => {
        e.currentTarget.blur();
        const isVisible = tasksOpen[actor] && panelOpen[actor];
        setTasksOpen((open) => ({ ...open, [actor]: !isVisible }));
        setPanelOpen((open) => ({ ...open, [actor]: true }));
      }}
    >
      Hunt II · {progressNumber}/4 · {tasksOpen[actor] && panelOpen[actor] ? `Hide ${actor === 'archivist' ? 'Archivist' : 'Tracker'} tasks` : `Show ${actor === 'archivist' ? 'Archivist' : 'Tracker'} tasks`}
    </button>
    {tasksOpen[actor] && panelOpen[actor] && <div className={`${styles.panels} ${actor === 'tracker' ? styles.futurePanel : ''}`} id={`hunt2-objectives-${actor}`} aria-label={`Hunt II ${actor} objectives`}>
      <section className={`${styles.panel} ${actor === 'tracker' ? styles.future : ''}`}>
      <button className={styles.panelHide} type="button" onClick={(e) => {
        e.currentTarget.blur();
        setPanelOpen((open) => ({ ...open, [actor]: false }));
      }}>Hide</button>
      <header><span>{actor === 'archivist' ? 'ARCHIVIST · PAST' : 'TRACKER · FUTURE'}</span><b>{status(state, actor)}</b></header>
      <small>HUNT II · THE FALSE MEMORY · TASK {progressNumber}/4</small>
      <h2>{title}</h2>
      <p><b>OBJECTIVE: </b>{OBJECTIVES[challenge][actor]}</p>
      <div className={styles.fieldGuide}>
        <b>TASK INSTRUCTIONS:</b>
        <ol>
          {fieldGuide(challenge, actor).map((step, idx) => (
            <li key={idx}>{step}</li>
          ))}
        </ol>
      </div>
      {nextAction(state, challenge, actor) && <aside className={styles.nextAction} role="status"><b>NEXT ACTION:</b><span>{nextAction(state, challenge, actor)}</span></aside>}
      <ul>{TASKS[challenge][actor].map(([key, label]) => <li className={isDone(state, key) ? styles.done : ''} key={key}><span>{isDone(state, key) ? '✓' : '○'}</span>{label}</li>)}</ul>
      {challenge === 2 && actor === 'archivist' && state.hiddenWeakness.archiveEvidence.includes('contradictions') && !state.hiddenWeakness.historicalValid && (
        <button type="button" className={styles.hint} onClick={() => onOpenInput('archivist', 'weakness-history')}>
          Submit historical conclusion
        </button>
      )}
      {challenge === 2 && actor === 'tracker' && state.hiddenWeakness.experiments.length >= 4 && !state.hiddenWeakness.experimentalValid && (
        <button type="button" className={styles.hint} onClick={() => onOpenInput('tracker', 'weakness-conclusion')}>
          Submit experimental profile
        </button>
      )}
      {challenge === 3 && actor === 'archivist' && state.brokenMemory.archivistEvidence.length >= 3 && !state.brokenMemory.historicalValid && (
        <button type="button" className={styles.hint} onClick={() => onOpenInput('archivist', 'broken-historical')}>
          Open Restoration Board (Historical Relations)
        </button>
      )}
      {challenge === 3 && actor === 'tracker' && state.brokenMemory.trackerEvidence.length >= 3 && !state.brokenMemory.structureValid && (
        <button type="button" className={styles.hint} onClick={() => onOpenInput('tracker', 'broken-structure')}>
          Open Restoration Board (Chamber Positions)
        </button>
      )}
      {challenge === 4 && actor === 'archivist' && isDone(state, 'anchorPastRecords') && !state.memoryAnchor.historicalValid && (
        <button type="button" className={styles.hint} onClick={() => onOpenInput('archivist', 'anchor-history-config')}>
          Configure Historical Alignment
        </button>
      )}
      {challenge === 4 && actor === 'tracker' && isDone(state, 'anchorNodesMapped') && !state.memoryAnchor.physicalValid && (
        <button type="button" className={styles.hint} onClick={() => onOpenInput('tracker', 'anchor-physical-config')}>
          Configure Physical Node Repairs
        </button>
      )}
      {challenge === 5 && actor === 'archivist' && state.subtasks.finalMemoryViewed && !state.subtasks.finalSequenceValidated && (
        <button type="button" className={styles.hint} onClick={() => onOpenInput('archivist', 'final-sequence')}>
          Submit Final Event Sequence
        </button>
      )}
      {challenge === 4 && actor === 'tracker' && <small>LIVE NODES · {(['A','B','C','D'] as const).map((node) => `${node}: ${state.memoryAnchor.nodeStates[node]}`).join(' · ')}</small>}
      <footer><span>Partner: {status(state, actor === 'archivist' ? 'tracker' : 'archivist')}</span><span>Your Hunt II score: {totalScore(state)} · Team {state.completed ? 4 : progressNumber}/4</span></footer>
      <small className={styles.unlock}>NEXT: {next}</small><button className={styles.hint} disabled={working || (state.hintUses[String(challenge)] ?? 0) >= 2} onClick={() => onHint(actor)}>Memory hint · 25 points</button>
      </section>
    </div>}
    </Fragment>)}
    {message && bannerVisible && (
      <div className={styles.instructionBanner} role="status">
        <span>📜 {message}</span>
      </div>
    )}
    {boardOpen && <aside className={styles.board}><button className={styles.close} onClick={() => setBoardOpen(false)}>Close</button><h2>Shared Memory Board</h2>
      <div className={styles.filters}><button aria-pressed={boardActor === 'archivist'} onClick={() => setBoardActor('archivist')}>Archivist view</button><button aria-pressed={boardActor === 'tracker'} onClick={() => setBoardActor('tracker')}>Tracker view</button></div>
      <h3>TASK {progressNumber}: {title}</h3><p>{CONTEXT[challenge]}</p>{visible.length ? [...visible].reverse().map((entry) => <article key={entry.id}><small>{entry.location} · {entry.discoveredBy.toUpperCase()} · {entry.verified ? 'VERIFIED' : 'UNVERIFIED'}</small><h3>{entry.title}</h3><p>{entry.content}</p></article>) : <p>No memory observations recorded yet.</p>}
    </aside>}
    {distorted && <div className={styles.distortion} role="status">FALSE MEMORY DISTORTION · THE ROOM IS REFORMING</div>}
    {challenge === 5 && state.syncDeadline !== null && !state.completed && <div className={styles.countdown} role="timer">FINAL MEMORY WINDOW · {Math.max(0, Math.ceil((state.syncDeadline - clockNow) / 1000))}s</div>}
    {challenge === 2 && state.hiddenWeakness.syncDeadline !== null && !state.subtasks.hiddenWeaknessComplete && <div className={styles.countdown} role="timer">CALIBRATION WINDOW · ARCHIVIST: PRESS E AT PAST CONTAINMENT CONSOLE · {Math.max(0, Math.ceil((state.hiddenWeakness.syncDeadline - clockNow) / 1000))}s</div>}
    {challenge === 3 && state.brokenMemory.syncDeadline !== null && !state.subtasks.brokenMemoryComplete && <div className={styles.countdown} role="timer">MEMORY SYNCHRONIZATION · {Math.max(0, Math.ceil((state.brokenMemory.syncDeadline - clockNow) / 1000))}s</div>}
    {challenge === 4 && state.memoryAnchor.syncDeadline !== null && !state.subtasks.memoryAnchorComplete && <div className={styles.countdown} role="timer">PAST / FUTURE SYNC · {Math.max(0, Math.ceil((state.memoryAnchor.syncDeadline - clockNow) / 1000))}s</div>}
    {challenge === 4 && state.memoryAnchor.finalSequenceDeadline !== null && !state.subtasks.memoryAnchorComplete && <div className={styles.countdown} role="timer">FINAL ANCHOR CADENCE · {Math.max(0, Math.ceil((state.memoryAnchor.finalSequenceDeadline - clockNow) / 1000))}s</div>}
    {pending && <div className={styles.scrim}><form className={styles.dialog} onSubmit={(event) => { void submit(event); }}><button type="button" className={styles.close} onClick={onClose}>Close</button>
      <small>TASK {progressNumber} · {pending.actor === 'archivist' ? 'ARCHIVIST / PAST' : 'TRACKER / FUTURE'}</small>
      <h2>{pending.kind === 'broken-historical' ? 'Reconnect the original relationships' : pending.kind === 'broken-structure' ? 'Restore the corrupted chamber' : pending.kind === 'anchor-history-config' ? 'Set the historical anchor alignment' : pending.kind === 'anchor-physical-config' ? 'Repair the Future anchor nodes' : pending.kind === 'weakness-history' ? 'Interpret the experiment archive' : pending.kind.startsWith('weakness-') && pending.kind !== 'weakness-conclusion' ? 'Run a controlled experiment' : pending.kind === 'weakness-conclusion' ? 'Submit the experimental profile' : 'Restore the final event sequence'}</h2>
      <p>{CONTEXT[challenge]} Work from your observations and your partner’s verified discovery.</p>
      {(pending.kind === 'anchor-history-config' || pending.kind === 'anchor-physical-config') && <><p>{pending.kind === 'anchor-history-config' ? 'Set the four design paths from the diagram. The Future node readings determine whether the design can still hold.' : `Repair the four live nodes using their condition readings. ${state.memoryAnchor.attemptsRemaining} stabilization attempts remain.`}</p><div className={styles.sequence}>{order.slice(0, 4).map((item,index) => <label key={index}>Node {['A','B','C','D'][index]} · {pending.kind === 'anchor-history-config' ? 'design path' : state.memoryAnchor.nodeStates[['A','B','C','D'][index] as 'A' | 'B' | 'C' | 'D']}<select value={item} onChange={(event) => setOrder((old) => old.map((part,i) => i === index ? event.target.value : part))} required><option value="">Select connection…</option>{(pending.kind === 'anchor-history-config' ? [['east','East feed'],['west','West return'],['ground','Central ground'],['loop','Outer loop']] : index === 0 ? [['stabilize','Stabilize surge'],['redirect','Redirect current'],['hold','Hold'],['overdrive','Overdrive']] : index === 1 ? [['forward','Reverse to forward'],['hold','Hold'],['ground','Ground'],['stabilize','Stabilize']] : index === 2 ? [['reconnect','Reconnect ground'],['hold','Hold'],['redirect','Redirect'],['overdrive','Overdrive']] : [['hold','Hold stable'],['overdrive','Overdrive'],['redirect','Redirect'],['ground','Ground']]).map(([key,label]) => <option key={key} value={`${['A','B','C','D'][index]}:${key}`}>{label}</option>)}</select></label>)}</div></>}
      {pending.kind === 'weakness-history' && <label>Which historical conclusion survives the control failures?<select value={single} onChange={(event) => setSingle(event.target.value)} required><option value="">Choose interpretation…</option><option value="bright and warm">Reject bright and warm conclusions as compromised</option><option value="bright">Bright exposure is the true weakness</option><option value="warm">Warmth is the true weakness</option></select></label>}
      {(pending.kind === 'weakness-frequency' || pending.kind === 'weakness-light' || pending.kind === 'weakness-temperature') && <><label>{pending.kind === 'weakness-frequency' ? 'Frequency resonance' : pending.kind === 'weakness-light' ? 'Light exposure' : 'Temperature fluctuation'}<select value={single} onChange={(event) => setSingle(event.target.value)} required><option value="">Choose an untested condition…</option>{(pending.kind === 'weakness-frequency' ? [['low','Low resonance'],['high','High resonance']] : pending.kind === 'weakness-light' ? [['dark','Dark'],['bright','Bright']] : [['cold','Cold'],['warm','Warm']]).map(([key,label]) => <option key={key} value={key}>{label}</option>)}</select></label><p>{state.hiddenWeakness.resourcesRemaining} experiment charges remain. Repeated settings are rejected without spending a charge.</p></>}
      {pending.kind === 'weakness-conclusion' && <div className={styles.sequence}>{(['frequency','light','temperature'] as const).map((key) => <label key={key}>{key}<select value={profile[key]} onChange={(event) => setProfile((old) => ({ ...old, [key]: event.target.value }))} required><option value="">Select observed condition…</option>{(key === 'frequency' ? [['low','Low'],['high','High']] : key === 'light' ? [['dark','Dark'],['bright','Bright']] : [['cold','Cold'],['warm','Warm']]).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>)}</div>}
      {(pending.kind === 'broken-historical' || pending.kind === 'broken-structure') && <><p>Reconnect six memory components. The archive establishes relationships; the chamber traces establish positions. Repeated components are rejected.</p><div className={styles.sequence}>{order.map((item,index) => <label key={index}>{['Photograph','Ledger','Recording','Keepsake','Shadow','Name'][index]} · {pending.kind === 'broken-historical' ? 'historical relation' : 'Future position'}<select value={item} onChange={(event) => setOrder((old) => old.map((part,i) => i === index ? event.target.value : part))} required><option value="">Choose connection…</option>{(pending.kind === 'broken-historical' ? [['source','Original source'],['duplicate','Duplicated entry'],['fragmented-voice','Fragmented voice'],['before-test','Before the experiment'],['original','Original identity'],['subject-zero','Subject Zero']] : [['entry','Entry chamber'],['archive','Archive niche'],['resonance','Resonance field'],['center','Central node'],['mirror','Mirror wall'],['anchor','Anchor alcove']]).map(([key,label]) => <option key={key} value={`${['photograph','ledger','recording','keepsake','shadow','name'][index]}:${key}`}>{label}</option>)}</select></label>)}</div></>}
      {pending.kind === 'final-sequence' && <div className={styles.sequence}>{order.slice(0, 3).map((item,index) => <label key={index}>Event {index+1}<select value={item} onChange={(event) => setOrder((old) => old.map((part,i) => i === index ? event.target.value : part))} required><option value="">Select…</option>{[['arrival','Subject arrives'],['alarm','Warning alarm'],['containment-failure','Containment fails']].map(([key,label]) => <option key={key} value={key}>{label}</option>)}</select></label>)}</div>}
      <button className={styles.submit} disabled={working}>{working ? 'Checking memory…' : 'Submit for verification'}</button>
    </form></div>}
    {state.completed && <div className={styles.completed} role="status"><b>TRUE MEMORY ANCHOR DESTROYED</b><span>Hunt II complete · Score {state.score}</span><button onClick={onContinue}>Continue to Hunt III</button></div>}
  </>;
}
