import type { EngineRefs } from '../../hooks/useGameEngine';
import type { UiSnapshot } from '../../engine/state/snapshot';
import type { Round3RunStatus } from '../../../../../../types/round3.types';
import CardTray from '../hud/CardTray';
import TeamHud from '../hud/TeamHud';
import styles from './Game.module.css';
import TimelinePane from './TimelinePane';

interface SplitScreenProps {
  snapshot: UiSnapshot;
  refs: EngineRefs;
  onPuzzleKey: (playerIndex: 0 | 1, key: number) => void;
  onToggleJournal: (playerIndex: 0 | 1) => void;
  onUseCard: (slot: number) => void;
  remainingSeconds: number;
  runStatus: Round3RunStatus;
  runBusy: boolean;
  canToggleRun: boolean;
  onToggleRun: () => void;
}

/** Split-screen layout: Archivist (Past) on the left, Tracker (Future) on the right. */
export default function SplitScreen({ snapshot, refs, onPuzzleKey, onToggleJournal, onUseCard, remainingSeconds, runStatus, runBusy, canToggleRun, onToggleRun }: SplitScreenProps) {
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
          onToggleJournal={() => onToggleJournal(0)}
          hideObjective={false}
        />
        <TimelinePane
          view={snapshot.players[1]}
          journal={snapshot.journal}
          canvasRef={refs.futureCanvas}
          halfRef={refs.futureHalf}
          onPuzzleKey={(k) => onPuzzleKey(1, k)}
          onToggleJournal={() => onToggleJournal(1)}
          hideObjective={false}
        />
      </div>
      {playing && <TeamHud snapshot={snapshot} remainingSeconds={remainingSeconds} runStatus={runStatus} runBusy={runBusy || !canToggleRun} onToggleRun={onToggleRun} />}
      {playing && <CardTray cards={snapshot.cards} onUse={onUseCard} />}
    </>
  );
}
