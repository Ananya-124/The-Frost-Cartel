import type { EndSummary } from '../../types';
import Leaderboard from '../leaderboard/Leaderboard';
import styles from '../overlays/Overlays.module.css';

interface EndScreenProps {
  summary: EndSummary;
  onNewSession: () => void;
  expired?: boolean;
  storyReveal?: boolean;
}

export default function EndScreen({ summary, onNewSession, expired = false, storyReveal = false }: EndScreenProps) {
  return (
    <div className={styles.end}>
      <h1>{expired ? 'TIME EXPIRED · SCORE PRESERVED' : storyReveal ? 'THE ENTITY IS CONTAINED' : 'THE PARADOX IS BOUND'}</h1>
      {storyReveal && <section className={styles.storyReveal} aria-label="Final incident report">
        <h2>FINAL INCIDENT REPORT · CONTAINMENT SEALED</h2>
        <p>The experiment was designed to use temporal resonance to reconstruct human memories. The team pushed the apparatus beyond its intended limits.</p>
        <p>Something inside the reconstructed memories became conscious. That consciousness was the entity encountered throughout the facility—and it is now contained.</p>
      </section>}
      <div>Team {summary.teamName}</div>
      <div className={styles.big}>{summary.totalScore}</div>
      <div className={styles.stats}>
        {summary.huntScores.map((s, i) => (
          <div className={styles.stat} key={i}>
            Hunt {i + 1}
            <b>{s}</b>
          </div>
        ))}
        <div className={styles.stat}>
          Evidence
          <b>{summary.evidence}</b>
        </div>
        <div className={styles.stat}>
          Captures
          <b>{summary.captures}</b>
        </div>
        <div className={styles.stat}>
          Bonuses
          <b>{summary.bonus}</b>
        </div>
        <div className={styles.stat}>
          Penalties
          <b>{summary.penalties}</b>
        </div>
      </div>
      <div>Rank #{summary.rank}</div>
      <Leaderboard entries={summary.leaderboard} teamName={summary.teamName} score={summary.totalScore} />
      <button onClick={onNewSession}>Return to cartel</button>
    </div>
  );
}
