# Coding Conventions

**Analysis Date:** 2026-11-06

## Naming Patterns

**Files:**
- React Components: PascalCase matching the component export (e.g. `FloorInteriorView.tsx`, `CollegeBuildingView.tsx`, `Round1Dashboard.tsx`).
- Business Services & Controllers: camelCase with descriptor suffix (e.g. `round4Service.ts`, `adminService.ts`, `soundController.ts`).
- Types & Interfaces: camelCase with `.types.ts` extension (e.g. `round4Expedition.types.ts`, `admin.types.ts`, `round.types.ts`).
- Constants: camelCase with `.constants.ts` extension (e.g. `credits.constants.ts`, `rounds.constants.ts`).
- Utilities: camelCase with `.utils.ts` extension (e.g. `validation.utils.ts`, `date.utils.ts`).
- Unit & Integration Tests: Name of tested unit plus `.test.ts` or `.test.tsx` (e.g. `FloorInteriorView.test.tsx`, `database_and_api.test.ts`).

**Functions:**
- Standard Functions & Methods: camelCase with active verb prefixes (`getProgress()`, `markTargetDiscovered()`, `verifyAnswer()`, `hashPassword()`, `requireTeamAuth()`).
- React Component Functions: PascalCase named exports (`export const FloorInteriorView: React.FC<FloorInteriorViewProps> = ...`).
- Custom React Hooks: camelCase with `use` prefix (`useNativeDialog()`, `useRoundFourIntro()`).
- Event Handlers: camelCase with `handle` or `on` prefix (`handleFloorClick()`, `onReturnToExterior()`, `handleClueSubmit()`).

**Variables:**
- Local Variables & State: camelCase (`activeFloorId`, `targetDiscovered`, `isSubmitting`, `currentStepIndex`).
- Boolean Flags: Prefix with `is`, `has`, `can`, or `should` (`isMuted`, `isPaused`, `hasClue`, `targetDiscovered`).
- Global Constants & Enums: UPPER_SNAKE_CASE (e.g. `COLLEGE_FLOORS`, `EXPEDITION_ROUTES`, `STAGE_CREDITS`, `INITIAL_HUNT_IMAGES`).
- Singleton Instances: camelCase instance exports (e.g. `export const round4Service = new Round4Service()`, `export const soundController = new SoundController()`).

**Types & Interfaces:**
- Interface & Type Aliases: PascalCase without Hungarian prefix (e.g. `ExpeditionProgress`, `FloorOverlayConfig`, `StageId`, `TeamSessionState`, NOT `IExpeditionProgress`).
- Component Props: PascalCase named with `Props` suffix (e.g. `FloorInteriorViewProps`, `CollegeBuildingViewProps`).
- Union String Literals: lower_snake_case or kebab-case string unions (e.g. `'route-1' | 'route-2'`, `'AVAILABLE' | 'IN_PROGRESS' | 'COMPLETED'`).

## Code Style

**Formatting:**
- Indentation: 2 spaces.
- Semicolons: Standard semicolons used consistently across backend and frontend TypeScript files.
- Quotes: Single quotes for TypeScript string literals (`'round-4'`), double quotes in JSX attributes (`className="..."`).
- Trailing Commas: Multi-line arrays, objects, and function argument lists include trailing commas.

**Linting:**
- Tool: Oxlint (`npx oxlint --deny-warnings`) integrated into `package.json` scripts and GitHub Actions CI.
- Key Enforced Rules:
  - `typescript:S3358`: No deeply nested ternary operators (extract complex conditions into independent helper variables or statements).
  - `typescript:S7503`: Async arrow functions must contain an `await` expression or return a promise explicitly.
  - `typescript:S4144`: No duplicate method or conditional implementations.
  - `react-hooks/exhaustive-deps`: Dependency arrays in `useEffect`, `useCallback`, and `useMemo` must be exhaustive; ref access during cleanup must cache `.current` locally within the effect body.
  - `no-unused-vars`: Unused variables and imports must be eliminated.

## Import Organization

**Order:**
1. Built-in Node.js modules with `node:` scheme:
   ```typescript
   import * as crypto from 'node:crypto';
   import * as path from 'node:path';
   import type { Server } from 'node:http';
   ```
2. External 3rd-party library imports:
   ```typescript
   import React, { useState, useEffect, useCallback, useRef } from 'react';
   import { Compass, Volume2, VolumeX, ShieldAlert } from 'lucide-react';
   ```
3. Type-only imports (always using `import type`):
   ```typescript
   import type { ExpeditionProgress, ExpeditionStep } from '../types/round4Expedition.types';
   import type { CollegeFloor } from './FloorConfiguration';
   ```
4. Internal business services, utilities, and constants:
   ```typescript
   import { round4Service } from '../../services/round4Service';
   import { soundController } from '../../utils/soundController';
   import { EXPEDITION_ROUTES } from './ExpeditionRouteConfiguration';
   ```
5. Component child imports:
   ```typescript
   import { CampusFloorMap } from './CampusFloorMap';
   import { FieldRiddlePanel } from './FieldRiddlePanel';
   ```
6. Styling imports:
   ```typescript
   import '../../styles/index.css';
   ```

**Path Aliases:**
- Standard relative path resolution (`../` and `./`) is utilized throughout `src/` and `server/`.
- Relative imports preserve explicit `.ts` extension where Node.js native ESM/CJS resolution requires it (e.g. `import { db } from '../../database/db.ts'`).

## Error Handling

**Patterns:**
- **Authoritative Backend APIs (`server/routes/`):**
  - Always validate request bodies upfront.
  - Return standardized JSON error envelopes: `{ success: false, message: string }` or `{ error: string }`.
  - Use appropriate HTTP status codes:
    - `400 Bad Request` for missing required fields or invalid formats.
    - `401 Unauthorized` for missing/invalid credentials or session cookies.
    - `403 Forbidden` for paused squads or unprivileged operations.
    - `404 Not Found` for non-existent teams or stages.
    - `500 Internal Server Error` for uncaught database or server failures.
  - Explicit early returns after sending error responses:
    ```typescript
    if (!teamName || !password) {
      res.status(400).json({ success: false, message: 'Squad Name and Ritual Password are required.' });
      return;
    }
    ```

- **Frontend Services (`src/services/`):**
  - Safe parsing of `localStorage` with fallback to default state:
    ```typescript
    try {
      return JSON.parse(stored);
    } catch {
      // Return safe initial state on corrupted JSON
      return initialProgress;
    }
    ```
  - Fetch requests wrap network errors into structured result objects rather than throwing unhandled exceptions:
    ```typescript
    try {
      const response = await fetch('/api/round4/submit', { ... });
      const data = await response.json();
      return data;
    } catch (err) {
      return { success: false, message: (err as Error).message || 'Network request failed' };
    }
    ```

## Logging

**Framework:**
- Built-in `console` methods (`console.error`, `console.warn`, `console.info`, `console.log`).

**Patterns:**
- Use domain-prefixed brackets in logs for clear traceability during server or browser troubleshooting:
  - `[Round4Service]` for client expedition logic.
  - `[SoundController]` for Web Audio API audio state changes.
  - `[SSE eventBus]` for client connections and broadcast transmissions.
  - `[DB Init]` for database bootstrapping and migration events.
- Sensitive credentials (passwords, auth cookies, raw hashes) are strictly excluded from log statements.

## Comments

**When to Comment:**
- Header docstrings at the top of domain service and configuration files explaining the role, architectural bounds, and coordinate spaces (e.g. `1629 × 965` SVG canvas resolution in `FloorConfiguration.ts`).
- Mathematical explanations for Bézier curves, SVG path matrices, and audio frequency curves.
- Intent explanation for security measures (e.g. constant-time buffer comparison `timingSafeEqual`).

**JSDoc/TSDoc:**
- Used on public service methods to document parameter expectations and return types:
  ```typescript
  /**
   * Verify team riddle answer against authoritative route configuration.
   * Case-insensitive matching with whitespace trimming.
   *
   * @param teamId Active squad identifier
   * @param routeId Target expedition route
   * @param stepId Active clue identifier
   * @param answer Plain text answer candidate
   */
  verifyAnswer(teamId: string, routeId: string, stepId: string, answer: string): ExpeditionVerificationResult;
  ```

## Function Design

**Size:**
- Single-purpose functions kept between 10 and 60 lines. Complex UI views are composed of subcomponents (e.g. `FloorInteriorView` delegates to `CampusFloorMap`, `RouteNavigation`, and `FieldRiddlePanel`).

**Parameters:**
- Functions with more than 3 related arguments accept a single typed options or props object:
  ```typescript
  interface SubmitClueOptions {
    teamId: string;
    routeId: string;
    stepId: string;
    answer: string;
  }
  ```

**Return Values:**
- Service mutations return the updated immutable state or an explicit result object `{ success: boolean; error?: string }`.
- React hook functions return tuples or structured state objects for intuitive destructuring.

## Module Design

**Exports:**
- Named exports are preferred across components and services (`export const FloorInteriorView: React.FC<FloorInteriorViewProps> = ...`).
- Singleton services are exported as named instances (`export const round4Service = new Round4Service()`).
- Barrel files (`src/types/index.ts`, `src/types/admin.ts`, `src/components/index.ts`) aggregate common exports for concise consumer imports.

**Barrel Files:**
- Used at directory boundaries (e.g. `src/types/index.ts`) to provide unified public contracts without circular dependencies.

---

*Convention analysis: 2026-11-06*

