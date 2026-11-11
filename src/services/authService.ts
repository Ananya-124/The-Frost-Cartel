import type { AuthResponse, TeamSession } from '../types';
import { apiUrl } from './apiBaseUrl';

const AUTH_REQUEST_TIMEOUT_MS = 15_000;

async function fetchWithTimeout(path: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AUTH_REQUEST_TIMEOUT_MS);
  const startedAt = performance.now();
  let status = 0;
  try {
    const response = await fetch(apiUrl(path), { ...init, signal: controller.signal });
    status = response.status;
    return response;
  } catch (error) {
    if (controller.signal.aborted) throw new Error('The authentication request timed out. Check your connection and retry.');
    if (error instanceof Error && error.name === 'TypeError') throw new Error('Could not reach the authentication server. Check your connection and retry.');
    throw error;
  } finally {
    clearTimeout(timeout);
    if (import.meta.env.DEV) console.debug(`[Auth timing] ${init.method ?? 'GET'} ${path} ${Math.round(performance.now() - startedAt)}ms status=${status || 'network-error'}`);
  }
}

/**
 * Authentication Service Boundary for Frost Cartel.
 *
 * Implements the conceptual API contract:
 * POST /api/auth/team-login
 * Body: { teamName: string, password: string }
 *
 * Can connect directly to the future PostgreSQL / Supabase / Express backend.
 */
class AuthService {
  private currentSession: TeamSession | null = null;
  private cachedProfile: Partial<TeamSession> | null = null;

  constructor() {
    // A cached profile is display-only until /api/auth/session validates its cookie.
    const stored = typeof sessionStorage === 'undefined' ? null : sessionStorage.getItem('frost_cartel_session');
    if (stored) {
      try {
        this.cachedProfile = JSON.parse(stored) as Partial<TeamSession>;
      } catch {
        this.cachedProfile = null;
      }
    }
  }

  /**
   * Authenticate a two-player squad with organizer-issued credentials.
   */
  async loginTeam(teamName: string, passkey: string): Promise<AuthResponse> {
    const trimmedName = teamName.trim();
    const trimmedPass = passkey.trim();

    if (!trimmedName || !trimmedPass) {
      return {
        success: false,
        message: 'Both Team Name and Master Passkey are required.',
      };
    }

    // App runs through its same-origin /api proxy by default. Keep the offline
    // simulation strictly in Vitest; it cannot authenticate Round 3 requests.
    if (import.meta.env.MODE !== 'test') {
      try {
        const response = await fetchWithTimeout('/api/auth/team-login', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ teamName: trimmedName, password: trimmedPass }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          return {
            success: false,
            message: errorData.message || 'Authentication failed. Please verify with tournament organizer.',
          };
        }

        const data = await response.json() as {
          success: boolean;
          message?: string;
          token?: string;
          playerNumber?: 1 | 2;
          team?: { id: string; teamName: string; score: number; totalCredits?: number; maxCredits?: number; isPaused: boolean };
        };
        if (data.success && data.team) {
          const session: TeamSession = {
            teamId: data.team.id,
            teamName: data.team.teamName,
            playerNumber: data.playerNumber,
            credits: data.team.totalCredits ?? 0,
            currentRound: 1,
            gameStatus: data.team.isPaused ? 'paused' : 'active',
            loginTime: new Date().toISOString(),
          };
          this.setSession(session);
          return { success: true, team: session, token: data.token, message: data.message };
        }
        return { success: false, message: data.message || 'Authentication failed. Please verify with tournament organizer.' };
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Unable to reach authentication server. Please alert technical support.',
        };
      }
    }

    // Prototype / Offline Simulation Mode (prior to database deployment)
    // Simulates server network latency and validates format (fast-path in tests)
    const delayMs = import.meta.env?.MODE === 'test' ? 10 : 850;
    await new Promise((resolve) => setTimeout(resolve, delayMs));

    // Reject short passwords or invalid dummy attempts
    if (trimmedPass.length < 4) {
      return {
        success: false,
        message: 'Invalid passkey. Organizer passkeys are at least 4 characters.',
      };
    }

    // Build session for authenticated team with cryptographically secure ID
    const randomSuffix = crypto.randomUUID().replaceAll('-', '').substring(0, 8);
    const session: TeamSession = {
      teamId: `fc_${randomSuffix}`,
      teamName: trimmedName,
      credits: 0,
      currentRound: 1,
      gameStatus: 'waiting', // Round 1 start is controlled by the event admin
      loginTime: new Date().toISOString(),
    };

    this.setSession(session);

    return {
      success: true,
      team: session,
      token: `sess_${Date.now()}_${session.teamId}`,
      message: 'Crypt access granted. Welcome, Operatives.',
    };
  }

  getCurrentSession(): TeamSession | null {
    return this.currentSession;
  }

  async restoreSession(): Promise<TeamSession | null> {
    try {
      const response = await fetchWithTimeout('/api/auth/session', { credentials: 'include' });
      if (!response.ok) throw new Error('Team session is no longer valid.');
      const data = await response.json() as {
        success?: boolean;
        playerNumber?: number;
        team?: { id: string; teamName: string; score: number; totalCredits?: number; maxCredits?: number; isPaused: boolean };
      };
      if (!data.success || !data.team?.id || !data.team.teamName || data.team.isPaused) throw new Error('Team session is unavailable.');
      const session: TeamSession = {
        teamId: data.team.id,
        teamName: data.team.teamName,
        playerNumber: data.playerNumber === 1 || data.playerNumber === 2 ? data.playerNumber : undefined,
        credits: typeof data.team.totalCredits === 'number' ? data.team.totalCredits : null,
        currentRound: 1,
        gameStatus: 'active',
        loginTime: this.cachedProfile?.loginTime ?? new Date().toISOString(),
      };
      this.setSession(session);
      return session;
    } catch {
      this.currentSession = null;
      this.cachedProfile = null;
      sessionStorage.removeItem('frost_cartel_session');
      return null;
    }
  }

  async getPlayerNumber(): Promise<1 | 2> {
    const response = await fetchWithTimeout('/api/auth/session', { credentials: 'include' });
    if (!response.ok) throw new Error('Could not identify the authenticated investigator. Reconnect before starting Hunt I.');
    const data = await response.json() as { playerNumber?: number };
    if (data.playerNumber !== 1 && data.playerNumber !== 2) throw new Error('The authenticated investigator role is missing. Reconnect before starting Hunt I.');
    if (this.currentSession) this.setSession({ ...this.currentSession, playerNumber: data.playerNumber });
    return data.playerNumber;
  }

  isAuthenticated(): boolean {
    return this.currentSession !== null;
  }

  logout(): void {
    // Revoke the server session as well as clearing the non-sensitive local profile.
    void fetch(apiUrl('/api/auth/logout'), { method: 'POST', credentials: 'include' }).catch(() => undefined);
    this.currentSession = null;
    this.cachedProfile = null;
    sessionStorage.removeItem('frost_cartel_session');
  }

  updateSessionCredits(credits: number): void {
    if (this.currentSession) {
      this.currentSession.credits = credits;
      this.setSession(this.currentSession);
    }
  }

  private setSession(session: TeamSession): void {
    this.currentSession = session;
    this.cachedProfile = session;
    // Store only non-sensitive session profile in sessionStorage (no passwords)
    sessionStorage.setItem('frost_cartel_session', JSON.stringify(session));
  }
}

export const authService = new AuthService();
