import type { GameState, PlayerIndex } from '../types';
import { createWorldAssets, get2d, type WorldAssets } from './prerender';
import { renderScene, type DustMote, type View } from './renderScene';

function createView(canvas: HTMLCanvasElement): View {
  const light = document.createElement('canvas');
  return { canvas, ctx: get2d(canvas), light, lightCtx: get2d(light) };
}

/** Owns the canvases' drawing resources. Created once; never touches React. */
export class Renderer {
  private readonly assets: WorldAssets = createWorldAssets();
  private readonly dust: DustMote[] = Array.from({ length: 90 }, () => ({
    x: Math.random(),
    y: Math.random(),
    v: 0.02 + Math.random() * 0.05,
  }));
  private readonly menuView: View;
  private readonly timelineViews: [View, View];

  constructor(menuCanvas: HTMLCanvasElement, canvases: [HTMLCanvasElement, HTMLCanvasElement]) {
    this.menuView = createView(menuCanvas);
    this.timelineViews = [createView(canvases[0]), createView(canvases[1])];
  }

  /** Matches each canvas's pixel size to its on-screen size. */
  resize(): void {
    for (const v of [this.menuView, ...this.timelineViews]) {
      const w = v.canvas.clientWidth || window.innerWidth / 2;
      const h = v.canvas.clientHeight || window.innerHeight;
      if (v.canvas.width !== w || v.canvas.height !== h) {
        v.canvas.width = v.light.width = w;
        v.canvas.height = v.light.height = h;
      }
    }
  }

  /** Slowly drifting camera behind the menu. */
  drawMenu(state: GameState): void {
    const t = state.time * 0.5;
    renderScene({
      view: this.menuView,
      assets: this.assets,
      dust: this.dust,
      state,
      timeline: state.time % 40 > 20 ? 1 : 0,
      cx: 300 + (Math.sin(t * 0.3) * 0.5 + 0.5) * 1000,
      cy: 250 + (Math.cos(t * 0.2) * 0.5 + 0.5) * 600,
      t: state.time,
      player: null,
    });
  }

  drawTimeline(state: GameState, index: PlayerIndex): void {
    const player = state.players[index];
    renderScene({
      view: this.timelineViews[index],
      assets: this.assets,
      dust: this.dust,
      state,
      timeline: index,
      cx: player.x,
      cy: player.y,
      t: state.time,
      player,
    });
  }
}
