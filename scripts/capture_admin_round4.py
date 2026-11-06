import asyncio
from playwright.async_api import async_playwright
import shutil, os

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={'width': 1440, 'height': 900})
        page = await context.new_page()
        await page.goto('http://127.0.0.1:5173/#/admin')
        await page.wait_for_timeout(800)
        await page.click("button:has-text('ROUND 04 EXPEDITION')")
        await page.wait_for_timeout(800)
        await page.click("button:has-text('VISUAL CLUE EDITOR (35 STEPS)')")
        await page.wait_for_timeout(800)
        await page.screenshot(path='public/assets/round-4/verify_admin_round4_editor.png')
        shutil.copyfile('public/assets/round-4/verify_admin_round4_editor.png', r'C:\Users\yashm\.gemini\antigravity\brain\8f13d18b-3772-4740-bcdd-d4869ff605fe\verify_admin_round4_editor.png')
        print('Captured admin round4 editor successfully')
        await browser.close()

if __name__ == '__main__':
    asyncio.run(run())
