from playwright.sync_api import sync_playwright
import os

os.makedirs('docs/screenshots', exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(viewport={'width': 1920, 'height': 1080})
    page = context.new_page()
    page.goto('http://localhost:5173/')

    # Clear residual client storage
    page.evaluate('''() => {
        localStorage.clear();
        sessionStorage.clear();
    }''')
    page.reload()
    page.wait_for_timeout(1000)

    # Check if login panel is visible
    squad_input = page.locator('#squad-name-input')
    if squad_input.is_visible():
        print("Logging in as TEAM AI...")
        squad_input.fill('TEAM AI')
        page.fill('#passkey-input', 'SQUAD@AI9')
        page.click('button[type="submit"]')
        page.wait_for_timeout(2500)

    page.screenshot(path='docs/screenshots/team_ai_reset_home.png')

    # Navigate to Round 1 Dashboard
    page.goto('http://localhost:5173/?round=1')
    page.wait_for_timeout(2500)
    page.screenshot(path='docs/screenshots/team_ai_reset_round1.png')

    print("Screenshots saved successfully to docs/screenshots/")
    browser.close()
