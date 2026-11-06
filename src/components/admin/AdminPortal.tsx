import React, { useState } from 'react';
import type { DashboardMetrics } from '../../types/admin';
import { adminService } from '../../services/adminService';
import { AdminDashboardTab } from './dashboard/AdminDashboardTab';
import { AdminTeamsTab } from './teams/AdminTeamsTab';
import { AdminRoundControlTab } from './rounds/AdminRoundControlTab';
import { AdminResultsTab } from './results/AdminResultsTab';
import { AdminRound4Tab } from './round4/AdminRound4Tab';

interface AdminPortalProps {
  onNavigatePublic: () => void;
}

type TabKey = 'dashboard' | 'teams' | 'rounds' | 'results' | 'round4';

interface TabDefinition {
  key: TabKey;
  label: string;
  getLabel?: (count: number) => string;
}

const TABS: TabDefinition[] = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'teams', label: 'Teams', getLabel: (count) => `Teams (${count})` },
  { key: 'rounds', label: 'Round Control' },
  { key: 'results', label: 'Results' },
  { key: 'round4', label: 'Round 04 Expedition' },
];

function getInitialTab(): TabKey {
  const hash = window.location.hash;
  if (hash.includes('/teams')) return 'teams';
  if (hash.includes('/rounds')) return 'rounds';
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
  const [metrics, setMetrics] = useState<DashboardMetrics>(() =>
    adminService.getDashboardMetrics()
  );
  const [preselectedRoundTeamId, setPreselectedRoundTeamId] = useState<string | undefined>();

  const handleSelectTab = (tab: TabKey) => {
    setActiveTab(tab);
    window.location.hash = `#/admin/${tab}`;
  };

  const refreshMetrics = () => {
    setMetrics(adminService.getDashboardMetrics());
  };

  const handleNavigateToRoundControlWithTeam = (teamId?: string) => {
    setPreselectedRoundTeamId(teamId);
    handleSelectTab('rounds');
    refreshMetrics();
  };

  return (
    <div className="min-h-screen bg-[#0d1017] text-cartel-bone flex flex-col font-sans selection:bg-cartel-pumpkin selection:text-black">
      <AdminHeader
        activeTab={activeTab}
        totalTeams={metrics.totalTeams}
        onSelectTab={handleSelectTab}
        onNavigatePublic={onNavigatePublic}
      />

      {/* 2. Mock Mode Indicator Banner */}
      <output
        aria-live="polite"
        className="bg-cartel-midnight/90 border-b border-white/10 py-1.5 px-4 text-center text-[11px] font-mono text-cartel-silver/80 flex items-center justify-center gap-2 block"
      >
        <span className="w-2 h-2 rounded-full bg-cartel-amber animate-pulse" aria-hidden="true" />
        <span>
          <strong className="text-cartel-amber">MOCK REPOSITORY ACTIVE:</strong> Isolated memory
          store initialized with tournament roster. All admin operations are live and ready to connect to
          the production database.
        </span>
      </output>

      {/* 3. Main Admin Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
