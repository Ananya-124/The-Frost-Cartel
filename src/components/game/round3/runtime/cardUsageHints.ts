import type { PowerCard } from './types';

export interface CardUsageAdvice {
  cardName: string;
  keyLabel: string | null;
  advice: string;
}

/**
 * Returns contextual advice for active power cards based on the current Hunt, Task, and state.
 */
export function getActiveCardAdvice(
  cards: readonly PowerCard[],
  huntNumber: number,
  currentTaskNumber: number,
  partnerArmed: boolean,
  activePuzzleKind?: string | null
): CardUsageAdvice[] {
  const readyCards = cards
    .map((card, slot) => ({ card, slot }))
    .filter(({ card }) => card.uses > 0);

  const adviceList: CardUsageAdvice[] = [];

  for (const { card, slot } of readyCards) {
    const key = ['Z', 'X', 'C', 'V', 'B', 'N', 'M'][slot] ?? null;
    const cid = card.cardId ?? card.effect;

    // 1. Witching Hour (+5s sync window)
    if (cid === 'witching-hour') {
      if (partnerArmed) {
        adviceList.push({
          cardName: card.name,
          keyLabel: key,
          advice: `Partner is armed! Use [${key ?? 'Key'}] now for +5s sync window.`,
        });
      } else if (huntNumber === 2 && currentTaskNumber >= 2) {
        adviceList.push({
          cardName: card.name,
          keyLabel: key,
          advice: `Timed sync upcoming! Save [${key ?? 'Key'}] for when partner arms.`,
        });
      }
    }

    // 2. Chrono Freeze (10s timer freeze)
    else if (cid === 'chrono-freeze') {
      adviceList.push({
        cardName: card.name,
        keyLabel: key,
        advice: `Press [${key ?? 'Key'}] to freeze the countdown clock for 10s anytime.`,
      });
    }

    // 3. Hexbreaker (eliminate wrong option / connection)
    else if (cid === 'hexbreaker') {
      if (activePuzzleKind) {
        adviceList.push({
          cardName: card.name,
          keyLabel: key,
          advice: `Active puzzle open! Press [${key ?? 'Key'}] to eliminate a wrong connection.`,
        });
      } else {
        adviceList.push({
          cardName: card.name,
          keyLabel: key,
          advice: `Available for circuit/timeline puzzles in Task ${currentTaskNumber}: press [${key ?? 'Key'}].`,
        });
      }
    }

    // 4. Mechanic's Curse / Soul Surge (auto validate / skip step)
    else if (cid === 'mechanics-curse' || cid === 'soul-surge') {
      adviceList.push({
        cardName: card.name,
        keyLabel: key,
        advice: `Press [${key ?? 'Key'}] to auto-complete or validate one mechanism stage.`,
      });
    }

    // 5. Spectral Sight / Witch's Lens / Spectral Lens (reveal clues/interactables)
    else if (cid === 'spectral-sight' || cid === 'witchs-lens' || cid === 'spectral-lens') {
      adviceList.push({
        cardName: card.name,
        keyLabel: key,
        advice: `Searching rooms? Press [${key ?? 'Key'}] to reveal hidden clues/interactables.`,
      });
    }

    // 6. Raven's Messenger (location of next target)
    else if (cid === 'ravens-messenger') {
      adviceList.push({
        cardName: card.name,
        keyLabel: key,
        advice: `Press [${key ?? 'Key'}] to show location of the next interactable target.`,
      });
    }

    // 7. Witch's Elixir / Phantom Shield / Temporal Shield (passive defense)
    else if (cid === 'witchs-elixir' || cid === 'phantom-shield' || cid === 'temporal-shield') {
      adviceList.push({
        cardName: card.name,
        keyLabel: key,
        advice: `Active shield: automatically absorbs your next mistake or penalty.`,
      });
    }

    // 8. General fallback for other cards
    else {
      adviceList.push({
        cardName: card.name,
        keyLabel: key,
        advice: `Ready to use: press [${key ?? 'Key'}] for ${card.name}.`,
      });
    }
  }

  return adviceList;
}
