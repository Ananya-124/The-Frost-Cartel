import { useEffect, useState } from 'react';
import type { Hunt1ActionResult, Hunt1Actor, Hunt1Challenge, Hunt1State, Hunt1TaskKey } from '../../../../../../types/hunt1.types';
import styles from './Hunt1Progress.module.css';

interface Hunt1ProgressProps {
  state: Hunt1State | null;
  playerNumber: 1 | 2;
  message: string;
  working: boolean;
  onHint: () => void;
  onSubmit: (actor: Hunt1Actor, sequence: string[]) => Promise<Hunt1ActionResult>;
  onSpecialAction: (actor: Hunt1Actor, type: string, value: unknown) => Promise<Hunt1ActionResult>;
  onContinue: () => void;
}

const TASKS: Record<Hunt1Challenge, { key: Hunt1TaskKey; title: string; points: number; objective: Record<Hunt1Actor, string>; required: string[]; submitter: Hunt1Actor | 'team'; pieces: string[]; initial: string[]; labels: Record<string, string> }> = {
  1: { key: 'lastVisitor', title: 'The Last Visitor', points: 100, objective: { archivist: 'Read the visitor register and date the three admissions.', tracker: 'Follow the Future tracks and check whether the last visitor left.' }, required: ['visitorLedger', 'visitorTracks'], submitter: 'archivist', pieces: ['technician', 'director', 'visitor'], initial: ['director', 'visitor', 'technician'], labels: { technician: 'E. Marr · Technician', director: 'S. Vale · Director', visitor: 'Unregistered visitor' } },
  2: { key: 'missingReport', title: 'The Missing Report', points: 150, objective: { archivist: 'Interpret the damaged filing index and decode the section order.', tracker: 'Compare the four anonymous fragments with the Archivist’s decoded index.' }, required: ['archiveIndex', 'shreddedReport'], submitter: 'team', pieces: ['purpose', 'apparatus', 'safeguards', 'result'], initial: ['result', 'safeguards', 'purpose', 'apparatus'], labels: { purpose: 'Purpose fragment', apparatus: 'Apparatus fragment', safeguards: 'Safeguards fragment', result: 'Result fragment' } },
  3: { key: 'powerFailure', title: 'The Power Failure', points: 200, objective: { archivist: 'Interpret the original wiring diagram and decode the connection path.', tracker: 'Reconnect the damaged generator circuit using the decoded wiring path.' }, required: ['generatorLog', 'burntRelay', 'openGround'], submitter: 'team', pieces: ['generator-relay', 'relay-load', 'load-ground', 'ground-frame'], initial: ['ground-frame', 'load-ground', 'generator-relay', 'relay-load'], labels: { 'generator-relay': 'Amber lead · Output / R-4', 'relay-load': 'Copper lead · R-4 / Load', 'load-ground': 'Braided lead · Load / Ground', 'ground-frame': 'Return lead · Ground / Frame' } },
  4: { key: 'observationLog', title: 'The Observation Log', points: 200, objective: { archivist: 'Reconcile the logbook’s clock conflicts and submit the Past timeline.', tracker: 'Read the room’s physical traces and submit the Future timeline.' }, required: ['observationLog', 'cameraBuffer'], submitter: 'team', pieces: ['alarm', 'lights-fail', 'subject-appears', 'observer-vanishes'], initial: ['subject-appears', 'alarm', 'observer-vanishes', 'lights-fail'], labels: { alarm: 'Alarm acknowledged', 'lights-fail': 'Lights fail', 'subject-appears': 'Figure appears in glass', 'observer-vanishes': 'Observer disappears' } },
  5: { key: 'signalReconstruction', title: 'The Signal Reconstruction', points: 200, objective: { archivist: 'Decode the original signal path from the Past routing blueprint.', tracker: 'Reconnect the damaged Future console using the decoded route.' }, required: ['signalChart', 'cableJunction'], submitter: 'team', pieces: ['intake', 'ground', 'observer', 'transmit'], initial: ['transmit', 'intake', 'observer', 'ground'], labels: { intake: 'INTAKE terminal', ground: 'GROUND reference', observer: 'OBSERVER tap', transmit: 'TRANSMIT output' } },
  6: { key: 'incidentConclusion', title: 'The Incident Conclusion', points: 150, objective: { archivist: 'Recover the experiment’s original purpose and intended procedure from the historical record.', tracker: 'Reconstruct the failure and transmission aftermath from the physical traces.' }, required: ['incidentBoardPast', 'incidentBoardFuture'], submitter: 'team', pieces: [], initial: [], labels: {} },
};

const CONCLUSION_ARCHIVE = ['temporal-resonance-reconstructs-human-memories', 'resonance-limited-to-recorded-imprints'];
const CONCLUSION_FUTURE = ['omitted-ground-and-relay-bypass-exceeded-limits', 'a-reconstructed-memory-became-conscious-after-transmission', 'that-consciousness-manifested-as-the-entity'];
const CONCLUSION_LABELS: Record<string, string> = {
  'temporal-resonance-reconstructs-human-memories': 'Temporal resonance was used to reconstruct human memories',
  'resonance-limited-to-recorded-imprints': 'The intended procedure limited resonance to recorded memory imprints',
  'omitted-ground-and-relay-bypass-exceeded-limits': 'The omitted grounding safeguard and relay bypass pushed the experiment beyond its limits',
  'a-reconstructed-memory-became-conscious-after-transmission': 'After transmission, something within the reconstructed memories became conscious',
  'that-consciousness-manifested-as-the-entity': 'That consciousness manifested as the entity encountered by the investigators',
};

const OBJECT_LABELS: Record<string, string> = {
  visitorLedger: 'Visitor ledger · Reception — Past', visitorTracks: 'Visitor tracks · Reception — Future',
  archiveIndex: 'Incident report index · Archive — Past', shreddedReport: 'Shredded report · Archive — Future',
  generatorLog: 'Generator log · Generator Room — Past', burntRelay: 'Burned relay · Generator Room — Future', openGround: 'Open ground · Generator Room — Future',
  observationLog: 'Observation log · Observation Room — Past', cameraBuffer: 'Camera buffer · Observation Room — Future',
  signalChart: 'Signal chart · Communications Room — Past', cableJunction: 'Cable junction · Communications Room — Future',
  incidentBoardPast: 'Investigation board · Past', incidentBoardFuture: 'Evidence board · Future',
};
const TASK_KEYS = Object.keys(TASKS).map((key) => Number(key) as Hunt1Challenge);

function movePiece(sequence: string[], from: number, to: number): string[] {
  if (to < 0 || to >= sequence.length) return sequence;
  const next = [...sequence];
  [next[from], next[to]] = [next[to], next[from]];
  return next;
}

export default function Hunt1Progress({ state, playerNumber, message, working, onHint, onSubmit, onSpecialAction, onContinue }: Hunt1ProgressProps) {
  const [tasksOpen, setTasksOpen] = useState(false);
  const [journalOpen, setJournalOpen] = useState(false);
  const [selectedEvidence, setSelectedEvidence] = useState<string | null>(null);
  const [sequence, setSequence] = useState<string[]>([]);
  const [workingSubmit, setWorkingSubmit] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const actor: Hunt1Actor = playerNumber === 1 ? 'archivist' : 'tracker';

  useEffect(() => {
    if (!state) return;
    const savedOrder = state.currentChallenge === 2
      ? (playerNumber === 1 ? state.missingReport?.archivistOrder : state.missingReport?.trackerOrder)
      : state.currentChallenge === 3
        ? (playerNumber === 1 ? state.powerFailure?.archivistConnections : state.powerFailure?.trackerConnections)
        : state.currentChallenge === 4
          ? (playerNumber === 1 ? state.observationTimeline?.archivistTimeline : state.observationTimeline?.trackerTimeline)
          : state.currentChallenge === 5
            ? (playerNumber === 1 ? state.signalReconstruction?.archivistRoute : state.signalReconstruction?.trackerRoute)
            : state.currentChallenge === 6
              ? (playerNumber === 1 ? state.incidentConclusion?.archivistInterpretation : state.incidentConclusion?.trackerInterpretation)
              : null;
    const roleDefault = state.currentChallenge === 6 ? (playerNumber === 1 ? CONCLUSION_ARCHIVE : CONCLUSION_FUTURE) : TASKS[state.currentChallenge].initial;
    setSequence(savedOrder ?? roleDefault);
  }, [state?.currentChallenge, state?.incidentConclusion?.archivistInterpretation, state?.incidentConclusion?.trackerInterpretation, playerNumber]);

  if (!state) return <div className={styles.loading}>Connecting to the shared Hunt I investigation…</div>;
  const challenge = state.currentChallenge;
  const task = TASKS[challenge];
  const evidenceReady = task.required.every((id) => state.subtasks[id]);
  const priorTasksReady = task.key !== 'incidentConclusion'
    || Object.entries(state.taskCompleted).filter(([key]) => key !== 'incidentConclusion').every(([, done]) => done);
  const submittedAlready = challenge === 6 && !!state.subtasks[actor === 'archivist' ? 'conclusionArchivist' : 'conclusionTracker'];
  const canSubmit = !state.completed && evidenceReady && priorTasksReady && !submittedAlready
    && (task.submitter === 'team' || task.submitter === actor);
  const unlockedObjects = state.availableInteractables.filter((id) => !id.startsWith('optional'));
  const optionalFound = Object.values(state.optionalScores).reduce((sum, value) => sum + value, 0);

  const reconstruct = async () => {
    if (!canSubmit || workingSubmit) return;
    setWorkingSubmit(true);
    try { await onSubmit(actor, sequence); }
    finally { setWorkingSubmit(false); }
  };

  const reportPuzzle = state.missingReport;
  const powerPuzzle = state.powerFailure;
  const observationPuzzle = state.observationTimeline;
  const signalPuzzle = state.signalReconstruction;
  const reportOrder = actor === 'archivist' ? reportPuzzle?.archivistOrder : reportPuzzle?.trackerOrder;
  const submitReportOrder = async () => {
    if (workingSubmit || working) return;
    setWorkingSubmit(true);
    try { await onSpecialAction(actor, actor === 'archivist' ? 'missingReportArchivist' : 'missingReportTracker', { sequence }); }
    finally { setWorkingSubmit(false); }
  };
  const confirmReport = async () => {
    if (!reportPuzzle || workingSubmit || working) return;
    setWorkingSubmit(true);
    try { await onSpecialAction(actor, 'missingReportConfirm', { reconstructionVersion: reportPuzzle.reconstructionVersion }); }
    finally { setWorkingSubmit(false); }
  };
  const sameReportOrder = !!reportPuzzle?.archivistOrder && !!reportPuzzle.trackerOrder
    && reportPuzzle.archivistOrder.join('|') === reportPuzzle.trackerOrder.join('|');
  const powerOrder = actor === 'archivist' ? powerPuzzle?.archivistConnections : powerPuzzle?.trackerConnections;
  const observationOrder = actor === 'archivist' ? observationPuzzle?.archivistTimeline : observationPuzzle?.trackerTimeline;
  const signalOrder = actor === 'archivist' ? signalPuzzle?.archivistRoute : signalPuzzle?.trackerRoute;
  const submitPowerFailure = async () => {
    if (workingSubmit || working) return;
    setWorkingSubmit(true);
    try { await onSpecialAction(actor, actor === 'archivist' ? 'powerFailureArchivist' : 'powerFailureTracker', { sequence }); }
    finally { setWorkingSubmit(false); }
  };
  const submitObservationTimeline = async () => {
    if (workingSubmit || working) return;
    setWorkingSubmit(true);
    try { await onSpecialAction(actor, actor === 'archivist' ? 'observationArchivist' : 'observationTracker', { sequence }); }
    finally { setWorkingSubmit(false); }
  };
  const submitSignalRoute = async () => {
    if (workingSubmit || working) return;
    setWorkingSubmit(true);
    try { await onSpecialAction(actor, actor === 'archivist' ? 'signalArchivist' : 'signalTracker', { sequence }); }
    finally { setWorkingSubmit(false); }
  };
  const submitIncidentConclusion = async () => {
    if (workingSubmit || working || !canSubmit) return;
    setWorkingSubmit(true);
    try { await onSpecialAction(actor, actor === 'archivist' ? 'incidentConclusionArchivist' : 'incidentConclusionTracker', { sequence }); }
    finally { setWorkingSubmit(false); }
  };

  return <>
    <button className={styles.taskToggle} type="button" aria-expanded={tasksOpen} aria-controls="hunt1-objectives" onClick={() => setTasksOpen((open) => !open)}>
      HUNT I · {challenge}/6 · {tasksOpen ? 'Hide progress' : 'Investigation progress'}
    </button>
    {tasksOpen && <div className={styles.grid} id="hunt1-objectives" aria-label="Hunt I task progress">
      {TASK_KEYS.map((number) => {
        const item = TASKS[number];
        const done = state.taskCompleted[item.key];
        return <section className={`${styles.panel} ${number % 2 === 0 ? styles.future : styles.past}`} key={item.key}>
          <header><span>TASK {number} · {item.title.toUpperCase()}</span><b>{done ? `+${item.points}` : state.currentChallenge === number ? 'ACTIVE' : 'SEALED'}</b></header>
          <small>{item.required.map((id) => OBJECT_LABELS[id]).join(' · ')}</small>
          <ul>{item.required.map((id) => <li className={state.subtasks[id] ? styles.done : ''} key={id}><span>{state.subtasks[id] ? '✓' : '○'}</span>{OBJECT_LABELS[id]}</li>)}</ul>
        </section>;
      })}
    </div>}

    {!state.completed && <div className={styles.reconstruction} aria-label={`${task.title} reconstruction`}>
      <header><span>ACTIVE INVESTIGATION · {task.title.toUpperCase()}</span><b>{task.points} POINTS</b></header>
      <p className={actor === 'archivist' ? styles.pastText : styles.futureText}>{actor === 'archivist' ? 'ARCHIVIST · PAST' : 'TRACKER · FUTURE'} — {task.objective[actor]}</p>
      <div className={styles.objects} aria-label="Evidence to examine">
        {unlockedObjects.length === 0 ? <span>Both investigators’ evidence is needed before reconstruction.</span> : unlockedObjects.map((id) => <span key={id}>{OBJECT_LABELS[id] ?? id}</span>)}
        {state.availableInteractables.some((id) => id.startsWith('optional')) && <span>Optional evidence may also be hidden in this hunt.</span>}
      </div>
      {challenge === 2 && evidenceReady ? <section className={styles.reportCoop} aria-label="Missing Report cooperative reconstruction">
        <header><span>PAST INDEX ↔ FUTURE FRAGMENTS</span><b>RECONSTRUCTION {reportPuzzle?.reconstructionVersion ?? 1}</b></header>
        {actor === 'archivist' ? <>
          <p className={styles.pastText}>ARCHIVIST · HISTORICAL INDEX — Interpret the filing notes. The report opens with its purpose, follows with the apparatus, places safeguards before the findings, and ends with the result.</p>
          <p>Arrange the index entries, then submit your decoded order. The Tracker will receive it in the shared investigation once recorded.</p>
        </> : <>
          <p className={styles.futureText}>TRACKER · SHREDDED REPORT — Four loose fragments have no printed numbers. Arrange the physical sections using the Archivist’s decoded index when it is shared.</p>
          {reportPuzzle?.archivistValid && <p className={styles.decodedOrder}>ARCHIVIST’S DECODED INDEX: {reportPuzzle.archivistOrder?.map((piece) => TASKS[2].labels[piece]).join(' → ')}</p>}
          {!reportPuzzle?.archivistOrder && <p className={styles.waiting}>Waiting for the Archivist to decode the historical index.</p>}
        </>}
        <ol className={styles.sequenceBoard} aria-label={actor === 'archivist' ? 'Historical index entries' : 'Shredded report fragments'}>
          {sequence.map((piece, index) => <li key={piece} draggable onDragStart={() => setDragIndex(index)} onDragOver={(event) => event.preventDefault()} onDrop={() => { if (dragIndex !== null) setSequence((old) => movePiece(old, dragIndex, index)); setDragIndex(null); }}>
            <span>{TASKS[2].labels[piece]}</span>
            <button type="button" aria-label={`Move ${TASKS[2].labels[piece]} earlier`} disabled={index === 0} onClick={() => setSequence((old) => movePiece(old, index, index - 1))}>↑</button>
            <button type="button" aria-label={`Move ${TASKS[2].labels[piece]} later`} disabled={index === sequence.length - 1} onClick={() => setSequence((old) => movePiece(old, index, index + 1))}>↓</button>
          </li>)}
        </ol>
        <button className={styles.submit} type="button" disabled={working || workingSubmit} onClick={() => { void submitReportOrder(); }}>
          {workingSubmit ? 'Recording…' : reportOrder && reportOrder.join('|') === sequence.join('|') ? 'Order submitted' : actor === 'archivist' ? 'Submit decoded index' : 'Submit reconstructed report'}
        </button>
        {reportPuzzle?.archivistOrder && reportPuzzle.trackerOrder && <div className={styles.reportCompare}>
          <p>ARCHIVIST: {reportPuzzle.archivistOrder.map((piece) => TASKS[2].labels[piece]).join(' → ')}</p>
          <p>TRACKER: {reportPuzzle.trackerOrder.map((piece) => TASKS[2].labels[piece]).join(' → ')}</p>
          <p>{sameReportOrder ? 'The reconstructions agree. Both investigators must confirm this version.' : 'The arrangements differ. Compare the evidence and update your submission before confirming.'}</p>
          <button className={styles.submit} type="button" disabled={!sameReportOrder || !reportPuzzle.archivistValid || !reportPuzzle.trackerValid || working || workingSubmit || reportPuzzle.confirmations[actor] === reportPuzzle.reconstructionVersion} onClick={() => { void confirmReport(); }}>
            {reportPuzzle.confirmations[actor] === reportPuzzle.reconstructionVersion ? 'Your confirmation is recorded' : 'Confirm shared reconstruction'}
          </button>
          <small>Archivist: {reportPuzzle.confirmations.archivist === reportPuzzle.reconstructionVersion ? 'confirmed' : 'waiting'} · Tracker: {reportPuzzle.confirmations.tracker === reportPuzzle.reconstructionVersion ? 'confirmed' : 'waiting'}</small>
        </div>}
      </section> : challenge === 3 && evidenceReady ? <section className={styles.reportCoop} aria-label="Power Failure circuit reconstruction">
        <header><span>PAST WIRING DIAGRAM ↔ FUTURE GENERATOR</span><b>200 POINTS</b></header>
        {actor === 'archivist' ? <>
          <p className={styles.pastText}>ARCHIVIST · ORIGINAL DIAGRAM — Current leaves generator output, passes through safety control R-4 and the load, bonds to ground, then returns to the generator frame.</p>
          <p>Arrange the four connection segments in that path and submit the decoded circuit. Your connection order will be shared with the Tracker.</p>
        </> : <>
          <p className={styles.futureText}>TRACKER · DAMAGED GENERATOR — Reconnect the four loose leads to restore a continuous, grounded path. The Archivist’s decoded diagram is a reference; your physical connections remain yours to make.</p>
          {powerPuzzle?.archivistValid && <p className={styles.decodedOrder}>ARCHIVIST’S DECODED WIRING: {powerPuzzle.archivistConnections?.map((piece) => TASKS[3].labels[piece]).join(' → ')}</p>}
          {!powerPuzzle?.archivistValid && <p className={styles.waiting}>Waiting for the Archivist to decode the original wiring diagram.</p>}
        </>}
        <ol className={styles.sequenceBoard} aria-label={actor === 'archivist' ? 'Original circuit connections' : 'Future generator lead connections'}>
          {sequence.map((piece, index) => <li key={piece} draggable onDragStart={() => setDragIndex(index)} onDragOver={(event) => event.preventDefault()} onDrop={() => { if (dragIndex !== null) setSequence((old) => movePiece(old, dragIndex, index)); setDragIndex(null); }}>
            <span>{TASKS[3].labels[piece]}</span>
            <button type="button" aria-label={ 'Move ' + TASKS[3].labels[piece] + ' earlier'} disabled={index === 0} onClick={() => setSequence((old) => movePiece(old, index, index - 1))}>↑</button>
            <button type="button" aria-label={ 'Move ' + TASKS[3].labels[piece] + ' later'} disabled={index === sequence.length - 1} onClick={() => setSequence((old) => movePiece(old, index, index + 1))}>↓</button>
          </li>)}
        </ol>
        <button className={styles.submit} type="button" disabled={working || workingSubmit || (actor === 'tracker' && !powerPuzzle?.archivistValid)} onClick={() => { void submitPowerFailure(); }}>
          {workingSubmit ? 'Testing circuit…' : powerOrder && powerOrder.join('|') === sequence.join('|') ? 'Connections submitted' : actor === 'archivist' ? 'Submit decoded wiring' : 'Reconnect and test generator'}
        </button>
        {actor === 'tracker' && powerPuzzle?.trackerConnections && !powerPuzzle.trackerValid && <p className={styles.waiting}>The submitted circuit did not restore power. Rearrange the leads and retry.</p>}
        {actor === 'tracker' && powerPuzzle?.trackerValid && !state.taskCompleted.powerFailure && <p className={styles.waiting}>Circuit verified; waiting for task state to synchronize.</p>}
      </section> : challenge === 4 && evidenceReady ? <section className={styles.reportCoop} aria-label="Observation Log timeline investigation">
        <header><span>PAST RECORD ↔ FUTURE TRACES</span><b>200 POINTS</b></header>
        {actor === 'archivist' ? <>
          <p className={styles.pastText}>ARCHIVIST · HISTORICAL RECORD — The log confirms the alarm at 18:23 and the observer’s response ending at 18:26. One entry places the figure in the glass at 18:24 on the camera clock; another marks the blackout at 18:25 on the relay clock. Their synchronization mark is damaged.</p>
          <p>Reconcile the historical evidence and arrange the four events. The Tracker has physical traces that resolve the conflicting middle entries.</p>
        </> : <>
          <p className={styles.futureText}>TRACKER · PHYSICAL EVIDENCE — Soot beneath the lamp relay settled before the glass afterimage formed. The observer’s chair scrape begins after the figure appears and ends at the empty seat.</p>
          <p>Arrange the four events from the room traces. The Archivist’s timestamps identify the incident’s historical boundaries.</p>
        </>}
        <ol className={styles.sequenceBoard} aria-label={actor === 'archivist' ? 'Past historical timeline' : 'Future physical timeline'}>
          {sequence.map((piece, index) => <li key={piece} draggable onDragStart={() => setDragIndex(index)} onDragOver={(event) => event.preventDefault()} onDrop={() => { if (dragIndex !== null) setSequence((old) => movePiece(old, dragIndex, index)); setDragIndex(null); }}>
            <span>{TASKS[4].labels[piece]}</span>
            <button type="button" aria-label={'Move ' + TASKS[4].labels[piece] + ' earlier'} disabled={index === 0} onClick={() => setSequence((old) => movePiece(old, index, index - 1))}>↑</button>
            <button type="button" aria-label={'Move ' + TASKS[4].labels[piece] + ' later'} disabled={index === sequence.length - 1} onClick={() => setSequence((old) => movePiece(old, index, index + 1))}>↓</button>
          </li>)}
        </ol>
        <button className={styles.submit} type="button" disabled={working || workingSubmit} onClick={() => { void submitObservationTimeline(); }}>
          {workingSubmit ? 'Comparing evidence…' : actor === 'archivist' ? observationOrder ? 'Update Past timeline' : 'Submit Past timeline' : observationOrder ? 'Update Future timeline' : 'Submit Future timeline'}
        </button>
        {observationPuzzle?.archivistSubmitted && observationPuzzle.trackerSubmitted && <div className={styles.reportCompare}>
          <p>{observationPuzzle.investigationsAgree ? 'Both submitted timelines align.' : 'The submitted timelines conflict.'}</p>
          <p>{observationPuzzle.investigationsVerified ? 'Historical and physical evidence confirm the sequence.' : 'The incident remains unverified. Compare your clues and revise your own timeline.'}</p>
        </div>}
      </section> : challenge === 5 && evidenceReady ? <section className={styles.reportCoop} aria-label="Signal Reconstruction route restoration">
        <header><span>PAST ROUTING BLUEPRINT ↔ FUTURE CONSOLE</span><b>200 POINTS</b></header>
        {actor === 'archivist' ? <>
          <p className={styles.pastText}>ARCHIVIST · ORIGINAL BLUEPRINT — Follow the flow arrows from INTAKE. The earth symbol is a route station, not the cable shield. The observer callout is a tap along the path, and TRANSMIT is the terminal endpoint.</p>
          <p>Interpret the legend, arrange the four route stations, and submit the decoded path for the Tracker.</p>
        </> : <>
          <p className={styles.futureText}>TRACKER · DAMAGED CONSOLE — Reconnect the four loose station leads across the broken continuity seal. The cable has not been repaired or arranged for you.</p>
          {signalPuzzle?.archivistValid && <p className={styles.decodedOrder}>ARCHIVIST’S DECODED ROUTE: {signalPuzzle.archivistRoute?.map((piece) => TASKS[5].labels[piece]).join(' → ')}</p>}
          {!signalPuzzle?.archivistValid && <p className={styles.waiting}>Waiting for the Archivist to decode the historical route.</p>}
          <div className={styles.objects}><span>INTAKE · damaged input</span><span>GROUND · loose earth braid</span><span>OBSERVER · scorched tap</span><span>TRANSMIT · open output</span></div>
        </>}
        <ol className={styles.sequenceBoard} aria-label={actor === 'archivist' ? 'Past signal route' : 'Future console connections'}>
          {sequence.map((piece, index) => <li key={piece} draggable onDragStart={() => setDragIndex(index)} onDragOver={(event) => event.preventDefault()} onDrop={() => { if (dragIndex !== null) setSequence((old) => movePiece(old, dragIndex, index)); setDragIndex(null); }}>
            <span>{TASKS[5].labels[piece]}</span>
            <button type="button" aria-label={'Move ' + TASKS[5].labels[piece] + ' earlier'} disabled={index === 0} onClick={() => setSequence((old) => movePiece(old, index, index - 1))}>↑</button>
            <button type="button" aria-label={'Move ' + TASKS[5].labels[piece] + ' later'} disabled={index === sequence.length - 1} onClick={() => setSequence((old) => movePiece(old, index, index + 1))}>↓</button>
          </li>)}
        </ol>
        <button className={styles.submit} type="button" disabled={working || workingSubmit || (actor === 'tracker' && !signalPuzzle?.archivistValid)} onClick={() => { void submitSignalRoute(); }}>
          {workingSubmit ? 'Testing transmission…' : actor === 'archivist' ? signalOrder ? 'Update decoded route' : 'Submit decoded route' : signalOrder ? 'Update console connections' : 'Reconnect and restore signal'}
        </button>
        {actor === 'tracker' && signalPuzzle?.trackerRoute && !signalPuzzle.trackerValid && <p className={styles.waiting}>The console still has a broken or bypassed connection. Rearrange the stations and retry.</p>}
      </section> : challenge === 6 && evidenceReady && priorTasksReady ? <section className={styles.reportCoop} aria-label="Final incident investigation board">
        <header><span>FINAL INCIDENT REPORT · PAST ↔ FUTURE</span><b>150 POINTS</b></header>
        {actor === 'archivist' ? <>
          <p className={styles.pastText}>ARCHIVIST · HISTORICAL RECORD — The original proposal describes a temporal resonance apparatus intended to recover memory imprints. The signed procedure limits each pass to recorded impressions; it does not authorize an open-ended connection.</p>
          <p>Arrange the two historical findings from the experiment’s purpose to its intended limit. Submit your interpretation for the shared report.</p>
        </> : <>
          <p className={styles.futureText}>TRACKER · PHYSICAL AFTERMATH — The grounding strap is absent and the safety relay was bridged. The transmission trace continues after the observation feed ends; marks on the far side of the glass show something answered it.</p>
          <p>Arrange the physical cause and aftermath. The Archivist’s separate historical interpretation will join the report when both are submitted.</p>
        </>}
        <ol className={styles.sequenceBoard} aria-label={actor === 'archivist' ? 'Historical interpretation' : 'Physical interpretation'}>
          {sequence.map((piece, index) => <li key={piece} draggable onDragStart={() => setDragIndex(index)} onDragOver={(event) => event.preventDefault()} onDrop={() => { if (dragIndex !== null) setSequence((old) => movePiece(old, dragIndex, index)); setDragIndex(null); }}>
            <span>{CONCLUSION_LABELS[piece]}</span>
            <button type="button" aria-label={`Move ${CONCLUSION_LABELS[piece]} earlier`} disabled={index === 0} onClick={() => setSequence((old) => movePiece(old, index, index - 1))}>↑</button>
            <button type="button" aria-label={`Move ${CONCLUSION_LABELS[piece]} later`} disabled={index === sequence.length - 1} onClick={() => setSequence((old) => movePiece(old, index, index + 1))}>↓</button>
          </li>)}
        </ol>
        <button className={styles.submit} type="button" disabled={!canSubmit || working || workingSubmit} onClick={() => { void submitIncidentConclusion(); }}>
          {workingSubmit ? 'Recording interpretation…' : submittedAlready ? 'Your interpretation is confirmed' : actor === 'archivist' ? 'Submit historical conclusion' : 'Submit physical conclusion'}
        </button>
        <p className={styles.partnerStatus}>Archivist: {state.subtasks.conclusionArchivist ? 'submitted' : 'waiting'} · Tracker: {state.subtasks.conclusionTracker ? 'submitted' : 'waiting'}</p>
        {submittedAlready && !state.completed && <p className={styles.waiting}>Your evidence is preserved. Waiting for the other investigator’s conclusion.</p>}
      </section> : evidenceReady && priorTasksReady ? <>
        <p>Reorder the evidence tiles into the event sequence. Use the arrows to move each tile.</p>
        <ol className={styles.sequenceBoard}>
          {sequence.map((piece, index) => <li key={piece}>
            <span>{TASKS[challenge].labels[piece]}</span>
            <button type="button" aria-label={`Move ${TASKS[challenge].labels[piece]} earlier`} disabled={index === 0} onClick={() => setSequence((old) => movePiece(old, index, index - 1))}>↑</button>
            <button type="button" aria-label={`Move ${TASKS[challenge].labels[piece]} later`} disabled={index === sequence.length - 1} onClick={() => setSequence((old) => movePiece(old, index, index + 1))}>↓</button>
          </li>)}
        </ol>
        <button className={styles.submit} type="button" disabled={!canSubmit || working || workingSubmit} onClick={() => { void reconstruct(); }}>
          {workingSubmit ? 'Reconstructing…' : submittedAlready ? 'Your conclusion is confirmed' : task.submitter !== 'team' && task.submitter !== actor ? `Waiting for ${task.submitter}` : 'Reconstruct from both timelines'}
        </button>
      </> : <p className={styles.waiting}>Examine the required Past and Future objects in the active investigation to unlock the reconstruction board.</p>}
      <button className={styles.hint} type="button" disabled={working || (state.hintUses[String(challenge)] ?? 0) >= 2} onClick={onHint}>Request field note · −10 points</button>
    </div>}

    <div className={styles.toolbar}>
      <button onClick={() => setJournalOpen((open) => !open)}>Incident evidence · {state.evidence.length}</button>
      {message && <span role="status">{message}</span>}
      <span>HUNT I SCORE {state.score} · PENALTIES −{state.penalties}</span>
      <details className={styles.teamScoreDetails}><summary>Score breakdown</summary>
        <span>{TASK_KEYS.map((number) => `${TASKS[number].title} ${state.taskScores[TASKS[number].key]}`).join(' · ')} · Optional ${optionalFound} · Penalties −${state.penalties}</span>
      </details>
    </div>
    {journalOpen && <aside className={styles.journal}>
      <button className={styles.close} onClick={() => setJournalOpen(false)}>Close</button>
      <h2>Shared incident evidence</h2>
      {!state.evidence.length && <p>No incident evidence examined yet.</p>}
      {[...state.evidence].reverse().map((entry) => <article key={entry.id}>
        <small>{entry.type.toUpperCase()} · {entry.location} · {entry.discoveredBy}</small>
        <h3>{entry.title}{entry.verified ? ' · VERIFIED' : ''}</h3>
        <button type="button" onClick={() => setSelectedEvidence((current) => current === entry.id ? null : entry.id)}>{selectedEvidence === entry.id ? 'Close examination' : 'Examine evidence'}</button>
        {selectedEvidence === entry.id && <><p>{entry.content}</p><p><b>Inference:</b> {entry.inference}</p></>}
      </article>)}
    </aside>}
    {state.completed && <div className={styles.completed} role="status">
      <b>THE FORGOTTEN INCIDENT RECONSTRUCTED</b><span>Hunt I complete · {state.score} points preserved</span>
      <article aria-label="Final incident report">
        <h2>FINAL INCIDENT REPORT</h2>
        <p>The scientists used temporal resonance to reconstruct human memories. Their intended procedure was limited to recorded memory imprints.</p>
        <p>The experiment exceeded those limits when the grounding safeguard was omitted and the safety relay bypassed.</p>
        <p>After transmission, something within the reconstructed memories became conscious.</p>
        <p>That consciousness manifested as the entity encountered during the investigation.</p>
      </article>
      <button onClick={onContinue}>Continue to Hunt II</button>
    </div>}
  </>;
}
