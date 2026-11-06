import type { RoundConfig, StageId } from '../types/round.types';
import { STAGE_CREDITS } from './credits.constants';

export const STAGE_NAMES: Record<StageId, string> = {
  'stage-1': 'Stage 1: The Crypt Chamber',
  'stage-2': 'Stage 2: The Mausoleum Decipher',
  'stage-3': 'Stage 3: The Arch-Lich Gate',
};

export const STAGE_CONFIGS: Array<{ id: StageId; name: string; credits: number; desc: string }> = [
  {
    id: 'stage-1',
    name: 'The Crypt Chamber',
    credits: STAGE_CREDITS['stage-1'],
    desc: 'Initial decipher puzzle focusing on crypt symbols and hidden tombstones.',
  },
  {
    id: 'stage-2',
    name: 'The Mausoleum Decipher',
    credits: STAGE_CREDITS['stage-2'],
    desc: 'Intermediate riddle involving sarcophagus alignments and spectral runic keys.',
  },
  {
    id: 'stage-3',
    name: 'The Arch-Lich Gate',
    credits: STAGE_CREDITS['stage-3'],
    desc: 'High-difficulty cemetery escape gate cipher. Final barrier of Round 1.',
  },
];

export const ROUNDS_DATA: RoundConfig[] = [
  {
    id: 'round-01',
    number: '01',
    title: 'THE GRAVEYARD ESCAPE',
    tagline: 'Crypt Exploration & Puzzle Deciphering',
    statusText: 'ROUND 01 ACTIVE • READY',
    statusBadge: 'active',
    duration: '20–25 Mins',
    bounty: 'Up to 500 Credits',
    teamFormat: '2 Players / Team',
    description: 'Explore cursed cemetery grounds, unearth ancient relics, and decipher cryptic puzzles before the midnight timer runs out.',
    imageSrc: '/assets/round1_graveyard.jpg',
    actionText: 'ENTER ROUND 01',
    isAccessible: true,
  },
  {
    id: 'round-02',
    number: '02',
    title: 'THE HAUNTED AUCTION',
    tagline: 'High-Stakes Credit Bidding War',
    statusText: 'ROUND 02 ACTIVE • READY',
    statusBadge: 'active',
    duration: '15 Mins',
    bounty: 'Market Advantages',
    teamFormat: '2 Players / Team',
    description: 'Use your earned credits to bid for special advantages. Outmaneuver rival squads to secure crucial advantages for the final trial.',
    imageSrc: '/assets/round2_auction.jpg',
    actionText: 'ENTER ROUND 02',
    isAccessible: true,
  },
  {
    id: 'round-03',
    number: '03',
    title: 'CLASSIFIED',
    tagline: 'The Final Catacomb Trial',
    statusText: 'COMING SOON • SEALED',
    statusBadge: 'locked',
    duration: 'Classified',
    bounty: 'Ultimate Trophy',
    teamFormat: '2 Players / Team',
    description: 'The final trial remains shrouded beyond the frozen iron seal. Details will be declassified once Round 2 concludes.',
    imageSrc: '/assets/round3_classified.jpg',
    actionText: 'CLASSIFIED PROTOCOL',
    isAccessible: false,
  },
  {
    id: 'round-04',
    number: '04',
    title: 'THE RADIANT TREASURE HUNT',
    tagline: 'FROM DARKNESS TO DISCOVERY.',
    statusText: 'ROUND 04 ACTIVE • READY',
    statusBadge: 'active',
    duration: '20–25 Mins',
    bounty: 'The Golden Relic',
    teamFormat: '2 Players / Team',
    description: 'Beyond the graveyard, follow the white messenger dove through the sunlit archway into the forgotten college treasure.',
    imageSrc: '/assets/round4_radiant.jpg',
    actionText: 'ENTER ROUND 04',
    isAccessible: true,
  },
];

