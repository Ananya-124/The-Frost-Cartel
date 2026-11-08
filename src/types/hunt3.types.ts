export type Hunt3Actor = 'archivist' | 'tracker';
export type Hunt3Evidence = {
  id: string; stage: 1 | 2 | 3 | 4; actor: Hunt3Actor | 'team'; title: string; location: string;
  content: string; relatedObjective: string; verified: boolean; createdAt?: string;
};
export type Hunt3State = {
  teamId: string; stage: 1 | 2 | 3 | 4; completed: boolean; score: number; scoreBreakdown: { stage1: number; stage2: number; stage3: number; stage4: number; optional: number };
  journal: Hunt3Evidence[];
  evidence: Record<Hunt3Actor, string[]>; trail: { archivist: string | null; tracker: string | null; resolved: boolean };
  seals: Record<'power' | 'resonance' | 'memory', { archive: boolean; physical: string[]; disabled: boolean }>;
  components: string[]; apparatus: { archive: string[] | null; physical: string[] | null; configured: boolean };
  weakness: { archive: boolean; trials: string[]; discovered: boolean; lure: number; weakened: number };
  boss: { step: number; warning: string | null; stability: number; captured: boolean; lastActionAt: number | null; deadlineAt: number | null };
  optional: { archivist: boolean; tracker: boolean; complete: boolean };
  actions: string[]; penalties: number; updatedAt: string;
};
export type Hunt3ActionResult = { success: boolean; message: string; state: Hunt3State };
