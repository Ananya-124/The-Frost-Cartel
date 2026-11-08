import asyncio
import json
from playwright.async_api import async_playwright

RESOLUTIONS = [
    {'width': 1280, 'height': 720, 'name': '720p'},
    {'width': 1366, 'height': 768, 'name': '1366x768'},
    {'width': 1440, 'height': 900, 'name': '1440x900'},
    {'width': 1536, 'height': 864, 'name': '1536x864'},
    {'width': 1920, 'height': 1080, 'name': '1080p'},
]

async def audit():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        report = {}

        for res in RESOLUTIONS:
            w = res['width']
            h = res['height']
            res_key = f"{w}x{h}"
            report[res_key] = {}
            
            page = await browser.new_page(viewport={'width': w, 'height': h})

            # --- 1. Round 1 Portal Selection Hub ---
            await page.goto('http://127.0.0.1:5173/?round=1&mock=1')
            await page.wait_for_timeout(1000)
            await page.screenshot(path=f'artifacts_hub_{res_key}.png')
            
            diag_stage1 = await page.evaluate('''() => {
                const doc = document.documentElement;
                const body = document.body;
                return {
                    docScrollHeight: doc.scrollHeight,
                    docClientHeight: doc.clientHeight,
                    bodyScrollHeight: body.scrollHeight,
                    bodyClientHeight: body.clientHeight,
                    windowInnerHeight: window.innerHeight,
                    hasScroll: doc.scrollHeight > doc.clientHeight + 1,
                    diff: doc.scrollHeight - doc.clientHeight
                };
            }''')
            report[res_key]['Stage1_Hub'] = diag_stage1

            # --- 2. Stage 2 The Haunted Image Hunt ---
            stage2_btn = page.locator('[aria-label*="Stage 2"]').first
            if await stage2_btn.count() > 0:
                await stage2_btn.click()
            else:
                await page.click('text=THE HAUNTED IMAGE HUNT')
            await page.wait_for_timeout(1200)
            await page.screenshot(path=f'artifacts_stage2_{res_key}.png')
            
            diag_stage2 = await page.evaluate('''() => {
                const doc = document.documentElement;
                const body = document.body;
                return {
                    docScrollHeight: doc.scrollHeight,
                    docClientHeight: doc.clientHeight,
                    bodyScrollHeight: body.scrollHeight,
                    bodyClientHeight: body.clientHeight,
                    windowInnerHeight: window.innerHeight,
                    hasScroll: doc.scrollHeight > doc.clientHeight + 1,
                    diff: doc.scrollHeight - doc.clientHeight
                };
            }''')
            report[res_key]['Stage2_ImageHunt'] = diag_stage2

            # Return to dashboard/hub
            dash_btn = page.locator('button:has-text("Round Dashboard")').first
            if await dash_btn.count() > 0:
                await dash_btn.click()
            else:
                await page.goto('http://127.0.0.1:5173/?round=1&mock=1')
            await page.wait_for_timeout(1000)

            # --- 3. Stage 3 The Forgotten Graveyard ---
            stage3_btn = page.locator('[aria-label*="Stage 3"]').first
            if await stage3_btn.count() > 0:
                await stage3_btn.click()
            else:
                await page.click('text=THE FORGOTTEN GRAVEYARD')
            await page.wait_for_timeout(1200)
            await page.screenshot(path=f'artifacts_stage3_{res_key}.png')

            diag_stage3 = await page.evaluate('''() => {
                const doc = document.documentElement;
                const body = document.body;
                return {
                    docScrollHeight: doc.scrollHeight,
                    docClientHeight: doc.clientHeight,
                    bodyScrollHeight: body.scrollHeight,
                    bodyClientHeight: body.clientHeight,
                    windowInnerHeight: window.innerHeight,
                    hasScroll: doc.scrollHeight > doc.clientHeight + 1,
                    diff: doc.scrollHeight - doc.clientHeight
                };
            }''')
            report[res_key]['Stage3_Graveyard'] = diag_stage3

            await page.close()

        await browser.close()
        print(json.dumps(report, indent=2))

if __name__ == '__main__':
    asyncio.run(audit())
