import asyncio
import json
from playwright.async_api import async_playwright

async def inspect_breakdown():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={'width': 1366, 'height': 768})

        # --- Inspect Stage 2 ---
        await page.goto('http://127.0.0.1:5173/?round=1&mock=1')
        await page.wait_for_timeout(1000)
        await page.click('text=STAGE 2')
        await page.wait_for_timeout(1500)

        stage2_breakdown = await page.evaluate('''() => {
            const getBox = (el) => {
                if (!el) return null;
                const rect = el.getBoundingClientRect();
                const style = window.getComputedStyle(el);
                return {
                    tagName: el.tagName,
                    className: el.className ? String(el.className).slice(0, 50) : '',
                    height: rect.height,
                    width: rect.width,
                    marginTop: style.marginTop,
                    marginBottom: style.marginBottom,
                    paddingTop: style.paddingTop,
                    paddingBottom: style.paddingBottom
                };
            };
            const header = document.querySelector('header');
            const checklist = document.querySelector('[role="region"][aria-label*="Relic"]') || document.querySelector('header + div') || document.querySelector('.relic-checklist');
            const main = document.querySelector('main');
            const footer = document.querySelector('footer');
            const allPhotos = Array.from(document.querySelectorAll('main div[role="button"], main button, main .photo-card')).map(getBox);
            
            return {
                windowHeight: window.innerHeight,
                header: getBox(header),
                checklist: getBox(checklist),
                main: getBox(main),
                footer: getBox(footer),
                photoCount: allPhotos.length,
                samplePhoto: allPhotos[0]
            };
        }''')
        print("=== STAGE 2 BREAKDOWN (at 1366x768) ===")
        print(json.dumps(stage2_breakdown, indent=2))

        # --- Inspect Stage 3 ---
        await page.goto('http://127.0.0.1:5173/?round=1&mock=1')
        await page.wait_for_timeout(1000)
        await page.click('text=STAGE 3')
        await page.wait_for_timeout(1500)

        stage3_breakdown = await page.evaluate('''() => {
            const getBox = (el) => {
                if (!el) return null;
                const rect = el.getBoundingClientRect();
                const style = window.getComputedStyle(el);
                return {
                    tagName: el.tagName,
                    className: el.className ? String(el.className).slice(0, 60) : '',
                    height: rect.height,
                    width: rect.width,
                    marginTop: style.marginTop,
                    marginBottom: style.marginBottom,
                    paddingTop: style.paddingTop,
                    paddingBottom: style.paddingBottom
                };
            };
            const header = document.querySelector('header');
            const heading = document.querySelector('h1')?.parentElement;
            const coffinGrid = document.querySelector('.grid-cols-1');
            const footer = document.querySelector('footer');
            const coffins = Array.from(document.querySelectorAll('.grid-cols-1 > div')).map(getBox);

            return {
                windowHeight: window.innerHeight,
                header: getBox(header),
                heading: getBox(heading),
                coffinGrid: getBox(coffinGrid),
                footer: getBox(footer),
                coffinCount: coffins.length,
                coffinSample: coffins[0]
            };
        }''')
        print("=== STAGE 3 BREAKDOWN (at 1366x768) ===")
        print(json.dumps(stage3_breakdown, indent=2))

        # --- Inspect Stage 1 Hub ---
        await page.goto('http://127.0.0.1:5173/?round=1&mock=1')
        await page.wait_for_timeout(1000)
        stage1_breakdown = await page.evaluate('''() => {
            const getBox = (el) => {
                if (!el) return null;
                const rect = el.getBoundingClientRect();
                return {
                    tagName: el.tagName,
                    className: el.className ? String(el.className).slice(0, 60) : '',
                    height: rect.height,
                    width: rect.width
                };
            };
            const header = document.querySelector('header');
            const main = document.querySelector('main');
            const portals = Array.from(document.querySelectorAll('main .group, main [role="button"]')).map(getBox);
            return {
                windowHeight: window.innerHeight,
                header: getBox(header),
                main: getBox(main),
                portalCount: portals.length,
                portalSample: portals[0]
            };
        }''')
        print("=== STAGE 1 HUB BREAKDOWN (at 1366x768) ===")
        print(json.dumps(stage1_breakdown, indent=2))

        await browser.close()

if __name__ == '__main__':
    asyncio.run(inspect_breakdown())

