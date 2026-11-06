export type Hunt1Actor = 'archivist' | 'tracker';
export type Hunt1Challenge = 1 | 2 | 3 | 4 | 5 | 6;
export type Hunt1EvidenceType = 'evidence' | 'observation' | 'deduction' | 'objective';
export type Hunt1ScoreBreakdown = { evidence: number; deductions: number; circuit: number; configuration: number; shutdown: number; optional: number; penalties: number };

export interface Hunt1Evidence {
  id: string;
  title: string;
  location: string;
  discoveredBy: Hunt1Actor | 'team';
  type: Hunt1EvidenceType;
  content: string;
  inference: string;
  relatedObjective: string;
  verified: boolean;
  createdAt: string;
}

export interface Hunt1State {
  teamId: string;
  currentChallenge: Hunt1Challenge;
  completed: boolean;
  score: number;
  penalties: number;
  scoreBreakdownByPlayer: Record<Hunt1Actor, Hunt1ScoreBreakdown>;
  subtasks: Record<string, boolean>;
  objectStates: Record<string, 'hidden' | 'undiscovered' | 'locked' | 'available' | 'discovered' | 'collected' | 'unlocked' | 'activated' | 'completed'>;
  inventory: string[];
  components: string[];
  evidence: Hunt1Evidence[];
  journal: Hunt1Evidence[];
  frequency: number | null;
  circuitOrder: string[];
  resonanceMode: string | null;
  hintUses: Record<string, number>;
  scoreBreakdown: Hunt1ScoreBreakdown;
  syncDeadline: number | null;
  activatedBy: Partial<Record<Hunt1Actor, number>>;
  updatedAt: string;
}

export interface Hunt1ActionResult {
  success: boolean;
  message: string;
  state: Hunt1State;
  input?: 'riddle' | 'frequency' | 'circuit' | 'configuration';
  hint?: string;
}
