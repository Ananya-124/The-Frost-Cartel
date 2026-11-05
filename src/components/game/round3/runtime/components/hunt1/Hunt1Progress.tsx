import { useEffect, useState, type FormEvent } from 'react';
import type { Hunt1ActionResult, Hunt1Actor, Hunt1Challenge, Hunt1State } from '../../../../../../types/hunt1.types';
import styles from './Hunt1Progress.module.css';

interface Hunt1ProgressProps {
  state: Hunt1State | null;
  pending: { actor: Hunt1Actor; kind: NonNullable<Hunt1ActionResult['input']> } | null;
  message: string;
  working: boolean;
  onHint: () => void;
  onSubmit: (actor: Hunt1Actor, kind: NonNullable<Hunt1ActionResult['input']>, value: unknown) => Promise<Hunt1ActionResult>;
  onCloseSubmission: () => void;
  onContinue: () => void;
}

const TITLES: Record<Hunt1Challenge, string> = {
  1: 'The Missing Key', 2: 'The Sealed Report', 3: 'The Frequency',
  4: 'The Broken Circuit', 5: 'The Resonance Configuration', 6: 'Final Shutdown',
};
const OBJECTIVES: Record<Hunt1Challenge, Record<Hunt1Actor, string>> = {
  1: { archivist: 'Inspect the reception desk and solve its maintenance riddle.', tracker: 'Wait for the riddle solution, then inspect the stopped clock for the key.' },
  2: { archivist: 'Use the shared maintenance key to open the reception desk drawer and read the report.', tracker: 'Inspect the damaged reception desk underside and recover the missing fragment.' },
  3: { archivist: 'Inspect the three-tone recording and decode its frequency.', tracker: 'Inspect the transmitter dial and enter the Archivist’s decoded frequency.' },
  4: { archivist: 'Read the original circuit diagram and validate its component order.', tracker: 'Open the electrical panel, collect all three missing components, and install them in order.' },
  5: { archivist: 'Validate the historical calibration from the reconstructed report.', tracker: 'Configure the transmitter from the report, then confirm it with your partner.' },
  6: { archivist: 'Prepare the Past shutdown console and synchronize its activation.', tracker: 'Prepare the Future emergency breaker and synchronize its activation.' },
};
const TASKS: Record<Hunt1Challenge, Record<Hunt1Actor, readonly [string, string][]>> = {
  1: { archivist: [['maintenanceNoteFound', 'Maintenance note inspected'], ['riddleSolved', 'Riddle deduction verified']], tracker: [['maintenanceKeyCollected', 'Maintenance key collected']] },
  2: { archivist: [['drawerUnlocked', 'Drawer unlocked with the key'], ['originalReportCollected', 'Original report recovered']], tracker: [['reportFragmentCollected', 'Report fragment recovered'], ['reportReconstructed', 'Shared report reconstructed']] },
  3: { archivist: [['audioInspected', 'Recording inspected'], ['frequencyDecoded', 'Frequency deduction verified']], tracker: [['transmitterDialInspected', 'Transmitter dial inspected'], ['transmitterFrequencyEntered', 'Frequency entered and verified']] },
  4: { archivist: [['circuitDiagramInspected', 'Circuit diagram inspected'], ['wiringValidated', 'Wiring deduction verified']], tracker: [['componentsCollected', 'All three components collected'], ['circuitRestored', 'Circuit installed and restored']] },
  5: { archivist: [['calibrationValidated', 'Historical calibration verified'], ['archivistConfigurationConfirmed', 'Archivist confirmed configuration']], tracker: [['transmitterConfigured', 'Transmitter configured'], ['trackerConfigurationConfirmed', 'Tracker confirmed configuration']] },
  6: { archivist: [['archivistReady', 'Shutdown console prepared'], ['archivistActivated', 'Shutdown control activated']], tracker: [['trackerReady', 'Emergency breaker prepared'], ['trackerActivated', 'Breaker activated']] },
};

function progressStatus(state: Hunt1State, actor: Hunt1Actor): string {
  if (state.completed) return 'COMPLETED';
  const keys = TASKS[state.currentChallenge][actor].map(([key]) => key);
  return keys.every((key) => state.subtasks[key]) ? 'WAITING FOR PARTNER' : 'ACTIVE';
}

function playerScore(state: Hunt1State, actor: Hunt1Actor): number {
  const breakdown = state.scoreBreakdownByPlayer[actor];
  return breakdown.evidence + breakdown.deductions + breakdown.circuit + breakdown.configuration + breakdown.shutdown + breakdown.optional - breakdown.penalties;
}

export default function Hunt1Progress({ state, pending, message, working, onHint, onSubmit, onCloseSubmission, onContinue }: Hunt1ProgressProps) {
  const [riddle, setRiddle] = useState('');
  const [frequency, setFrequency] = useState('');
  const [mode, setMode] = useState('');
  const [order, setOrder] = useState(['', '', '', '']);
  const [journalOpen, setJournalOpen] = useState(false);
  const [journalActor, setJournalActor] = useState<Hunt1Actor>('archivist');
  const [clockNow, setClockNow] = useState(0);

  useEffect(() => {
    if (!state?.syncDeadline || state.completed) return;
    const initialize = window.setTimeout(() => setClockNow(Date.now()), 0);
    const timer = window.setInterval(() => setClockNow(Date.now()), 200);
    return () => { window.clearTimeout(initialize); window.clearInterval(timer); };
  }, [state?.syncDeadline, state?.completed]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!pending) return;
    let value: unknown;
    if (pending.kind === 'riddle') value = { kind: 'riddle', answer: riddle };
    else if (pending.kind === 'frequency') value = { kind: pending.actor === 'archivist' ? 'frequency-analysis' : 'transmitter-frequency', frequency: Number(frequency) };
    else if (pending.kind === 'circuit') value = { kind: pending.actor === 'archivist' ? 'circuit-deduction' : 'circuit-installation', order };
    else value = { kind: pending.actor === 'archivist' ? 'calibration' : 'transmitter-configuration', frequency: Number(frequency), mode };
    try {
      const result = await onSubmit(pending.actor, pending.kind, value);
      if (result.success) { setRiddle(''); setFrequency(''); setMode(''); setOrder(['', '', '', '']); }
    } catch { /* The parent reports the API error in the persistent mission bar. */ }
  };

  if (!state) return <div className={styles.loading}>Connecting to the shared Hunt I investigation…</div>;
  const challenge = state.currentChallenge;
  const nextCondition = challenge === 1 ? 'Both the riddle and hidden key must be secured.'
    : challenge === 2 ? 'Both report pieces must be recovered and reconstructed.'
      : challenge === 3 ? 'Both frequency deductions must be verified.'
        : challenge === 4 ? 'The diagram and installed circuit must agree.'
          : challenge === 5 ? 'Both investigators must confirm the configuration.'
            : 'Both controls must be activated within the 10-second window.';

  return <>
    <div className={styles.grid}>
      {(['archivist', 'tracker'] as const).map((actor) => <section className={`${styles.panel} ${actor === 'tracker' ? styles.future : styles.past}`} key={actor}>
        <header><span>{actor === 'archivist' ? 'ARCHIVIST · PAST' : 'TRACKER · FUTURE'}</span><b>{progressStatus(state, actor)}</b></header>
        <small>HUNT I · THE HOLLOW WITNESS · CHALLENGE {challenge}/6</small>
        <h2>{TITLES[challenge]}</h2>
        <p>{OBJECTIVES[challenge][actor]}</p>
        <ul>{TASKS[challenge][actor].map(([key, label]) => <li className={state.subtasks[key] ? styles.done : ''} key={key}><span>{state.subtasks[key] ? '✓' : '○'}</span>{label}</li>)}</ul>
        <footer><span>Partner: {progressStatus(state, actor === 'archivist' ? 'tracker' : 'archivist')}</span><span>Your score: {playerScore(state, actor)} · Team progress: {state.completed ? 6 : challenge - 1}/6</span></footer>
        <details className={styles.scoreDetails}><summary>Score breakdown · {actor === 'archivist' ? 'Archivist' : 'Tracker'}</summary>
          <span>Evidence {state.scoreBreakdownByPlayer[actor].evidence} · Deductions {state.scoreBreakdownByPlayer[actor].deductions} · Circuit {state.scoreBreakdownByPlayer[actor].circuit} · Configuration {state.scoreBreakdownByPlayer[actor].configuration} · Shutdown {state.scoreBreakdownByPlayer[actor].shutdown} · Optional {state.scoreBreakdownByPlayer[actor].optional} · Penalties −{state.scoreBreakdownByPlayer[actor].penalties}</span>
        </details>
        <small className={styles.unlock}>NEXT UNLOCK: {nextCondition}</small>
        <button className={styles.hint} disabled={working || state.hintUses[String(challenge)] >= 2} onClick={onHint}>Request hint · 25 points</button>
      </section>)}
    </div>
    <div className={styles.toolbar}>
      <button onClick={() => setJournalOpen((open) => !open)}>Shared investigation journal · {state.journal.length}</button>
      {message && <span role="status">{message}</span>}
      <span>TEAM SCORE {state.score} · PENALTIES {state.penalties}</span>
      <details className={styles.teamScoreDetails}><summary>Team breakdown</summary><span>Evidence {state.scoreBreakdown.evidence} · Deductions {state.scoreBreakdown.deductions} · Circuit {state.scoreBreakdown.circuit} · Configuration {state.scoreBreakdown.configuration} · Shutdown {state.scoreBreakdown.shutdown} · Optional {state.scoreBreakdown.optional} · Penalties −{state.scoreBreakdown.penalties}</span></details>
    </div>
    {journalOpen && <aside className={styles.journal}>
      <button className={styles.close} onClick={() => setJournalOpen(false)}>Close</button>
      <h2>Shared Investigation Journal</h2>
      <div className={styles.journalFilters} role="group" aria-label="Investigator journal view">
        <button aria-pressed={journalActor === 'archivist'} onClick={() => setJournalActor('archivist')}>Archivist discoveries</button>
        <button aria-pressed={journalActor === 'tracker'} onClick={() => setJournalActor('tracker')}>Tracker discoveries</button>
      </div>
      {state.journal.filter((entry) => entry.verified || entry.discoveredBy === 'team' || entry.discoveredBy === journalActor).length === 0 ? <p>No evidence discovered yet.</p> : [...state.journal].reverse().filter((entry) => entry.verified || entry.discoveredBy === 'team' || entry.discoveredBy === journalActor).map((entry) => <article key={entry.id}>
        <small>{entry.type.toUpperCase()} · {entry.location} · {entry.discoveredBy}</small>
        <h3>{entry.title}{entry.verified ? ' · VERIFIED' : ''}</h3>
        <p>{entry.content}</p><p><b>Inference:</b> {entry.inference}</p>
      </article>)}
    </aside>}
    {challenge === 6 && state.syncDeadline !== null && !state.completed && <div className={styles.syncCountdown} role="timer" aria-live="polite">
      SHUTDOWN WINDOW · {Math.max(0, Math.ceil((state.syncDeadline - clockNow) / 1000))}s
    </div>}
    {pending && <div className={styles.scrim}><form className={styles.dialog} onSubmit={(event) => { void submit(event); }}>
      <button type="button" className={styles.close} onClick={onCloseSubmission}>Close</button>
      <small>CHALLENGE {challenge} · {pending.actor === 'archivist' ? 'ARCHIVIST / PAST' : 'TRACKER / FUTURE'}</small>
      <h2>{pending.kind === 'riddle' ? 'Submit the maintenance deduction' : pending.kind === 'frequency' ? 'Analyze the transmitter frequency' : pending.kind === 'circuit' ? 'Submit the component order' : 'Confirm transmitter configuration'}</h2>
      {pending.kind === 'riddle' && <><p>“I have hands but cannot hold. I stopped when the final experiment began. Behind me lies what you seek.”</p><select value={riddle} onChange={(event) => setRiddle(event.target.value)} required><option value="">Choose the answer…</option><option value="stopped wall clock">The stopped wall clock</option><option value="reception desk">The reception desk</option><option value="generator timer">The generator timer</option><option value="director watch">The director’s watch</option></select></>}
      {pending.kind === 'frequency' && <><p>Enter the frequency in hertz (Hz).</p><input type="number" min="0" max="1000" value={frequency} onChange={(event) => setFrequency(event.target.value)} placeholder="0–1000 Hz" required /></>}
      {pending.kind === 'circuit' && <><p>Arrange the complete circuit from power source to output.</p><div className={styles.sequence}>{order.map((value, index) => <label key={index}>Position {index + 1}<select value={value} onChange={(event) => setOrder((old) => old.map((entry, i) => i === index ? event.target.value : entry))} required><option value="">Choose component…</option>{[['power', 'Power'], ['capacitor', 'Capacitor'], ['resonance-coil', 'Resonance coil'], ['output', 'Output']].map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>)}</div></>}
      {pending.kind === 'configuration' && <><p>Use the recovered maintenance report and historical calibration evidence.</p><label>Frequency (Hz)<input type="number" min="0" max="1000" value={frequency} onChange={(event) => setFrequency(event.target.value)} required /></label><label>Resonance mode<select value={mode} onChange={(event) => setMode(event.target.value)} required><option value="">Select mode…</option><option value="in-phase">In-phase</option><option value="antiphase">Antiphase</option><option value="reverse-polarity">Reverse polarity</option><option value="series">Series</option></select></label></>}
      <button className={styles.submit} disabled={working}>{working ? 'Checking…' : 'Submit for verification'}</button>
    </form></div>}
    {state.completed && <div className={styles.completed} role="status"><b>RESONANCE TRANSMITTER DISABLED</b><span>Hunt I complete · Score {state.score}</span><button onClick={onContinue}>Continue to the existing Hunt II</button></div>}
  </>;
}
