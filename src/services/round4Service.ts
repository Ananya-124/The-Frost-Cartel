/**
 * FROST CARTEL — ROUND 04: THE CAMPUS EXPEDITION SERVICE
 * Authoritative 7-team competitive treasure hunt progression service.
 * Connects to `/api/round4` with local fallback support and SSE real-time sync.
 */

import type { ExpeditionProgress, WinnerRecord } from '../types/round4Expedition.types';
import { EXPEDITION_ROUTES, getExpeditionRoute } from '../components/game/round4/ExpeditionRouteConfiguration';

export interface AuthoritativeRouteState {
  qualified: boolean;
  isReleased: boolean;
  assignedRouteId: string;
  routeNumber: number;
  romanNumeral: string;
  routeName: string;
  routeSubtitle: string;
  progress: {
    currentStepIndex: number;
    targetDiscovered: boolean;
    solvedStepIds: string[];
    commonRoomArrived: boolean;
    isFinished: boolean;
    finishedAt: string | null;
  };
  activeStep: {
    stepId: string;
    clueIndex: number;
    floorId: string;
    locationName: string;
    targetPoint: { x: number; y: number };
    triggerRadius: number;
    riddle: string;
    fieldLocationHint: string;
    isCommonFinal: boolean;
    physicalEntryInstructions?: string;
  } | null;
  totalSteps: number;
  winner: WinnerRecord | null;
  isWinner: boolean;
}

class Round4Service {
  private readonly listeners: Set<(progress: ExpeditionProgress) => void> = new Set();
  private readonly winnerListeners: Set<(winner: WinnerRecord | null) => void> = new Set();
  private currentWinner: WinnerRecord | null = null;
  private sseSource: EventSource | null = null;

  constructor() {
    this.initSSE();
  }

  private initSSE(): void {
    if (typeof window !== 'undefined' && 'EventSource' in window) {
      try {
        this.sseSource = new EventSource('/api/events/stream');
        this.sseSource.addEventListener('ROUND4_WINNER_DECLARED', (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data);
            if (data.winner) {
              this.currentWinner = data.winner;
              this.winnerListeners.forEach((l) => l(data.winner));
            }
          } catch (err) {
            console.error('[Round4Service] Failed parsing SSE winner event:', err);
          }
        });

        this.sseSource.addEventListener('ROUND4_RESET', () => {
          this.currentWinner = null;
          this.winnerListeners.forEach((l) => l(null));
        });
      } catch {
        // SSE connection failure ignored in non-server / test environments
      }
    }
  }

  private getStorageKey(teamId: string): string {
    return `frost_cartel_round4_progress_${teamId || 'default'}`;
  }

  /**
   * Synchronous progress getter for immediate render and unit testing
   */
  getProgress(teamId: string): ExpeditionProgress {
    const key = this.getStorageKey(teamId);
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(key);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          // ignore corrupted JSON
        }
      }
    }

    const initial: ExpeditionProgress = {
      teamId: teamId || 'default',
      activeRouteId: 'route-1',
      activeStepIndex: 0,
      targetDiscovered: false,
      solvedStepIds: [],
      completedRouteIds: [],
      lastUpdated: new Date().toISOString(),
    };
    return initial;
  }

  saveLocalProgress(progress: ExpeditionProgress): void {
    if (typeof window !== 'undefined') {
      const key = this.getStorageKey(progress.teamId);
      progress.lastUpdated = new Date().toISOString();
      localStorage.setItem(key, JSON.stringify(progress));
    }
    this.listeners.forEach((listener) => listener(progress));
  }

  /**
   * Check qualification & tournament release status from authoritative server
   */
  async getStatus(): Promise<{
    qualified: boolean;
    isReleased: boolean;
    assignedRouteId: string | null;
    winner: WinnerRecord | null;
    message?: string;
  }> {
    try {
      const res = await fetch('/api/round4/status');
      if (res.ok) {
        const data = await res.json();
        if (data.winner) {
          this.currentWinner = data.winner;
        }
        return data;
      }
    } catch {
      // Local fallback for test or offline mode
    }

    return {
      qualified: true,
      isReleased: true,
      assignedRouteId: 'route-1',
      winner: this.currentWinner,
    };
  }

  /**
   * Fetch authoritative route state for current team
   */
  async fetchMyRouteState(teamId: string): Promise<AuthoritativeRouteState> {
    try {
      const res = await fetch('/api/round4/my-route');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          if (data.winner) {
            this.currentWinner = data.winner;
          }
          // Sync local progress cache with authoritative server state
          const local = this.getProgress(teamId);
          local.activeRouteId = data.route.routeId;
          local.activeStepIndex = data.progress.currentStepIndex;
          local.targetDiscovered = data.progress.targetDiscovered;
          local.solvedStepIds = data.progress.solvedStepIds;
          this.saveLocalProgress(local);

          return data;
        }
      }
    } catch {
      // Fallback to local configuration if offline or in testing
    }

    const localProg = this.getProgress(teamId);
    const route = getExpeditionRoute(localProg.activeRouteId);
    const activeRaw = route.steps[localProg.activeStepIndex] || null;

    return {
      qualified: true,
      isReleased: true,
      assignedRouteId: route.routeId,
      routeNumber: route.routeNumber,
      romanNumeral: route.romanNumeral,
      routeName: route.routeName,
      routeSubtitle: route.routeSubtitle,
      progress: {
        currentStepIndex: localProg.activeStepIndex,
        targetDiscovered: localProg.targetDiscovered,
        solvedStepIds: localProg.solvedStepIds,
        commonRoomArrived: localProg.activeStepIndex === 4 && localProg.targetDiscovered,
        isFinished: localProg.activeStepIndex >= 5,
        finishedAt: null,
      },
      activeStep: activeRaw
        ? {
            stepId: activeRaw.stepId,
            clueIndex: activeRaw.clueIndex,
            floorId: activeRaw.floorId,
            locationName: activeRaw.locationName,
            targetPoint: activeRaw.targetPoint,
            triggerRadius: activeRaw.triggerRadius,
            riddle: localProg.targetDiscovered ? activeRaw.riddle : '',
            fieldLocationHint: localProg.targetDiscovered ? activeRaw.fieldLocationHint : '',
            isCommonFinal: activeRaw.clueIndex === 5,
          }
        : null,
      totalSteps: route.steps.length,
      winner: this.currentWinner,
      isWinner: this.currentWinner?.teamId === teamId,
    };
  }

  /**
   * Mark the active map target as discovered by the Map Explorer avatar
   */
  markTargetDiscovered(teamId: string): ExpeditionProgress {
    const progress = this.getProgress(teamId);
    if (!progress.targetDiscovered) {
      progress.targetDiscovered = true;
      this.saveLocalProgress(progress);
    }

    if (typeof window !== 'undefined') {
      fetch('/api/round4/discover-target', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }).catch(() => {});
    }

    return progress;
  }

  /**
   * Submit an answer/code discovered by the Field Partner
   */
  submitAnswer(
    teamId: string,
    rawAnswer: string
  ): {
    success: boolean;
    message: string;
    isRouteCompleted: boolean;
    isWinner?: boolean;
    raceClosed?: boolean;
    winner?: WinnerRecord;
    nextFloorId?: string;
    nextFloorName?: string;
    progress: ExpeditionProgress;
  } {
    const progress = this.getProgress(teamId);
    const route = getExpeditionRoute(progress.activeRouteId);
    const currentStep = route.steps[progress.activeStepIndex];

    if (!currentStep) {
      return {
        success: false,
        message: 'No active clue step found.',
        isRouteCompleted: false,
        progress,
      };
    }

    if (!progress.targetDiscovered) {
      return {
        success: false,
        message: 'You must reach the marked golden point on the map first.',
        isRouteCompleted: false,
        progress,
      };
    }

    const normalizedInput = rawAnswer.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    const isCorrect = currentStep.acceptedCodes.some(
      (code) => code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '') === normalizedInput
    );

    if (!isCorrect) {
      return {
        success: false,
        message: 'Incorrect code or cipher. Re-examine the clue with your field partner.',
        isRouteCompleted: false,
        progress,
      };
    }

    const newSolved = [...new Set([...progress.solvedStepIds, currentStep.stepId])];
    const isLastStepOfRoute = progress.activeStepIndex >= 4;

    if (isLastStepOfRoute) {
      const newCompletedRoutes = [...new Set([...progress.completedRouteIds, route.routeId])];
      const updated: ExpeditionProgress = {
        ...progress,
        solvedStepIds: newSolved,
        completedRouteIds: newCompletedRoutes,
        activeStepIndex: 4,
        targetDiscovered: false,
      };
      this.saveLocalProgress(updated);

      const winRecord: WinnerRecord = {
        teamId,
        teamName: 'Team Champion',
        routeId: route.routeId,
        solvedAt: new Date().toISOString(),
      };
      this.currentWinner = winRecord;
      this.winnerListeners.forEach((l) => l(winRecord));

      if (typeof window !== 'undefined') {
        fetch('/api/round4/submit-clue', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stepId: currentStep.stepId, answer: rawAnswer }),
        }).catch(() => {});
      }

      return {
        success: true,
        message: `Route ${route.romanNumeral} completed! All five sector clues verified.`,
        isRouteCompleted: true,
        isWinner: true,
        progress: updated,
      };
    }

    const nextIndex = progress.activeStepIndex + 1;
    const nextStep = route.steps[nextIndex];
    const nextFloorId = nextStep ? nextStep.floorId : 'floor-07';
    const floorNames: Record<string, string> = {
      'floor-02': 'Second Floor — Humanities & Research Wing',
      'floor-03': 'Third Floor — Computer Applications Wing',
      'floor-04': 'Fourth Floor — Computer Science & Engineering Wing',
      'floor-05': 'Fifth Floor — Academic & Faculty Block',
      'floor-06': 'Sixth Floor — Electronics & AI Department',
      'floor-07': 'Seventh Floor — Main Event Venue & Auditorium',
    };
    const nextFloorName = floorNames[nextFloorId] || nextFloorId.toUpperCase();

    const updated: ExpeditionProgress = {
      ...progress,
      solvedStepIds: newSolved,
      activeStepIndex: nextIndex,
      targetDiscovered: false,
    };
    this.saveLocalProgress(updated);

    if (typeof window !== 'undefined') {
      fetch('/api/round4/submit-clue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stepId: currentStep.stepId, answer: rawAnswer }),
      }).catch(() => {});
    }

    return {
      success: true,
      message: 'The seal has yielded. Your next destination awaits.',
      isRouteCompleted: false,
      nextFloorId,
      nextFloorName,
      progress: updated,
    };
  }

  /**
   * Scan or validate a physical QR token at the current checkpoint
   */
  async scanQrToken(
    teamId: string,
    qrToken: string
  ): Promise<{
    success: boolean;
    valid: boolean;
    validationWord?: string;
    clueIndex?: number;
    locationName?: string;
    message: string;
    code?: string;
  }> {
    try {
      const res = await fetch('/api/round4/scan-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrToken }),
      });
      if (res.ok) {
        return await res.json();
      }
      const err = await res.json().catch(() => ({}));
      return {
        success: false,
        valid: false,
        message: err.message || 'Checkpoint scan failed.',
        code: err.code,
      };
    } catch {
      // Local offline fallback
      const progress = this.getProgress(teamId);
      const route = getExpeditionRoute(progress.activeRouteId);
      const activeStep = route.steps[progress.activeStepIndex];
      const cleanToken = qrToken.trim();

      if (activeStep && activeStep.qrToken === cleanToken) {
        return {
          success: true,
          valid: true,
          validationWord: activeStep.acceptedCodes[0] || 'WRAITH',
          clueIndex: activeStep.clueIndex,
          locationName: activeStep.locationName,
          message: 'Physical checkpoint confirmed! Enter the validation cipher into your field console.',
        };
      }

      // Check if out of sequence on this route
      const otherStep = route.steps.find((s) => s.qrToken === cleanToken);
      if (otherStep) {
        return {
          success: false,
          valid: false,
          code: 'OUT_OF_SEQUENCE',
          message: `Out of sequence checkpoint! This marker is for Clue #${otherStep.clueIndex}, but your squad is currently on Clue #${activeStep?.clueIndex || 1}.`,
        };
      }

      return {
        success: false,
        valid: false,
        message: 'Unrecognized checkpoint cipher. Ensure you are scanning an authentic Frost Cartel physical marker.',
      };
    }
  }

  /**
   * Switch active route if unlocked (for test harness and admin routing)
   */
  selectRoute(
    teamId: string,
    targetRouteId: string
  ): {
    success: boolean;
    message: string;
    progress: ExpeditionProgress;
  } {
    const progress = this.getProgress(teamId);
    const targetRoute = getExpeditionRoute(targetRouteId);

    // Route 1 is always accessible
    if (targetRoute.routeNumber === 1) {
      const updated = {
        ...progress,
        activeRouteId: targetRoute.routeId,
        activeStepIndex: this.calculateCurrentStepIndexForRoute(progress, targetRoute.routeId),
        targetDiscovered: false,
      };
      this.saveLocalProgress(updated);
      return { success: true, message: `Switched to ${targetRoute.routeName}`, progress: updated };
    }

    // Subsequent routes require the preceding route to be completed
    const prevRoute = EXPEDITION_ROUTES[targetRoute.routeNumber - 2];
    const isUnlocked = prevRoute && progress.completedRouteIds.includes(prevRoute.routeId);

    if (!isUnlocked) {
      return {
        success: false,
        message: `${targetRoute.routeName} is locked. Complete ${prevRoute ? prevRoute.routeName : 'previous route'} first.`,
        progress,
      };
    }

    const updated: ExpeditionProgress = {
      ...progress,
      activeRouteId: targetRoute.routeId,
      activeStepIndex: this.calculateCurrentStepIndexForRoute(progress, targetRoute.routeId),
      targetDiscovered: false,
    };
    this.saveLocalProgress(updated);
    return { success: true, message: `Switched to ${targetRoute.routeName}`, progress: updated };
  }

  private calculateCurrentStepIndexForRoute(progress: ExpeditionProgress, routeId: string): number {
    const route = getExpeditionRoute(routeId);
    for (let i = 0; i < route.steps.length; i++) {
      if (!progress.solvedStepIds.includes(route.steps[i].stepId)) {
        return i;
      }
    }
    return 4;
  }

  getWinner(): WinnerRecord | null {
    return this.currentWinner;
  }

  subscribe(listener: (progress: ExpeditionProgress) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  subscribeWinner(listener: (winner: WinnerRecord | null) => void): () => void {
    this.winnerListeners.add(listener);
    return () => {
      this.winnerListeners.delete(listener);
    };
  }
}

export const round4Service = new Round4Service();
