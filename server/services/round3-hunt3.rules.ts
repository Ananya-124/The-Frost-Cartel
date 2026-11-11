import type { Hunt3ActionResult, Hunt3Actor, Hunt3Evidence, Hunt3State } from '../../src/types/hunt3.types.ts';

export const HUNT3_MODEL_VERSION = 1;
export const STAGE_POINTS = [250, 400, 350, 500] as const;
export const SEALS = ['power', 'resonance', 'memory'] as const;
export const COMPONENTS = ['induction-coil', 'prism-lens', 'grounding-braid', 'memory-core'] as const;

export const SEAL_SOLUTIONS: Record<(typeof SEALS)[number], string[]> = {
  power: ['source', 'ground', 'return'],
  resonance: ['low-tone', 'phase-two', 'silence'],
  memory: ['arrival', 'warning', 'anchor'],
};

export const SEAL_EVIDENCE: Record<(typeof SEALS)[number], string> = {
  power: 'The archive sketch marks a feed, a ground bond, and a return path. Use the terminal labels on the Future relay to work out their order.',
  resonance: 'The old notes describe a low-frequency condition, a phase alignment, and a silenced carrier. The order is damaged; compare the notes with the Future controls.',
  memory: 'Three event names survive in the Past protocol, but the cadence marks are incomplete. Compare them with the Future mechanism before submitting.',
};

export const HUNT3_EVIDENCE_LOCATIONS: Record<string, { title: string; location: string }> = {
  'sighting-ledger': { title: 'Entity sighting ledger', location: 'Archive · Past' },
  'containment-observation': { title: 'Containment observation', location: 'Observation room · Past' },
  'old-facility-report': { title: 'Facility incident report', location: 'Director’s office · Past' },
  'cold-ash': { title: 'Cold ash pattern', location: 'Main hall · Future' },
  'drag-marks': { title: 'Drag marks at the threshold', location: 'Main hall · Future' },
  'shattered-compass': { title: 'Shattered compass', location: 'Main hall · Future' },
  'power-diagram': { title: 'Power seal diagram', location: 'Archive · Past' },
  'power-mechanism': { title: 'Power relay', location: 'Generator room · Future' },
  'resonance-diagram': { title: 'Resonance seal notes', location: 'Communications room · Past' },
  'resonance-mechanism': { title: 'Resonator controls', location: 'Communications room · Future' },
  'memory-diagram': { title: 'Memory seal protocol', location: 'Observation room · Past' },
  'memory-mechanism': { title: 'Memory seal mechanism', location: 'Observation room · Future' },
  'component-catalog': { title: 'Containment component catalogue', location: 'Archive · Past' },
  'recover-induction-coil': { title: 'Induction coil recovered', location: 'Generator room · Future' },
  'recover-prism-lens': { title: 'Prism lens recovered', location: 'Examination room · Future' },
  'recover-grounding-braid': { title: 'Grounding braid recovered', location: 'Communications room · Future' },
  'recover-memory-core': { title: 'Memory core recovered', location: 'Observation room · Future' },
  'recover-shattered-glass': { title: 'Shattered glass decoy', location: 'Main hall · Future' },
  'recover-scorched-lattice': { title: 'Scorched lattice decoy', location: 'Main hall · Future' },
  'apparatus-blueprint': { title: 'Containment apparatus blueprint', location: 'Containment room · Past' },
  'physical-apparatus': { title: 'Reconstruction apparatus', location: 'Containment room · Future' },
  'weakness-notes': { title: 'Historical reaction notes', location: 'Experiment room · Past' },
  'test-station': { title: 'Controlled test station', location: 'Experiment room · Future' },
  'secret-inscription': { title: 'Concealed containment inscription', location: 'Director’s office · Past' },
  'secret-residue': { title: 'Impossible containment shadow', location: 'Main hall · Future' },
};

export const HUNT3_STAGE_TITLES = ['The Entity’s Trail', 'Break the Three Seals', 'The Bait Protocol', 'Final Containment'] as const;
export const APPARATUS = ['coil:west', 'lens:center', 'braid:ground', 'core:east'];

export const BOSS_SEQUENCE: Array<{ actor: Hunt3Actor; control: string; warning: string }> = [
  { actor: 'archivist', control: 'hold-record', warning: 'The archive pulse is surging. Brace the Past sequence.' },
  { actor: 'tracker', control: 'ground-current', warning: 'Current is arcing across the floor. Ground the chamber.' },
  { actor: 'archivist', control: 'release-memory', warning: 'The entity is rewriting the record. Release the verified memory.' },
  { actor: 'tracker', control: 'vent-pressure', warning: 'Containment pressure is rising. Vent before the next pulse.' },
  { actor: 'archivist', control: 'lock-sequence', warning: 'The entity is destabilizing the lock. Maintain the final sequence.' },
  { actor: 'tracker', control: 'close-containment', warning: 'The chamber is open for a moment. Close containment now.' },
];

const now = () => new Date().toISOString();

export function createFreshRound3Hunt3State(teamId: string): Hunt3State {
  return {
    teamId,
    stage: 1,
    completed: false,
    score: 0,
    scoreBreakdown: { stage1: 0, stage2: 0, stage3: 0, stage4: 0, optional: 0 },
    journal: [],
    evidence: { archivist: [], tracker: [] },
    trail: { archivist: null, tracker: null, resolved: false },
    seals: {
      power: { archive: false, physical: [], disabled: false },
      resonance: { archive: false, physical: [], disabled: false },
      memory: { archive: false, physical: [], disabled: false },
    },
    components: [],
    apparatus: { archive: null, physical: null, configured: false },
    weakness: { archive: false, trials: [], discovered: false, lure: 0, weakened: 0 },
    boss: { step: 0, warning: BOSS_SEQUENCE[0].warning, stability: 0, captured: false, lastActionAt: null, deadlineAt: null },
    optional: { archivist: false, tracker: false, complete: false },
    actions: [],
    penalties: 0,
    updatedAt: now(),
  };
}

export function normalizeRound3Hunt3State(source: unknown, teamId: string): Hunt3State | null {
  if (!source || typeof source !== 'object' || Array.isArray(source)) return null;
  const raw = source as Partial<Hunt3State>;
  if (raw.teamId && raw.teamId !== teamId) return null;

  const stage = raw.stage && [1, 2, 3, 4].includes(raw.stage) ? raw.stage : 1;
  const completed = raw.completed === true;
  const score = typeof raw.score === 'number' && Number.isFinite(raw.score) ? Math.max(0, raw.score) : 0;
  const penalties = typeof raw.penalties === 'number' && Number.isFinite(raw.penalties) ? Math.max(0, raw.penalties) : 0;

  const scoreBreakdown = {
    stage1: typeof raw.scoreBreakdown?.stage1 === 'number' ? raw.scoreBreakdown.stage1 : 0,
    stage2: typeof raw.scoreBreakdown?.stage2 === 'number' ? raw.scoreBreakdown.stage2 : 0,
    stage3: typeof raw.scoreBreakdown?.stage3 === 'number' ? raw.scoreBreakdown.stage3 : 0,
    stage4: typeof raw.scoreBreakdown?.stage4 === 'number' ? raw.scoreBreakdown.stage4 : 0,
    optional: typeof raw.scoreBreakdown?.optional === 'number' ? raw.scoreBreakdown.optional : 0,
  };

  const journal = Array.isArray(raw.journal) ? raw.journal as Hunt3Evidence[] : [];
  const evidence = {
    archivist: Array.isArray(raw.evidence?.archivist) ? raw.evidence!.archivist : [],
    tracker: Array.isArray(raw.evidence?.tracker) ? raw.evidence!.tracker : [],
  };

  const trail = {
    archivist: typeof raw.trail?.archivist === 'string' ? raw.trail.archivist : null,
    tracker: typeof raw.trail?.tracker === 'string' ? raw.trail.tracker : null,
    resolved: raw.trail?.resolved === true,
  };

  const seals = {
    power: {
      archive: raw.seals?.power?.archive === true,
      physical: Array.isArray(raw.seals?.power?.physical) ? raw.seals.power.physical : [],
      disabled: raw.seals?.power?.disabled === true,
    },
    resonance: {
      archive: raw.seals?.resonance?.archive === true,
      physical: Array.isArray(raw.seals?.resonance?.physical) ? raw.seals.resonance.physical : [],
      disabled: raw.seals?.resonance?.disabled === true,
    },
    memory: {
      archive: raw.seals?.memory?.archive === true,
      physical: Array.isArray(raw.seals?.memory?.physical) ? raw.seals.memory.physical : [],
      disabled: raw.seals?.memory?.disabled === true,
    },
  };

  const components = Array.isArray(raw.components) ? raw.components : [];
  const apparatus = {
    archive: Array.isArray(raw.apparatus?.archive) ? raw.apparatus.archive : null,
    physical: Array.isArray(raw.apparatus?.physical) ? raw.apparatus.physical : null,
    configured: raw.apparatus?.configured === true,
  };

  const weakness = {
    archive: raw.weakness?.archive === true,
    trials: Array.isArray(raw.weakness?.trials) ? raw.weakness.trials : [],
    discovered: raw.weakness?.discovered === true,
    lure: typeof raw.weakness?.lure === 'number' ? raw.weakness.lure : 0,
    weakened: typeof raw.weakness?.weakened === 'number' ? raw.weakness.weakened : 0,
  };

  const boss = {
    step: typeof raw.boss?.step === 'number' ? raw.boss.step : 0,
    warning: typeof raw.boss?.warning === 'string' ? raw.boss.warning : BOSS_SEQUENCE[0].warning,
    stability: typeof raw.boss?.stability === 'number' ? raw.boss.stability : 0,
    captured: raw.boss?.captured === true,
    lastActionAt: typeof raw.boss?.lastActionAt === 'number' ? raw.boss.lastActionAt : null,
    deadlineAt: typeof raw.boss?.deadlineAt === 'number' ? raw.boss.deadlineAt : null,
  };

  const optional = {
    archivist: raw.optional?.archivist === true,
    tracker: raw.optional?.tracker === true,
    complete: raw.optional?.complete === true,
  };

  const actions = Array.isArray(raw.actions) ? raw.actions : [];
  const updatedAt = typeof raw.updatedAt === 'string' ? raw.updatedAt : now();

  return {
    teamId,
    stage,
    completed,
    score,
    scoreBreakdown,
    journal,
    evidence,
    trail,
    seals,
    components,
    apparatus,
    weakness,
    boss,
    optional,
    actions,
    penalties,
    updatedAt,
  };
}

export function round3Hunt3StateForActor(state: Hunt3State, actor: Hunt3Actor, sharedView = true): Hunt3State {
  if (sharedView) return structuredClone(state);
  const visible = structuredClone(state);
  visible.evidence = {
    archivist: actor === 'archivist' ? [...state.evidence.archivist] : [],
    tracker: actor === 'tracker' ? [...state.evidence.tracker] : [],
  };
  visible.actions = state.actions.filter((id) => {
    const privateToArchivist = [
      'sighting-ledger', 'containment-observation', 'old-facility-report',
      'power-diagram', 'resonance-diagram', 'memory-diagram',
      'component-catalog', 'apparatus-blueprint', 'weakness-notes', 'secret-inscription',
    ];
    const privateToTracker = [
      'cold-ash', 'drag-marks', 'shattered-compass',
      'power-mechanism', 'resonance-mechanism', 'memory-mechanism',
      'test-station', 'secret-residue',
    ];
    return actor === 'archivist' ? !privateToTracker.includes(id) : !privateToArchivist.includes(id);
  });
  if (!state.trail.resolved) visible.trail = { ...state.trail, [actor === 'archivist' ? 'tracker' : 'archivist']: null };
  if (!state.apparatus.configured) visible.apparatus = { ...state.apparatus, [actor === 'archivist' ? 'physical' : 'archive']: (actor === 'archivist' ? state.apparatus.physical : state.apparatus.archive) ? ['verified'] : null };
  if (!state.weakness.discovered) visible.weakness = { ...state.weakness, archive: actor === 'archivist' && state.weakness.archive, trials: [...state.weakness.trials] };
  return visible;
}

function award(state: Hunt3State, stage: 1 | 2 | 3 | 4): number {
  const key = `stage${stage}` as keyof Hunt3State['scoreBreakdown'];
  if (state.scoreBreakdown[key] === 0) {
    state.scoreBreakdown[key] = STAGE_POINTS[stage - 1];
    state.score += STAGE_POINTS[stage - 1];
    return STAGE_POINTS[stage - 1];
  }
  return 0;
}

function completeStage(state: Hunt3State, stage: 1 | 2 | 3 | 4): number {
  const delta = award(state, stage);
  if (stage < 4) {
    state.stage = (stage + 1) as Hunt3State['stage'];
    if (stage === 3) state.boss.deadlineAt = Date.now() + 12_000;
  } else {
    state.completed = true;
    state.boss.captured = true;
  }
  return delta;
}

function recordEvidence(state: Hunt3State, actor: Hunt3Actor | 'team', id: string, stage: Hunt3State['stage'], content: string, verified = false): void {
  if (state.journal.some((entry) => entry.id === id)) return;
  const location = HUNT3_EVIDENCE_LOCATIONS[id];
  state.journal.push({
    id,
    stage,
    actor,
    title: location?.title ?? id,
    location: location?.location ?? 'Shared investigation',
    content,
    relatedObjective: HUNT3_STAGE_TITLES[stage - 1],
    verified,
    createdAt: now(),
  });
}

export function applyRound3Hunt3ActionToState(
  sourceState: Hunt3State,
  actor: Hunt3Actor,
  input: unknown,
): { result: Hunt3ActionResult; scoreDelta: number } | null {
  if (!sourceState || !input || typeof input !== 'object' || Array.isArray(input)) return null;
  const state = structuredClone(sourceState);
  const data = input as Record<string, unknown>;

  if (state.completed) {
    return {
      result: { success: false, message: 'The entity is contained. Hunt III is complete.', state },
      scoreDelta: 0,
    };
  }

  if (typeof data.type !== 'string' || typeof data.id !== 'string') return null;
  const type = data.type;
  const id = data.id;
  const actionStage = state.stage;
  const value = data.value && typeof data.value === 'object' && !Array.isArray(data.value) ? data.value as Record<string, unknown> : {};
  const strings = (v: unknown): string[] | null => Array.isArray(v) && v.length <= 20 && v.every((x) => typeof x === 'string') ? v as string[] : null;

  let message = '';
  let success = true;
  let totalScoreDelta = 0;

  const fail = (msg: string, penalty = 20): { result: Hunt3ActionResult; scoreDelta: number } => {
    state.penalties += penalty;
    const oldScore = state.score;
    state.score = Math.max(0, state.score - penalty);
    state.updatedAt = now();
    return {
      result: { success: false, message: msg, state },
      scoreDelta: state.score - oldScore,
    };
  };

  if (type === 'interact') {
    const archivistOnly = [
      'sighting-ledger', 'containment-observation', 'old-facility-report',
      'power-diagram', 'resonance-diagram', 'memory-diagram',
      'component-catalog', 'apparatus-blueprint', 'weakness-notes',
      'lure-control', 'secret-inscription', 'release-memory', 'hold-record', 'lock-sequence',
    ];
    const trackerOnly = [
      'cold-ash', 'drag-marks', 'shattered-compass',
      'power-mechanism', 'resonance-mechanism', 'memory-mechanism',
      'test-station', 'disruptor', 'secret-residue', 'ground-current',
      'vent-pressure', 'close-containment', 'physical-apparatus',
      'recover-induction-coil', 'recover-prism-lens', 'recover-grounding-braid',
      'recover-memory-core', 'recover-shattered-glass', 'recover-scorched-lattice',
    ];

    if ((archivistOnly.includes(id) && actor !== 'archivist') || (trackerOnly.includes(id) && actor !== 'tracker')) {
      return {
        result: { success: false, message: 'That control belongs to the other investigator’s timeline.', state },
        scoreDelta: 0,
      };
    }

    if (state.actions.includes(id) && id !== 'disruptor' && !(state.stage === 4 && BOSS_SEQUENCE.some((entry) => entry.control === id))) {
      return {
        result: { success: true, message: 'That clue or control has already been recorded.', state },
        scoreDelta: 0,
      };
    }

    if (state.stage === 1) {
      const archive = ['sighting-ledger', 'containment-observation', 'old-facility-report'];
      const field = actor === 'archivist' ? archive : ['cold-ash', 'drag-marks', 'shattered-compass'];
      if (!field.includes(id)) {
        return {
          result: { success: false, message: 'That evidence is not available in this stage or timeline.', state },
          scoreDelta: 0,
        };
      }
      state.evidence[actor].push(id);
      state.actions.push(id);
      message = actor === 'archivist'
        ? ({
            'sighting-ledger': '02:13 — the final sighting places movement in the eastern wing, but the room number is missing.',
            'containment-observation': 'The entity approached only during a dark interval when the resonance field fell below its marked threshold.',
            'old-facility-report': 'A low-frequency hum attracted it toward one of the eastern observation spaces; the report map is incomplete.',
          } as Record<string, string>)[id]
        : ({
            'cold-ash': 'Ash temperature falls in a repeating star-shaped pattern; it does not identify a room by itself.',
            'drag-marks': 'The marks lead toward a sealed inner threshold, then stop. The trail has not crossed back.',
            'shattered-compass': 'The needle swings south only during the dark interval recorded in the old notes.',
          } as Record<string, string>)[id];
    } else if (state.stage === 2) {
      if (actor === 'archivist' && SEALS.some((seal) => `${seal}-diagram` === id)) {
        const seal = id.replace('-diagram', '') as typeof SEALS[number];
        state.evidence.archivist.push(id);
        state.actions.push(id);
        message = SEAL_EVIDENCE[seal];
      } else if (actor === 'tracker' && SEALS.some((seal) => `${seal}-mechanism` === id)) {
        const seal = id.replace('-mechanism', '') as typeof SEALS[number];
        state.seals[seal].physical = ['mechanism-inspected'];
        state.evidence.tracker.push(id);
        state.actions.push(id);
        message = ({
          power: 'The power relay has three live terminals: source, ground, return.',
          resonance: 'The resonator has a low-tone dial, a two-step phase wheel and a carrier mute.',
          memory: 'The memory seal responds to three physical beats: arrival, warning, anchor.',
        } as Record<string, string>)[seal];
      } else if (actor === 'archivist' && ['component-catalog', 'apparatus-blueprint'].includes(id)) {
        state.evidence.archivist.push(id);
        state.actions.push(id);
        message = id === 'component-catalog'
          ? 'Catalogue confirms the induction coil, prism lens, grounding braid and memory core. Shattered glass and a scorched lattice are unusable decoys.'
          : 'Containment placement blueprint recovered.';
      } else if (actor === 'tracker' && ['recover-shattered-glass', 'recover-scorched-lattice'].includes(id)) {
        state.actions.push(id);
        state.evidence.tracker.push(id);
        message = id === 'recover-shattered-glass'
          ? 'The glass is fractured beyond use. It is a decoy, not a containment component.'
          : 'The lattice is heat-warped and cannot hold a seal. It is a decoy, not a containment component.';
      } else if (actor === 'tracker' && id.startsWith('recover-')) {
        const component = id.slice(8);
        if (!(COMPONENTS as readonly string[]).includes(component)) {
          return {
            result: { success: false, message: 'That part is too damaged or unrelated to the containment rig.', state },
            scoreDelta: 0,
          };
        }
        if (!state.evidence.archivist.includes('component-catalog')) {
          return {
            result: { success: false, message: 'The Archivist must identify the usable part in the equipment catalogue first.', state },
            scoreDelta: 0,
          };
        }
        if (!state.components.includes(component)) state.components.push(component);
        state.actions.push(id);
        state.evidence.tracker.push(id);
        message = `Recovered ${component.replace('-', ' ')}. ${state.components.length}/4 verified components secured.`;
      } else {
        return {
          result: { success: false, message: 'That seal or component interaction is unavailable.', state },
          scoreDelta: 0,
        };
      }
    } else if (state.stage === 3) {
      if (id === 'apparatus-blueprint' && actor === 'archivist') {
        state.evidence.archivist.push(id);
        message = 'The faded diagram marks a western branch, a centered optical path, a grounded lower socket, and an eastern return. Match those locations to the recovered component labels.';
      } else if (id === 'physical-apparatus' && actor === 'tracker') {
        message = 'The Future apparatus sockets are exposed. Place each recovered component independently.';
      } else if (id === 'weakness-notes' && actor === 'archivist') {
        state.weakness.archive = true;
        state.evidence.archivist.push(id);
        message = 'Historical reaction notes compared. A specific environmental response stands out, but it needs a live test.';
      } else if (id === 'test-station' && actor === 'tracker') {
        message = 'The controlled test station is ready. Change one condition per trial and observe the entity.';
      } else if (id === 'lure-control' && actor === 'archivist') {
        if (!state.apparatus.configured || !state.weakness.discovered) {
          return {
            result: { success: false, message: 'Configure the apparatus and verify the weakness before activating the lure.', state },
            scoreDelta: 0,
          };
        }
        state.weakness.lure = Math.min(1, state.weakness.lure + 1);
        message = 'Lure tone engaged. The entity is moving toward the chamber.';
      } else if (id === 'disruptor' && actor === 'tracker') {
        if (state.weakness.lure < 1 || !state.weakness.discovered) {
          return {
            result: { success: false, message: 'The entity is not in the lure field yet.', state },
            scoreDelta: 0,
          };
        }
        state.weakness.weakened = Math.min(3, state.weakness.weakened + 1);
        message = `Weakness pulse applied. Entity stability ${state.weakness.weakened}/3.`;
      } else if ((id === 'secret-inscription' && actor === 'archivist') || (id === 'secret-residue' && actor === 'tracker')) {
        state.optional[actor] = true;
        message = actor === 'archivist'
          ? 'A concealed inscription aligns with the old containment record. Search the Future for its matching trace.'
          : 'This impossible shadow matches a hidden inscription. The Archivist may know its historical placement.';
        if (state.optional.archivist && state.optional.tracker && !state.optional.complete) {
          state.optional.complete = true;
          state.scoreBreakdown.optional = 100;
          state.score += 100;
          totalScoreDelta += 100;
          message = 'The paired hidden traces form a complete containment record. 100 bonus points awarded.';
        }
      } else {
        return {
          result: { success: false, message: 'That apparatus control is not available.', state },
          scoreDelta: 0,
        };
      }
      state.actions.push(id);
    } else if ((id === 'secret-inscription' && actor === 'archivist') || (id === 'secret-residue' && actor === 'tracker')) {
      state.optional[actor] = true;
      state.actions.push(id);
      message = actor === 'archivist'
        ? 'A concealed inscription aligns with the old containment record. Search the Future for its matching trace.'
        : 'This impossible shadow matches a hidden inscription. The Archivist may know its historical placement.';
      if (state.optional.archivist && state.optional.tracker && !state.optional.complete) {
        state.optional.complete = true;
        state.scoreBreakdown.optional = 100;
        state.score += 100;
        totalScoreDelta += 100;
        message = 'The paired hidden traces form a complete containment record. 100 bonus points awarded.';
      }
    } else if (state.stage === 4) {
      const expected = BOSS_SEQUENCE[state.boss.step];
      if (!expected) {
        return {
          result: { success: false, message: 'The containment sequence is awaiting final capture.', state },
          scoreDelta: 0,
        };
      }
      const ts = Date.now();
      if (state.boss.deadlineAt !== null && ts > state.boss.deadlineAt) {
        state.boss.stability = Math.max(0, state.boss.stability - 1);
        state.boss.step = Math.max(0, state.boss.step - 1);
        state.boss.deadlineAt = ts + 12_000;
        state.boss.warning = BOSS_SEQUENCE[state.boss.step].warning;
        state.boss.lastActionAt = ts;
        state.updatedAt = now();
        return {
          result: {
            success: false,
            message: 'The warning window closed and the entity destabilized the chamber. Respond to the new warning; completed stages remain secured.',
            state,
          },
          scoreDelta: 0,
        };
      }
      if (state.boss.lastActionAt !== null && ts - state.boss.lastActionAt < 700) {
        return {
          result: { success: false, message: 'The controls are cycling. Wait for the next warning.', state },
          scoreDelta: 0,
        };
      }
      if (actor !== expected.actor || id !== expected.control) {
        state.boss.stability = Math.max(0, state.boss.stability - 1);
        state.boss.step = Math.max(0, state.boss.step - 1);
        state.boss.warning = BOSS_SEQUENCE[state.boss.step].warning;
        state.boss.lastActionAt = ts;
        message = `The entity disrupts the sequence. Stability ${state.boss.stability}/6. Recover at the next warning.`;
        success = false;
      } else {
        state.boss.step += 1;
        state.boss.stability = Math.min(6, state.boss.stability + 1);
        state.boss.lastActionAt = ts;
        state.boss.deadlineAt = ts + 12_000;
        state.boss.warning = BOSS_SEQUENCE[state.boss.step]?.warning ?? 'Containment is closing. Tracker, lock the chamber.';
        if (state.boss.step === BOSS_SEQUENCE.length) {
          totalScoreDelta += completeStage(state, 4);
          message = 'The chamber seals around the entity. Containment is stable.';
        } else {
          message = `Control accepted. Stability ${state.boss.stability}/6. ${state.boss.warning}`;
        }
      }
      state.updatedAt = now();
      return {
        result: { success, message, state },
        scoreDelta: totalScoreDelta,
      };
    } else {
      return {
        result: { success: false, message: 'That interaction is not available here.', state },
        scoreDelta: 0,
      };
    }
  } else if (type === 'submit') {
    if (state.stage === 1 && id === 'trail-location') {
      const location = typeof value.location === 'string' ? value.location : '';
      if (actor === 'archivist') {
        if (state.evidence.archivist.length < 3) {
          return {
            result: { success: false, message: 'Examine all three historical records first.', state },
            scoreDelta: 0,
          };
        }
        if (location !== 'east-wing') {
          return fail('The dated movement record contradicts that wing. Reconcile the final entry with the facility map.');
        }
        state.trail.archivist = location;
        message = 'Historical wing interpretation recorded privately. The surviving report does not identify the room.';
      } else {
        if (state.evidence.tracker.length < 3) {
          return {
            result: { success: false, message: 'Collect all three physical traces first.', state },
            scoreDelta: 0,
          };
        }
        if (location !== 'cold-star') {
          return fail('The physical pattern does not match that trace signature. Compare the ash, threshold marks and compass response.');
        }
        state.trail.tracker = location;
        message = 'Physical trail signature recorded privately. The markings need historical map context.';
      }
      if (state.trail.archivist === 'east-wing' && state.trail.tracker === 'cold-star') {
        state.trail.resolved = true;
        state.evidence.archivist.push('trail-resolution');
        state.evidence.tracker.push('trail-resolution');
        totalScoreDelta += completeStage(state, 1);
        message = 'The eastern-wing report matches the cold-star trace at the Observation Room. The entity manifests there. Stage 2 unlocked.';
      }
    } else if (state.stage === 2 && id.startsWith('seal-')) {
      const archiveSubmission = id.endsWith('-archive');
      const seal = id.slice(5, archiveSubmission ? -8 : undefined) as typeof SEALS[number];
      if (!(SEALS as readonly string[]).includes(seal)) return null;
      const sequence = strings(value.sequence);
      if (!sequence || sequence.length !== 3) return null;
      const record = state.seals[seal];
      if (archiveSubmission) {
        if (actor !== 'archivist') {
          return {
            result: { success: false, message: 'The Archivist interprets the Past seal diagram.', state },
            scoreDelta: 0,
          };
        }
        if (!state.evidence.archivist.includes(`${seal}-diagram`)) {
          return {
            result: { success: false, message: 'Examine the Past diagram before submitting its interpretation.', state },
            scoreDelta: 0,
          };
        }
        if (JSON.stringify(sequence) !== JSON.stringify(SEAL_SOLUTIONS[seal])) {
          return fail(`The ${seal} diagram interpretation does not fit the historical evidence. Re-examine the annotations and compare them with the Future mechanism.`);
        }
        record.archive = true;
        message = `Past ${seal} interpretation verified. The Tracker can now configure its Future mechanism.`;
      } else {
        if (!record.archive || !record.physical.length) {
          return {
            result: { success: false, message: 'Both the historical diagram interpretation and physical mechanism inspection are required.', state },
            scoreDelta: 0,
          };
        }
        if (actor !== 'tracker') {
          return {
            result: { success: false, message: 'The Tracker operates the Future-side seal mechanism.', state },
            scoreDelta: 0,
          };
        }
        const correct = JSON.stringify(sequence) === JSON.stringify(SEAL_SOLUTIONS[seal]);
        if (!correct) {
          return fail(`The ${seal} seal rejects that configuration. Its verified state remains intact.`);
        }
        record.disabled = true;
        message = `${seal} seal disabled. ${SEALS.filter((s) => state.seals[s].disabled).length}/3 seals are stable.`;
      }
    } else if (state.stage === 3 && id === 'apparatus') {
      const sequence = strings(value.sequence);
      if (!sequence) return null;
      if (actor === 'archivist') {
        if (!state.evidence.archivist.includes('apparatus-blueprint')) {
          return {
            result: { success: false, message: 'Inspect the original apparatus blueprint first.', state },
            scoreDelta: 0,
          };
        }
        if (JSON.stringify(sequence) !== JSON.stringify(APPARATUS)) {
          return fail('Blueprint interpretation is inconsistent. Recheck component orientation and grounding.');
        }
        state.apparatus.archive = APPARATUS;
        message = 'Historical apparatus layout verified. Tracker can now configure the physical rig.';
      } else {
        if (!state.apparatus.archive || state.components.length !== COMPONENTS.length || !state.actions.includes('physical-apparatus')) {
          return {
            result: { success: false, message: 'Examine the Future apparatus after the blueprint is verified and all four parts are recovered.', state },
            scoreDelta: 0,
          };
        }
        if (JSON.stringify(sequence) !== JSON.stringify(APPARATUS)) {
          return fail('The apparatus rejects that placement. Completed placements remain available for retry.');
        }
        state.apparatus.physical = APPARATUS;
        state.apparatus.configured = true;
        message = 'Physical rig matches the Past blueprint. Run the weakness investigation.';
      }
    } else if (state.stage === 3 && id === 'weakness-trial' && actor === 'tracker') {
      const condition = typeof value.condition === 'string' ? value.condition : '';
      const reading = typeof value.reading === 'string' ? value.reading : '';
      if (!['frequency-low', 'light-dark', 'temperature-cold'].includes(condition) || !['withdrawal', 'surge'].includes(reading)) return null;
      if (!state.actions.includes('test-station')) {
        return {
          result: { success: false, message: 'Examine the physical test station before running a controlled trial.', state },
          scoreDelta: 0,
        };
      }
      if (!state.apparatus.configured) {
        return {
          result: { success: false, message: 'The reconstructed apparatus must be configured before running controlled trials.', state },
          scoreDelta: 0,
        };
      }
      const correct = (condition === 'frequency-low' || condition === 'temperature-cold') ? reading === 'withdrawal' : reading === 'surge';
      const trial = `${condition}:${reading}`;
      if (!state.weakness.trials.includes(trial)) state.weakness.trials.push(trial);
      recordEvidence(state, actor, `weakness-trial-${condition}-${reading}`, actionStage, `Controlled trial: ${condition.replace('-', ' ')} produced ${reading}. Compare this result with the Archivist’s historical notes.`);
      if (!correct) {
        return fail('The field surges. That condition does not disrupt the entity; wait for it to stabilize and test another condition.', 10);
      }
      message = 'The entity withdraws from the field. Record the observed response and compare the historical notes.';
    } else if (state.stage === 3 && id === 'weakness-conclusion') {
      const profile = strings(value.profile);
      if (!profile || profile.length !== 3) return null;
      const answer = ['frequency-low', 'light-dark', 'temperature-cold'];
      if (!state.weakness.archive || !['frequency-low:withdrawal', 'light-dark:surge', 'temperature-cold:withdrawal'].every((trial) => state.weakness.trials.includes(trial))) {
        return {
          result: { success: false, message: 'Run all three controlled conditions and compare the reactions with the Archivist’s historical notes.', state },
          scoreDelta: 0,
        };
      }
      if (JSON.stringify(profile) !== JSON.stringify(answer)) {
        return fail('The combined evidence does not support that vulnerability profile.');
      }
      state.weakness.discovered = true;
      message = 'The weakness is verified: low frequency, darkness and cold. Use the lure, then disrupt it three times.';
    } else if (id === 'optional-confirm') {
      if (!state.optional.archivist || !state.optional.tracker) {
        return {
          result: { success: false, message: 'The two hidden containment traces have not been matched yet.', state },
          scoreDelta: 0,
        };
      }
      if (!state.optional.complete) {
        state.optional.complete = true;
        state.scoreBreakdown.optional = 100;
        state.score += 100;
        totalScoreDelta += 100;
      }
      message = 'The paired traces form a complete record. 100 hidden containment points awarded.';
    } else {
      return {
        result: { success: false, message: 'That submission is not available during the current stage.', state },
        scoreDelta: 0,
      };
    }
  } else {
    return null;
  }

  if (state.stage === 2 && SEALS.every((seal) => state.seals[seal].disabled) && state.components.length === COMPONENTS.length) {
    totalScoreDelta += completeStage(state, 2);
    message += ' All three safeguards are down and four verified components are secured. Stage 3 unlocked.';
  }
  if (state.stage === 3 && state.apparatus.configured && state.weakness.discovered && state.weakness.lure > 0 && state.weakness.weakened >= 3) {
    totalScoreDelta += completeStage(state, 3);
    message += ' The weakened entity is drawn into the containment chamber. Stage 4 unlocked.';
  }

  if (type === 'interact' && success && HUNT3_EVIDENCE_LOCATIONS[id]) {
    recordEvidence(state, actor, id, actionStage, message);
  }
  if (state.stage !== actionStage || state.completed) {
    recordEvidence(state, 'team', `stage-${actionStage}-verified`, actionStage, message, true);
  }

  state.updatedAt = now();
  return {
    result: { success, message, state },
    scoreDelta: totalScoreDelta,
  };
}
