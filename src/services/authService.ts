import type { AuthResponse, TeamSession } from '../types';

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
  private readonly apiUrl = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '');
  private currentSession: TeamSession | null = null;

  constructor() {
    // Check if an active session exists in sessionStorage (never passwords)
    const stored = sessionStorage.getItem('frost_cartel_session');
    if (stored) {
      try {
        this.currentSession = JSON.parse(stored);
      } catch {
        this.currentSession = null;
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
        const response = await fetch(`${this.apiUrl}/api/auth/team-login`, {
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
          team?: { id: string; teamName: string; score: number; isPaused: boolean };
        };
        if (data.success && data.team) {
          const session: TeamSession = {
            teamId: data.team.id,
            teamName: data.team.teamName,
            playerNumber: data.playerNumber,
            credits: data.team.score,
            currentRound: 1,
            gameStatus: data.team.isPaused ? 'paused' : 'active',
            loginTime: new Date().toISOString(),
          };
          this.setSession(session);
          return { success: true, team: session, token: data.token, message: data.message };
        }
        return { success: false, message: data.message || 'Authentication failed. Please verify with tournament organizer.' };
      } catch {
        return {
          success: false,
          message: 'Unable to reach authentication server. Please alert technical support.',
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

  async getPlayerNumber(): Promise<1 | 2> {
    const response = await fetch(`${this.apiUrl}/api/auth/session`, { credentials: 'include' });
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
    this.currentSession = null;
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
    // Store only non-sensitive session profile in sessionStorage (no passwords)
    sessionStorage.setItem('frost_cartel_session', JSON.stringify(session));
  }
}

export const authService = new AuthService();
