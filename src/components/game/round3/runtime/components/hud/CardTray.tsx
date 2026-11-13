import { CARD_KEYS } from '../../config/controls';
import type { PowerCard } from '../../types';
import styles from '../canvas/Game.module.css';

const CARD_HINTS: Record<string, string> = {
  'chrono-freeze': 'Freeze active countdown timer for 10s',
  'witching-hour': 'Add +5s when partner is armed or countdown is urgent',
  'spectral-sight': 'Reveal hidden clues when searching rooms',
  'witchs-lens': 'Highlight important interactable in your room',
  'hexbreaker': 'Eliminate one wrong connection in active puzzle',
  'mechanics-curse': 'Auto-validate one stage of a multi-stage mechanism',
  'witchs-elixir': 'Passive shield: forgives next mistake penalty',
  'ravens-messenger': 'Show location of the next interactable target',
  'phantom-shield': 'Passive shield: absorbs next failed sync penalty',
  'soul-surge': 'Instantly complete a mechanism step',
  'wardens-decree': 'Order 2-minute tournament pause with ward sigils',
  'spectral-lens': 'Reveal the true entity for 9s',
  'echo-recorder': 'Replay latest clue via shared journal',
  'phantom-key': 'Unlock nearest locked door',
  'temporal-compass': 'Widen sync window for easier capture',
  'phantom-beacon': 'Mark true entity for 9s',
  'resonance-decoder': 'Reveal active anomaly for 9s',
  'temporal-shield': 'Absorb next penalty',
  'memory-seal': 'Absorb next penalty',
  'emergency-power-cell': 'Restore facility power',
  'soul-binding-sigil': 'Absorb next penalty',
};

interface CardTrayProps {
  cards: readonly PowerCard[];
  onUse: (slot: number) => void;
}

/** Bottom bar: both players' controls and the shared power cards. */
export default function CardTray({ cards, onUse }: CardTrayProps) {
  // Only display usable cards to keep the gameplay screen uncluttered
  const readyCards = cards
    .map((card, slot) => ({ card, slot }))
    .filter(({ card }) => card.uses > 0);

  return (
    <footer className={styles.bar} aria-label="Round 3 controls">
      <section className={`${styles.controlGroup} ${styles.pastControls}`} aria-label="Archivist controls">
        <b>ARCHIVIST <span>PAST</span></b>
        <div><kbd>W A S D</kbd> Move <i>·</i> <kbd>E</kbd> Examine <i>·</i> <kbd>Q</kbd> Journal <i>·</i> <kbd>1–4</kbd> Panels</div>
      </section>

      <section className={styles.powerGroup} aria-label="Team power cards">
        <span className={styles.powerLabel}>⚡ POWER CARDS:</span>
        <div className={styles.cards}>
          {readyCards.length === 0 ? (
            <span className={styles.noCards}>None</span>
          ) : (
            readyCards.map(({ card, slot }) => {
              const keyLabel = CARD_KEYS[slot] ? CARD_KEYS[slot].replace('Key', '') : null;
              const hintText = (card.cardId && CARD_HINTS[card.cardId]) || CARD_HINTS[card.effect] || card.desc;
              return (
                <button
                  key={`${slot}-${card.name}`}
                  type="button"
                  className={styles.cardReady}
                  title={`${card.name}: ${hintText} (Click or press [${keyLabel ?? 'slot'}])`}
                  onClick={() => onUse(slot)}
                >
                  {keyLabel && <kbd className={styles.cardKey}>{keyLabel}</kbd>}
                  <span className={styles.cardName}>{card.name}</span>
                </button>
              );
            })
          )}
        </div>
      </section>

      <section className={`${styles.controlGroup} ${styles.futureControls}`} aria-label="Tracker controls">
        <b>TRACKER <span>FUTURE</span></b>
        <div><kbd>← ↑ ↓ →</kbd> Move <i>·</i> <kbd>Enter</kbd> Examine <i>·</i> <kbd>P</kbd> Journal <i>·</i> <kbd>7–0</kbd> Panels</div>
      </section>
    </footer>
  );
}
