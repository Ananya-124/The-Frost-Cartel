import { createRef, type RefObject, useEffect, useRef, useState } from 'react';
import { GameEngine, type CardUseHandler } from '../engine/GameEngine';
import type { Hunt1InteractionHandler, Hunt2InteractionHandler, Hunt3InteractionHandler } from '../engine/input/playerControls';
import type { GameStore } from '../engine/state/store';
import type { GameState } from '../types';

/** Stable refs to the canvases and containers the engine needs. */
export interface EngineRefs {
  menuCanvas: RefObject<HTMLCanvasElement | null>;
  pastCanvas: RefObject<HTMLCanvasElement | null>;
  futureCanvas: RefObject<HTMLCanvasElement | null>;
  pastHalf: RefObject<HTMLDivElement | null>;
  futureHalf: RefObject<HTMLDivElement | null>;
}

export const createEngineRefs = (): EngineRefs => ({
  menuCanvas: createRef<HTMLCanvasElement | null>(),
  pastCanvas: createRef<HTMLCanvasElement | null>(),
  futureCanvas: createRef<HTMLCanvasElement | null>(),
  pastHalf: createRef<HTMLDivElement | null>(),
  futureHalf: createRef<HTMLDivElement | null>(),
});

/**
 * Creates the engine once the canvases exist and disposes it on unmount.
 * The engine is not re-created on renders; only when the store or refs change.
 */
export function useGameEngine(
  store: GameStore,
  refs: EngineRefs,
  cardUseHandler?: CardUseHandler,
  initialState?: GameState,
  hunt1InteractionHandler?: Hunt1InteractionHandler,
  hunt2InteractionHandler?: Hunt2InteractionHandler,
  hunt3InteractionHandler?: Hunt3InteractionHandler
): GameEngine | null {
  const [engine, setEngine] = useState<GameEngine | null>(null);
  const cardUseRef = useRef(cardUseHandler);
  cardUseRef.current = cardUseHandler;
  const hunt1Ref = useRef(hunt1InteractionHandler);
  hunt1Ref.current = hunt1InteractionHandler;
  const hunt2Ref = useRef(hunt2InteractionHandler);
  hunt2Ref.current = hunt2InteractionHandler;
  const hunt3Ref = useRef(hunt3InteractionHandler);
  hunt3Ref.current = hunt3InteractionHandler;
  const initialStateRef = useRef(initialState);

  useEffect(() => {
    const menuCanvas = refs.menuCanvas.current;
    const pastCanvas = refs.pastCanvas.current;
    const futureCanvas = refs.futureCanvas.current;
    const pastHalf = refs.pastHalf.current;
    const futureHalf = refs.futureHalf.current;
    if (!menuCanvas || !pastCanvas || !futureCanvas || !pastHalf || !futureHalf) return;

    const created = new GameEngine(
      store,
      {
        menuCanvas,
        canvases: [pastCanvas, futureCanvas],
        halves: [pastHalf, futureHalf],
      },
      (slot, exec) => (cardUseRef.current ? cardUseRef.current(slot, exec) : exec()),
      initialStateRef.current,
      (p, o) => hunt1Ref.current?.(p, o),
      (p, o) => hunt2Ref.current?.(p, o),
      (p, o) => hunt3Ref.current?.(p, o),
    );
    created.start();
    const stateFrame = requestAnimationFrame(() => setEngine(created));
    return () => {
      cancelAnimationFrame(stateFrame);
      created.dispose();
    };
  }, [store, refs]);

  return engine;
}
