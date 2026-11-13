import React, { useEffect, useState } from 'react';
import { round1Api } from '../../../services/round1ApiService';

export const AdminStageConfigPanel: React.FC = () => {
  const [activeStageTab, setActiveStageTab] = useState<'stage-1' | 'stage-2' | 'stage-3'>('stage-1');
  const [stage1Title, setStage1Title] = useState('');
  const [stage1Desc, setStage1Desc] = useState('');
  const [stage1Instructions, setStage1Instructions] = useState('');
  const [stage1Ready, setStage1Ready] = useState(false);

  const [stage2HintDeduction, setStage2HintDeduction] = useState(0);
  const [stage2Penalty, setStage2Penalty] = useState(0);

  const [stage3Code, setStage3Code] = useState('');
  const [stage3FinalAnswer, setStage3FinalAnswer] = useState('');
  const [stage3Penalty, setStage3Penalty] = useState(0);

  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void round1Api.adminConfig().then(({ configuration }) => {
      setStage1Title(configuration.stage1.title); setStage1Desc(configuration.stage1.description);
      setStage1Instructions(configuration.stage1.instructions); setStage1Ready(configuration.stage1.isReadyForPublication);
      setStage2HintDeduction(configuration.stage2.hintDeduction); setStage2Penalty(configuration.stage2.incorrectClickPenalty);
      setStage3Code(configuration.stage3.grave2.correctCode); setStage3FinalAnswer(configuration.stage3.finalGate.acceptedAnswer);
      setStage3Penalty(configuration.stage3.incorrectAnswerPenalty);
    }).catch((error: unknown) => setErrorMessage(error instanceof Error ? error.message : 'Could not load trusted puzzle configuration.'));
  }, []);

  const save = async (e: React.FormEvent, group: 'stage1' | 'stage2' | 'stage3', patch: Record<string, unknown>, label: string) => {
    e.preventDefault();
    setSaving(true); setErrorMessage(null);
    try { await round1Api.updateAdminConfig(group, patch); setSaveMessage(`${label} Configuration Saved Successfully.`); setTimeout(() => setSaveMessage(null), 3000); }
    catch (error) { setErrorMessage(error instanceof Error ? error.message : 'Configuration could not be saved.'); }
    finally { setSaving(false); }
  };

  const handleSaveStage1 = (e: React.FormEvent) => save(e, 'stage1', {
      title: stage1Title, description: stage1Desc, instructions: stage1Instructions, isReadyForPublication: stage1Ready,
    }, 'Stage 1');
  const handleSaveStage2 = (e: React.FormEvent) => save(e, 'stage2', {
      hintDeduction: Number(stage2HintDeduction),
      incorrectClickPenalty: Number(stage2Penalty),
    }, 'Stage 2');
  const handleSaveStage3 = (e: React.FormEvent) => save(e, 'stage3', {
    correctCode: stage3Code.trim(), acceptedAnswer: stage3FinalAnswer.trim().toUpperCase(), incorrectAnswerPenalty: Number(stage3Penalty),
  }, 'Stage 3');

  return (
    <div className="stone-panel rounded-xl p-5 border border-white/10 shadow-xl space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div>
          <div className="text-[10px] font-cinzel text-cartel-amber uppercase font-bold tracking-widest">
            ROUND 1 GAMEPLAY ENGINE
          </div>
          <h3 className="text-sm font-cinzel font-bold text-white tracking-wide">
            CHAMBER RULES &amp; PUZZLE CONFIGURATION
          </h3>
        </div>

        {saveMessage && (
          <span className="text-xs font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-500/50 px-3 py-1 rounded">
            {saveMessage}
          </span>
        )}
        {errorMessage && <span role="alert" className="text-xs text-red-300">{errorMessage}</span>}
      </div>

      {/* Stage Selector Tabs */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveStageTab('stage-1')}
          className={`px-3 py-1.5 rounded-lg text-xs font-cinzel font-bold uppercase transition-all cursor-pointer ${
            activeStageTab === 'stage-1'
              ? 'bg-cartel-pumpkin/20 border border-cartel-pumpkin text-cartel-pumpkin'
              : 'bg-cartel-charcoal border border-white/10 text-cartel-silver hover:text-white'
          }`}
        >
          Stage 1 (Pending Framework)
        </button>
        <button
          type="button"
          onClick={() => setActiveStageTab('stage-2')}
          className={`px-3 py-1.5 rounded-lg text-xs font-cinzel font-bold uppercase transition-all cursor-pointer ${
            activeStageTab === 'stage-2'
              ? 'bg-cartel-amber/20 border border-cartel-amber text-cartel-amber'
              : 'bg-cartel-charcoal border border-white/10 text-cartel-silver hover:text-white'
          }`}
        >
          Stage 2 (Haunted Image Hunt)
        </button>
        <button
          type="button"
          onClick={() => setActiveStageTab('stage-3')}
          className={`px-3 py-1.5 rounded-lg text-xs font-cinzel font-bold uppercase transition-all cursor-pointer ${
            activeStageTab === 'stage-3'
              ? 'bg-cartel-cyan/20 border border-cartel-cyan text-cartel-cyan'
              : 'bg-cartel-charcoal border border-white/10 text-cartel-silver hover:text-white'
          }`}
        >
          Stage 3 (The Forgotten Graveyard)
        </button>
      </div>

      {/* STAGE 1 EDITOR */}
      {activeStageTab === 'stage-1' && (
        <form onSubmit={handleSaveStage1} className="space-y-3 pt-2">
          <div className="p-3 rounded bg-amber-950/20 border border-amber-500/30 text-xs text-amber-200">
            <strong>Production Readiness Rule:</strong> Stage 1 challenge is currently pending. Organizers cannot publish Round 1 as fully playable until the challenge has been finalized. Reward: 100 Credits reserved.
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="stage1-title" className="block text-[10px] font-cinzel font-bold text-cartel-silver uppercase mb-1">
                Chamber Title
              </label>
              <input
                id="stage1-title"
                type="text"
                value={stage1Title}
                onChange={(e) => setStage1Title(e.target.value)}
                className="w-full bg-cartel-charcoal border border-white/10 rounded px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-cartel-pumpkin"
              />
            </div>
            <div>
              <label htmlFor="stage1-desc" className="block text-[10px] font-cinzel font-bold text-cartel-silver uppercase mb-1">
                Description / Tagline
              </label>
              <input
                id="stage1-desc"
                type="text"
                value={stage1Desc}
                onChange={(e) => setStage1Desc(e.target.value)}
                className="w-full bg-cartel-charcoal border border-white/10 rounded px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-cartel-pumpkin"
              />
            </div>
          </div>

          <div>
            <label htmlFor="stage1-instr" className="block text-[10px] font-cinzel font-bold text-cartel-silver uppercase mb-1">
              Briefing Note / Instructions
            </label>
            <textarea
              id="stage1-instr"
              rows={2}
              value={stage1Instructions}
              onChange={(e) => setStage1Instructions(e.target.value)}
              className="w-full bg-cartel-charcoal border border-white/10 rounded px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-cartel-pumpkin"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-mono text-cartel-silver">
              <input
                type="checkbox"
                checked={stage1Ready}
                onChange={(e) => setStage1Ready(e.target.checked)}
                className="rounded border-white/20 text-cartel-pumpkin focus:ring-0"
              />
              <span>Mark Stage 1 Ready For Tournament Publication</span>
            </label>

            <button
              type="submit" disabled={saving}
              className="px-4 py-1.5 rounded bg-cartel-pumpkin text-cartel-void font-cinzel font-black text-xs uppercase"
            >
              Save Stage 1
            </button>
          </div>
        </form>
      )}

      {/* STAGE 2 EDITOR */}
      {activeStageTab === 'stage-2' && (
        <form onSubmit={handleSaveStage2} className="space-y-3 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="stage2-hint" className="block text-[10px] font-cinzel font-bold text-cartel-amber uppercase mb-1">
                Hint Usage Deduction (Credits)
              </label>
              <input
                id="stage2-hint"
                type="number"
                min={0}
                max={50}
                value={stage2HintDeduction}
                onChange={(e) => setStage2HintDeduction(Number(e.target.value))}
                className="w-full bg-cartel-charcoal border border-white/10 rounded px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-cartel-amber"
              />
              <span className="text-[10px] text-cartel-silver/50">Deducted when squad confirms an occult hint.</span>
            </div>

            <div>
              <label htmlFor="stage2-penalty" className="block text-[10px] font-cinzel font-bold text-cartel-amber uppercase mb-1">
                Incorrect Click Penalty (Credits)
              </label>
              <input
                id="stage2-penalty"
                type="number"
                min={0}
                max={25}
                value={stage2Penalty}
                onChange={(e) => setStage2Penalty(Number(e.target.value))}
                className="w-full bg-cartel-charcoal border border-white/10 rounded px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-cartel-amber"
              />
              <span className="text-[10px] text-cartel-silver/50">Leave 0 to disable penalty for false search clicks.</span>
            </div>
          </div>

          <div className="p-3 rounded bg-black/40 border border-white/10 text-xs font-mono">
            <div className="text-[10px] text-cartel-silver/60 uppercase mb-1">Current Target Objects (11 Relics):</div>
            <div className="text-white">Pumpkin, Skull, Bat, Witch Hat, Spider, Spider Web, Coffin, Black Cat, Potion Bottle, Lantern, Skeleton Key.</div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit" disabled={saving}
              className="px-4 py-1.5 rounded bg-cartel-amber text-cartel-void font-cinzel font-black text-xs uppercase"
            >
              Save Stage 2 Settings
            </button>
          </div>
        </form>
      )}

      {/* STAGE 3 EDITOR */}
      {activeStageTab === 'stage-3' && (
        <form onSubmit={handleSaveStage3} className="space-y-3 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="stage3-code" className="block text-[10px] font-cinzel font-bold text-cartel-cyan uppercase mb-1">
                Grave 2 Coffer Code
              </label>
              <input
                id="stage3-code"
                type="text"
                maxLength={4}
                value={stage3Code}
                onChange={(e) => setStage3Code(e.target.value)}
                className="w-full bg-cartel-charcoal border border-white/10 rounded px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-cartel-cyan"
              />
              <span className="text-[10px] text-cartel-silver/50">Derived from 1891, 1904, 1927 final digits.</span>
            </div>

            <div>
              <label htmlFor="stage3-answer" className="block text-[10px] font-cinzel font-bold text-cartel-cyan uppercase mb-1">
                Accepted Escape Answer
              </label>
              <input
                id="stage3-answer"
                type="text"
                value={stage3FinalAnswer}
                onChange={(e) => setStage3FinalAnswer(e.target.value)}
                className="w-full bg-cartel-charcoal border border-white/10 rounded px-3 py-1.5 text-xs text-white font-mono uppercase focus:outline-none focus:border-cartel-cyan"
              />
              <span className="text-[10px] text-cartel-silver/50">Normalized case &amp; whitespace.</span>
            </div>

            <div>
              <label htmlFor="stage3-pen" className="block text-[10px] font-cinzel font-bold text-cartel-cyan uppercase mb-1">
                Wrong Gate Attempt Penalty (CR)
              </label>
              <input
                id="stage3-pen"
                type="number"
                min={0}
                max={50}
                value={stage3Penalty}
                onChange={(e) => setStage3Penalty(Number(e.target.value))}
                className="w-full bg-cartel-charcoal border border-white/10 rounded px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-cartel-cyan"
              />
              <span className="text-[10px] text-cartel-silver/50">Deducted for incorrect incantations.</span>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit" disabled={saving}
              className="px-4 py-1.5 rounded bg-cartel-cyan text-cartel-void font-cinzel font-black text-xs uppercase"
            >
              Save Stage 3 Settings
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

