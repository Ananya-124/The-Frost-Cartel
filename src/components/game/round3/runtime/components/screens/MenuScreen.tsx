import type { RefObject } from 'react';
import type { PowerCard } from '../../types';
import type { Round3InventoryItem } from '../../../../../../types/round3.types';
import styles from './Menu.module.css';
import type { TestPowerCardId } from '../../testingCards';

interface MenuScreenProps {
  visible: boolean;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  teamName: string;
  cards: PowerCard[];
  inventory: readonly Round3InventoryItem[];
  onStart: () => void;
  onExit: () => void;
  testingCardIds: readonly TestPowerCardId[];
  onToggleTestingCard: (id: TestPowerCardId) => void;
}

export default function MenuScreen({ visible, canvasRef, teamName, onStart, onExit }: MenuScreenProps) {

  return (
    <div className={visible ? styles.menu : styles.hidden}>
      <canvas ref={canvasRef} className={styles.background} />
      <div className={styles.content}>
        <button className={styles.exit} onClick={onExit}>RETURN TO CARTEL</button>
        <h1 className={styles.title}>PARADOX LAB</h1>
        <p className={styles.story}>
          Ward 9 of the Halloran Institute vanished in one night. Thirty years apart, two
          investigators walk the same halls: one through its last working day, one through what
          remains. What happened in the Experiment Chamber still happens. Neither of you can see
          the whole truth alone.
        </p>

        <div className={styles.controls}>
          <div>
            <b className={styles.past}>THE ARCHIVIST · Past</b>
            <br />
            <kbd>W A S D</kbd> move · <kbd>E</kbd> search / use
            <br />
            <kbd>Q</kbd> journal ·
            {/* <kbd>1</kbd>-<kbd>4</kbd> panel buttons */}
          </div>
          <div>
            <b className={styles.future}>THE TRACKER · Future</b>
            <br />
            <kbd>← ↑ ↓ →</kbd> move · <kbd>Enter</kbd> search / use / mark
            <br />
            <kbd>P</kbd> journal ·
            {/* <kbd>7</kbd>  */}
            {/* <kbd>8</kbd> <kbd>9</kbd> <kbd>0</kbd> panel buttons */}
          </div>
          <div>
            <b>TEAM</b>
            <br />
            <kbd>Z</kbd> <kbd>X</kbd> <kbd>C</kbd> <kbd>V</kbd> power cards · <kbd>Esc</kbd> closes panels
          </div>
        </div>

        <p className={styles.story}>
          Walk the halls. Search desks, cabinets and panels. Doors stay shut until something in{' '}
          <i>either</i> timeline opens them. Talk to each other and share evidence from your
          journals. Wrong answers cost points and wake the entity.
        </p>

        <p className={styles.team}>TEAM · <b>{teamName}</b></p>
        <button className={styles.start} onClick={onStart}>
          BEGIN THE HUNT
        </button>
      </div>
    </div>
  );
}
