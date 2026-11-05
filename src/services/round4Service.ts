/**
 * FROST CARTEL — ROUND 04: THE CAMPUS EXPEDITION SERVICE
 * Manages route progress, clue tracking, answer verification, and persistence.
 */

import type { ExpeditionProgress } from '../types/round4Expedition.types';
import { EXPEDITION_ROUTES, getExpeditionRoute } from '../components/game/round4/ExpeditionRouteConfiguration';

class Round4Service {
  private listeners: Set<(progress: ExpeditionProgress) => void> = new Set();

  private getStorageKey(teamId: string): string {
    return `frost_cartel_round4_progress_${teamId || 'default'}`;
  }

  /**
   * Retrieve active team progress from persistent storage
   */
  getProgress(teamId: string): ExpeditionProgress {
    const key = this.getStorageKey(teamId);
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(key);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          // ignore corrupted JSON and return initial state
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

  /**
   * Save progress to persistent storage and notify listeners
   */
  private saveProgress(progress: ExpeditionProgress): void {
    if (typeof window !== 'undefined') {
      const key = this.getStorageKey(progress.teamId);
      progress.lastUpdated = new Date().toISOString();
      localStorage.setItem(key, JSON.stringify(progress));
    }
    this.listeners.forEach((listener) => listener(progress));
  }

  /**
   * Mark the active map target as discovered by the Map Explorer avatar
   */
  markTargetDiscovered(teamId: string): ExpeditionProgress {
    const progress = this.getProgress(teamId);
    if (progress.targetDiscovered) return progress;

    const updated: ExpeditionProgress = {
      ...progress,
      targetDiscovered: true,
    };
    this.saveProgress(updated);
    return updated;
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

    // Correct Answer: advance step or complete route
    const newSolved = [...new Set([...progress.solvedStepIds, currentStep.stepId])];
    const isLastStepOfRoute = progress.activeStepIndex >= 4;

    if (isLastStepOfRoute) {
      const newCompletedRoutes = [...new Set([...progress.completedRouteIds, route.routeId])];
      const nextRouteIndex = route.routeNumber; // e.g. Route 1 -> next is Route 2 (index 1 in array)
      const nextRoute = EXPEDITION_ROUTES[nextRouteIndex];

      const updated: ExpeditionProgress = {
        ...progress,
        solvedStepIds: newSolved,
        completedRouteIds: newCompletedRoutes,
        activeRouteId: nextRoute ? nextRoute.routeId : route.routeId,
        activeStepIndex: nextRoute ? 0 : 4,
        targetDiscovered: false,
      };
      this.saveProgress(updated);
      return {
        success: true,
        message: `Route ${route.romanNumeral} completed! All five sector clues verified.`,
        isRouteCompleted: true,
        progress: updated,
      };
    }

    // Advance to next step in current route
    const updated: ExpeditionProgress = {
      ...progress,
      solvedStepIds: newSolved,
      activeStepIndex: progress.activeStepIndex + 1,
      targetDiscovered: false,
    };
    this.saveProgress(updated);

    return {
      success: true,
      message: 'Clue verified! Advancing to the next target location.',
      isRouteCompleted: false,
      progress: updated,
    };
  }

  /**
   * Switch active route if unlocked (Route 1 is always unlocked; subsequent routes unlock when previous completes)
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
      this.saveProgress(updated);
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
    this.saveProgress(updated);
    return { success: true, message: `Switched to ${targetRoute.routeName}`, progress: updated };
  }

  private calculateCurrentStepIndexForRoute(progress: ExpeditionProgress, routeId: string): number {
    const route = getExpeditionRoute(routeId);
    for (let i = 0; i < route.steps.length; i++) {
      if (!progress.solvedStepIds.includes(route.steps[i].stepId)) {
        return i;
      }
    }
    return 4; // all solved
  }

  /**
   * Subscribe to progress changes
   */
  subscribe(listener: (progress: ExpeditionProgress) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}

export const round4Service = new Round4Service();
