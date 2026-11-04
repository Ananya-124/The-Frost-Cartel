export type Round4IntroState =
  | 'INITIAL_REVEAL'
  | 'ENVIRONMENT_IDLE'
  | 'INTRO_VISIBLE'
  | 'DOVE_ENTERING'
  | 'DOVE_FLYING'
  | 'DOVE_APPROACHING'
  | 'LETTER_DROPPING'
  | 'LETTER_DROPPED'
  | 'DOVE_LANDING'
  | 'LETTER_AVAILABLE'
  | 'LETTER_OPENING'
  | 'LETTER_REVEALED'
  | 'LETTER_OPENED'
  | 'HUNT_REQUESTED'
  | 'OUTGOING_BLUR'
  | 'INCOMING_COLLEGE_REVEAL'
  | 'COLLEGE_REVEAL'
  | 'COLLEGE_READY'
  // Legacy aliases for backward-compatible test suites
  | 'PORTAL_IGNITION'
  | 'SCENE_CONTRACTING'
  | 'PARTICLES_FORMING'
  | 'WHITE_TUNNEL';

export interface Round4Floor {
  id: string;
  name: string;
  level: string;
  description: string;
  status: 'locked' | 'unlocked' | 'completed';
}
