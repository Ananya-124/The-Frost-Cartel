import { CARD_KEYS } from '../../config/controls';
import type { PowerCard } from '../../types';
import styles from '../canvas/Game.module.css';

interface CardTrayProps {
  cards: readonly PowerCard[];
  onUse: (slot: number) => void;
}

/** Bottom bar: both players' controls and the shared power cards. */
export default function CardTray({ cards, onUse }: CardTrayProps) {
  return (
    <footer className={styles.bar} aria-label="Round 3 controls">
      <section className={`${styles.controlGroup} ${styles.pastControls}`} aria-label="Archivist controls">
        <b>ARCHIVIST <span>PAST</span></b>
        <div><kbd>W A S D</kbd> Move <i>·</i> <kbd>E</kbd> Examine <i>·</i> <kbd>Q</kbd> Evidence <i>·</i> <kbd>1–4</kbd> Panels</div>
      </section>
      <section className={styles.powerGroup} aria-label="Team power cards">
        <b>TEAM POWER</b>
        <div className={styles.cards}>
          {cards.map((card, slot) => (
            <button
              key={`${slot}-${card.name}`}
              disabled={card.uses < 1}
              title={card.desc}
              onClick={() => onUse(slot)}
            >
              {CARD_KEYS[slot] ? `[${CARD_KEYS[slot].replace('Key', '')}] ` : ''}{card.name} · {card.uses > 0 ? 'READY' : 'USED'}
            </button>
          ))}
        </div>
      </section>
      <section className={`${styles.controlGroup} ${styles.futureControls}`} aria-label="Tracker controls">
        <b>TRACKER <span>FUTURE</span></b>
        <div><kbd>← ↑ ↓ →</kbd> Move <i>·</i> <kbd>Enter</kbd> Examine <i>·</i> <kbd>P</kbd> Evidence <i>·</i> <kbd>7–0</kbd> Panels</div>
      </section>
    </footer>
  );
}
