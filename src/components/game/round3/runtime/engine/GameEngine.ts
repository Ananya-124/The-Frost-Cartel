import { disposeAudio, startDrone } from '../audio/sound';
import { normalizeCards } from '../config/cards';
import { MAX_FRAME_DT } from '../config/constants';
import { Renderer } from '../rendering/Renderer';
import type { PlayerIndex, PowerCard } from '../types';
import { randomInt } from '../utils/math';
import { installParadoxApi } from './cards/cardApi';
import { activateCardEffect, createCardEffects } from './cards/cardEffects';
import { type GameContext, Scheduler } from './context';
import { advanceHunt, endGame, startHunt } from './hunts/huntManager';
import { InputManager } from './input/InputManager';
import { handleActionKey, type Hunt1InteractionHandler, type Hunt2InteractionHandler, type Hunt3InteractionHandler } from './input/playerControls';
import { pressPuzzleKey } from './puzzles/puzzleManager';
import { createInitialState } from './state/createInitialState';
import type { GameStore } from './state/store';
import { updateGame } from './update';

export interface EngineElements {
  menuCanvas: HTMLCanvasElement;
  canvases: [HTMLCanvasElement, HTMLCanvasElement];
  /** Containers that receive the distortion filter. */
  halves: [HTMLElement, HTMLElement];
}

export type CardUseHandler = (slot: number, execute: () => boolean) => void;

const DISTORTION_FILTER = 'hue-rotate(40deg) saturate(2) contrast(1.3)';

/**
 * The game, running outside React. React creates it once, hands it canvases,
 * and calls `dispose()` on unmount; nothing here depends on React renders.
 */
export class GameEngine {
  private readonly store: GameStore;
  private readonly els: EngineElements;
  private readonly cardUseHandler?: CardUseHandler;
  private readonly ctx: GameContext;
  private readonly renderer: Renderer;
  private readonly input: InputManager;
  private readonly observers: ResizeObserver[] = [];
  private removeApi: (() => void) | null = null;
  private frame = 0;
  private lastTime = 0;
  private running = false;
  private gameplayEnabled = true;

  constructor(
    store: GameStore,
    els: EngineElements,
    cardUseHandler?: CardUseHandler,
    initialState = createInitialState(),
    hunt1InteractionHandler?: Hunt1InteractionHandler,
    hunt2InteractionHandler?: Hunt2InteractionHandler,
    hunt3InteractionHandler?: Hunt3InteractionHandler,
  ) {
    this.store = store;
    this.els = els;
    this.cardUseHandler = cardUseHandler;
    this.store.replaceState(initialState);
    this.ctx = {
      state: store.state,
      store,
      scheduler: new Scheduler(),
      cardEffects: createCardEffects(),
    };
    this.renderer = new Renderer(els.menuCanvas, els.canvases);
    this.input = new InputManager((e) => {
      const journalKey = e.code === 'KeyQ' || e.code === 'KeyP';
      if (this.gameplayEnabled || (journalKey && this.ctx.state.phase === 'playing')) {
        handleActionKey(this.ctx, e, (slot) => this.requestCardUse(slot), hunt1InteractionHandler, hunt2InteractionHandler, hunt3InteractionHandler);
      }
    });
  }

  /** Starts the render loop and size tracking. */
  start(): void {
    if (this.running) return;
    this.running = true;
    this.removeApi = installParadoxApi(this.ctx);
    window.addEventListener('resize', this.handleResize);
    for (const canvas of [this.els.menuCanvas, ...this.els.canvases]) {
      const observer = new ResizeObserver(this.handleResize);
      observer.observe(canvas);
      this.observers.push(observer);
    }
    this.renderer.resize();
    this.lastTime = performance.now();
    this.frame = requestAnimationFrame(this.loop);
  }

  /** Stops everything and removes every listener, timer and audio node. */
  dispose(): void {
    this.running = false;
    cancelAnimationFrame(this.frame);
    window.removeEventListener('resize', this.handleResize);
    this.observers.forEach((o) => o.disconnect());
    this.observers.length = 0;
    this.input.dispose();
    this.ctx.scheduler.clear();
    this.removeApi?.();
    this.removeApi = null;
    disposeAudio();
  }

  /** Begins a new game from the menu. */
  startGame(teamName: string, cards: readonly PowerCard[]): void {
    this.ctx.scheduler.clear();
    this.store.replaceState({
      ...createInitialState(teamName.trim() || 'Team', normalizeCards(cards)),
      phase: 'playing',
    });
    startDrone();
    startHunt(this.ctx, 0);
    this.store.emit();
  }

  setGameplayEnabled(enabled: boolean): void {
    this.gameplayEnabled = enabled;
    if (!enabled) this.input.clearHeldKeys();
  }

  /** Ends an expired run using the latest total returned by the server. */
  endWithServerScore(score: number): void {
    if (!Number.isSafeInteger(score) || score < 0) return;
    this.ctx.state.score = score;
    if (this.ctx.state.phase !== 'ended') endGame(this.ctx);
    if (this.ctx.state.summary) this.ctx.state.summary.totalScore = score;
    this.store.emit();
  }

  /** Back to the menu after the end screen. */
  newSession(): void {
    this.ctx.scheduler.clear();
    this.store.replaceState(createInitialState());
  }

  pressPuzzle(index: PlayerIndex, key: number): void {
    if (!this.gameplayEnabled) return;
    pressPuzzleKey(this.ctx.state, index, key);
    this.flush();
  }

  setCards(cards: readonly PowerCard[]): void {
    this.ctx.state.cards = cards.map((card) => ({ ...card }));
    this.store.emit();
  }

  useCardSlot(slot: number): void {
    if (!this.gameplayEnabled) return;
    this.requestCardUse(slot);
  }

  /** Continues into the existing Hunt 2 only after the server completed Hunt 1. */
  advanceAfterHunt1(): void {
    if (this.ctx.state.huntIndex !== 0 || this.ctx.state.phase !== 'playing') return;
    advanceHunt(this.ctx);
    this.store.emit();
  }

  /** Continues into the existing Hunt 3 after the server completed Hunt 2. */
  advanceAfterHunt2(): void {
    if (this.ctx.state.huntIndex !== 1 || this.ctx.state.phase !== 'playing') return;
    advanceHunt(this.ctx);
    this.store.emit();
  }

  private requestCardUse(slot: number): void {
    const execute = () => {
      const used = activateCardEffect(this.ctx, slot);
      this.flush();
      return used;
    };
    if (this.cardUseHandler) this.cardUseHandler(slot, execute);
    else execute();
  }

  private flush(): void {
    if (this.ctx.state.dirty) this.store.emit();
  }

  private handleResize = (): void => {
    this.renderer.resize();
  };

  private loop = (timestamp: number): void => {
    if (!this.running) return;
    const state = this.ctx.state;
    const dt = Math.min(MAX_FRAME_DT, (timestamp - this.lastTime) / 1000 || 0);
    this.lastTime = timestamp;
    if (this.gameplayEnabled) state.time += dt;

    if (state.phase === 'playing' && this.gameplayEnabled) {
      updateGame(this.ctx, this.input, dt);
      for (const i of [0, 1] as const) {
        this.renderer.drawTimeline(state, i);
        const distorted = state.distortion > 0;
        this.els.halves[i].style.filter = distorted ? DISTORTION_FILTER : '';
        this.els.canvases[i].style.transform = distorted
          ? `translate(${randomInt(9) - 4}px,${randomInt(9) - 4}px)`
          : '';
      }
    } else if (state.phase === 'menu') {
      this.renderer.drawMenu(state);
    }

    if (state.dirty) this.store.emit();
    this.frame = requestAnimationFrame(this.loop);
  };
}
