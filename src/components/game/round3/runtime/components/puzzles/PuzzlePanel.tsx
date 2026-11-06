import { BREAKER_COLORS, BREAKER_SYMBOLS, RUNES } from '../../config/constants';
import { CONTROLS } from '../../config/controls';
import type { ActivePuzzle, PlayerIndex } from '../../types';
import styles from '../canvas/Game.module.css';

interface PuzzlePanelProps {
  index: PlayerIndex;
  puzzle: ActivePuzzle;
  onPress: (key: number) => void;
}

const KEY_LABELS: Record<PlayerIndex, readonly string[]> = {
  0: CONTROLS[0].panelKeys.map((k) => k.replace('Digit', '')),
  1: CONTROLS[1].panelKeys.map((k) => k.replace('Digit', '')),
};

/** Verification questions and rune / breaker sequences. */
export default function PuzzlePanel({ index, puzzle, onPress }: PuzzlePanelProps) {
  const labels = KEY_LABELS[index];
  const symbol = (k: number): string => (index ? RUNES[k] : BREAKER_SYMBOLS[k]);

  if (puzzle.kind === 'verification') {
    return (
      <div className={styles.puzzle}>
        <h3>Verify your findings</h3>
        <p>{puzzle.question.prompt}</p>
        {puzzle.question.options.map((option, k) => (
          <div className={styles.option} key={option}>
            <button onClick={() => onPress(k)}>
              {labels[k]} · {option}
            </button>
          </div>
        ))}
        <p>
          <small>Wrong answer: −75.</small>
        </p>
      </div>
    );
  }

  return (
    <div className={styles.puzzle}>
      <h3>{index ? 'Rune dais' : 'Breaker panel'}</h3>
      <p>
        Enter the {puzzle.length}-step sequence.
        <br />
        <b>{puzzle.input.map((x) => symbol(x)).join(' → ') || '…'}</b>
      </p>
      {[0, 1, 2, 3].map((k) => (
        <button
          key={k}
          onClick={() => onPress(k)}
          style={index ? undefined : { borderColor: BREAKER_COLORS[k], color: BREAKER_COLORS[k] }}
        >
          {labels[k]} · {symbol(k)}
        </button>
      ))}
      <p>
        <small>Esc to step away. Wrong sequences cost points and wake the entity.</small>
      </p>
    </div>
  );
}
