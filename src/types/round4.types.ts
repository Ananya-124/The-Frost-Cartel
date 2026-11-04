export type Round4IntroState =
  | 'ENVIRONMENT_IDLE'
  | 'DOVE_ENTERING'
  | 'DOVE_FLYING'
  | 'LETTER_DROPPING'
  | 'DOVE_LANDING'
  | 'LETTER_AVAILABLE'
  | 'LETTER_OPENING'
  | 'LETTER_REVEALED'
  | 'PORTAL_IGNITION'
  | 'SCENE_CONTRACTING'
  | 'PARTICLES_FORMING'
  | 'WHITE_TUNNEL'
  | 'COLLEGE_REVEAL';

export interface Round4Floor {
  id: string;
  name: string;
  level: string;
  description: string;
  status: 'locked' | 'unlocked' | 'completed';
}
