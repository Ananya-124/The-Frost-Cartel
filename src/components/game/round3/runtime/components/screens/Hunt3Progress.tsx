import { useEffect, useRef, useState } from 'react';
import type { Hunt3ActionResult, Hunt3Actor, Hunt3State } from '../../../../../../types/hunt3.types';
import styles from './Hunt3Progress.module.css';

interface Props {
  state: Hunt3State | null;
  actor: Hunt3Actor;
  message: string;
  working: boolean;
  onAction: (action: { type: string; id: string; value?: unknown }) => Promise<Hunt3ActionResult>;
}

const SEALS = ['power', 'resonance', 'memory'] as const;
const SEAL_OPTIONS: Record<(typeof SEALS)[number], string[]> = {
  power: ['source', 'ground', 'return'],
  resonance: ['low-tone', 'phase-two', 'silence'],
  memory: ['arrival', 'warning', 'anchor'],
};
const APPARATUS = ['coil:west', 'lens:center', 'braid:ground', 'core:east'];
const CONDITIONS = ['frequency-low', 'light-dark', 'temperature-cold'];
const EXPECTED_TRIALS = ['frequency-low:withdrawal', 'light-dark:surge', 'temperature-cold:withdrawal'];
const BOSS_CONTROLS = [
  { actor: 'archivist' as const, id: 'hold-record', label: 'Hold record · Past' },
  { actor: 'tracker' as const, id: 'ground-current', label: 'Ground current · Future' },
  { actor: 'archivist' as const, id: 'release-memory', label: 'Release memory · Past' },
  { actor: 'tracker' as const, id: 'vent-pressure', label: 'Vent pressure · Future' },
  { actor: 'archivist' as const, id: 'lock-sequence', label: 'Lock sequence · Past' },
  { actor: 'tracker' as const, id: 'close-containment', label: 'Close containment · Future' },
];
const STAGE_TITLES = ['The Entity’s Trail', 'Break the Three Seals', 'The Bait Protocol', 'Final Containment'];

function stageInstructions(stage: number, actor: Hunt3Actor): string[] {
  if (stage === 1) {
    return actor === 'archivist'
      ? [
          'Compare the three historical records in the Past: Sighting Ledger (Archive), Containment Observation (Observation Room), and Movement Report (Director’s Office).',
          'Read the timecodes and movements in your journal (Q), then deduce and submit which facility wing the entity was tracked to.',
        ]
      : [
          'Compare the three Future traces: Cold Ash (Main Hall), Drag Marks (Observation Room), and Shattered Compass (Observation Room).',
          'Review the needle anomalies and ash patterns in your journal (P), then deduce and submit your physical trace signature.',
        ];
  }
  if (stage === 2) {
    return actor === 'archivist'
      ? [
          'Inspect each Past diagram: Power Diagram (Generator), Resonance Notes (Communications), and Memory Protocol (Observation).',
          'Interpret the 3-part sequence for each diagram from the clues and submit it below to unlock the matching Future mechanism.',
          'Inspect the Component Catalogue in Archive to verify the 4 genuine parts needed for the containment rig.',
        ]
      : [
          'Inspect each Future mechanism in the Generator, Communications, and Observation rooms.',
          'Once the Archivist verifies a diagram, enter the 3-part sequence on the matching mechanism to disable that seal.',
          'Recover the 4 genuine containment components across the facility (Coil, Lens, Braid, Core) while ignoring broken decoys.',
        ];
  }
  if (stage === 3) {
    return actor === 'archivist'
      ? [
          'Review the Containment Blueprint in Underground Containment and submit the 4-part socket layout for the rig.',
          'Read the historical reaction notes in Experiment Room to prepare for the entity’s environmental response patterns.',
          'After Tracker records all 3 controlled trials, arrange and verify the entity’s 3-part vulnerability profile.',
          'Activate the chamber lure in Underground Containment to pull the entity into the chamber.',
        ]
      : [
          'In Underground Containment, inspect the physical apparatus and install the 4 recovered parts according to the blueprint.',
          'In Experiment Room, inspect the test station, test each condition (Frequency, Light, Temperature), and record the entity’s reaction.',
          'Once the Archivist activates the lure, go to Underground Containment and fire the disruptor 3 times to weaken the entity.',
        ];
  }
  return [
    'Watch the chamber warnings: each warning describes an entity attack and names who must respond.',
    'The targeted investigator has 12 seconds to reach their highlighted control terminal in their timeline and interact.',
    'Alternate through all 6 phases successfully (Stability 6/6) to permanently seal the containment chamber.',
  ];
}
function completedTasksFor(state: Hunt3State, actor: Hunt3Actor): boolean[] {
  const trailSubmitted = state.trail[actor] !== null;
  const stageTwoComplete = actor === 'archivist'
    ? SEALS.every((seal) => state.seals[seal].archive)
      && state.actions.includes('component-catalog')
    : SEALS.every((seal) => state.seals[seal].disabled) && state.components.length === 4;
  const stageThreeComplete = actor === 'archivist'
    ? state.apparatus.archive !== null && state.weakness.archive && state.weakness.discovered && state.weakness.lure > 0
    : state.apparatus.configured && EXPECTED_TRIALS.every((trial) => state.weakness.trials.includes(trial)) && state.weakness.weakened >= 3;
  return [trailSubmitted, stageTwoComplete, stageThreeComplete, state.completed];
}

function nextClueAction(state: Hunt3State, actor: Hunt3Actor): string | null {
  if (state.stage === 1) {
    const clues = actor === 'archivist'
      ? ['sighting-ledger', 'containment-observation', 'old-facility-report']
      : ['cold-ash', 'drag-marks', 'shattered-compass'];
    if (clues.every((id) => state.evidence[actor].includes(id)) && !state.trail[actor]) {
      return `All three ${actor === 'archivist' ? 'Past records' : 'Future traces'} are collected. Submit your ${actor === 'archivist' ? 'last-known wing' : 'physical trace signature'} using the selector below.`;
    }
  }
  if (state.stage === 2) {
    if (actor === 'archivist') {
      const ready = SEALS.find((seal) => state.evidence.archivist.includes(`${seal}-diagram`) && !state.seals[seal].archive);
      if (ready) return `The ${ready} seal diagram is collected. Arrange its three connections and submit the Past interpretation below.`;
      if (SEALS.every((seal) => state.seals[seal].archive) && !state.actions.includes('component-catalog')) return 'All three seal interpretations are verified. Inspect the component catalogue in the Past Archive.';
    } else {
      const ready = SEALS.find((seal) => state.seals[seal].physical.length > 0 && !state.seals[seal].disabled);
      if (ready && state.seals[ready].archive) return `The ${ready} seal mechanism and its verified Past interpretation are ready. Arrange the three connections and disable it below.`;
      if (SEALS.every((seal) => state.seals[seal].disabled) && state.components.length < 4) return 'All seals are disabled. Recover the four catalogue-confirmed components in the Future.';
    }
  }
  if (state.stage === 3) {
    if (actor === 'archivist' && state.evidence.archivist.includes('apparatus-blueprint') && state.apparatus.archive === null) return 'The Past blueprint is collected. Arrange the four placement steps and verify the interpretation below.';
    if (actor === 'tracker' && state.actions.includes('physical-apparatus') && state.apparatus.archive && !state.apparatus.configured) return 'The apparatus and verified blueprint are ready. Place the four recovered parts in order and configure the rig below.';
    if (actor === 'tracker' && state.actions.includes('test-station') && state.apparatus.configured) return 'The test station is inspected and the apparatus is configured. Record the response for each of the three required conditions below.';
    if (actor === 'archivist' && state.weakness.archive && EXPECTED_TRIALS.every((trial) => state.weakness.trials.includes(trial)) && !state.weakness.discovered) return 'The historical notes and all three Tracker readings are ready. Arrange the weakness profile and verify it below.';
    if (actor === 'archivist' && state.weakness.discovered && state.weakness.lure === 0) return 'The weakness profile is verified. Activate the chamber lure in the Containment room.';
    if (actor === 'tracker' && state.weakness.lure > 0 && state.weakness.weakened < 3) return `The lure is active and the weakness is verified. Apply three pulses at the Containment disruptor (${state.weakness.weakened}/3 complete).`;
  }
  return null;
}

type TaskObject = { id: string; label: string; name: string };
const taskObjects: Record<1 | 2 | 3, Record<Hunt3Actor, TaskObject[]>> = {
  1: {
    archivist: [
      { id: 'sighting-ledger', label: 'Inspect sighting ledger · Archive', name: 'Entity sighting ledger' },
      { id: 'containment-observation', label: 'Inspect containment observation · Past', name: 'Containment observation' },
      { id: 'old-facility-report', label: 'Inspect facility report · Director’s office', name: 'Facility movement report' },
    ],
    tracker: [
      { id: 'cold-ash', label: 'Inspect cold ash · Main hall', name: 'Cold ash trail' },
      { id: 'drag-marks', label: 'Inspect drag marks · Observation room', name: 'Fresh drag marks' },
      { id: 'shattered-compass', label: 'Inspect shattered compass · Observation room', name: 'Shattered compass' },
    ],
  },
  2: {
    archivist: [
      { id: 'power-diagram', label: 'Read Power seal diagram · Generator', name: 'Power seal diagram' },
      { id: 'resonance-diagram', label: 'Read Resonance seal notes · Communications', name: 'Resonance seal notes' },
      { id: 'memory-diagram', label: 'Read Memory seal protocol · Observation', name: 'Memory seal protocol' },
      { id: 'component-catalog', label: 'Inspect component catalogue · Archive', name: 'Containment component catalogue' },
      { id: 'apparatus-blueprint', label: 'Inspect apparatus blueprint · Containment', name: 'Containment apparatus blueprint' },
    ],
    tracker: [
      { id: 'power-mechanism', label: 'Inspect Power mechanism · Generator', name: 'Power seal mechanism' },
      { id: 'resonance-mechanism', label: 'Inspect Resonance mechanism · Communications', name: 'Resonance mechanism' },
      { id: 'memory-mechanism', label: 'Inspect Memory mechanism · Observation', name: 'Memory seal mechanism' },
      { id: 'recover-induction-coil', label: 'Recover induction coil · Generator', name: 'Induction coil' },
      { id: 'recover-prism-lens', label: 'Recover prism lens · Examination', name: 'Prism lens' },
      { id: 'recover-grounding-braid', label: 'Recover grounding braid · Communications', name: 'Grounding braid' },
      { id: 'recover-memory-core', label: 'Recover memory core · Observation', name: 'Memory core' },
      { id: 'recover-shattered-glass', label: 'Examine shattered glass decoy · Main hall', name: 'Shattered glass decoy' },
      { id: 'recover-scorched-lattice', label: 'Examine scorched lattice decoy · Main hall', name: 'Scorched lattice decoy' },
    ],
  },
  3: {
    archivist: [
      { id: 'apparatus-blueprint', label: 'Review apparatus blueprint · Containment', name: 'Containment apparatus blueprint' },
      { id: 'weakness-notes', label: 'Read historical reaction notes · Experiment', name: 'Historical reaction notes' },
      { id: 'lure-control', label: 'Activate chamber lure · Containment', name: 'Lure tone control' },
    ],
    tracker: [
      { id: 'physical-apparatus', label: 'Inspect physical apparatus · Containment', name: 'Reconstruction apparatus' },
      { id: 'test-station', label: 'Inspect environmental test station · Experiment', name: 'Environmental test station' },
      { id: 'disruptor', label: 'Apply weakness pulse · Containment', name: 'Containment disruptor' },
    ],
  },
};

export default function Hunt3Progress({ state, actor, message, working, onAction }: Props) {
  const [apparatusSequence, setApparatusSequence] = useState<string[]>(['', '', '', '']);
  const [sealAnswers, setSealAnswers] = useState<Record<(typeof SEALS)[number], string[]>>({
    power: ['', '', ''], resonance: ['', '', ''], memory: ['', '', ''],
  });
  const [location, setLocation] = useState('');
  const [condition, setCondition] = useState('');
  const [reading, setReading] = useState<'' | 'withdrawal' | 'surge'>('');
  const [profile, setProfile] = useState(['', '', '']);
  const [panelOpen, setPanelOpen] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const previousNextAction = useRef<string | null>(null);

  useEffect(() => {
    const deadlineAt = state?.boss.deadlineAt ?? null;
    const update = () => setSecondsLeft(deadlineAt ? Math.max(0, Math.ceil((deadlineAt - Date.now()) / 1000)) : 0);
    update();
    const interval = window.setInterval(update, 1000);
    return () => window.clearInterval(interval);
  }, [state?.boss.deadlineAt]);

  const nextAction = state ? nextClueAction(state, actor) : null;
  useEffect(() => {
    if (nextAction && nextAction !== previousNextAction.current) setPanelOpen(true);
    previousNextAction.current = nextAction;
  }, [nextAction]);

  if (!state) return <>
    <button className={`${styles.taskToggle} ${actor === 'archivist' ? styles.pastToggle : styles.trackerToggle}`} type="button" aria-expanded={panelOpen} onClick={(e) => { e.currentTarget.blur(); setPanelOpen((open) => !open); }}>
      Hunt III · {actor === 'archivist' ? 'Archivist' : 'Tracker'} · {panelOpen ? 'Hide tasks' : 'Show tasks'}
    </button>
    {panelOpen && <section className={`${styles.root} ${actor === 'archivist' ? styles.archivistPanel : styles.trackerPanel}`} aria-label={`Hunt III ${actor} progress`}>
      <header><div><small>ROUND III · FINAL CONTAINMENT</small><h2>Hunt III investigation</h2></div><strong>{actor === 'archivist' ? 'ARCHIVIST · PAST' : 'TRACKER · FUTURE'}</strong><button className={styles.hidePanel} type="button" onClick={(e) => { e.currentTarget.blur(); setPanelOpen(false); }}>Hide</button></header>
      <div className={styles.status} role="status">{message || 'Restoring the shared containment investigation…'}</div>
      <section className={styles.task}>
        <h3>The Entity’s Trail</h3>
        <p>{actor === 'archivist' ? 'Inspect the sighting ledger, containment observation and facility report in the Past. Use them to submit the last-known wing.' : 'Inspect the cold ash, drag marks and shattered compass in the Future. Use them to submit the physical trace signature.'}</p>
        <small>{actor === 'archivist' ? 'Archivist: investigate the Past records and submit your wing finding.' : 'Tracker: investigate the Future traces and submit your trace finding.'} Hunt III progress is {message || 'loading'}.</small>
      </section>
    </section>}
  </>;
  const run = (type: string, id: string, value?: unknown) => {
    if (!working) void onAction({ type, id, value });
  };
  const taskStage = state.stage as 1 | 2 | 3;
  const currentObjects = state.stage < 4 ? taskObjects[taskStage][actor] : [];
  const bossControl = BOSS_CONTROLS[state.boss.step];
  const nextBossActor = bossControl?.actor ?? null;
  const stageOneEvidence = state.evidence[actor].filter((id) => (actor === 'archivist'
    ? ['sighting-ledger', 'containment-observation', 'old-facility-report'].includes(id)
    : ['cold-ash', 'drag-marks', 'shattered-compass'].includes(id))).length;
  const playerTasks = completedTasksFor(state, actor);
  const completedTaskCount = playerTasks.filter(Boolean).length;

  return <>
    <button
      className={`${styles.taskToggle} ${actor === 'archivist' ? styles.pastToggle : styles.trackerToggle}`}
      type="button"
      aria-expanded={panelOpen}
      onClick={(e) => { e.currentTarget.blur(); setPanelOpen((open) => !open); }}
    >
      Hunt III · {state.stage}/4 · {panelOpen ? `Hide ${actor === 'archivist' ? 'Archivist' : 'Tracker'} tasks` : `Show ${actor === 'archivist' ? 'Archivist' : 'Tracker'} tasks`}
    </button>
    {panelOpen && <section className={`${styles.root} ${actor === 'archivist' ? styles.archivistPanel : styles.trackerPanel}`} aria-label={`Hunt III ${actor} progress`}>
    <header><div><small>ROUND III · FINAL CONTAINMENT</small><h2>{STAGE_TITLES[state.stage - 1]}</h2></div><strong>STAGE {state.stage}/4</strong><button className={styles.hidePanel} type="button" onClick={(e) => { e.currentTarget.blur(); setPanelOpen(false); }}>Hide</button></header>
    <div className={styles.status} aria-live="polite">{message || `Server score: ${state.score} · ${actor === 'archivist' ? 'Archivist · Past' : 'Tracker · Future'}`}</div>
    <div className={styles.playerProgress} aria-live="polite">
      <b>{actor === 'archivist' ? 'ARCHIVIST' : 'TRACKER'} TASKS COMPLETED · {completedTaskCount}/4</b>
      <span>Current task {state.stage}/4{playerTasks[state.stage - 1] ? ' · COMPLETE' : ' · IN PROGRESS'}</span>
    </div>
    {nextAction && <aside className={styles.nextAction} role="status"><b>CLUES READY · NEXT ACTION</b><span>{nextAction}</span></aside>}
    <div className={styles.progress}>Stage awards: {state.scoreBreakdown.stage1}/250 · {state.scoreBreakdown.stage2}/400 · {state.scoreBreakdown.stage3}/350 · {state.scoreBreakdown.stage4}/500 · Hidden evidence {state.optional.complete ? '100/100' : '0/100'} · Maximum 1,600</div>

    {state.stage < 4 && <section className={styles.task}>
      <h3>{state.stage === 1 ? 'Track the roaming entity' : state.stage === 2 ? 'Disable the three seals' : 'Rebuild, test, lure and weaken'}</h3>
      <div className={styles.stageInstructions}>
        <b>TASK INSTRUCTIONS:</b>
        <ol>
          {stageInstructions(state.stage, actor).map((step, idx) => (
            <li key={idx}>{step}</li>
          ))}
        </ol>
      </div>
      <b>{actor === 'archivist' ? 'ARCHIVIST · PAST INSPECTIONS' : 'TRACKER · FUTURE INSPECTIONS'}</b>
      <ul className={styles.inspectList}>{currentObjects.map((item) => {
        const complete = item.id === 'disruptor' ? state.weakness.weakened >= 3 : state.actions.includes(item.id);
        const progress = item.id === 'disruptor' ? ` · ${state.weakness.weakened}/3 pulses` : '';
        return <li key={item.id} className={complete ? styles.playerTaskDone : ''} title={item.name}>
          <span>{complete ? '✓' : '○'}</span>{item.label}{progress}
        </li>;
      })}</ul>

      {state.stage === 1 && <>
        <small>Evidence inspected: {stageOneEvidence}/3. Move beside each object and press {actor === 'archivist' ? 'E' : 'Enter'} to inspect it. Only an in-world inspection records a clue.</small>
        <label>{actor === 'archivist' ? 'Last known wing' : 'Physical trace signature'}
          <select value={location} disabled={working} onChange={(event) => setLocation(event.target.value)}>
            <option value="">Choose your deduction…</option>
            {actor === 'archivist' ? <><option value="east-wing">East wing</option><option value="west-wing">West wing</option><option value="north-wing">North wing</option></> : <><option value="cold-star">Cold star</option><option value="broken-compass">Broken compass</option><option value="drag-loop">Drag loop</option></>}
        </select></label>
        <button type="button" disabled={working || stageOneEvidence < 3 || !location} onClick={() => run('submit', 'trail-location', { location })}>Submit private trail finding</button>
        <small>Archivist: {state.trail.archivist ?? 'awaiting'} · Tracker: {state.trail.tracker ?? 'awaiting'}</small>
      </>}

      {state.stage === 2 && <>
        {actor === 'archivist' && <div className={styles.seals}>{SEALS.map((seal) => <div key={seal}>
          <b>{seal.toUpperCase()} SEAL</b><span>{state.seals[seal].disabled ? 'DISABLED' : state.seals[seal].archive ? 'PAST VERIFIED' : 'AWAITING DIAGRAM'}</span>
          {state.evidence.archivist.includes(`${seal}-diagram`) && !state.seals[seal].archive && <>
            <SequenceSelect options={SEAL_OPTIONS[seal]} values={sealAnswers[seal]} disabled={working} setValues={(values) => setSealAnswers({ ...sealAnswers, [seal]: values })} />
            <button type="button" disabled={working || sealAnswers[seal].some((item) => !item) || new Set(sealAnswers[seal]).size !== 3} onClick={() => run('submit', `seal-${seal}-archive`, { sequence: sealAnswers[seal] })}>Submit Past {seal} interpretation</button>
          </>}
        </div>)}</div>}
        {actor === 'tracker' && <div className={styles.seals}>{SEALS.map((seal) => <div key={seal}>
          <b>{seal.toUpperCase()} SEAL</b><span>{state.seals[seal].disabled ? 'DISABLED' : state.seals[seal].physical.length ? 'MECHANISM INSPECTED' : 'AWAITING INSPECTION'}</span>
          {state.seals[seal].physical.length > 0 && !state.seals[seal].disabled && <>
            <SequenceSelect options={SEAL_OPTIONS[seal]} values={sealAnswers[seal]} disabled={working} setValues={(values) => setSealAnswers({ ...sealAnswers, [seal]: values })} />
            <button type="button" disabled={working || !state.seals[seal].archive || sealAnswers[seal].some((item) => !item) || new Set(sealAnswers[seal]).size !== 3} onClick={() => run('submit', `seal-${seal}`, { sequence: sealAnswers[seal] })}>Configure {seal} seal</button>
          </>}
        </div>)}</div>}
        <small>Verified parts: {state.components.length}/4 · disabled seals: {SEALS.filter((seal) => state.seals[seal].disabled).length}/3</small>
      </>}

      {state.stage === 3 && <>
        {(actor === 'archivist' && state.evidence.archivist.includes('apparatus-blueprint') || actor === 'tracker' && state.apparatus.archive && state.actions.includes('physical-apparatus')) && <>
          <b>{actor === 'archivist' ? 'Decode the blueprint placement order' : 'Place the verified components in the matching sockets'}</b>
          <SequenceSelect options={APPARATUS} values={apparatusSequence} disabled={working} setValues={setApparatusSequence} />
          <button type="button" disabled={working || apparatusSequence.some((item) => !item) || new Set(apparatusSequence).size !== 4 || (actor === 'tracker' && state.components.length !== 4)} onClick={() => run('submit', 'apparatus', { sequence: apparatusSequence })}>{actor === 'archivist' ? 'Verify Past blueprint' : 'Configure Future apparatus'}</button>
          <small>{state.apparatus.configured ? 'Apparatus configured.' : state.apparatus.archive ? 'Blueprint verified; Tracker may configure the rig.' : 'Awaiting blueprint interpretation.'}</small>
        </>}
        {actor === 'tracker' && state.actions.includes('test-station') && <div className={styles.trial}>
          <b>Controlled environmental trials · complete all three</b>
          <label>Condition<select value={condition} disabled={working} onChange={(event) => setCondition(event.target.value)}><option value="">Choose condition…</option><option value="frequency-low">Low frequency</option><option value="light-dark">Darkness</option><option value="temperature-cold">Cold</option></select></label>
          <label>Observed reaction<select value={reading} disabled={working} onChange={(event) => setReading(event.target.value as 'withdrawal' | 'surge' | '')}><option value="">Record observed reaction…</option><option value="withdrawal">Entity withdraws</option><option value="surge">Entity surges</option></select></label>
          <button type="button" disabled={working || !state.apparatus.configured || !condition || !reading} onClick={() => run('submit', 'weakness-trial', { condition, reading })}>Record trial</button>
          <small>Verified response trials: {EXPECTED_TRIALS.filter((trial) => state.weakness.trials.includes(trial)).length}/3. Observe and record the entity’s actual reaction for each condition.</small>
        </div>}
        {actor === 'archivist' && state.weakness.archive && <>
          <b>Verify the historical vulnerability profile</b><small>Order the three findings to match the sequence described in the Past notes.</small>
          {profile.map((value, index) => <label key={index}>Finding order {index + 1}<select value={value} disabled={working} onChange={(event) => setProfile(profile.map((old, i) => i === index ? event.target.value : old))}><option value="">Choose finding…</option>{CONDITIONS.map((option) => <option key={option} value={option}>{option === 'frequency-low' ? 'Low frequency' : option === 'light-dark' ? 'Darkness' : 'Cold'}</option>)}</select></label>)}
          <button type="button" disabled={working || profile.some((item) => !item) || new Set(profile).size !== 3 || !EXPECTED_TRIALS.every((trial) => state.weakness.trials.includes(trial))} onClick={() => run('submit', 'weakness-conclusion', { profile })}>Verify weakness from Tracker’s readings</button>
        </>}
        <small>Weakness: {state.weakness.discovered ? 'verified · low frequency, darkness, and cold' : 'not verified'} · Lure: {state.weakness.lure ? 'active' : 'off'} · Pulses: {state.weakness.weakened}/3</small>
      </>}
    </section>}

    {state.stage === 4 && <section className={styles.task}>
      <h3>Capture the weakened entity (Final Sequence)</h3>
      <div className={styles.stageInstructions}>
        <b>TASK INSTRUCTIONS:</b>
        <ol>
          {stageInstructions(4, actor).map((step, idx) => (
            <li key={idx}>{step}</li>
          ))}
        </ol>
      </div>
      <p>{state.boss.warning ?? 'Containment sequence complete.'}</p>
      <strong>Containment room · Stability {state.boss.stability}/6{state.boss.deadlineAt ? ` · ${secondsLeft}s to respond` : ''}</strong>
      <small>{nextBossActor === actor ? `Your turn. Reach the highlighted control in your timeline and press ${actor === 'archivist' ? 'E' : 'Enter'}.` : `Waiting for ${nextBossActor === 'archivist' ? 'Archivist · Past' : 'Tracker · Future'} to act. Your matching control is ready for the next warning.`}</small>
      <small>Controls only register after the correct player uses the named in-world object within the warning window.</small>
    </section>}

    <details className={`${styles.task} ${styles.optional}`}>
      <summary>Optional hidden evidence · {state.optional.complete ? 'complete' : '100 bonus points'}</summary>
      <p>{actor === 'archivist' ? 'Director’s office, Past: inspect the concealed inscription.' : 'Main hall, Future: inspect the impossible shadow.'} Move beside it and press {actor === 'archivist' ? 'E' : 'Enter'}; both findings are needed.</p>
      <small>Archivist {state.optional.archivist ? '✓' : '○'} · Tracker {state.optional.tracker ? '✓' : '○'}</small>
    </details>

    {state.completed && <div className={styles.complete} role="status">CONTAINMENT COMPLETE · Hunt III score {state.score}/1,600. The entity has been captured.</div>}
    <small className={styles.journalHint}>Press Q (Archivist) or P (Tracker) to open the shared Hunt III journal. Inspected clues appear there.</small>
  </section>}
  </>;
}

function SequenceSelect({ options, values, disabled, setValues }: { options: string[]; values: string[]; disabled: boolean; setValues: (value: string[]) => void }) {
  return <div className={styles.sequence}>{values.map((value, index) => <label key={index}>Connection {index + 1}<select value={value} disabled={disabled} onChange={(event) => setValues(values.map((old, i) => i === index ? event.target.value : old))}><option value="">Choose…</option>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>)}</div>;
}
