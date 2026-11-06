import type { Mission, Timeline } from '../types';

/** Objectives per timeline, shown in order until each condition is met. */
export const MISSIONS: Record<Timeline, Mission> = {
  past: {
    timeline: 'past',
    steps: [
      {
        objective: 'Search the entrance and find a way deeper into the building.',
        completedWhen: 'key',
      },
      { objective: 'Open the locked cabinet in the Archive.', completedWhen: 'arch' },
      { objective: 'Restore power to the facility.', completedWhen: 'power' },
      { objective: 'Recover and play the recording.', completedWhen: 'tape' },
      {
        objective: 'Verify your findings at the Archive terminal (Observation).',
        completedWhen: 'pastVerified',
      },
      {
        objective: 'Prepare the breaker panel at the Experiment Chamber node.',
        completedWhen: 'pastNodeReady',
      },
    ],
    finalObjective: 'Synchronize the capture with the Tracker.',
  },
  future: {
    timeline: 'future',
    steps: [
      {
        objective: 'Search the ruins. Some routes are sealed from the other side of time.',
        completedWhen: 'arch',
      },
      { objective: 'Explore. Light will come from somewhere else.', completedWhen: 'power' },
      {
        objective: 'Track the true entity. Walk up to a manifestation and press Enter.',
        completedWhen: 'entityMarked',
      },
      {
        objective: 'Verify your findings at the Warden terminal (Observation).',
        completedWhen: 'futureVerified',
      },
      {
        objective: 'Prepare the rune dais at the Experiment Chamber node.',
        completedWhen: 'futureNodeReady',
      },
    ],
    finalObjective: 'Synchronize the capture with the Archivist.',
  },
};
