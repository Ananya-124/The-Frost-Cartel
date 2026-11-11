import { useEffect, useState } from 'react';
import type { EndSummary, LeaderboardEntry } from '../../types';
import Leaderboard from '../leaderboard/Leaderboard';
import styles from '../overlays/Overlays.module.css';
import { loadLeaderboard } from '../../services/leaderboardStorage';

interface EndScreenProps {
  summary: EndSummary;
  teamId: string;
  onNewSession: () => void;
  expired?: boolean;
  storyReveal?: boolean;
}

export default function EndScreen({ summary, teamId, onNewSession, expired = false, storyReveal = false }: EndScreenProps) {
  const [leaderboard, setLeaderboard] = useState<Array<LeaderboardEntry & { teamId: string; rank: number }> | null>(null);
  const [leaderboardError, setLeaderboardError] = useState<string | null>(null);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLeaderboardLoading(true); setLeaderboardError(null);
    void loadLeaderboard().then((rows) => {
      if (active) setLeaderboard(rows.map((row) => ({ teamId: row.team_id, name: row.team_name, score: row.score, rank: row.rank })));
    }).catch((error: unknown) => {
      if (active) { setLeaderboard(null); setLeaderboardError(error instanceof Error ? error.message : 'Official leaderboard is unavailable.'); }
    }).finally(() => { if (active) setLeaderboardLoading(false); });
    return () => { active = false; };
  }, []);

  const officialTeam = leaderboard?.find((entry) => entry.teamId === teamId);
  return (
    <div className={styles.end}>
      <h1>{expired ? 'TIME EXPIRED · SCORE PRESERVED' : storyReveal ? 'THE ENTITY IS CONTAINED' : 'THE PARADOX IS BOUND'}</h1>
      {storyReveal && <section className={styles.storyReveal} aria-label="Final incident report">
        <h2>FINAL INCIDENT REPORT · CONTAINMENT SEALED</h2>
        <p>The experiment was designed to use temporal resonance to reconstruct human memories. The team pushed the apparatus beyond its intended limits.</p>
        <p>Something inside the reconstructed memories became conscious. That consciousness was the entity encountered throughout the facility—and it is now contained.</p>
      </section>}
      <div>Team {summary.teamName}</div>
      <div>Local Round 3 run tally (not official)</div>
      <div className={styles.big} aria-label="Run score summary">{summary.totalScore}</div>
      <div>Official team score: {officialTeam ? officialTeam.score : leaderboardLoading ? 'Loading…' : 'Unavailable'}</div>
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
      <div>{officialTeam ? `Official rank #${officialTeam.rank}` : leaderboardLoading ? 'Loading official rank…' : 'Official rank unavailable'}</div>
      {leaderboardLoading && <p role="status">Loading official leaderboard…</p>}
      {leaderboardError && <div role="alert">{leaderboardError} <button type="button" onClick={() => {
        setLeaderboardLoading(true); setLeaderboardError(null);
        void loadLeaderboard().then((rows) => setLeaderboard(rows.map((row) => ({ teamId: row.team_id, name: row.team_name, score: row.score, rank: row.rank })))).catch((error: unknown) => setLeaderboardError(error instanceof Error ? error.message : 'Official leaderboard is unavailable.')).finally(() => setLeaderboardLoading(false));
      }}>Retry</button></div>}
      {leaderboard && <Leaderboard entries={leaderboard} teamName={officialTeam?.name ?? ''} score={officialTeam?.score ?? -1} />}
      <button onClick={onNewSession}>Return to cartel</button>
    </div>
  );
}
