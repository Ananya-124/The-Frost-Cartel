import React, { useCallback, useEffect, useState } from 'react';
import type { DashboardMetrics } from '../../types/admin';
import { adminReadService } from '../../services/adminReadService';
import { AdminDashboardTab } from './dashboard/AdminDashboardTab';
import { AdminTeamsTab } from './teams/AdminTeamsTab';
import { AdminRoundControlTab } from './rounds/AdminRoundControlTab';
import { AdminResultsTab } from './results/AdminResultsTab';
import { AdminAuctionTab } from './auction/AdminAuctionTab';
import { AdminRound4Tab } from './round4/AdminRound4Tab';
import { adminAuthService } from '../../services/progressionService';

interface AdminPortalProps {
  onNavigatePublic: () => void;
}

type TabKey = 'dashboard' | 'teams' | 'rounds' | 'auction' | 'results' | 'round4';

interface TabDefinition {
  key: TabKey;
  label: string;
  getLabel?: (count: number) => string;
}

const TABS: TabDefinition[] = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'teams', label: 'Teams', getLabel: (count) => `Teams (${count})` },
  { key: 'rounds', label: 'Round Control' },
  { key: 'auction', label: 'Auction' },
  { key: 'results', label: 'Results' },
  { key: 'round4', label: 'Round 04 Expedition' },
];

function getInitialTab(): TabKey {
  const hash = window.location.hash;
  if (hash.includes('/teams')) return 'teams';
  if (hash.includes('/rounds')) return 'rounds';
  if (hash.includes('/auction')) return 'auction';
  if (hash.includes('/results')) return 'results';
  if (hash.includes('/round4')) return 'round4';
  return 'dashboard';
}

function getDesktopTabClass(isActive: boolean): string {
  if (isActive) {
    return 'bg-cartel-charcoal text-cartel-amber border border-cartel-amber/50';
  }
  return 'text-cartel-silver/70 hover:text-white';
}

function getMobileTabClass(isActive: boolean): string {
  if (isActive) {
    return 'text-cartel-amber';
  }
  return 'text-cartel-silver/70';
}

interface AdminHeaderProps {
  activeTab: TabKey;
  totalTeams: number;
  onSelectTab: (tab: TabKey) => void;
  onNavigatePublic: () => void;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({
  activeTab,
  totalTeams,
  onSelectTab,
  onNavigatePublic,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-cartel-void/95 backdrop-blur-md border-b border-cartel-frostBorder/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        {/* Brand & Area Badge */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full border border-cartel-amber/60 flex items-center justify-center bg-cartel-charcoal shadow-pumpkinGlow">
            <span className="text-sm">🛡️</span>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-sm sm:text-base font-gothic tracking-wider font-bold silver-metallic-text leading-none">
                FROST CARTEL
              </span>
              <span className="px-2 py-0.5 rounded bg-cartel-charcoal border border-cartel-amber/40 text-[9px] font-cinzel font-bold text-cartel-amber uppercase tracking-wider">
                CONTROL VAULT
              </span>
            </div>
          </div>
        </div>

        {/* Desktop Tab Navigation */}
        <nav aria-label="Admin Primary Navigation" className="hidden md:flex items-center space-x-1 font-cinzel text-xs font-bold uppercase tracking-wider">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            const labelText = tab.getLabel ? tab.getLabel(totalTeams) : tab.label;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => onSelectTab(tab.key)}
                aria-current={isActive ? 'page' : undefined}
                className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${getDesktopTabClass(isActive)}`}
              >
                {labelText}
              </button>
            );
          })}
        </nav>

        {/* Right Action: Public Site Switcher */}
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onNavigatePublic}
            aria-label="View Public Homepage"
            className="px-3 py-1.5 rounded bg-cartel-charcoal hover:bg-white/10 border border-white/20 text-white font-cinzel text-xs font-semibold tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span aria-hidden="true">←</span>
            <span className="hidden sm:inline">View Public Homepage</span>
            <span className="sm:hidden">Exit</span>
          </button>
        </div>
      </div>

      {/* Mobile Tab Row */}
      <nav aria-label="Admin Mobile Navigation" className="md:hidden flex items-center justify-around px-2 py-1.5 border-t border-white/10 bg-cartel-midnight/80 font-cinzel text-[11px] font-bold uppercase tracking-wider">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onSelectTab(tab.key)}
              aria-current={isActive ? 'page' : undefined}
              className={`px-2 py-1 rounded ${getMobileTabClass(isActive)}`}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
};

interface AdminTabContentProps {
  activeTab: TabKey;
  metrics: DashboardMetrics;
  preselectedRoundTeamId?: string;
  onRefreshMetrics: () => void;
  onSelectTab: (tab: TabKey) => void;
  onNavigateToRoundControlWithTeam: (teamId?: string) => void;
}

const AdminTabContent: React.FC<AdminTabContentProps> = ({
  activeTab,
  metrics,
  preselectedRoundTeamId,
  onRefreshMetrics,
  onSelectTab,
  onNavigateToRoundControlWithTeam,
}) => {
  switch (activeTab) {
    case 'dashboard':
      return (
        <AdminDashboardTab
          metrics={metrics}
          onRefresh={onRefreshMetrics}
          onNavigateToTeams={() => onSelectTab('teams')}
          onNavigateToRoundControl={() => onSelectTab('rounds')}
        />
      );
    case 'teams':
      return (
        <AdminTeamsTab
          onRefreshMetrics={onRefreshMetrics}
          onNavigateToRoundControl={onNavigateToRoundControlWithTeam}
        />
      );
    case 'rounds':
      return (
        <AdminRoundControlTab
          round1Status={metrics.round1Status}
          preselectedTeamId={preselectedRoundTeamId}
          onRefresh={onRefreshMetrics}
        />
      );
    case 'auction':
      return <AdminAuctionTab />;
    case 'results':
      return <AdminResultsTab />;
    case 'round4':
      return <AdminRound4Tab />;
    default:
      return null;
  }
};

export const AdminPortal: React.FC<AdminPortalProps> = ({ onNavigatePublic }) => {
  const [activeTab, setActiveTab] = useState<TabKey>(getInitialTab);
  const [metrics, setMetrics] = useState<DashboardMetrics>({ totalTeams: 0, waitingTeams: 0, activeTeams: 0, completedTeams: 0, pausedTeams: 0, round1Status: 'not_started', totalActiveSessions: 0 });
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [metricsError, setMetricsError] = useState<string | null>(null);
  const [preselectedRoundTeamId, setPreselectedRoundTeamId] = useState<string | undefined>();
  const testPreview = import.meta.env.MODE === 'test';
  const [authState, setAuthState] = useState<'checking' | 'signed-out' | 'signed-in'>(testPreview ? 'signed-in' : 'checking');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authBusy, setAuthBusy] = useState(false);

  const refreshMetrics = useCallback(async () => {
    setMetricsLoading(true);
    setMetricsError(null);
    try { setMetrics(await adminReadService.getDashboardMetrics()); }
    catch (error) { setMetricsError(error instanceof Error ? error.message : 'Could not load dashboard metrics.'); }
    finally { setMetricsLoading(false); }
  }, []);

  useEffect(() => {
    if (testPreview) return;
    let active = true;
    void adminAuthService.validate().then((valid) => { if (active) setAuthState(valid ? 'signed-in' : 'signed-out'); })
      .catch(() => { if (active) setAuthState('signed-out'); });
    return () => { active = false; };
  }, [testPreview]);

  useEffect(() => {
    if (authState === 'signed-in') void refreshMetrics();
  }, [authState, refreshMetrics]);

  const signIn = async (event: React.FormEvent) => {
    event.preventDefault(); setAuthBusy(true); setAuthError('');
    try { await adminAuthService.login(username, password); setPassword(''); setAuthState('signed-in'); }
    catch (error) { setAuthError(error instanceof Error ? error.message : 'Could not sign in to the control vault.'); }
    finally { setAuthBusy(false); }
  };

  const signOut = async () => {
    try { await adminAuthService.logout(); } catch { /* locally close controls even if the session already expired */ }
    setAuthState('signed-out');
  };

  const handleSelectTab = (tab: TabKey) => {
    setActiveTab(tab);
    window.location.hash = `#/admin/${tab}`;
  };

  const handleNavigateToRoundControlWithTeam = (teamId?: string) => {
    setPreselectedRoundTeamId(teamId);
    handleSelectTab('rounds');
    refreshMetrics();
  };

  if (authState === 'checking') return <main className="min-h-screen bg-[#0d1017] p-8 text-center text-cartel-silver" role="status">Checking administrator session…</main>;
  if (authState === 'signed-out') return (
    <main className="flex min-h-screen items-center justify-center bg-[#0d1017] px-4 text-cartel-bone">
      <form onSubmit={(event) => { void signIn(event); }} className="w-full max-w-md space-y-4 rounded-xl border border-cartel-amber/30 bg-black/50 p-6 shadow-2xl">
        <p className="font-cinzel text-xs uppercase tracking-[0.2em] text-cartel-amber">Frost Cartel · Control Vault</p>
        <h1 className="font-gothic text-3xl text-white">Administrator sign in</h1>
        <label className="block text-xs text-cartel-silver">Username<input autoComplete="username" required value={username} onChange={(event) => setUsername(event.target.value)} className="mt-1 w-full rounded border border-white/15 bg-black/40 px-3 py-2 text-white" /></label>
        <label className="block text-xs text-cartel-silver">Password<input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1 w-full rounded border border-white/15 bg-black/40 px-3 py-2 text-white" /></label>
        {authError && <p role="alert" className="text-sm text-red-300">{authError}</p>}
        <div className="flex items-center justify-between gap-3"><button type="button" onClick={onNavigatePublic} className="text-xs text-cartel-silver underline">Return to public portal</button><button disabled={authBusy} className="rounded border border-cartel-amber/50 bg-cartel-amber/10 px-4 py-2 font-cinzel text-xs font-bold text-cartel-amber disabled:opacity-50">{authBusy ? 'Checking…' : 'Sign in'}</button></div>
      </form>
    </main>
  );

  return (
    <div className="min-h-screen bg-[#0d1017] text-cartel-bone flex flex-col font-sans selection:bg-cartel-pumpkin selection:text-black">
      <AdminHeader
        activeTab={activeTab}
        totalTeams={metrics.totalTeams}
        onSelectTab={handleSelectTab}
        onNavigatePublic={onNavigatePublic}
      />

      {/* 2. Live PostgreSQL read status */}
      <output
        aria-live="polite"
        className="bg-cartel-midnight/90 border-b border-white/10 py-1.5 px-4 text-center text-[11px] font-mono text-cartel-silver/80 flex items-center justify-center gap-2 block"
      >
        <span className="w-2 h-2 rounded-full bg-cartel-amber animate-pulse" aria-hidden="true" />
        <span>
          <><strong className="text-cartel-amber">SERVER SESSION ACTIVE:</strong> Dashboard reads use authenticated PostgreSQL records.</>
        </span>
        {!testPreview && <button type="button" onClick={() => { void signOut(); }} className="ml-3 rounded border border-white/20 px-2 py-0.5 text-[10px] text-cartel-silver hover:text-white">Sign out</button>}
      </output>

      {/* 3. Main Admin Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && metricsLoading && <p role="status" className="mb-4 text-center text-sm text-cartel-silver">Loading dashboard metrics…</p>}
        {activeTab === 'dashboard' && metricsError && <div role="alert" className="mb-4 flex items-center justify-center gap-3 rounded border border-red-500/40 bg-red-950/30 p-3 text-sm text-red-200"><span>{metricsError}</span><button type="button" onClick={() => { void refreshMetrics(); }} className="underline">Retry</button></div>}
        <AdminTabContent
          activeTab={activeTab}
          metrics={metrics}
          preselectedRoundTeamId={preselectedRoundTeamId}
          onRefreshMetrics={refreshMetrics}
          onSelectTab={handleSelectTab}
          onNavigateToRoundControlWithTeam={handleNavigateToRoundControlWithTeam}
        />
      </main>
    </div>
  );
};
