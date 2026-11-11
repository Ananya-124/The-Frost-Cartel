import React, { useState, useEffect, useRef } from 'react';
import type { Round4AdminOverview, QualifiedTeamAssignment } from '../../../types/round4Expedition.types';
import { round4Service } from '../../../services/round4Service';
import { getFloorMapConfig } from '../../game/round4/FloorMapConfiguration';

function renderSquadStatusBadge(team: QualifiedTeamAssignment, winnerTeamId?: string): React.JSX.Element {
  if (team.isFinished !== 1) {
    return <span className="text-amber-400">In Progress</span>;
  }
  if (winnerTeamId === team.teamId) {
    return (
      <span className="px-2 py-0.5 rounded bg-amber-400 text-black font-cinzel font-black">
        👑 CHAMPION
      </span>
    );
  }
  return <span className="text-cartel-silver">Completed</span>;
}

export const AdminRound4Tab: React.FC = () => {
  const [overview, setOverview] = useState<Round4AdminOverview | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const saving = useRef(false);
  const [activeSubTab, setActiveSubTab] = useState<'monitoring' | 'qualification' | 'editor'>('monitoring');
  const [notice, setNotice] = useState<string | null>(null);

  // Qualification State (max 7 teams)
  const [assignments, setAssignments] = useState<Array<{ teamId: string; routeId: string }>>([]);

  // Editor State
  const [selectedRouteId, setSelectedRouteId] = useState<string>('');
  const [selectedClueIndex, setSelectedClueIndex] = useState<number>(1);
  const [editingStep, setEditingStep] = useState<{
    riddleText: string;
    fieldLocationHint: string;
    acceptedAnswers: string;
    floorId: string;
    locationName: string;
    targetX: number;
    targetY: number;
    triggerRadius: number;
  }>({
    riddleText: '',
    fieldLocationHint: '',
    acceptedAnswers: '',
    floorId: '',
    locationName: '',
    targetX: 0,
    targetY: 0,
    triggerRadius: 0,
  });

  const loadOverview = async () => {
    setIsLoading(true); setLoadError(null);
    try {
      const data = await round4Service.getAdminOverview();
      if (!data.settings || !Array.isArray(data.routes) || !Array.isArray(data.steps) || !Array.isArray(data.qualifiedTeams) || !Array.isArray(data.availableTeams)) {
        throw new Error('Round 04 overview response is incomplete.');
      }
      setOverview(data);
      setAssignments(data.qualifiedTeams.map((q) => ({ teamId: q.teamId, routeId: q.routeId })));
      const firstStep = data.steps.find((step) => step.routeId === selectedRouteId && step.clueIndex === selectedClueIndex) ?? data.steps[0];
      if (firstStep) {
        setSelectedRouteId(firstStep.routeId); setSelectedClueIndex(firstStep.clueIndex);
        let answers: string[] = [];
        try { answers = JSON.parse(firstStep.acceptedAnswersJson || '[]'); } catch { answers = []; }
        setEditingStep({ riddleText: firstStep.riddleText, fieldLocationHint: firstStep.fieldLocationHint, acceptedAnswers: answers.join(', '), floorId: firstStep.floorId, locationName: firstStep.locationName, targetX: firstStep.targetX, targetY: firstStep.targetY, triggerRadius: firstStep.triggerRadius });
      }
    } catch (error) {
      setOverview(null); setLoadError(error instanceof Error ? error.message : 'Round 04 overview could not be loaded.');
    } finally { setIsLoading(false); }
  };

  useEffect(() => {
    void loadOverview();
  }, []);

  const runAdminAction = async (action: () => Promise<string>) => {
    if (saving.current) return;
    saving.current = true; setIsSaving(true); setNotice(null); setLoadError(null);
    try {
      setNotice(await action());
      await loadOverview();
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'The Round 04 action could not be completed.');
    } finally { saving.current = false; setIsSaving(false); }
  };

  const handleSelectRouteOrClue = (newRouteId: string, newClueIndex: number) => {
    setSelectedRouteId(newRouteId);
    setSelectedClueIndex(newClueIndex);
    setLoadError(null);

    if (!overview?.steps) return;
    const found = overview.steps.find(
      (s) => s.routeId === newRouteId && s.clueIndex === newClueIndex
    );
    if (found) {
      let answersArr: string[] = [];
      try {
        answersArr = JSON.parse(found.acceptedAnswersJson || '[]');
      } catch {
        answersArr = [];
      }

      setEditingStep({
        riddleText: found.riddleText,
        fieldLocationHint: found.fieldLocationHint,
        acceptedAnswers: answersArr.join(', '),
        floorId: found.floorId,
        locationName: found.locationName,
        targetX: found.targetX,
        targetY: found.targetY,
        triggerRadius: found.triggerRadius,
      });
    } else {
      setEditingStep({ riddleText: '', fieldLocationHint: '', acceptedAnswers: '', floorId: '', locationName: '', targetX: 0, targetY: 0, triggerRadius: 0 });
      setLoadError('The selected clue is missing from the server catalog. Reload the Round 04 overview.');
    }
    };

  const handleToggleRelease = async () => {
    if (!overview) return;
    const nextState = overview.settings.is_released !== 1;
    await runAdminAction(async () => {
      const result = await round4Service.setAdminRelease(nextState);
      return `Round 04 is now ${result.isReleased ? 'RELEASED to qualified squads' : 'SEALED'}.`;
    });
  };

  const handleResetTournament = async () => {
    if (!window.confirm('Are you sure you want to RESET Round 04? This will clear the champion record and reset all 7 teams back to Clue 1.')) {
      return;
    }
    await runAdminAction(async () => {
      const result = await round4Service.resetAdminTournament();
      return result.message;
    });
  };

  const handleSaveQualifications = async () => {
    if (assignments.length > 7) {
      setNotice('Error: Exactly seven teams (or fewer) can be qualified.');
      return;
    }
    await runAdminAction(async () => {
      const result = await round4Service.qualifyAdminTeams(assignments);
      return result.message;
    });
  };

  const handleSaveStep = async () => {
    const stepId = overview?.steps.find((step) => step.routeId === selectedRouteId && step.clueIndex === selectedClueIndex)?.id;
    if (!stepId) { setLoadError('The selected clue is missing from the server catalog. Reload the Round 04 overview.'); return; }
    const answers = editingStep.acceptedAnswers
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    await runAdminAction(async () => {
      const result = await round4Service.configureAdminStep({
          stepId,
          riddleText: editingStep.riddleText,
          fieldLocationHint: editingStep.fieldLocationHint,
          acceptedAnswers: answers,
          targetX: editingStep.targetX,
          targetY: editingStep.targetY,
          triggerRadius: editingStep.triggerRadius,
          floorId: editingStep.floorId,
          locationName: editingStep.locationName,
      });
      return result.message;
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12 text-cartel-amber font-cinzel">
        Loading Round 04 Tournament State...
      </div>
    );
  }

  if (!overview && loadError) return <div className="space-y-4 rounded-xl border border-red-500/40 bg-red-950/20 p-6 text-center text-sm text-red-200"><p role="alert">{loadError}</p><button type="button" disabled={isLoading} onClick={() => { void loadOverview(); }} className="rounded border border-red-300/40 px-4 py-2 text-xs disabled:opacity-50">Retry Round 04 data</button></div>;
  if (!overview) return <div role="status" className="p-8 text-center text-sm text-cartel-silver">Round 04 data is unavailable.</div>;

  const mapConfig = getFloorMapConfig(editingStep.floorId);

  return (
    <div className="space-y-6 text-cartel-bone font-sans">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-cartel-midnight/90 border border-cartel-amber/40 shadow-lg">
        <div>
          <div className="text-[10px] font-cinzel text-cartel-amber uppercase font-bold tracking-widest">
            ROUND 04 MASTER SUITE
          </div>
          <h2 className="text-xl font-cinzel font-black text-white">
            Seven Teams, Seven Routes, One Common Treasure
          </h2>
          <div className="text-xs text-cartel-silver mt-1">
            Status:{' '}
            <span className={overview?.settings.is_released === 1 ? 'text-emerald-400 font-bold' : 'text-amber-500 font-bold'}>
              {overview?.settings.is_released === 1 ? 'RELEASED' : 'SEALED (ADMIN ACCESS ONLY)'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={isSaving}
            onClick={() => { void handleToggleRelease(); }}
            className={`px-3 py-1.5 rounded font-cinzel text-xs font-bold uppercase tracking-wider cursor-pointer border transition-colors ${
              overview?.settings.is_released === 1
                ? 'bg-amber-950/80 hover:bg-amber-900 border-amber-600 text-amber-200'
                : 'bg-emerald-950/80 hover:bg-emerald-900 border-emerald-600 text-emerald-200'
            }`}
          >
            {overview?.settings.is_released === 1 ? 'Pause / Seal Round 04' : 'Release Round 04'}
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={() => { void handleResetTournament(); }}
            className="px-3 py-1.5 rounded bg-red-950/60 hover:bg-red-900/80 border border-red-700/60 text-red-300 font-cinzel text-xs font-bold uppercase tracking-wider cursor-pointer"
          >
            Reset Tournament
          </button>
        </div>
      </div>

      {/* Notice Banner */}
      {notice && (
        <div className="p-3 rounded-lg bg-cartel-amber/20 border border-cartel-amber text-xs font-cinzel text-cartel-amber flex items-center justify-between">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice(null)} className="text-sm font-bold cursor-pointer">✕</button>
        </div>
      )}
      {loadError && <div role="alert" className="flex items-center justify-between gap-3 rounded border border-red-500/40 bg-red-950/30 p-3 text-xs text-red-200"><span>{loadError}</span><button type="button" disabled={isLoading} onClick={() => { void loadOverview(); }} className="underline disabled:opacity-50">Retry</button></div>}

      {/* Winner Spotlight Banner if Winner Recorded */}
      {overview?.winner && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/80 via-yellow-900/50 to-amber-950/80 border-2 border-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.3)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">👑</span>
            <div>
              <div className="text-[10px] font-cinzel text-amber-300 font-bold uppercase tracking-widest">
                OFFICIAL CHAMPION DECLARED
              </div>
              <div className="text-xl font-cinzel font-black text-white">
                TEAM {overview.winner.teamName.toUpperCase()}
              </div>
              <div className="text-xs text-amber-200 font-mono">
                Victory Recorded: {new Date(overview.winner.solvedAt).toLocaleTimeString()}
              </div>
            </div>
          </div>
          <span className="px-3 py-1 rounded bg-amber-400 text-black font-cinzel text-xs font-black uppercase">
            CHAMPION
          </span>
        </div>
      )}

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2">
        <button
          type="button"
          onClick={() => setActiveSubTab('monitoring')}
          className={`px-3 py-1.5 rounded font-cinzel text-xs uppercase font-bold tracking-wider cursor-pointer ${
            activeSubTab === 'monitoring'
              ? 'bg-cartel-charcoal text-cartel-amber border border-cartel-amber/60'
              : 'text-cartel-silver hover:text-white'
          }`}
        >
          Live Monitoring ({overview?.qualifiedTeams.length ?? 0} Teams)
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('qualification')}
          className={`px-3 py-1.5 rounded font-cinzel text-xs uppercase font-bold tracking-wider cursor-pointer ${
            activeSubTab === 'qualification'
              ? 'bg-cartel-charcoal text-cartel-amber border border-cartel-amber/60'
              : 'text-cartel-silver hover:text-white'
          }`}
        >
          7-Team Qualification & Routes
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('editor')}
          className={`px-3 py-1.5 rounded font-cinzel text-xs uppercase font-bold tracking-wider cursor-pointer ${
            activeSubTab === 'editor'
              ? 'bg-cartel-charcoal text-cartel-amber border border-cartel-amber/60'
              : 'text-cartel-silver hover:text-white'
          }`}
        >
          Visual Clue Editor (35 Steps)
        </button>
      </div>

      {/* TAB 1: LIVE MONITORING */}
      {activeSubTab === 'monitoring' && (
        <div className="p-4 rounded-xl bg-cartel-charcoal/60 border border-white/10 overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="border-b border-white/10 text-cartel-amber font-cinzel uppercase">
                <th className="py-2 px-3">Squad Name</th>
                <th className="py-2 px-3">Assigned Route</th>
                <th className="py-2 px-3">Current Clue</th>
                <th className="py-2 px-3">Target Reached</th>
                <th className="py-2 px-3">Final Room Arrival</th>
                <th className="py-2 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {overview.qualifiedTeams.length === 0 ? <tr><td colSpan={6} className="p-6 text-center text-cartel-silver/60">No teams are currently qualified.</td></tr> : overview.qualifiedTeams.map((team) => (
                <tr key={team.teamId} className="hover:bg-white/5">
                  <td className="py-2.5 px-3 font-bold text-white">{team.teamName}</td>
                  <td className="py-2.5 px-3 font-cinzel text-amber-300">
                    {team.routeName} ({team.romanNumeral})
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded bg-white/10 font-mono text-xs">
                      Clue {team.currentStepIndex + 1} / 5
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    {team.targetDiscovered === 1 ? (
                      <span className="text-emerald-400 font-bold">✓ Target Reached</span>
                    ) : (
                      <span className="text-cartel-silver/60">Searching Map...</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3">
                    {team.commonRoomArrived === 1 ? (
                      <span className="text-amber-400 font-bold">✓ At Common Vault</span>
                    ) : (
                      <span className="text-cartel-silver/60">En Route</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3">
                    {renderSquadStatusBadge(team, overview.winner?.teamId)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 2: QUALIFICATION & ROUTE ASSIGNMENT */}
      {activeSubTab === 'qualification' && (
        <div className="space-y-4 p-4 rounded-xl bg-cartel-charcoal/60 border border-white/10">
          <div className="text-xs text-cartel-silver leading-relaxed">
            Configure exactly seven qualified squads after Round 03 and assign one unique route to each squad.
            A squad cannot enter Round 04 unless qualified here.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {overview.routes.length === 0 && <p className="text-xs text-cartel-silver/60">No Round 04 routes are available in PostgreSQL.</p>}
            {overview.routes.map((route) => {
              const currentAssign = assignments.find((a) => a.routeId === route.id);
              return (
                <div key={route.id} className="p-3 rounded-lg bg-black/40 border border-white/10 flex items-center justify-between">
                  <div>
                    <div className="font-cinzel text-xs font-bold text-amber-400">
                      ROUTE {route.roman_numeral} • {route.route_name}
                    </div>
                    <div className="text-[11px] text-cartel-silver/70">{route.route_subtitle}</div>
                  </div>

                  <select
                    disabled={isSaving}
                    value={currentAssign?.teamId || ''}
                    aria-label={`Assign squad to Route ${route.roman_numeral}`}
                    onChange={(e) => {
                      const newTeamId = e.target.value;
                      const updated = assignments.filter((a) => a.routeId !== route.id && a.teamId !== newTeamId);
                      if (newTeamId) {
                        updated.push({ teamId: newTeamId, routeId: route.id });
                      }
                      setAssignments(updated);
                    }}
                    className="p-1.5 rounded bg-cartel-charcoal border border-white/20 text-xs text-white"
                  >
                    <option value="">-- Unassigned --</option>
                    {overview.availableTeams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.teamName} (Score: {team.score})
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <span className="text-xs font-mono text-cartel-silver">
              Qualified: <strong className="text-amber-400">{assignments.length}</strong> / 7 Squads
            </span>
            <button
              type="button"
              disabled={isSaving}
              onClick={() => { void handleSaveQualifications(); }}
              className="px-4 py-2 rounded bg-cartel-amber hover:bg-amber-400 text-black font-cinzel font-bold text-xs uppercase tracking-wider cursor-pointer shadow-lg"
            >
              {isSaving ? 'Saving…' : 'Confirm 7-Team Qualification & Save Assignments'}
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: VISUAL CLUE PLACEMENT & RIDDLE EDITOR */}
      {activeSubTab === 'editor' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-4 rounded-xl bg-cartel-charcoal/60 border border-white/10">
          {/* Left Column: Route / Step Selector & Interactive Floor Map Canvas */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <select
                value={selectedRouteId}
                aria-label="Select Expedition Route"
                onChange={(e) => handleSelectRouteOrClue(e.target.value, selectedClueIndex)}
                className="p-1.5 rounded bg-black border border-white/20 text-xs text-amber-300 font-cinzel"
              >
                {overview.routes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.route_name} ({r.roman_numeral})
                  </option>
                ))}
              </select>

              <select
                value={selectedClueIndex}
                aria-label="Select Clue Step"
                onChange={(e) => handleSelectRouteOrClue(selectedRouteId, Number(e.target.value))}
                className="p-1.5 rounded bg-black border border-white/20 text-xs text-white font-cinzel"
              >
                {[1, 2, 3, 4, 5].map((idx) => (
                  <option key={idx} value={idx}>
                    Clue Step {idx} {idx === 5 ? '(Common Final Room)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Click-to-Place Target Map Area */}
            <div className="relative rounded-lg overflow-hidden border border-amber-500/40 bg-black cursor-crosshair">
              <input
                type="image"
                src={mapConfig.mapImage}
                alt="Floor Plan Canvas - Click to set clue target"
                className="w-full h-auto block select-none cursor-crosshair"
                onClick={(e) => {
                  e.preventDefault();
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickX = e.clientX - rect.left;
                  const clickY = e.clientY - rect.top;
                  const scaleX = mapConfig.mapWidth / rect.width;
                  const scaleY = mapConfig.mapHeight / rect.height;
                  const newX = Math.round(clickX * scaleX);
                  const newY = Math.round(clickY * scaleY);
                  setEditingStep((prev) => ({ ...prev, targetX: newX, targetY: newY }));
                  setNotice(`Target placed at X:${newX}, Y:${newY}`);
                }}
              />

              {/* Glowing Target Marker */}
              <div
                className="absolute w-6 h-6 -ml-3 -mt-3 rounded-full border-2 border-amber-300 bg-amber-400/60 shadow-[0_0_15px_rgba(255,215,0,0.9)] animate-pulse pointer-events-none flex items-center justify-center text-[10px] text-black font-bold"
                style={{
                  left: `${(editingStep.targetX / mapConfig.mapWidth) * 100}%`,
                  top: `${(editingStep.targetY / mapConfig.mapHeight) * 100}%`,
                }}
              >
                ✦
              </div>
            </div>
            <div className="text-[11px] text-cartel-silver/70 italic">
              💡 Click anywhere on the floor plan above to reposition the golden clue target.
            </div>
          </div>

          {/* Right Column: Step Fields */}
          <div className="space-y-3">
            <div>
              <label htmlFor="round4-editor-floor" className="block text-[11px] font-cinzel text-cartel-amber uppercase mb-1">
                Floor Plan & Map Asset
              </label>
              <select
                id="round4-editor-floor"
                value={editingStep.floorId}
                onChange={(e) => setEditingStep((prev) => ({ ...prev, floorId: e.target.value }))}
                className="w-full p-2 rounded bg-black/80 border border-white/20 text-xs text-white"
              >
                <option value="floor-7">Seventh Floor (Observatory & Celestial Vault)</option>
                <option value="floor-6">Sixth Floor (Scriptorium & Cartographer Bays)</option>
                <option value="floor-5">Fifth Floor (Alchemical & Analytical Labs)</option>
                <option value="floor-4">Fourth Floor (Conservation & Rare Folios)</option>
                <option value="floor-3">Third Floor (Engineering & Foundations Gallery)</option>
                <option value="floor-2">Second Floor (Physics & Harmonic Labs)</option>
                <option value="floor-1">First Floor (Grand Foyer & Foundation Stone)</option>
              </select>
            </div>

            <div>
              <label htmlFor="round4-editor-location" className="block text-[11px] font-cinzel text-cartel-amber uppercase mb-1">
                Location Name
              </label>
              <input
                id="round4-editor-location"
                type="text"
                value={editingStep.locationName}
                onChange={(e) => setEditingStep((prev) => ({ ...prev, locationName: e.target.value }))}
                className="w-full p-2 rounded bg-black/80 border border-white/20 text-xs text-white"
              />
            </div>

            <div>
              <label htmlFor="round4-editor-riddle" className="block text-[11px] font-cinzel text-cartel-amber uppercase mb-1">
                Riddle Text (Unlocked upon arrival)
              </label>
              <textarea
                id="round4-editor-riddle"
                rows={3}
                value={editingStep.riddleText}
                onChange={(e) => setEditingStep((prev) => ({ ...prev, riddleText: e.target.value }))}
                className="w-full p-2 rounded bg-black/80 border border-white/20 text-xs text-white"
              />
            </div>

            <div>
              <label htmlFor="round4-editor-hint" className="block text-[11px] font-cinzel text-cartel-amber uppercase mb-1">
                Field Location Hint (For Field Partner)
              </label>
              <input
                id="round4-editor-hint"
                type="text"
                value={editingStep.fieldLocationHint}
                onChange={(e) => setEditingStep((prev) => ({ ...prev, fieldLocationHint: e.target.value }))}
                className="w-full p-2 rounded bg-black/80 border border-white/20 text-xs text-white"
              />
            </div>

            <div>
              <label htmlFor="round4-editor-answers" className="block text-[11px] font-cinzel text-cartel-amber uppercase mb-1">
                Accepted Answers (Comma-separated, case-insensitive)
              </label>
              <input
                id="round4-editor-answers"
                type="text"
                value={editingStep.acceptedAnswers}
                onChange={(e) => setEditingStep((prev) => ({ ...prev, acceptedAnswers: e.target.value }))}
                className="w-full p-2 rounded bg-black/80 border border-white/20 text-xs text-white font-mono"
              />
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleSaveStep}
                className="w-full py-2 rounded bg-cartel-amber hover:bg-amber-400 text-black font-cinzel font-bold text-xs uppercase tracking-wider cursor-pointer shadow-lg"
              >
                Save Clue Configuration
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
