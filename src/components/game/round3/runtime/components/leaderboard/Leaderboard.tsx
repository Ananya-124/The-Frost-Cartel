import { LEADERBOARD_QUALIFYING_RANKS } from '../../config/scoring';
import type { LeaderboardEntry } from '../../types';
import styles from '../overlays/Overlays.module.css';

interface LeaderboardProps {
  entries: readonly LeaderboardEntry[];
  teamName: string;
  score: number;
}

export default function Leaderboard({ entries, teamName, score }: LeaderboardProps) {
  const yourFirstResult = entries.findIndex((entry) => entry.name === teamName && entry.score === score);
  return (
    <table className={styles.board}>
      <tbody>
        {entries.map((entry, i) => {
          const isYou = i === yourFirstResult;
          const qualifies = i < LEADERBOARD_QUALIFYING_RANKS;
          return (
            <tr key={`${i}-${entry.name}-${entry.score}`} className={isYou ? styles.you : undefined}>
              <td>#{i + 1}</td>
              <td>
                {entry.name}
                {qualifies && <span className={styles.qualify}> · qualifies for the next round</span>}
              </td>
              <td>{entry.score}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
