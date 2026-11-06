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
    <div className={styles.bar}>
      <span>
        <kbd>WASD</kbd> move · <kbd>E</kbd> search · <kbd>Q</kbd> journal · <kbd>1-4</kbd> panels
      </span>
      <div className={styles.cards}>
        {cards.map((card, slot) => (
          <button
            key={`${slot}-${card.name}`}
            disabled={card.uses < 1}
            title={card.desc}
            onClick={() => onUse(slot)}
          >
            [{CARD_KEYS[slot]?.replace('Key', '') ?? slot + 1}] {card.name} ×{card.uses}
          </button>
        ))}
      </div>
      <span>
        <kbd>←↑↓→</kbd> move · <kbd>Enter</kbd> search / mark · <kbd>P</kbd> journal ·{' '}
        <kbd>7-0</kbd> panels
      </span>
    </div>
  );
}
