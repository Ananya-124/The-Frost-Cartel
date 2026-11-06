# Testing Patterns

**Analysis Date:** 2026-11-06

## Test Framework

**Runner:**
- Vitest v4.1.2
- Config: `vite.config.ts` (configured under `test` block of `defineConfig`)
- Environment Matching:
  - `server/**` runs in Node.js environment (`node`).
  - `src/**` runs in DOM environment (`jsdom`).

**Assertion Library:**
- Vitest built-in `expect` with `@testing-library/jest-dom/vitest` matchers (e.g. `toBeInTheDocument()`, `toBeDisabled()`).

**Run Commands:**
```bash
npm test                       # Run all 10 test suites once (vitest run)
npx vitest                     # Interactive watch mode for TDD
npx vitest run --coverage      # Run all tests with code coverage analysis
npx vitest run server/         # Run only server-side integration tests
npx vitest run src/components/ # Run only React UI component tests
```

## Test File Organization

**Location:**
- Unit & Component Tests: Separate dedicated test directories:
  - Frontend components: `src/components/__tests__/`
  - Frontend services: `src/services/__tests__/`
  - Backend integration: `server/__tests__/`

**Naming:**
- Suffix with `.test.ts` for logic/service/backend suites and `.test.tsx` for React component suites.
- File names correspond directly to the tested unit:
  - `FloorInteriorView.test.tsx` tests `src/components/game/round4/FloorInteriorView.tsx`.
  - `round1Service.test.ts` tests `src/services/round1Service.ts`.
  - `database_and_api.test.ts` tests `server/index.ts`, `server/routes/*`, and `database/db.ts`.

**Structure:**
```text
winter-arc/
├── server/
│   └── __tests__/
│       ├── database_and_api.test.ts        # Authoritative Express API & DB tests
│       └── persistence_restart.test.ts     # SQLite process restart durability tests
├── src/
│   ├── test/
│   │   └── setup.ts                        # Vitest setup & HTMLDialogElement polyfill
│   ├── components/
│   │   └── __tests__/
│   │       ├── AdminPortal.test.tsx
│   │       ├── CollegeBuildingView.test.tsx
│   │       ├── FloorInteriorView.test.tsx
│   │       ├── FrostCartelHomePage.test.tsx
│   │       ├── RoundFourIntro.test.tsx
│   │       ├── Stage2HauntedImageHunt.test.tsx
│   │       └── Stage3ForgottenGraveyard.test.tsx
│   └── services/
│       └── __tests__/
│           └── round1Service.test.ts
```

## Test Structure

**Suite Organization (React Component Pattern):**
```typescript
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { FloorInteriorView } from '../game/round4/FloorInteriorView';
import { COLLEGE_FLOORS } from '../game/round4/FloorConfiguration';
import { round4Service } from '../../services/round4Service';

describe('Round 04 Floor Interior: The Campus Expedition Map & Cooperative Treasure Hunt', () => {
  const mockReturn = vi.fn();
  const mockToggleMute = vi.fn();
  const mockExit = vi.fn();
  const testFloor = COLLEGE_FLOORS[0]; // Seventh Floor

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders the complete cooperative treasure hunt map interface matching the reference design', () => {
    render(
      <FloorInteriorView
        floor={testFloor}
        onReturnToExterior={mockReturn}
        isMuted={false}
        onToggleMute={mockToggleMute}
        onExit={mockExit}
      />
    );

    expect(screen.getByText('FROST CARTEL')).toBeInTheDocument();
    expect(screen.getByText(/ROUND 04 • SEVENTH FLOOR/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Return to Exterior/i })).toBeInTheDocument();
  });
});
```

**Suite Organization (Backend Node.js API Pattern):**
```typescript
// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { Server } from 'node:http';
import { app } from '../index.ts';
import { db, initDatabase } from '../../database/db.ts';

describe('FROST CARTEL Authoritative Database & API Layer', () => {
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    initDatabase();
    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const addr = server.address();
        if (addr && typeof addr === 'object') {
          baseUrl = `http://127.0.0.1:${addr.port}`;
        }
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  it('authenticates admin with valid credentials and sets secure session cookie', async () => {
    const res = await fetch(`${baseUrl}/api/auth/admin-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin123', password: 'admin@1' }),
    });
    expect(res.status).toBe(200);
    const cookie = res.headers.get('set-cookie');
    expect(cookie).toContain('fc_admin_session=');
  });
});
```

**Patterns:**
- Setup: `beforeEach` resets mocks with `vi.clearAllMocks()` and clears browser storage (`localStorage.clear()`, `sessionStorage.clear()`).
- Backend Server Bind: Ephemeral port assignment (`app.listen(0, '127.0.0.1')`) prevents port collision during parallel test runs.
- Teardown: `afterAll` closes the HTTP server cleanly via `server.close()`.
- Global Polyfill (`src/test/setup.ts`): Polyfills `<dialog>` elements (`HTMLDialogElement.prototype.showModal` and `close`) so native modal dialogs render properly inside jsdom.

## Mocking

**Framework:**
- Vitest built-in mock utilities (`vi.fn()`, `vi.spyOn()`, `vi.mock()`).

**Patterns:**
```typescript
// Mocking callback props
const mockOnSelect = vi.fn();
const mockToggleMute = vi.fn();

// Mocking service methods
const progressSpy = vi.spyOn(round4Service, 'getProgress').mockReturnValue({
  teamId: 'team_alpha',
  activeRouteId: 'route-1',
  activeStepIndex: 0,
  targetDiscovered: false,
  solvedStepIds: [],
  completedRouteIds: [],
  lastUpdated: new Date().toISOString(),
});
```

**What to Mock:**
- Web Audio API contexts and synthetic sound playback (`soundController`).
- Navigation transitions and parent window redirection.
- External timers or animations with `vi.useFakeTimers()` when testing timed intervals.

**What NOT to Mock:**
- Real SQLite queries in `server/__tests__/`: The authoritative backend tests run against real SQLite in-process to guarantee schema, index, foreign key, and WAL integrity.
- Component state transitions driven by `@testing-library/react` events.

## Fixtures and Factories

**Test Data:**
- Real domain data models are imported directly from configurations:
  - `COLLEGE_FLOORS` from `src/components/game/round4/FloorConfiguration.ts`.
  - `EXPEDITION_ROUTES` from `src/components/game/round4/ExpeditionRouteConfiguration.ts`.
  - `STAGE_CREDITS` from `src/constants/credits.constants.ts`.

**Location:**
- Seed bootstrap fixture logic is maintained in `database/db.ts:seedBootstrapData()` and refreshed in `server/__tests__/database_and_api.test.ts`.

## Coverage

**Requirements:**
- Automated in GitHub Actions CI (`.github/workflows/ci.yml`).
- Every pull request and push to `main` executes `npm run lint`, `tsc -b`, and `npm test`.

**View Coverage:**
```bash
npx vitest run --coverage
```

## Test Types

**Unit Tests:**
- Validate individual service methods (e.g. `round1Service.test.ts` checking 22-minute timer calculations, hint credit deductions, and non-sequential stage unlocking).
- Validate individual React components rendering appropriate accessibility roles, labels, and state transitions (`CollegeBuildingView.test.tsx`, `FloorInteriorView.test.tsx`).

**Integration Tests:**
- Validate full HTTP request/response lifecycles, cookie parsing, scrypt password authentication, SSE event stream emission, and SQLite WAL persistence across server restarts (`database_and_api.test.ts`, `persistence_restart.test.ts`).

**E2E Tests:**
- No browser automation harness (e.g. Playwright or Cypress) currently installed. Full-stack verification is conducted via Vitest integration tests and visual verification captures.

## Common Patterns

**Async Testing:**
```typescript
it('submits clue answer and updates expedition progress', async () => {
  render(<FloorInteriorView floor={testFloor} onReturnToExterior={vi.fn()} isMuted={false} onToggleMute={vi.fn()} onExit={vi.fn()} />);
  
  const input = screen.getByPlaceholderText(/ENTER CODE \/ ANSWER/i);
  fireEvent.change(input, { target: { value: 'ARCHIVE-701' } });
  
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: /SUBMIT/i }));
  });

  expect(screen.getByText(/CORRECT/i)).toBeInTheDocument();
});
```

**Error Testing:**
```typescript
it('rejects team login with invalid password', async () => {
  const res = await fetch(`${baseUrl}/api/auth/team-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ teamName: 'TEAM AI', password: 'WrongPassword' }),
  });
  expect(res.status).toBe(401);
  const data = await res.json();
  expect(data.success).toBe(false);
  expect(data.message).toMatch(/Invalid Squad Name or password/i);
});
```

---

*Testing analysis: 2026-11-06*
