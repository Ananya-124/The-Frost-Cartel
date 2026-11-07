import React, { useState, useEffect } from 'react';
import type { TeamSession } from '../../types/team.types';
import type { RoundConfig } from '../../types/round.types';
import { ROUNDS_DATA } from '../../constants/rounds.constants';
import { authService } from '../../services/authService';
import { isRound2Route, isRound3Route, isRound4Route } from '../../app/routes';
import { HauntedAtmosphere } from './HauntedAtmosphere';
import { HauntedHero } from './HauntedHero';
import { TeamDashboardView } from '../player/TeamDashboardView';
import { Round1Dashboard } from '../game/Round1Dashboard';
import { RoundFourIntro } from '../game/round4/RoundFourIntro';
import { Round2Auction } from '../game/round2/Round2Auction';
import { ParadoxHunt } from '../game/round3/ParadoxHunt';
import { CornerQuickNav } from '../layout/CornerQuickNav';
import { GothicLeaderboardModal } from '../leaderboard/GothicLeaderboardModal';

function resolveChamberFromLocation(
  hash: string,
  search: string,
  current: number | null
): number | null {
  if (isRound2Route(hash)) return 2;
  if (isRound3Route(hash, search)) return 3;
  if (isRound4Route(hash, search)) return 4;
  const params = new URLSearchParams(search);
  if (params.get('round') === '1') return 1;
  if (current === 4 || current === 3 || current === 2) return null;
  return current;
}

export const FrostCartelHomePage: React.FC = () => {
  const [session, setSession] = useState<TeamSession | null>(() => {
    const current = authService.getCurrentSession();
    if (current) return current;
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('round') === '1') {
        return {
          teamId: 'fc_team_001',
          teamName: 'TEAM AI',
          credits: 0,
          currentRound: 1,
          gameStatus: 'active',
          loginTime: new Date().toISOString(),
        };
      }
      if (params.get('dashboard') === '1') {
        return {
          teamId: 'fc_team_001',
          teamName: 'TEAM 1',
          credits: 0,
          currentRound: 1,
          gameStatus: 'active',
          loginTime: new Date().toISOString(),
        };
      }
    }
    return null;
  });
  const [isDashboardOpen, setIsDashboardOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('dashboard') === '1';
    }
    return false;
  });
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [activeChamberRound, setActiveChamberRound] = useState<number | null>(() => {
    if (typeof window === 'undefined') return null;
    return resolveChamberFromLocation(window.location.hash, window.location.search, null);
  });
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const handleRouteSync = () => {
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
    if (round.id === 'round-04' || round.number === '04') {
      navigateToChamber(4, '#/round-4');
      return;
    }

    if (!round.isAccessible) {
      setNotice(`${round.title} is sealed until prior stages conclude.`);
      setTimeout(() => setNotice(null), 3500);
      return;
    }

    if (!session) {
      document.getElementById('login-section')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    if (round.number === '02') {
      navigateToChamber(2, '#/round-2');
    } else if (round.number === '03') {
      navigateToChamber(3, '#/round-3');
    } else {
      navigateToChamber(1, '#/round-1');
    }
  };

  const handleEnterRound1 = () => {
    setIsDashboardOpen(false);
    setActiveChamberRound(1);
  };

  // If player has entered Round 2 (The Haunted Auction):
  if (activeChamberRound === 2 && session) {
    return (
      <Round2Auction
        session={session}
        onReturnHome={() => {
          window.location.hash = '';
          setActiveChamberRound(null);
        }}
      />
    );
  }

  if (activeChamberRound === 3 && session) {
    return <ParadoxHunt session={session} onReturnHome={() => { window.location.hash = ''; setActiveChamberRound(null); }} />;
  }
  // If player has entered Round 4 (The Messenger's Letter):
  if (activeChamberRound === 4) {
    const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const directState = searchParams?.get('introState') as import('../../types/round4.types').Round4IntroState | null;

    return (
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
        }}
      />
    );
  }

  // If player has entered Round 1:
  if (activeChamberRound === 1 && session) {
    return (
      <div className="relative min-h-screen bg-cartel-void text-cartel-bone flex flex-col font-sans">
        <Round1Dashboard
          session={session}
          onReturnHome={() => setActiveChamberRound(null)}
          onOpenDashboard={() => setIsDashboardOpen(true)}
          onUpdateCredits={(newCredits) => {
            setSession((prev) => (prev ? { ...prev, credits: newCredits } : null));
          }}
        />

        {/* Modal Console accessible from inside the game */}
        {isDashboardOpen && (
          <TeamDashboardView
            session={session}
            round1Config={ROUNDS_DATA[0]}
            onLogout={handleLogout}
            onEnterRound1={handleEnterRound1}
            onClose={() => setIsDashboardOpen(false)}
          />
        )}

        {/* Tournament Standings Leaderboard Modal */}
        <GothicLeaderboardModal
          isOpen={isLeaderboardOpen}
          onClose={() => setIsLeaderboardOpen(false)}
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
          rounds={ROUNDS_DATA}
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
          round1Config={ROUNDS_DATA[0]}
          onLogout={handleLogout}
          onEnterRound1={handleEnterRound1}
          onClose={() => setIsDashboardOpen(false)}
        />
      )}

      {/* 4. Tournament Standings Leaderboard Modal */}
      <GothicLeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
      />
    </div>
  );
};
