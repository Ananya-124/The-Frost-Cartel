import type { EngineRefs } from '../../hooks/useGameEngine';
import type { UiSnapshot } from '../../engine/state/snapshot';
import CardTray from '../hud/CardTray';
import TeamHud from '../hud/TeamHud';
import styles from './Game.module.css';
import TimelinePane from './TimelinePane';

interface SplitScreenProps {
  snapshot: UiSnapshot;
  refs: EngineRefs;
  onPuzzleKey: (playerIndex: 0 | 1, key: number) => void;
  onUseCard: (slot: number) => void;
}

/** Split-screen layout: Archivist (Past) on the left, Tracker (Future) on the right. */
export default function SplitScreen({ snapshot, refs, onPuzzleKey, onUseCard }: SplitScreenProps) {
  const playing = snapshot.phase === 'playing';
  return (
    <>
      <div className={playing ? styles.game : styles.hidden}>
        <TimelinePane
          view={snapshot.players[0]}
          journal={snapshot.journal}
          canvasRef={refs.pastCanvas}
          halfRef={refs.pastHalf}
          onPuzzleKey={(k) => onPuzzleKey(0, k)}
          hideObjective={snapshot.huntNumber === 1 || snapshot.huntNumber === 2}
        />
        <TimelinePane
          view={snapshot.players[1]}
          journal={snapshot.journal}
          canvasRef={refs.futureCanvas}
          halfRef={refs.futureHalf}
          onPuzzleKey={(k) => onPuzzleKey(1, k)}
          hideObjective={snapshot.huntNumber === 1 || snapshot.huntNumber === 2}
        />
      </div>
      {playing && <TeamHud snapshot={snapshot} />}
      {playing && <CardTray cards={snapshot.cards} onUse={onUseCard} />}
    </>
  );
}
