import React, { lazy, Suspense, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { TeamSession } from '../../types/team.types';
import type { RoundConfig } from '../../types/round.types';
import { ROUNDS_DATA } from '../../constants/rounds.constants';
import { authService } from '../../services/authService';
import { isRound1Route, isRound2Route, isRound3Route, isRound4Route } from '../../app/routes';
import { HauntedAtmosphere } from './HauntedAtmosphere';
import { HauntedHero } from './HauntedHero';
import { TeamDashboardView } from '../player/TeamDashboardView';
import { Round1Dashboard } from '../game/Round1Dashboard';
import { Round1DeferredBoundary } from '../game/Round1DeferredBoundary';
import { CornerQuickNav } from '../layout/CornerQuickNav';
import { GothicLeaderboardModal } from '../leaderboard/GothicLeaderboardModal';
import { progressionService, errorStatus, type TeamProgression } from '../../services/progressionService';

const RoundFourIntro = lazy(() => import('../game/round4/RoundFourIntro').then((module) => ({ default: module.RoundFourIntro })));
const Round2Auction = lazy(() => import('../game/round2/Round2Auction').then((module) => ({ default: module.Round2Auction })));
const ParadoxHunt = lazy(() => import('../game/round3/ParadoxHunt').then((module) => ({ default: module.ParadoxHunt })));

function serverRounds(progression: TeamProgression | null, isAuthenticated: boolean): RoundConfig[] {
  if (!progression) return ROUNDS_DATA.map((round) => Number(round.number) === 1 && isAuthenticated
    ? { ...round, isAccessible: true, statusBadge: 'active', statusText: 'AVAILABLE • SERVER VERIFIES ENTRY', actionText: 'ENTER ROUND' }
    : { ...round, isAccessible: false, statusBadge: 'locked', statusText: isAuthenticated ? 'STATUS UNAVAILABLE' : 'SIGN IN TO CHECK ACCESS', actionText: isAuthenticated ? 'RETRY STATUS' : 'SIGN IN' });
  return ROUNDS_DATA.map((round) => {
    const state = progression.rounds.find((item) => item.round_id === Number(round.number));
    if (!state) return { ...round, isAccessible: false, statusBadge: 'locked', statusText: 'STATUS UNAVAILABLE', actionText: 'CHECK STATUS' };
    const eligible = state.status === 'LOCKED' && Boolean(state.eligible_at);
    const isAccessible = state.status !== 'LOCKED';
    const statusText = eligible ? 'ELIGIBLE • ADMIN UNLOCK REQUIRED' : state.status.replace('_', ' ');
    const statusBadge = state.status === 'LOCKED' ? (eligible ? 'upcoming' : 'locked') : state.status === 'COMPLETED' ? 'completed' : 'active';
    const actionText = state.status === 'COMPLETED' ? 'VIEW ROUND' : state.status === 'IN_PROGRESS' ? 'RESUME ROUND' : state.status === 'AVAILABLE' ? 'ENTER ROUND' : eligible ? 'AWAIT UNLOCK' : 'LOCKED';
    return { ...round, isAccessible, statusText, statusBadge, actionText };
  });
}

function resolveChamberFromLocation(
  hash: string,
  search: string,
  current: number | null
): number | null {
  if (isRound1Route(hash, search)) return 1;
  if (isRound2Route(hash)) return 2;
  if (isRound3Route(hash, search)) return 3;
  if (isRound4Route(hash, search)) return 4;
  if (current === 4 || current === 3 || current === 2 || current === 1) return null;
  return current;
}

export const FrostCartelHomePage: React.FC = () => {
  const [session, setSession] = useState<TeamSession | null>(() => {
    return null;
  });
  const [isDashboardOpen, setIsDashboardOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('dashboard') === '1';
    }
    return false;
  });
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return (
        params.get('leaderboard') === '1' ||
        window.location.hash === '#/leaderboard' ||
        window.location.hash === '#leaderboard'
      );
    }
    return false;
  });
  const [activeChamberRound, setActiveChamberRound] = useState<number | null>(() => {
    if (typeof window === 'undefined') return null;
    return resolveChamberFromLocation(window.location.hash, window.location.search, null);
  });
  const [notice, setNotice] = useState<string | null>(null);
  const [progression, setProgression] = useState<TeamProgression | null>(null);
  const progressionRequestInFlight = useRef<Promise<TeamProgression> | null>(null);
  const handleRound1CreditUpdate = useCallback((credits: number) => {
    setSession((previous) => previous && previous.credits !== credits ? { ...previous, credits } : previous);
  }, []);

  useEffect(() => {
    let active = true;
    void authService.restoreSession().then((restored) => {
      if (active && restored) { setSession(restored); setIsDashboardOpen(true); }
    });
    return () => { active = false; };
  }, []);

  const refreshProgression = useCallback(async () => {
    if (!session) { setProgression(null); return; }
    let request = progressionRequestInFlight.current;
    if (!request) {
      request = progressionService.getMine();
      progressionRequestInFlight.current = request;
    }
    try {
      setProgression(await request);
    } catch (error) {
      if (errorStatus(error) === 401) {
        authService.logout();
        setSession(null);
        setProgression(null);
      }
    } finally {
      if (progressionRequestInFlight.current === request) progressionRequestInFlight.current = null;
    }
  }, [session]);

  useEffect(() => {
    if (!session || activeChamberRound !== null) return;
    void refreshProgression();
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        void refreshProgression();
      }
    }, 15_000);
    const onFocus = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        void refreshProgression();
      }
    };
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [session, activeChamberRound, refreshProgression]);
  const displayRounds = useMemo(() => serverRounds(progression, Boolean(session)), [progression, session]);

  useEffect(() => {
    const handleRouteSync = () => {
      const current = authService.getCurrentSession();
      if (current) {
        setSession(current);
      }
      if (window.location.hash === '#/leaderboard' || window.location.hash === '#leaderboard') {
        setIsLeaderboardOpen(true);
      }
      setActiveChamberRound((prev) =>
        resolveChamberFromLocation(window.location.hash, window.location.search, prev)
      );
    };
    window.addEventListener('hashchange', handleRouteSync);
    window.addEventListener('popstate', handleRouteSync);
    return () => {
      window.removeEventListener('hashchange', handleRouteSync);
      window.removeEventListener('popstate', handleRouteSync);
    };
  }, []);

  const handleLoginSuccess = (newSession: TeamSession) => {
    setSession(newSession);
    setIsDashboardOpen(true);
  };

  const handleLogout = () => {
    authService.logout();
    setSession(null);
    setIsDashboardOpen(false);
    setActiveChamberRound(null);
  };

  const navigateToChamber = (roundNum: number, hash: string) => {
    setIsDashboardOpen(false);
    window.location.hash = hash;
    setActiveChamberRound(roundNum);
  };

  const handleSelectRound = (round: RoundConfig) => {
    if (!session) {
      document.getElementById('login-section')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    // The authenticated Round 1 state route validates access and automatically
    // starts AVAILABLE team progression. Avoid a separate read and start RTT.
    if (Number(round.number) === 1) {
      navigateToChamber(1, '#/round-1');
      return;
    }
    void (async () => {
      try {
        const fresh = await progressionService.getMine();
        setProgression(fresh);
        const current = fresh.rounds.find((item) => item.round_id === Number(round.number));
        if (!current || current.status === 'LOCKED') {
          setNotice(current?.eligible_at ? 'This round is eligible and awaits an administrator unlock.' : `${round.title} is locked for your team.`);
          return;
        }
        if (current.status === 'AVAILABLE') setProgression(await progressionService.startRound(current.round_id));
        if (round.number === '04') navigateToChamber(4, '#/round-4');
        else {
          const targetRound = Number(round.number);
          navigateToChamber(targetRound, `#/round-${targetRound}`);
        }
      } catch (error) {
        if (errorStatus(error) === 401) {
          authService.logout(); setSession(null);
          setNotice('Your team session expired. Sign in again before entering a round.');
        } else setNotice(error instanceof Error ? error.message : 'Could not verify round access. Retry shortly.');
      }
    })();
  };

  const handleEnterRound1 = () => {
    setIsDashboardOpen(false);
    window.location.hash = '#/round-1';
    setActiveChamberRound(1);
  };

  // If player has entered Round 2 (The Haunted Auction):
  if (activeChamberRound === 2 && session) {
    return <Round1DeferredBoundary stageLabel="Round 2"><Suspense fallback={<div role="status" className="min-h-screen bg-black text-stone-100 flex items-center justify-center">Loading Round 2…</div>}>
      <Round2Auction
        session={session}
        onReturnHome={() => {
          window.location.hash = '';
          setActiveChamberRound(null);
          void refreshProgression();
        }}
      />
    </Suspense></Round1DeferredBoundary>;
  }

  if (activeChamberRound === 3 && session) {
    return <Round1DeferredBoundary stageLabel="Round 3"><Suspense fallback={<div role="status" className="min-h-screen bg-black text-stone-100 flex items-center justify-center">Loading Round 3…</div>}><ParadoxHunt session={session} onReturnHome={() => { window.location.hash = ''; setActiveChamberRound(null); void refreshProgression(); }} /></Suspense></Round1DeferredBoundary>;
  }
  // If player has entered Round 4 (The Messenger's Letter):
  if (activeChamberRound === 4) {
    const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const directState = searchParams?.get('introState') as import('../../types/round4.types').Round4IntroState | null;

    return <Round1DeferredBoundary stageLabel="Round 4"><Suspense fallback={<div role="status" className="min-h-screen bg-black text-stone-100 flex items-center justify-center">Loading Round 4…</div>}>
      <RoundFourIntro
        initialState={directState || undefined}
        onExit={() => {
          if (window.location.hash === '#/round-4' || window.location.hash === '#/round-04') {
            window.location.hash = '';
          }
          if (typeof window !== 'undefined' && window.location.search) {
            const url = new URL(window.location.href);
            if (url.searchParams.get('round') === '4' || url.searchParams.get('round') === '04') {
              url.searchParams.delete('round');
              window.history.pushState(null, '', url.pathname + url.search + url.hash);
            }
          }
          setActiveChamberRound(null);
          void refreshProgression();
        }}
      />
    </Suspense></Round1DeferredBoundary>;
  }

  // If player has entered Round 1:
  if (activeChamberRound === 1 && session) {
    return (
      <div className="relative min-h-screen bg-cartel-void text-cartel-bone flex flex-col font-sans">
        <Round1Dashboard
          session={session}
          onReturnHome={() => {
            window.location.hash = '';
            setActiveChamberRound(null);
            void refreshProgression();
          }}
          onOpenDashboard={() => setIsDashboardOpen(true)}
          onUpdateCredits={handleRound1CreditUpdate}
        />

        {/* Modal Console accessible from inside the game */}
        {isDashboardOpen && (
          <TeamDashboardView
            session={session}
            progression={progression}
            isRound1GameActive
            round1Config={ROUNDS_DATA[0]}
            onLogout={handleLogout}
            onEnterRound1={handleEnterRound1}
            onSelectRound={(roundNum) => {
              const cfg = ROUNDS_DATA.find((r) => Number(r.number) === roundNum);
              if (cfg) handleSelectRound(cfg);
            }}
            onClose={() => setIsDashboardOpen(false)}
          />
        )}

        {/* Tournament Standings Leaderboard Modal */}
        <GothicLeaderboardModal
          isOpen={isLeaderboardOpen}
          onClose={() => {
            setIsLeaderboardOpen(false);
            if (window.location.hash === '#/leaderboard' || window.location.hash === '#leaderboard') {
              window.location.hash = '';
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-cartel-void text-cartel-bone flex flex-col font-sans selection:bg-cartel-pumpkin selection:text-black overflow-x-hidden">
      {/* Discreet Floating Corner Navigation Dock (Leaderboard, Squad Console, Admin Vault) */}
      <CornerQuickNav
        session={session}
        onOpenDashboard={() => setIsDashboardOpen(true)}
        onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
      />

      {/* 1. Full-Screen Cinematic Haunted Environment (Castle, Moon, Bats, Ghost, Mist, Pumpkins) */}
      <HauntedAtmosphere />

      {/* Temporary Notice Pill */}
      {notice && (
        <div className="fixed top-8 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-cartel-midnight/95 border border-cartel-amber text-xs font-cinzel text-cartel-amber shadow-pumpkinGlow animate-fadeIn flex items-center gap-2">
          <span aria-hidden="true">🔒</span>
          <span>{notice}</span>
        </div>
      )}

      {/* 2. Main Hero with 3 Circular Portals & Integrated Team Login Console */}
      <main className="flex-1 flex flex-col relative z-10">
        <HauntedHero
          rounds={displayRounds}
          session={session}
          onLoginSuccess={handleLoginSuccess}
          onOpenDashboard={() => setIsDashboardOpen(true)}
          onSelectRound={handleSelectRound}
        />
      </main>

      {/* 3. Team Squad Console Dialog Modal */}
      {isDashboardOpen && session && (
        <TeamDashboardView
          session={session}
          progression={progression}
          round1Config={ROUNDS_DATA[0]}
          onLogout={handleLogout}
          onEnterRound1={handleEnterRound1}
          onSelectRound={(roundNum) => {
            const cfg = ROUNDS_DATA.find((r) => Number(r.number) === roundNum);
            if (cfg) handleSelectRound(cfg);
          }}
          onClose={() => setIsDashboardOpen(false)}
        />
      )}

      {/* 4. Tournament Standings Leaderboard Modal */}
      <GothicLeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => {
          setIsLeaderboardOpen(false);
          if (window.location.hash === '#/leaderboard' || window.location.hash === '#leaderboard') {
            window.location.hash = '';
          }
        }}
      />
    </div>
  );
};
