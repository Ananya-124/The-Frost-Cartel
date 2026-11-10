import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { Grave3FinalTestament } from '../game/stage3/Grave3FinalTestament';
import type { Stage3Config } from '../../types/round1.types';

const mockConfig: Stage3Config = {
  timeLimitSeconds: 1320,
  stageName: 'Stage 3: The Forgotten Graveyard',
  grave1: {
    combinationCode: '7412',
    cipherMethod: 'Roman Numeral Cross',
    clueFragment: 'THE',
    ruleText: 'Inspect the skeletal relics',
    isCompleted: true,
  },
  grave2: {
    combinationCode: '1749',
    chronologicalOrder: ['1', '7', '4', '9'],
    clueFragment: 'NIGHT',
    ruleText: 'The Buried Diary',
    isCompleted: true,
  },
  grave3: {
    clueFragment: 'RETURNS',
    ruleText: 'Align the celestial sequence: MOON → RAVEN → FLAME',
    runeRings: [
      { id: 'ring_1', name: 'Outer Ring', symbols: ['FLAME', 'MOON', 'RAVEN', 'SKULL'], selectedIndex: 0, correctSymbol: 'MOON' },
      { id: 'ring_2', name: 'Middle Ring', symbols: ['SKULL', 'FLAME', 'RAVEN', 'MOON'], selectedIndex: 0, correctSymbol: 'RAVEN' },
      { id: 'ring_3', name: 'Inner Ring', symbols: ['MOON', 'RAVEN', 'FLAME', 'SKULL'], selectedIndex: 0, correctSymbol: 'FLAME' },
    ],
    isCompleted: false,
  },
  finalGate: {
    acceptedAnswer: 'THE NIGHT RETURNS',
    isEscaped: false,
  },
  incorrectAnswerPenalty: 10,
};

describe('Stage 3: Coffin III — The Final Testament', () => {
  it('renders single unified header HUD with GRAVE III and THE FINAL TESTAMENT', () => {
    render(
      <Grave3FinalTestament
        teamId="team-alpha"
        config={mockConfig}
        collectedFragments={['THE', 'NIGHT']}
        ringIndices={[0, 0, 0]}
        isGrave3Unlocked={false}
        secondsRemaining={1200}
        stageCleared={false}
        isMuted={false}
        onToggleMute={vi.fn()}
        onReturnDashboard={vi.fn()}
        onReturnCemetery={vi.fn()}
        onRotateRing={vi.fn()}
        onFragmentUnlocked={vi.fn()}
        onOpenJournal={vi.fn()}
      />
    );

    expect(screen.getByText('GRAVE III')).toBeInTheDocument();
    expect(screen.getAllByText('THE FINAL TESTAMENT').length).toBeGreaterThan(0);
    expect(screen.getByText('20:00')).toBeInTheDocument();
  });

  it('renders the master coffin artwork and all 8 calibrated interactive targets', () => {
    render(
      <Grave3FinalTestament
        teamId="team-alpha"
        config={mockConfig}
        collectedFragments={['THE', 'NIGHT']}
        ringIndices={[0, 0, 0]}
        isGrave3Unlocked={false}
        secondsRemaining={1200}
        stageCleared={false}
        isMuted={false}
        onToggleMute={vi.fn()}
        onReturnDashboard={vi.fn()}
        onReturnCemetery={vi.fn()}
        onRotateRing={vi.fn()}
        onFragmentUnlocked={vi.fn()}
        onOpenJournal={vi.fn()}
      />
    );

    // Master Artwork Image
    const masterImg = screen.getByAltText('The Final Testament Master Coffin Environment');
    expect(masterImg).toBeInTheDocument();
    expect(masterImg).toHaveAttribute('src', '/assets/round-01/stage-03/coffin-03-final-testament-master.png');

    // All 8 targets
    expect(screen.getByLabelText('Inspect Cranium of the Arch-Warden marked III')).toBeInTheDocument();
    expect(screen.getByLabelText('Inspect Azure Soul Crystal')).toBeInTheDocument();
    expect(screen.getByLabelText('Inspect Celestial Astral Medallion')).toBeInTheDocument();
    expect(screen.getByLabelText('Inspect Cinnabar Infusion Potion Phial')).toBeInTheDocument();
    expect(screen.getByLabelText('Inspect Grimoire of the Constellations')).toBeInTheDocument();
    expect(screen.getByLabelText('Inspect Ancient Testament Scroll')).toBeInTheDocument();
    expect(screen.getByLabelText('Inspect Astronomical Chart of the Spheres')).toBeInTheDocument();
    expect(screen.getByLabelText('Inspect Carved Relic Chest')).toBeInTheDocument();
  });

  it('opens and closes the photographic inspection modal for clicked artifacts', () => {
    render(
      <Grave3FinalTestament
        teamId="team-alpha"
        config={mockConfig}
        collectedFragments={['THE', 'NIGHT']}
        ringIndices={[0, 0, 0]}
        isGrave3Unlocked={false}
        secondsRemaining={1200}
        stageCleared={false}
        isMuted={false}
        onToggleMute={vi.fn()}
        onReturnDashboard={vi.fn()}
        onReturnCemetery={vi.fn()}
        onRotateRing={vi.fn()}
        onFragmentUnlocked={vi.fn()}
        onOpenJournal={vi.fn()}
      />
    );

    // Click Soul Crystal
    const crystalBtn = screen.getByLabelText('Inspect Azure Soul Crystal');
    fireEvent.click(crystalBtn);

    // Modal opens
    expect(screen.getByText('BURIAL VAULT ARTIFACT INSPECTION')).toBeInTheDocument();
    expect(screen.getByText('Pulsating Celestial Ether Relic')).toBeInTheDocument();
    expect(screen.getByText(/pale sphere that commands the outer darkness/i)).toBeInTheDocument();

    // Close Modal
    const closeBtn = screen.getByLabelText('Close Inspection Modal');
    fireEvent.click(closeBtn);

    expect(screen.queryByText('BURIAL VAULT ARTIFACT INSPECTION')).not.toBeInTheDocument();
  });

  it('displays the exact required Keeper Final Testament riddle verse', () => {
    render(
      <Grave3FinalTestament
        teamId="team-alpha"
        config={mockConfig}
        collectedFragments={['THE', 'NIGHT']}
        ringIndices={[0, 0, 0]}
        isGrave3Unlocked={false}
        secondsRemaining={1200}
        stageCleared={false}
        isMuted={false}
        onToggleMute={vi.fn()}
        onReturnDashboard={vi.fn()}
        onReturnCemetery={vi.fn()}
        onRotateRing={vi.fn()}
        onFragmentUnlocked={vi.fn()}
        onOpenJournal={vi.fn()}
      />
    );

    expect(screen.getByText("THE KEEPER’S FINAL TESTAMENT")).toBeInTheDocument();
    expect(
      screen.getByText(/Three guardians watch the heavens through the endless night/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/One wears the pale face that commands the outer darkness/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Another travels between the heavens and the final fire/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/The last burns closest to the heart, yet fades before the dawn/i)
    ).toBeInTheDocument();
  });

  it('renders exactly THREE rotating ring selectors and handles rotation clicks', () => {
    const handleRotateRing = vi.fn();

    render(
      <Grave3FinalTestament
        teamId="team-alpha"
        config={mockConfig}
        collectedFragments={['THE', 'NIGHT']}
        ringIndices={[0, 0, 0]}
        isGrave3Unlocked={false}
        secondsRemaining={1200}
        stageCleared={false}
        isMuted={false}
        onToggleMute={vi.fn()}
        onReturnDashboard={vi.fn()}
        onReturnCemetery={vi.fn()}
        onRotateRing={handleRotateRing}
        onFragmentUnlocked={vi.fn()}
        onOpenJournal={vi.fn()}
      />
    );

    expect(screen.getByText('RING I — OUTER')).toBeInTheDocument();
    expect(screen.getByText('RING II — MIDDLE')).toBeInTheDocument();
    expect(screen.getByText('RING III — INNER')).toBeInTheDocument();

    // Click rotate clockwise on Ring 1
    const rotateRing1Btn = screen.getByLabelText('Rotate RING I — OUTER Clockwise');
    fireEvent.click(rotateRing1Btn);
    expect(handleRotateRing).toHaveBeenCalledWith(0, 'cw');
  });

  it('rejects incorrect alignment when clicking UNSEAL THE FINAL TESTAMENT', () => {
    const handleFragmentUnlocked = vi.fn();

    render(
      <Grave3FinalTestament
        teamId="team-alpha"
        config={mockConfig}
        collectedFragments={['THE', 'NIGHT']}
        ringIndices={[0, 0, 0]} // Symbols: FLAME, SKULL, MOON (incorrect!)
        isGrave3Unlocked={false}
        secondsRemaining={1200}
        stageCleared={false}
        isMuted={false}
        onToggleMute={vi.fn()}
        onReturnDashboard={vi.fn()}
        onReturnCemetery={vi.fn()}
        onRotateRing={vi.fn()}
        onFragmentUnlocked={handleFragmentUnlocked}
        onOpenJournal={vi.fn()}
      />
    );

    const unsealBtn = screen.getByLabelText('Unseal the Final Testament');
    fireEvent.click(unsealBtn);

    expect(handleFragmentUnlocked).not.toHaveBeenCalled();
    expect(screen.getByText(/The celestial runes resist your touch/i)).toBeInTheDocument();
  });

  it('successfully unseals the final testament when rings align to MOON - RAVEN - FLAME', () => {
    const handleFragmentUnlocked = vi.fn();

    render(
      <Grave3FinalTestament
        teamId="team-alpha"
        config={mockConfig}
        collectedFragments={['THE', 'NIGHT']}
        ringIndices={[1, 2, 2]} // In mockConfig: ring 1 idx 1 = MOON, ring 2 idx 2 = RAVEN, ring 3 idx 2 = FLAME
        isGrave3Unlocked={false}
        secondsRemaining={1200}
        stageCleared={false}
        isMuted={false}
        onToggleMute={vi.fn()}
        onReturnDashboard={vi.fn()}
        onReturnCemetery={vi.fn()}
        onRotateRing={vi.fn()}
        onFragmentUnlocked={handleFragmentUnlocked}
        onOpenJournal={vi.fn()}
      />
    );

    const unsealBtn = screen.getByLabelText('Unseal the Final Testament');
    fireEvent.click(unsealBtn);

    expect(handleFragmentUnlocked).toHaveBeenCalledWith('RETURNS');
    expect(screen.getByText('✦ CELESTIAL CODEX UNSEALED ✦')).toBeInTheDocument();
    expect(screen.getByText('R — E — T — U — R — N — S')).toBeInTheDocument();
    expect(screen.getByText(/The ancient cemetery iron gate is now accessible/i)).toBeInTheDocument();
  });
});

