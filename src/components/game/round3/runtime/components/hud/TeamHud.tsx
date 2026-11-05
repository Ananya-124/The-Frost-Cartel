import type { UiSnapshot } from '../../engine/state/snapshot';
import styles from '../canvas/Game.module.css';

const READINESS_LABELS = ['Weakness', 'Entity', 'Past node', 'Future node'] as const;

export default function TeamHud({ snapshot }: { snapshot: UiSnapshot }) {
  return (
    <div className={styles.hud}>
      <div className={styles.hudBox}>
        TEAM {snapshot.teamName.toUpperCase()}
        <b>{snapshot.score}</b>
      </div>
      <div className={styles.hudBox}>
        HUNT {snapshot.huntNumber} OF 3
        <b>{snapshot.huntTitle}</b>
      </div>
      <div className={`${styles.hudBox} ${styles.dots}`}>
        CAPTURE READINESS
        <div>
          {READINESS_LABELS.map((label, i) => (
            <span key={label} className={snapshot.readiness[i] ? styles.on : undefined}>
              ● {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
