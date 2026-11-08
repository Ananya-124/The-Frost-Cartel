import React, { useState, useEffect } from 'react';
import type { TeamSession } from '../../types/team.types';
import { authService } from '../../services/authService';

interface Round1GraveyardEscapeProps {
  session: TeamSession;
  onReturnHome: () => void;
  onOpenDashboard: () => void;
  onUpdateCredits: (newCredits: number) => void;
}

type ActiveChamber = 'crypt' | 'mausoleum' | 'gate';

export const Round1GraveyardEscape: React.FC<Round1GraveyardEscapeProps> = ({
  session,
  onReturnHome,
  onOpenDashboard,
  onUpdateCredits,
}) => {
  const [activeChamber, setActiveChamber] = useState<ActiveChamber>('crypt');
  const [credits, setCredits] = useState<number>(session.credits || 0);
  const [timeRemaining, setTimeRemaining] = useState<number>(24 * 60 + 59); // 24m 59s
  const [notice, setNotice] = useState<string | null>(null);

  // Chamber 1: Runic Sequence
  const [cryptSolved, setCryptSolved] = useState<boolean>(false);
  const [runicSequence, setRunicSequence] = useState<string[]>([]);
  const targetRunicSequence = ['blood', 'iron', 'thorns', 'gold'];

  // Chamber 2: Sarcophagus Alignment
  const [mausoleumSolved, setMausoleumSolved] = useState<boolean>(false);
  const [dial1, setDial1] = useState<number>(0); // 0: Gargoyle, 1: Moon, 2: Skull (Target: 2)
  const [dial2, setDial2] = useState<number>(0); // 0: Raven, 1: Serpent, 2: Wolf (Target: 1)
  const [dial3, setDial3] = useState<number>(0); // 0: Dagger, 1: Chalice, 2: Key (Target: 1)

  // Chamber 3: Gate Cipher
  const [gateSolved, setGateSolved] = useState<boolean>(false);
  const [cipherInput, setCipherInput] = useState<string>('');
  const [cipherError, setCipherError] = useState<string | null>(null);

  // Live Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const awardCredits = (amount: number, reason: string) => {
    const updated = Math.min(500, credits + amount);
    setCredits(updated);
    onUpdateCredits(updated);
    authService.updateSessionCredits(updated);
    setNotice(`+${amount} Credits unsealed! ${reason}`);
    setTimeout(() => setNotice(null), 4000);
  };

  // Chamber 1 logic
  const handleRuneClick = (runeKey: string) => {
    if (cryptSolved) return;
    const nextSeq = [...runicSequence, runeKey];
    setRunicSequence(nextSeq);

    // Check progress
    const idx = nextSeq.length - 1;
    if (targetRunicSequence[idx] !== runeKey) {
      // Wrong sequence
      setNotice('The ancient runes reject your touch. Sequence reset.');
      setRunicSequence([]);
      setTimeout(() => setNotice(null), 2500);
      return;
    }

    if (nextSeq.length === targetRunicSequence.length) {
      // Solved
      setCryptSolved(true);
      awardCredits(150, 'The Crypt Chamber has been decoded.');
    }
  };

  // Chamber 2 logic
  const handleDialClick = (dialIndex: 1 | 2 | 3) => {
    if (mausoleumSolved) return;
    let n1 = dial1;
    let n2 = dial2;
    let n3 = dial3;

    if (dialIndex === 1) {
      n1 = (dial1 + 1) % 3;
      setDial1(n1);
    } else if (dialIndex === 2) {
      n2 = (dial2 + 1) % 3;
      setDial2(n2);
    } else {
      n3 = (dial3 + 1) % 3;
      setDial3(n3);
    }

    if (n1 === 2 && n2 === 1 && n3 === 1) {
      setMausoleumSolved(true);
      awardCredits(150, 'The Mausoleum Sarcophagus seals have shattered.');
    }
  };

  // Chamber 3 logic
  const handleGateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (gateSolved) return;
    setCipherError(null);

    const normalized = cipherInput.trim().toUpperCase();
    if (['MORTIS', 'MEMENTO', 'FROST', 'CARTEL'].includes(normalized)) {
      setGateSolved(true);
      awardCredits(200, 'The Arch-Lich Cemetery Gate has shattered!');
    } else {
      setCipherError('The rusted lock remains sealed. Decipher the glyphs from prior chambers.');
    }
  };

  const isAllSolved = cryptSolved && mausoleumSolved && gateSolved;

  return (
    <div className="relative min-h-screen bg-cartel-void text-cartel-bone flex flex-col font-sans overflow-x-hidden select-none">
      {/* 1. Atmospheric Cemetery Background Image */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <img
          src="/assets/round1_graveyard.jpg"
          alt="Graveyard Chamber"
          className="w-full h-full object-cover object-center filter brightness-[0.45] contrast-125 saturate-90 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-cartel-bg via-cartel-bg/80 to-cartel-void/90" />
        <div className="absolute inset-0 mist-overlay opacity-80" />
      </div>

      {/* 2. Top HUD Bar */}
      <header className="relative z-20 w-full bg-black/80 backdrop-blur-md border-b border-cartel-pumpkin/40 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-2xl">
        {/* Squad Status */}
        <div className="flex items-center space-x-3">
          <div className="relative flex items-center justify-center shrink-0">
            <img
              src="/assets/cartel_skull_crossbones_gold.png"
              alt="Frost Cartel Sigil"
              aria-hidden="true"
              className="w-7 h-7 sm:w-8 sm:h-8 object-contain filter drop-shadow-[0_0_8px_rgba(246,166,58,0.7)] select-none hover:scale-105 transition-transform"
            />
          </div>
          <div>
            <div className="text-[10px] font-cinzel text-cartel-amber font-bold tracking-widest uppercase">
              AUTHENTICATED SQUAD
            </div>
            <div className="text-xs sm:text-sm font-gothic font-bold text-white tracking-wide">
              {session.teamName} <span className="text-[10px] font-mono text-cartel-cyan/80">(2P SYNC)</span>
            </div>
          </div>
        </div>

        {/* Center Round Title */}
        <div className="hidden md:flex flex-col items-center text-center">
          <span className="text-[10px] font-cinzel text-cartel-silver/70 tracking-widest uppercase">
            ROUND 01 ACTIVE CHAMBER
          </span>
          <h1 className="text-sm font-cinzel font-black text-white tracking-wider silver-metallic-text">
            THE GRAVEYARD ESCAPE
          </h1>
        </div>

        {/* Right HUD: Countdown & Credits */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          {/* Timer */}
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded bg-cartel-midnight/90 border border-white/10 text-xs font-mono">
            <span className="text-cartel-amber" aria-hidden="true">⏱️</span>
            <span className="text-white font-bold">{formatTimer(timeRemaining)}</span>
          </div>

          {/* Credits */}
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded bg-cartel-pumpkin/20 border border-cartel-pumpkin text-xs font-mono font-bold text-cartel-pumpkin shadow-pumpkinGlow">
            <span aria-hidden="true">💰</span>
            <span>{credits} / 500 CR</span>
          </div>

          {/* Controls */}
          <button
            onClick={onOpenDashboard}
            className="px-2.5 py-1 rounded bg-cartel-charcoal hover:bg-white/10 border border-white/15 text-cartel-silver hover:text-white font-cinzel text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
            title="Open Squad Console"
          >
            Console
          </button>
          <button
            onClick={onReturnHome}
            className="px-2.5 py-1 rounded bg-transparent hover:bg-white/5 border border-white/10 text-cartel-silver/70 hover:text-white font-cinzel text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
            title="Return to Sanctuary"
          >
            Exit
          </button>
        </div>
      </header>

      {/* Floating Notice / Achievement Toast */}
      {notice && (
        <div className="fixed top-16 left-1/2 transform -translate-x-1/2 z-50 px-5 py-2 rounded-full bg-cartel-midnight/95 border border-cartel-pumpkin text-xs font-cinzel text-cartel-amber shadow-pumpkinGlow animate-fadeIn flex items-center gap-2">
          <span aria-hidden="true">⚡</span>
          <span>{notice}</span>
        </div>
      )}

      {/* 3. Main Chamber Workspace */}
      <main className="relative z-10 flex-1 max-w-5xl w-full mx-auto px-4 py-4 sm:py-6 flex flex-col justify-between">
        {/* Chamber Selection Tabs */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 mb-4 sm:mb-6">
          <button
            onClick={() => setActiveChamber('crypt')}
            className={`px-3 sm:px-4 py-2 rounded-lg font-cinzel text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 border ${
              activeChamber === 'crypt'
                ? 'bg-cartel-pumpkin/25 border-cartel-pumpkin text-cartel-pumpkin shadow-pumpkinGlow'
                : 'bg-black/60 border-white/10 text-cartel-silver/70 hover:text-white'
            }`}
          >
            <span aria-hidden="true">{cryptSolved ? '✅' : '⚰️'}</span>
            <span>Chamber 1: The Crypt (150 CR)</span>
          </button>

          <button
            onClick={() => setActiveChamber('mausoleum')}
            className={`px-3 sm:px-4 py-2 rounded-lg font-cinzel text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 border ${
              activeChamber === 'mausoleum'
                ? 'bg-cartel-amber/25 border-cartel-amber text-cartel-amber shadow-[0_0_15px_rgba(246,166,58,0.3)]'
                : 'bg-black/60 border-white/10 text-cartel-silver/70 hover:text-white'
            }`}
          >
            <span aria-hidden="true">{mausoleumSolved ? '✅' : '🏛️'}</span>
            <span>Chamber 2: Mausoleum (150 CR)</span>
          </button>

          <button
            onClick={() => setActiveChamber('gate')}
            className={`px-3 sm:px-4 py-2 rounded-lg font-cinzel text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 border ${
              activeChamber === 'gate'
                ? 'bg-cartel-cyan/25 border-cartel-cyan text-cartel-cyan shadow-frostGlow'
                : 'bg-black/60 border-white/10 text-cartel-silver/70 hover:text-white'
            }`}
          >
            <span aria-hidden="true">{gateSolved ? '✅' : '⛩️'}</span>
            <span>Chamber 3: Escape Gate (200 CR)</span>
          </button>
        </div>

        {/* Active Chamber Puzzle Surface */}
        <div className="relative bg-gradient-to-b from-black/85 via-cartel-void/90 to-black/90 border border-white/15 rounded-2xl p-5 sm:p-7 shadow-2xl backdrop-blur-md mb-6">
          {/* CHAMBER 1: The Crypt Chamber */}
          {activeChamber === 'crypt' && (
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-cartel-pumpkin/20 border border-cartel-pumpkin text-cartel-pumpkin text-[10px] font-cinzel font-bold mb-2">
                <span>STAGE 1 CIPHER • 150 CREDITS</span>
              </div>
              <h2 className="text-lg sm:text-2xl font-cinzel font-bold text-white mb-1">
                The Decipher of the Ancestors' Tomb
              </h2>
              <p className="text-xs sm:text-sm text-cartel-silver/80 font-sans max-w-xl mx-auto mb-6">
                Light the runic tombstones in the ancient order inscribed upon the crypt lintel:
                <span className="block text-cartel-amber font-cinzel font-bold mt-1 tracking-wider">
                  "First of Blood, then Iron, then Thorns, then Gold."
                </span>
              </p>

              {/* Runic Tombstones */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-lg mx-auto mb-6">
                {[
                  { id: 'blood', name: 'Rune of Blood', glyph: 'ᚱ', color: 'border-red-500/60 text-red-400' },
                  { id: 'iron', name: 'Rune of Iron', glyph: 'ᛏ', color: 'border-slate-400/60 text-slate-300' },
                  { id: 'thorns', name: 'Rune of Thorns', glyph: 'ᚦ', color: 'border-emerald-500/60 text-emerald-400' },
                  { id: 'gold', name: 'Rune of Gold', glyph: 'ᛟ', color: 'border-amber-400/60 text-amber-300' },
                ].map((rune) => {
                  const isSelected = runicSequence.includes(rune.id);
                  return (
                    <button
                      key={rune.id}
                      onClick={() => handleRuneClick(rune.id)}
                      disabled={cryptSolved}
                      className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center transition-all cursor-pointer ${rune.color} ${
                        isSelected || cryptSolved
                          ? 'bg-amber-950/40 shadow-pumpkinGlow scale-105 border-amber-400'
                          : 'bg-black/50 hover:bg-white/5 hover:scale-102'
                      }`}
                    >
                      <span className="text-3xl sm:text-4xl font-serif mb-1">{rune.glyph}</span>
                      <span className="text-[10px] font-cinzel font-bold uppercase tracking-wider">
                        {rune.name}
                      </span>
                    </button>
                  );
                })}
              </div>

              {cryptSolved ? (
                <div className="p-3 bg-emerald-950/60 border border-emerald-500/50 rounded-lg text-emerald-300 text-xs font-cinzel font-bold max-w-md mx-auto">
                  ✓ CRYPT SOLVED: 150 Credits Unsealed! Clue revealed: <strong className="text-white">"MORTIS"</strong>
                </div>
              ) : (
                <div className="text-[11px] font-mono text-cartel-silver/60">
                  Touch the runes in correct sequence. Current steps: {runicSequence.length} / 4
                </div>
              )}
            </div>
          )}

          {/* CHAMBER 2: The Mausoleum Decipher */}
          {activeChamber === 'mausoleum' && (
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-cartel-amber/20 border border-cartel-amber text-cartel-amber text-[10px] font-cinzel font-bold mb-2">
                <span>STAGE 2 MECHANISM • 150 CREDITS</span>
              </div>
              <h2 className="text-lg sm:text-2xl font-cinzel font-bold text-white mb-1">
                The Spectral Sarcophagus Alignment
              </h2>
              <p className="text-xs sm:text-sm text-cartel-silver/80 font-sans max-w-xl mx-auto mb-6">
                Rotate each stone dial to harmonize the sarcophagus seals:
                <span className="block text-cartel-amber font-cinzel font-bold mt-1 tracking-wider">
                  "When the Skull gazes upon the Serpent, the Chalice receives the spirit."
                </span>
              </p>

              {/* 3 Revolving Dials */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-md mx-auto mb-6">
                {/* Dial 1 */}
                <div className="flex flex-col items-center">
                  <span className="text-[10px] font-cinzel text-cartel-silver/60 uppercase mb-1">DIAL 1</span>
                  <button
                    onClick={() => handleDialClick(1)}
                    disabled={mausoleumSolved}
                    className="w-20 h-20 rounded-full border-2 border-cartel-amber bg-black/70 flex flex-col items-center justify-center text-lg hover:scale-105 transition-transform cursor-pointer shadow-lg"
                  >
                    <span>{['🗿 Gargoyle', '🌕 Moon', '💀 Skull'][dial1].split(' ')[0]}</span>
                    <span className="text-[9px] font-cinzel text-cartel-amber font-bold mt-1">
                      {['Gargoyle', 'Moon', 'Skull'][dial1]}
                    </span>
                  </button>
                </div>

                {/* Dial 2 */}
                <div className="flex flex-col items-center">
                  <span className="text-[10px] font-cinzel text-cartel-silver/60 uppercase mb-1">DIAL 2</span>
                  <button
                    onClick={() => handleDialClick(2)}
                    disabled={mausoleumSolved}
                    className="w-20 h-20 rounded-full border-2 border-cartel-amber bg-black/70 flex flex-col items-center justify-center text-lg hover:scale-105 transition-transform cursor-pointer shadow-lg"
                  >
                    <span>{['🦅 Raven', '🐍 Serpent', '🐺 Wolf'][dial2].split(' ')[0]}</span>
                    <span className="text-[9px] font-cinzel text-cartel-amber font-bold mt-1">
                      {['Raven', 'Serpent', 'Wolf'][dial2]}
                    </span>
                  </button>
                </div>

                {/* Dial 3 */}
                <div className="flex flex-col items-center">
                  <span className="text-[10px] font-cinzel text-cartel-silver/60 uppercase mb-1">DIAL 3</span>
                  <button
                    onClick={() => handleDialClick(3)}
                    disabled={mausoleumSolved}
                    className="w-20 h-20 rounded-full border-2 border-cartel-amber bg-black/70 flex flex-col items-center justify-center text-lg hover:scale-105 transition-transform cursor-pointer shadow-lg"
                  >
                    <span>{['🗡️ Dagger', '🏆 Chalice', '🗝️ Key'][dial3].split(' ')[0]}</span>
                    <span className="text-[9px] font-cinzel text-cartel-amber font-bold mt-1">
                      {['Dagger', 'Chalice', 'Key'][dial3]}
                    </span>
                  </button>
                </div>
              </div>

              {mausoleumSolved ? (
                <div className="p-3 bg-emerald-950/60 border border-emerald-500/50 rounded-lg text-emerald-300 text-xs font-cinzel font-bold max-w-md mx-auto">
                  ✓ MAUSOLEUM ALIGNED: 150 Credits Unsealed! Sarcophagus opened.
                </div>
              ) : (
                <div className="text-[11px] font-mono text-cartel-silver/60">
                  Click dials to revolve until the alignment conditions match.
                </div>
              )}
            </div>
          )}

          {/* CHAMBER 3: The Arch-Lich Gate */}
          {activeChamber === 'gate' && (
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-cartel-cyan/20 border border-cartel-cyan text-cartel-cyan text-[10px] font-cinzel font-bold mb-2">
                <span>STAGE 3 FINALE • 200 CREDITS</span>
              </div>
              <h2 className="text-lg sm:text-2xl font-cinzel font-bold text-white mb-1">
                The Arch-Lich Cemetery Gate
              </h2>
              <p className="text-xs sm:text-sm text-cartel-silver/80 font-sans max-w-xl mx-auto mb-6">
                The final cemetery exit gate is bound by frozen spectral chains.
                Speak the word of power revealed in the Crypt Chamber to break the ward:
              </p>

              {gateSolved ? (
                <div className="p-4 bg-emerald-950/70 border border-emerald-500/60 rounded-xl text-emerald-200 text-sm font-cinzel font-bold max-w-md mx-auto shadow-frostGlow">
                  🎉 ARCH-LICH GATE SHATTERED! 200 Credits Claimed!
                  <span className="block text-xs font-sans text-emerald-300 mt-1">
                    Your squad has escaped the Graveyard and is qualified for Round 2!
                  </span>
                </div>
              ) : (
                <form onSubmit={handleGateSubmit} className="max-w-sm mx-auto space-y-3">
                  <div className="relative">
                    <input
                      type="text"
                      value={cipherInput}
                      onChange={(e) => setCipherInput(e.target.value)}
                      placeholder="ENTER CIPHER WORD (e.g. MORTIS)"
                      className="w-full text-center py-2.5 px-4 bg-black/60 border-2 border-cartel-cyan/50 focus:border-cartel-cyan rounded-lg text-white font-cinzel font-bold tracking-widest text-sm uppercase outline-none shadow-frostGlow"
                    />
                  </div>

                  {cipherError && (
                    <div className="text-red-400 text-xs font-sans">{cipherError}</div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-2.5 px-6 rounded-md bg-gradient-to-r from-cartel-cyan via-teal-400 to-cartel-cyan text-cartel-void font-cinzel font-black text-xs uppercase tracking-widest shadow-frostGlow hover:scale-102 transition-all cursor-pointer"
                  >
                    BREAK THE ARCH-LICH WARD
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Victory Banner when All Solved */}
        {isAllSolved && (
          <div className="p-5 bg-gradient-to-r from-cartel-pumpkin/30 via-cartel-amber/20 to-cartel-cyan/30 border-2 border-cartel-amber rounded-2xl text-center shadow-pumpkinGlow animate-fadeIn mb-4">
            <h3 className="text-xl sm:text-2xl font-gothic font-black text-white silver-metallic-text mb-1">
              🎉 SQUAD VICTORY: ROUND 01 CONCLUDED
            </h3>
            <p className="text-xs sm:text-sm text-cartel-silver font-sans mb-3">
              Congratulations, operatives. You earned the maximum <strong className="text-cartel-amber">500 Credits</strong>.
              Your squad status is recorded and staged for Round 2: The Haunted Auction!
            </p>
            <button
              onClick={onReturnHome}
              className="py-2 px-6 rounded-md bg-gradient-to-r from-cartel-pumpkin via-cartel-amber to-cartel-pumpkin text-cartel-void font-cinzel font-black text-xs uppercase tracking-widest shadow-pumpkinGlow hover:scale-105 transition-all cursor-pointer"
            >
              RETURN TO SANCTUARY PORTAL
            </button>
          </div>
        )}
      </main>
    </div>
  );
};
