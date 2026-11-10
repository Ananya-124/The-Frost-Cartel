import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Stage3ForgottenGraveyard } from '../game/stage3/Stage3ForgottenGraveyard';
import { round1Service } from '../../services/round1Service';

describe('Stage 3: The Forgotten Graveyard Component', () => {
  const mockReturn = vi.fn();
  const mockSkip = vi.fn();
  const mockComplete = vi.fn();

  beforeEach(() => {
    sessionStorage.clear();
    vi.clearAllMocks();
    round1Service.resetTeamProgress('test_team_s3');
    round1Service.beginRound1('test_team_s3', 'Graveyard Walkers');
  });

  it('renders graveyard grounds overview and grave navigation options', () => {
    const config = round1Service.getStage3Config();
    render(
      <Stage3ForgottenGraveyard
        teamId="test_team_s3"
        config={config}
        initialCollectedFragments={[]}
        isCompleted={false}
        onReturnDashboard={mockReturn}
        onSkipStage={mockSkip}
        onStageCompleted={mockComplete}
      />
    );

    expect(screen.getByText('STAGE 03 OF 03 • 250 CREDITS')).toBeInTheDocument();
    expect(screen.getByText('The Forgotten Graveyard')).toBeInTheDocument();
    expect(screen.getByText('The Cursed Sepulcher Grounds')).toBeInTheDocument();
    expect(screen.getByText('The Bone Chamber')).toBeInTheDocument();
    expect(screen.getByText('The Buried Diary')).toBeInTheDocument();
    expect(screen.getByText('The Rune Tombstone')).toBeInTheDocument();
  });

  it('allows navigating to Grave 1, reading scripture, solving riddle, and unlocking chest', () => {
    sessionStorage.setItem('frost_cartel_coffin1_opened', 'true');
    const config = round1Service.getStage3Config();
    render(
      <Stage3ForgottenGraveyard
        teamId="test_team_s3"
        config={config}
        initialCollectedFragments={[]}
        isCompleted={false}
        onReturnDashboard={mockReturn}
        onSkipStage={mockSkip}
        onStageCompleted={mockComplete}
      />
    );

    const grave1Btn = screen.getByRole('button', { name: /Grave 1: Bone Chamber/i });
    fireEvent.click(grave1Btn);

    expect(screen.getByText(/Grave 1 — The Bone Chamber/i)).toBeInTheDocument();
    expect(screen.getByText('THE KEEPER’S LAST RIDDLE')).toBeInTheDocument();

    // 1. Click Ancient Grimoire Book
    const bookBtn = screen.getByRole('button', { name: /Ancient Grimoire: Click to Open and Read/i });
    fireEvent.click(bookBtn);

    expect(screen.getByText('THE CARTEL EXEQUIES')).toBeInTheDocument();
    expect(screen.getByText('THE THREE WITNESSES')).toBeInTheDocument();

    // Turn to Page II
    const nextBtn1 = screen.getByRole('button', { name: /Next Page/i });
    fireEvent.click(nextBtn1);
    expect(screen.getByText('THE FORGOTTEN INSTRUCTION')).toBeInTheDocument();

    // Turn to Page III
    const nextBtn2 = screen.getByRole('button', { name: /Next Page/i });
    fireEvent.click(nextBtn2);
    expect(screen.getByText('THE FINAL RIDDLE')).toBeInTheDocument();

    // Close Book
    const closeBookBtn = screen.getByRole('button', { name: /Close & Inspect Remains/i });
    fireEvent.click(closeBookBtn);

    // 2. Submit Riddle Answer "ASH"
    const input = screen.getByPlaceholderText(/Enter your answer|Type the keyword/i);
    const unsealBtn = screen.getByRole('button', { name: /SUBMIT|UNSEAL/i });

    fireEvent.change(input, { target: { value: 'ASH' } });
    fireEvent.click(unsealBtn);

    expect(screen.getByText(/✓ RIDDLE SOLVED/i)).toBeInTheDocument();

    // 3. Unlock with Skeleton Key
    const keyBtn = screen.getByRole('button', { name: /Antique Brass Skeleton Key/i });
    fireEvent.click(keyBtn);

    // 4. Open Chest
    const chestBtn = screen.getByRole('button', { name: /Open unlocked treasure chest/i });
    fireEvent.click(chestBtn);

    expect(screen.getAllByText(/BENEATH/i).length).toBeGreaterThanOrEqual(1);
  });

  it('allows navigating to Grave 2, reading diary, inspecting clues, and unlocking coffer with 1749', () => {
    sessionStorage.setItem('frost_cartel_coffin2_opened', 'true');
    const config = round1Service.getStage3Config();
    render(
      <Stage3ForgottenGraveyard
        teamId="test_team_s3"
        config={config}
        initialCollectedFragments={[]}
        isCompleted={false}
        onReturnDashboard={mockReturn}
        onSkipStage={mockSkip}
        onStageCompleted={mockComplete}
      />
    );

    const grave2Btn = screen.getByRole('button', { name: /Grave 2: Buried Diary/i });
    fireEvent.click(grave2Btn);

    expect(screen.getByText(/Grave 2 — The Buried Diary/i)).toBeInTheDocument();
    expect(screen.getByText("THE KEEPER'S RIDDLE")).toBeInTheDocument();

    // 1. Read Ancient Diary
    const diaryBtn = screen.getByRole('button', { name: /Ancient Diary: Click to Read/i });
    fireEvent.click(diaryBtn);

    expect(screen.getByText(/The Keeper’s Chronicle — Anno Domini/i)).toBeInTheDocument();
    expect(screen.getByText(/On the night the old covenant was sealed/i)).toBeInTheDocument();

    const closeDiaryBtn = screen.getByRole('button', { name: /Close Diary/i });
    fireEvent.click(closeDiaryBtn);

    // 2. Inspect Clues
    const skullBtn = screen.getByRole('button', { name: /Cranium of the Keeper/i });
    fireEvent.click(skullBtn);
    expect(screen.getByText(/CRANIUM OF THE SECOND KEEPER/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Close Inspection/i }));

    const p7Btn = screen.getByRole('button', { name: /Western Parchment 7/i });
    fireEvent.click(p7Btn);
    expect(screen.getByText(/WESTERN MARKER — VII/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Close Inspection/i }));

    // 3. Enter Tumbler Combination 1749
    const tumblers = screen.getAllByRole('spinbutton');
    expect(tumblers).toHaveLength(4);

    fireEvent.keyDown(tumblers[0], { key: '1' });
    fireEvent.keyDown(tumblers[1], { key: '7' });
    fireEvent.keyDown(tumblers[2], { key: '4' });
    fireEvent.keyDown(tumblers[3], { key: '9' });

    const unlockBtn = screen.getByRole('button', { name: /UNLOCK/i });
    fireEvent.click(unlockBtn);

    // Verify Fragment II EMBER unsealed
    expect(screen.getByText('EMBER')).toBeInTheDocument();
    expect(screen.getByText(/COVENANT YEAR 1749 UNLOCKED/i)).toBeInTheDocument();
  });

  it('toggles evidence journal drawer', () => {
    const config = round1Service.getStage3Config();
    render(
      <Stage3ForgottenGraveyard
        teamId="test_team_s3"
        config={config}
        initialCollectedFragments={['THE']}
        isCompleted={false}
        onReturnDashboard={mockReturn}
        onSkipStage={mockSkip}
        onStageCompleted={mockComplete}
      />
    );

    const journalBtn = screen.getByRole('button', { name: /Evidence Journal/i });
    fireEvent.click(journalBtn);

    expect(screen.getByText('EVIDENCE JOURNAL')).toBeInTheDocument();
    expect(screen.getByText('THE')).toBeInTheDocument();

    const closeBtn = screen.getByRole('button', { name: /✕ Close/i });
    fireEvent.click(closeBtn);

    expect(screen.queryByText('EVIDENCE JOURNAL')).not.toBeInTheDocument();
  });

  it('submits final gate incantation and unlocks gate', () => {
    const config = round1Service.getStage3Config();
    render(
      <Stage3ForgottenGraveyard
        teamId="test_team_s3"
        config={config}
        initialCollectedFragments={['THE', 'NIGHT', 'RETURNS']}
        isCompleted={false}
        onReturnDashboard={mockReturn}
        onSkipStage={mockSkip}
        onStageCompleted={mockComplete}
      />
    );

    const gateTab = screen.getByRole('button', { name: /Final Escape Gate/i });
    fireEvent.click(gateTab);

    expect(screen.getByText('The Arch-Lich Escape Gate')).toBeInTheDocument();

    const input = screen.getByPlaceholderText(/ENTER COMPLETE RUNIC PHRASE/i);
    const submitBtn = screen.getByRole('button', { name: /Speak Incantation & Break Gate/i });

    fireEvent.change(input, { target: { value: 'THE NIGHT RETURNS' } });
    fireEvent.click(submitBtn);

    expect(mockComplete).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/Arch-Lich Gate Shattered • Escaped!/i)).toBeInTheDocument();
  });
});
