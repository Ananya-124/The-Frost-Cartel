export type Hunt1Actor = 'archivist' | 'tracker';
export type Hunt1Challenge = 1 | 2 | 3 | 4 | 5 | 6;
export type Hunt1TaskKey = 'lastVisitor' | 'missingReport' | 'powerFailure' | 'observationLog' | 'signalReconstruction' | 'incidentConclusion';
export type Hunt1EvidenceType = 'evidence' | 'observation' | 'deduction' | 'objective';

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

export interface MissingReportPuzzle {
  reconstructionVersion: number;
  archivistOrder: string[] | null;
  archivistValid: boolean;
  trackerOrder: string[] | null;
  trackerValid: boolean;
  confirmations: Partial<Record<Hunt1Actor, number>>;
}

export interface PowerFailurePuzzle {
  archivistConnections: string[] | null;
  archivistValid: boolean;
  trackerConnections: string[] | null;
  trackerValid: boolean;
}

export interface ObservationTimelinePuzzle {
  archivistTimeline: string[] | null;
  archivistValid: boolean;
  trackerTimeline: string[] | null;
  trackerValid: boolean;
  archivistSubmitted?: boolean;
  trackerSubmitted?: boolean;
  investigationsAgree?: boolean | null;
  investigationsVerified?: boolean;
}

export interface SignalReconstructionPuzzle {
  archivistRoute: string[] | null;
  archivistValid: boolean;
  trackerRoute: string[] | null;
  trackerValid: boolean;
}

export interface IncidentConclusionPuzzle {
  archivistInterpretation: string[] | null;
  archivistValid: boolean;
  trackerInterpretation: string[] | null;
  trackerValid: boolean;
}

export interface Hunt1State {
  modelVersion: number;
  teamId: string;
  currentChallenge: Hunt1Challenge;
  completed: boolean;
  score: number;
  penalties: number;
  subtasks: Record<string, boolean>;
  taskCompleted: Record<Hunt1TaskKey, boolean>;
  taskScores: Record<Hunt1TaskKey, number>;
  optionalScores: { researchNote: number; forgottenRecording: number };
  objectStates: Record<string, 'hidden' | 'available' | 'examined' | 'completed'>;
  availableInteractables: string[];
  evidence: Hunt1Evidence[];
  journal: Hunt1Evidence[];
  failedSubmissions: string[];
  hintUses: Record<string, number>;
  missingReport?: MissingReportPuzzle;
  powerFailure?: PowerFailurePuzzle;
  observationTimeline?: ObservationTimelinePuzzle;
  signalReconstruction?: SignalReconstructionPuzzle;
  incidentConclusion?: IncidentConclusionPuzzle;
  updatedAt: string;
}

export interface Hunt1ActionResult {
  success: boolean;
  message: string;
  state: Hunt1State;
  hint?: string;
}
