
import type { GameState, PlayerIndex } from '../types';
import { createWorldAssets, get2d, type WorldAssets } from './prerender';
import { renderScene, type DustMote, type View } from './renderScene';

function createView(canvas: HTMLCanvasElement): View {
  const light = document.createElement('canvas');

  return {
    canvas,
    ctx: get2d(canvas),
    light,
    lightCtx: get2d(light),
  };
}

/** Owns canvas drawing resources. Created once; never touches React. */
export class Renderer {
  private readonly assets: WorldAssets = createWorldAssets();

  private readonly dust: DustMote[] = Array.from({ length: 110 }, () => ({
    x: Math.random(),
    y: Math.random(),
    v: 0.012 + Math.random() * 0.035,
  }));

  private readonly menuView: View;
  private readonly timelineViews: [View, View];

  constructor(
    menuCanvas: HTMLCanvasElement,
    canvases: [HTMLCanvasElement, HTMLCanvasElement],
  ) {
    this.menuView = createView(menuCanvas);
    this.timelineViews = [
      createView(canvases[0]),
      createView(canvases[1]),
    ];
  }

  /** Matches each canvas's pixel size to its on-screen size. */
  resize(): void {
    for (const view of [this.menuView, ...this.timelineViews]) {
      const width = view.canvas.clientWidth || window.innerWidth / 2;
      const height = view.canvas.clientHeight || window.innerHeight;

      if (
        view.canvas.width !== width ||
        view.canvas.height !== height
      ) {
        view.canvas.width = view.light.width = width;
        view.canvas.height = view.light.height = height;
      }
    }
  }

  /** Shared atmospheric post-processing for all game environments. */
  private drawAtmosphere(view: View, time: number, intensity = 1): void {
    const ctx = view.ctx;
    const width = view.canvas.width;
    const height = view.canvas.height;

    if (!width || !height) return;

    ctx.save();

    // Cold paranormal colour grading.
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = `rgba(5, 9, 22, ${0.13 * intensity})`;
    ctx.fillRect(0, 0, width, height);

    // Slowly shifting supernatural fog.
    const fogX = width * (0.5 + Math.sin(time * 0.11) * 0.25);
    const fogY = height * (0.58 + Math.cos(time * 0.08) * 0.08);

    const fog = ctx.createRadialGradient(
      fogX,
      fogY,
      0,
      fogX,
      fogY,
      width * 0.75,
    );

    fog.addColorStop(0, `rgba(105, 122, 170, ${0.075 * intensity})`);
    fog.addColorStop(0.45, `rgba(57, 72, 120, ${0.045 * intensity})`);
    fog.addColorStop(1, 'rgba(20, 25, 50, 0)');

    ctx.fillStyle = fog;
    ctx.fillRect(0, 0, width, height);

    // Low-lying fog near the bottom of the environment.
    const mist = ctx.createLinearGradient(
      0,
      height * 0.55,
      0,
      height,
    );

    mist.addColorStop(0, 'rgba(80, 96, 145, 0)');
    mist.addColorStop(0.65, `rgba(75, 87, 130, ${0.055 * intensity})`);
    mist.addColorStop(1, `rgba(105, 115, 155, ${0.09 * intensity})`);

    ctx.fillStyle = mist;
    ctx.fillRect(0, height * 0.5, width, height * 0.5);

    // Dark cinematic vignette.
    const vignette = ctx.createRadialGradient(
      width * 0.5,
      height * 0.48,
      Math.min(width, height) * 0.18,
      width * 0.5,
      height * 0.48,
      Math.max(width, height) * 0.78,
    );

    vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vignette.addColorStop(0.55, 'rgba(1, 3, 12, 0.12)');
    vignette.addColorStop(1, `rgba(0, 0, 5, ${0.72 * intensity})`);

    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);

    // Very subtle supernatural light fluctuation.
    const pulse = Math.pow(
      Math.max(0, Math.sin(time * 0.72)),
      12,
    );

    if (pulse > 0.02) {
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = `rgba(105, 125, 255, ${pulse * 0.055 * intensity})`;
      ctx.fillRect(0, 0, width, height);
    }

    // Occasional cold spectral glow.
    const glowX = width * (0.72 + Math.sin(time * 0.17) * 0.12);
    const glowY = height * (0.38 + Math.cos(time * 0.13) * 0.12);

    const glow = ctx.createRadialGradient(
      glowX,
      glowY,
      0,
      glowX,
      glowY,
      width * 0.28,
    );

    glow.addColorStop(0, `rgba(100, 115, 255, ${0.035 * intensity})`);
    glow.addColorStop(1, 'rgba(70, 85, 255, 0)');

    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);

    ctx.restore();
  }

  /** Floating dust and supernatural particles. */
  private drawParticles(view: View, time: number, intensity = 1): void {
    const ctx = view.ctx;
    const width = view.canvas.width;
    const height = view.canvas.height;

    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    this.dust.forEach((particle, index) => {
      particle.y -= particle.v;

      particle.x += Math.sin(time * 0.25 + index) * 0.00012;

      if (particle.y < -0.03) {
        particle.y = 1.03;
        particle.x = Math.random();
      }

      if (particle.x < 0) particle.x = 1;
      if (particle.x > 1) particle.x = 0;

      const x = particle.x * width;
      const y = particle.y * height;

      const shimmer =
        0.3 + Math.abs(Math.sin(time * 1.5 + index)) * 0.7;

      const radius = index % 9 === 0 ? 2 : 1;

      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);

      ctx.fillStyle = index % 5 === 0
        ? `rgba(155, 165, 255, ${0.34 * shimmer * intensity})`
        : `rgba(185, 195, 215, ${0.22 * shimmer * intensity})`;

      ctx.fill();
    });

    ctx.restore();
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

    this.drawParticles(this.menuView, state.time, 0.8);
    this.drawAtmosphere(this.menuView, state.time, 0.85);
  }

  drawTimeline(state: GameState, index: PlayerIndex): void {
    const player = state.players[index];
    const view = this.timelineViews[index];

    renderScene({
      view,
      assets: this.assets,
      dust: this.dust,
      state,
      timeline: index,
      cx: player.x,
      cy: player.y,
      t: state.time,
      player,
    });

    this.drawParticles(view, state.time, 1);
    this.drawAtmosphere(view, state.time, 1);
  }
}
