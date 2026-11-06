export interface AuctionCardData {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  /** Frame / glow colour — one dimmed orange for every card */
  color: string;
  /** Card title colour */
  titleColor: string;
  art: string;
}

export const AUCTION_CARDS: AuctionCardData[] = [
  {
    id: 'vampire-shield',
    name: 'Vampire Shield',
    description: 'Blocks one penalty in Round 3.',
    basePrice: 100,
    color: '#c4601a',
    titleColor: '#e3a45c',
    art: '/assets/round2/vampire.png',
  },
  {
    id: 'witch-hex',
    name: 'Witch Hex',
    description: 'Cause a rival squad in Round 3.',
    basePrice: 100,
    color: '#c4601a',
    titleColor: '#e3a45c',
    art: '/assets/round2/witch.png',
  },
  {
    id: 'ghost-pass',
    name: 'Ghost Pass',
    description: 'Skip one obstacle in Round 3.',
    basePrice: 150,
    color: '#c4601a',
    titleColor: '#e3a45c',
    art: '/assets/round2/ghost-pass.png',
  },
  {
    id: 'zombie-revive',
    name: 'Zombie Revive',
    description: 'Revive once after falling.',
    basePrice: 150,
    color: '#c4601a',
    titleColor: '#e3a45c',
    art: '/assets/round2/zombie.png',
  },
  {
    id: 'pumpkin-bomb',
    name: 'Pumpkin Bomb',
    description: 'Explosive advantage in Round 3.',
    basePrice: 200,
    color: '#c4601a',
    titleColor: '#e3a45c',
    art: '/assets/round2/pumpkin-bomb.png',
  },
  {
    id: 'reaper-strike',
    name: 'Reaper Strike',
    description: 'A decisive final-round strike.',
    basePrice: 200,
    color: '#c4601a',
    titleColor: '#e3a45c',
    art: '/assets/round2/reaper.png',
  },
];
