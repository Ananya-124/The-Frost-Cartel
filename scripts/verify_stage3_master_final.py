import sys
import time
from playwright.sync_api import sync_playwright

def run_verification():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1920, "height": 1080})
        page = context.new_page()

        console_errors = []
        page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
        page.on("pageerror", lambda err: console_errors.append(str(err)))

        print("1. Loading game and setting up fresh Stage 3 session...")
        page.goto("http://localhost:5173/?round=1")
        page.wait_for_selector("body")

        # Initialize fresh team in local/session storage
        page.evaluate("""() => {
            sessionStorage.clear();
            localStorage.clear();
            const teamId = 'team_stage3_qa';
            const duration = 22;
            const now = new Date();
            const deadline = new Date(now.getTime() + duration * 60 * 1000);
            const session = {
                teamId,
                teamName: 'Spectral Operatives',
                status: 'active',
                currentStageId: 'stage-3',
                roundStartTime: now.toISOString(),
                roundDeadline: deadline.toISOString(),
                roundEndTime: null,
                totalDurationMinutes: duration,
                credits: 250,
                stages: {
                    'stage-1': { stageId: 'stage-1', status: 'completed', rewardCredits: 100, earnedCredits: 100 },
                    'stage-2': { stageId: 'stage-2', status: 'completed', rewardCredits: 150, earnedCredits: 150 },
                    'stage-3': { stageId: 'stage-3', status: 'available', rewardCredits: 250, earnedCredits: 0 }
                },
                scoreTransactions: [],
                stage1State: { trials: [] },
                stage2State: { foundTargetIds: [], usedHintsCount: 0 },
                stage3State: {
                    placedBoneSlots: {},
                    dugSoilIds: [],
                    grave2CofferUnlocked: false,
                    grave3RingIndices: [0, 0, 0],
                    grave3Unlocked: false,
                    collectedFragments: [],
                    isGateUnlocked: false
                },
                evidenceJournal: {
                    grave1Fragment: null,
                    grave2Fragment: null,
                    grave3Fragment: null,
                    notes: ['Evidence Journal initialized.'],
                    unlockedCodes: []
                }
            };
            const sessions = { [teamId]: session };
            localStorage.setItem('frost_cartel_round1_sessions', JSON.stringify(sessions));
            sessionStorage.setItem('frost_cartel_round1_sessions', JSON.stringify(sessions));
            sessionStorage.setItem('frost_cartel_team_id', teamId);
            sessionStorage.setItem('frost_cartel_team_name', 'Spectral Operatives');
            sessionStorage.setItem('frost_cartel_current_stage', 'stage-3');
        }""")

        page.goto("http://localhost:5173/?round=1")
        page.wait_for_timeout(1000)

        # Click portal card to enter Stage 3
        stage3_portal = page.locator("[aria-label*='Enter Stage 3']").first
        if stage3_portal.is_visible():
            print("Clicking Stage 3 portal from Round 1 dashboard...")
            stage3_portal.click()
            page.wait_for_timeout(1000)

        # Wait for the Graveyard overview
        page.wait_for_selector(".coffin-card", timeout=8000)
        print("✓ Verified Stage 3 Graveyard overview loaded.")

        # Step 1: Verify Initial 0/3 Counter and all Coffin Cards show PLAY
        journal_btn = page.locator("button[aria-label*='Evidence Journal']").first
        journal_text = journal_btn.inner_text()
        print(f"Evidence Journal button text: '{journal_text}'")
        assert "(0/3)" in journal_text, f"Expected (0/3) in journal button, got: {journal_text}"

        play_btns = page.locator(".coffin-card-play-btn:has-text('PLAY')")
        play_count = play_btns.count()
        print(f"Number of 'PLAY' buttons found on coffin cards: {play_count}")
        assert play_count == 3, f"Expected 3 PLAY buttons, got {play_count}"

        completed_btns = page.locator(".coffin-card-play-btn:has-text('COMPLETED')")
        assert completed_btns.count() == 0, f"Expected 0 COMPLETED buttons initially, got {completed_btns.count()}"

        page.screenshot(path="public/artifacts/stage3_initial_0_of_3.png")
        print("✓ Step 1 Passed: Initial state is clean 0/3 with PLAY buttons on all coffins.")

        # Step 2: Open and Solve Coffin 1
        print("\n2. Entering and solving Coffin 1 (The Marked Remains)...")
        coffin1_card = page.locator(".coffin-card[aria-label*='COFFIN I']").first
        coffin1_card.click()
        page.wait_for_selector("text=THE MARKED REMAINS", timeout=5000)

        # Read Grimoire
        book_hotspot = page.locator("path[aria-label*='Ancient Grimoire']").first
        book_hotspot.click()
        page.wait_for_selector("text=THE CARTEL EXEQUIES")
        # Flip to page 3
        page.click("button:has-text('Next Page')")
        page.wait_for_timeout(300)
        page.click("button:has-text('Next Page')")
        page.wait_for_timeout(300)
        page.click("button:has-text('Close & Inspect Remains')")
        page.wait_for_timeout(500)

        # Shift Femur bone to reveal ASH
        femur = page.locator("path[aria-label*='Movable Femur']").first
        femur.click()
        page.wait_for_timeout(600)

        # Enter Riddle Answer "ASH"
        riddle_input = page.locator("input[placeholder*='Enter your answer']").first
        riddle_input.fill("ASH")
        page.click("button:has-text('SUBMIT')")
        page.wait_for_timeout(800)
        assert page.locator("text=RIDDLE SOLVED").is_visible(), "Riddle solved banner not visible"

        # Click skeleton key to unlock chest
        key_btn = page.locator("g[aria-label*='Antique Brass Skeleton Key']").first
        key_btn.click()
        page.wait_for_timeout(1300)

        # Open ancient chest
        chest_btn = page.locator("button[aria-label*='OPEN ANCIENT CHEST']").first
        chest_btn.click()
        page.wait_for_timeout(800)

        # Verify Fragment Unsealed Modal with "BENEATH"
        assert page.locator("text=BENEATH").first.is_visible(), "Fragment BENEATH not visible"
        print("✓ Coffin 1 solved and BENEATH unlocked!")

        # Close reward modal and return to cemetery
        return_btn = page.locator("button:has-text('RETURN TO CEMETERY'), button:has-text('Return to Cemetery')").first
        return_btn.click()
        page.wait_for_timeout(1000)

        # Verify Cemetery Overview after Coffin 1 completion
        page.wait_for_selector(".coffin-card", timeout=5000)
        journal_text_after_1 = page.locator("button[aria-label*='Evidence Journal']").first.inner_text()
        print(f"Evidence Journal button after Grave 1: '{journal_text_after_1}'")
        assert "(1/3)" in journal_text_after_1, f"Expected (1/3), got: {journal_text_after_1}"

        # Coffin 1 must show COMPLETED
        coffin1_btn = page.locator(".coffin-card[aria-label*='COFFIN I'] .coffin-card-play-btn").first
        assert "COMPLETED" in coffin1_btn.inner_text(), f"Expected Coffin 1 to be COMPLETED, got {coffin1_btn.inner_text()}"
        assert page.locator("text=“BENEATH” SECURED").is_visible(), "BENEATH SECURED badge not visible"

        # Coffin 1 must NOT be clickable / should not reopen Coffin 1
        coffin1_card = page.locator(".coffin-card[aria-label*='COFFIN I']").first
        coffin1_card.click(force=True)
        page.wait_for_timeout(500)
        assert page.locator(".coffin-card").count() == 3, "Should stay on graveyard overview"

        page.screenshot(path="public/artifacts/stage3_coffin1_completed_1_of_3.png")
        print("✓ Step 2 Passed: Coffin 1 permanently marked COMPLETED and non-interactive; counter is 1/3.")

        # Step 3: Page Reload Persistence Test
        print("\n3. Testing page reload persistence...")
        page.reload()
        page.wait_for_timeout(1000)

        # If on dashboard, re-enter Stage 3
        s3_portal_reload = page.locator("[aria-label*='Enter Stage 3']").first
        if s3_portal_reload.is_visible():
            s3_portal_reload.click()
            page.wait_for_timeout(1000)

        page.wait_for_selector(".coffin-card")
        journal_reload_text = page.locator("button[aria-label*='Evidence Journal']").first.inner_text()
        assert "(1/3)" in journal_reload_text, f"Reload failed to preserve 1/3, got: {journal_reload_text}"

        coffin1_reload_btn = page.locator(".coffin-card[aria-label*='COFFIN I'] .coffin-card-play-btn").first
        assert "COMPLETED" in coffin1_reload_btn.inner_text(), "Reload failed to preserve Coffin 1 COMPLETED state"
        print("✓ Step 3 Passed: Progress and COMPLETED state persist across page reloads.")

        # Step 4: Open and Solve Coffin 2
        print("\n4. Entering and solving Coffin 2 (The Buried Diary)...")
        coffin2_card = page.locator(".coffin-card[aria-label*='COFFIN II']").first
        coffin2_card.click()
        page.wait_for_selector("text=THE BURIED DIARY", timeout=5000)

        # Enter tumbler combination 1749
        tumblers = page.locator(".tumbler-slot")
        assert tumblers.count() == 4, f"Expected 4 tumblers, found {tumblers.count()}"

        tumblers.nth(0).focus()
        page.keyboard.press("1")
        tumblers.nth(1).focus()
        page.keyboard.press("7")
        tumblers.nth(2).focus()
        page.keyboard.press("4")
        tumblers.nth(3).focus()
        page.keyboard.press("9")
        page.wait_for_timeout(500)

        unlock_btn = page.locator("button:has-text('UNLOCK')").first
        unlock_btn.click()
        page.wait_for_timeout(1000)

        # Verify EMBER unlocked
        assert page.locator("text=EMBER").first.is_visible(), "EMBER fragment not revealed"
        print("✓ Coffin 2 solved and EMBER unlocked!")

        # Return to Cemetery
        page.locator("button:has-text('RETURN TO CEMETERY')").first.click()
        page.wait_for_timeout(1000)

        # Verify Cemetery Overview after Coffin 2 completion
        page.wait_for_selector(".coffin-card")
        journal_text_after_2 = page.locator("button[aria-label*='Evidence Journal']").first.inner_text()
        print(f"Evidence Journal button after Grave 2: '{journal_text_after_2}'")
        assert "(2/3)" in journal_text_after_2, f"Expected (2/3), got: {journal_text_after_2}"

        # Coffin 2 must show COMPLETED
        coffin2_btn = page.locator(".coffin-card[aria-label*='COFFIN II'] .coffin-card-play-btn").first
        assert "COMPLETED" in coffin2_btn.inner_text(), "Expected Coffin 2 to be COMPLETED"

        page.screenshot(path="public/artifacts/stage3_coffin2_completed_2_of_3.png")
        print("✓ Step 4 Passed: Coffin 2 permanently marked COMPLETED; counter is 2/3.")

        # Step 5: Open and Solve Coffin 3
        print("\n5. Entering and solving Coffin 3 (The Final Testament)...")
        coffin3_card = page.locator(".coffin-card[aria-label*='COFFIN III']").first
        coffin3_card.click()
        page.wait_for_selector("text=THE FINAL TESTAMENT", timeout=5000)

        # Rotate rings to MOON (Outer), RAVEN (Middle), FLAME (Inner)
        # Ring 1: MOON is index 1
        page.locator("button[aria-label*='Rotate Outer Ring clockwise']").first.click()
        page.wait_for_timeout(300)

        # Ring 2: RAVEN is index 2 (rotate cw twice)
        ring2_cw = page.locator("button[aria-label*='Rotate Middle Ring clockwise']").first
        ring2_cw.click()
        page.wait_for_timeout(300)
        ring2_cw.click()
        page.wait_for_timeout(300)

        # Ring 3: FLAME is index 2 (rotate cw twice)
        ring3_cw = page.locator("button[aria-label*='Rotate Inner Ring clockwise']").first
        ring3_cw.click()
        page.wait_for_timeout(300)
        ring3_cw.click()
        page.wait_for_timeout(400)

        # Click Unseal Final Testament
        unseal_btn = page.locator("button:has-text('UNSEAL THE FINAL TESTAMENT')").first
        unseal_btn.click()
        page.wait_for_timeout(1000)

        assert page.locator("text=RETURNS").first.is_visible(), "RETURNS fragment not revealed"
        print("✓ Coffin 3 solved and RETURNS unlocked!")

        # Return to cemetery
        page.locator("button:has-text('Return to Cemetery Gate'), button:has-text('RETURN TO CEMETERY')").first.click()
        page.wait_for_timeout(1000)

        # Verify Cemetery Overview after all 3 graves
        page.wait_for_selector(".coffin-card")
        journal_text_after_3 = page.locator("button[aria-label*='Evidence Journal']").first.inner_text()
        print(f"Evidence Journal button after all 3 graves: '{journal_text_after_3}'")
        assert "(3/3)" in journal_text_after_3, f"Expected (3/3), got: {journal_text_after_3}"
        assert "4/3" not in journal_text_after_3, "CRITICAL ERROR: Found 4/3 in journal button!"

        # All 3 coffins must show COMPLETED
        comp_cards = page.locator(".coffin-card-play-btn:has-text('COMPLETED')")
        assert comp_cards.count() == 3, f"Expected all 3 coffins to be COMPLETED, found {comp_cards.count()}"

        page.screenshot(path="public/artifacts/stage3_all_coffins_completed_3_of_3.png")
        print("✓ Step 5 Passed: All 3 coffins COMPLETED; counter is exactly 3/3 (0 instances of 4/3).")

        # Step 6: Test Redesigned Final Escape Gate Modal
        print("\n6. Testing redesigned Final Escape Gate modal...")
        gate_modal_btn = page.locator("button[aria-label='Final Escape Gate']").first
        gate_modal_btn.click()
        page.wait_for_timeout(800)

        # Verify Single Clear Heading and Subtitle
        heading = page.locator("#gate-modal-title").inner_text()
        print(f"Gate Modal Title: '{heading}'")
        assert "THE ARCH-LICH ESCAPE GATE" in heading.upper(), f"Unexpected heading: {heading}"
        assert page.locator("text=FINAL SANCTUM • ESCAPE PORTAL").is_visible(), "Subtitle missing"

        # Verify 3 Connected Inscription Tablets
        assert page.locator("text=GRAVE I — THE MARKED REMAINS").is_visible()
        assert page.locator("text=GRAVE II — THE BURIED DIARY").is_visible()
        assert page.locator("text=GRAVE III — THE FINAL TESTAMENT").is_visible()
        assert page.locator("text=Grave Inscriptions Unsealed (3/3)").is_visible()

        # Submit wrong phrase
        phrase_input = page.locator("input#final-phrase-input").first
        phrase_input.fill("WRONG PHRASE CIPHER")
        unseal_gate_btn = page.locator("button[type='submit']").first
        unseal_gate_btn.click()
        page.wait_for_timeout(600)
        assert page.locator("text=The ancient runes reject your phrase").is_visible(), "Expected atmospheric rejection notice"

        # Click quick insert / chant button
        quick_chant = page.locator("button:has-text('Click to Chant Discovered Phrase')").first
        quick_chant.click()
        page.wait_for_timeout(300)
        filled_val = phrase_input.input_value()
        print(f"Phrase auto-filled: '{filled_val}'")
        assert "BENEATH EMBER RETURNS" in filled_val, f"Unexpected phrase: {filled_val}"

        # Submit correct phrase
        unseal_gate_btn.click()
        page.wait_for_timeout(1500)

        # Verify Unsealed triumph banner
        assert page.locator("text=ARCH-LICH GATE SHATTERED • ESCAPED!").is_visible()
        assert page.locator("text=+250 CREDITS SECURED").is_visible()

        page.screenshot(path="public/artifacts/stage3_final_gate_unsealed.png")
        print("✓ Step 6 Passed: Final Escape Gate successfully breached and credits secured!")

        # Verify console errors
        print(f"\nConsole Errors logged during session: {len(console_errors)}")
        if console_errors:
            print("Console Errors:", console_errors)
        assert len(console_errors) == 0, f"Found {len(console_errors)} console errors!"

        browser.close()
        print("\n=======================================================")
        print("ALL TESTS PASSED WITH ZERO CONSOLE ERRORS!")
        print("=======================================================")

if __name__ == "__main__":
    run_verification()
