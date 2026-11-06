import type { RefObject } from 'react';
import type { ClueRecord } from '../../types';
import type { PlayerPanelView } from '../../engine/state/snapshot';
import SharedJournal from '../journal/SharedJournal';
import PuzzlePanel from '../puzzles/PuzzlePanel';
import styles from './Game.module.css';

interface TimelinePaneProps {
  view: PlayerPanelView;
  journal: readonly ClueRecord[];
  canvasRef: RefObject<HTMLCanvasElement | null>;
  halfRef: RefObject<HTMLDivElement | null>;
  onPuzzleKey: (key: number) => void;
  hideObjective?: boolean;
}

/** One half of the split screen: its canvas plus the HUD for that player. */
export default function TimelinePane({
  view,
  journal,
  canvasRef,
  halfRef,
  onPuzzleKey,
  hideObjective = false,
}: TimelinePaneProps) {
  const isFuture = view.timeline === 'future';
  return (
    <div className={styles.half} ref={halfRef}>
      <canvas className={styles.canvas} ref={canvasRef} />
      <div className={styles.panel}>
        <div className={`${styles.role} ${isFuture ? styles.futureRole : styles.pastRole}`}>
          <b>{view.role.toUpperCase()}</b> · {isFuture ? 'FUTURE' : 'PAST'}
        </div>
        <div className={styles.room}>{view.roomName}</div>
        {!hideObjective && <div className={styles.objective}>
          {view.objective}
          {view.partnerArmed && <span className={styles.armed}> PARTNER IS ARMED!</span>}
        </div>}
      </div>
      <div className={styles.prompt}>{view.prompt}</div>
      {view.message && <div className={styles.message}>{view.message}</div>}
      {view.journalOpen && <SharedJournal entries={journal} />}
      {view.puzzle && <PuzzlePanel index={view.index} puzzle={view.puzzle} onPress={onPuzzleKey} />}
    </div>
  );
}
