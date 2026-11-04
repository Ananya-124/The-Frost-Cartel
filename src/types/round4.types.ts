export type Round4IntroState =
  | 'ENVIRONMENT_LOADING'
  | 'DOVE_ARRIVING'
  | 'LETTER_DROPPED'
  | 'LETTER_OPENING'
  | 'LETTER_REVEALED'
  | 'PORTAL_IGNITION'
  | 'SCREEN_CONTRACTION'
  | 'PARTICLE_FRAGMENTATION'
  | 'WHITE_PORTAL'
  | 'TUNNEL_TRAVEL'
  | 'COLLEGE_REVEAL';

export interface Round4Floor {
  id: string;
  name: string;
  level: string;
  description: string;
  status: 'locked' | 'unlocked' | 'completed';
}
