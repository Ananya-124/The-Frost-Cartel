import type { CharacterPose, GameState, PlayerIndex, Player } from '../types';
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

/** Pre-renders a tile of monochrome film grain. */
function createGrainTile(size: number): HTMLCanvasElement {
  const tile = document.createElement('canvas');
  tile.width = tile.height = size;
  const g = get2d(tile);
  const img = g.createImageData(size, size);
  for (let k = 0; k < img.data.length; k += 4) {
    const v = Math.floor(Math.random() * 255);
    img.data[k] = img.data[k + 1] = img.data[k + 2] = v;
    img.data[k + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  return tile;
}

/** Pre-renders thin horizontal scanlines for the Future's degraded-camera look. */
function createScanlineTile(): HTMLCanvasElement {
  const tile = document.createElement('canvas');
  tile.width = 4;
  tile.height = 3;
  const g = get2d(tile);
  g.fillStyle = 'rgba(0,0,0,.22)';
  g.fillRect(0, 2, 4, 1);
  return tile;
}

/** Owns canvas drawing resources. Created once; never touches React. */
export class Renderer {
  private readonly assets: WorldAssets = createWorldAssets();

  private readonly dust: DustMote[] = Array.from({ length: 82 }, () => ({
    x: Math.random(),
    y: Math.random(),
    v: 0.012 + Math.random() * 0.035,
  }));

  private readonly grain: HTMLCanvasElement = createGrainTile(160);
  private readonly scanlines: HTMLCanvasElement = createScanlineTile();

  private readonly menuView: View;
  private readonly timelineViews: [View, View];
  private readonly playerSamples: Array<{ x: number; y: number; facingX: number; facingY: number; phase: number; time: number; moving: boolean }> = [
    { x: 0, y: 0, facingX: 0, facingY: 1, phase: 0, time: -1, moving: false },
    { x: 0, y: 0, facingX: 0, facingY: 1, phase: 0, time: -1, moving: false },
  ];

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

  /** Shared colour grade + vignette. Past = sepia/amber, Future = cold teal. */
  private drawAtmosphere(view: View, time: number, timeline: PlayerIndex, intensity = 1): void {
    const ctx = view.ctx;
    const width = view.canvas.width;
    const height = view.canvas.height;

    if (!width || !height) return;

    ctx.save();

    // Colour grading.
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = timeline === 1
      ? `rgba(6, 18, 24, ${0.1 * intensity})`
      : `rgba(34, 18, 6, ${0.1 * intensity})`;
    ctx.fillRect(0, 0, width, height);

    // Slow fog.
    const fogX = width * (0.5 + Math.sin(time * 0.11) * 0.25);
    const fogY = height * (0.58 + Math.cos(time * 0.08) * 0.08);
    const fog = ctx.createRadialGradient(fogX, fogY, 0, fogX, fogY, width * 0.75);
    const fogRgb = timeline === 1 ? '120, 165, 175' : '175, 140, 100';
    fog.addColorStop(0, `rgba(${fogRgb}, ${0.04 * intensity})`);
    fog.addColorStop(0.45, `rgba(${fogRgb}, ${0.022 * intensity})`);
    fog.addColorStop(1, 'rgba(20, 20, 17, 0)');
    ctx.fillStyle = fog;
    ctx.fillRect(0, 0, width, height);

    // Vignette.
    const vignette = ctx.createRadialGradient(
      width * 0.5, height * 0.48, Math.min(width, height) * 0.18,
      width * 0.5, height * 0.48, Math.max(width, height) * 0.78,
    );
    vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vignette.addColorStop(0.55, 'rgba(1, 3, 12, 0.1)');
    vignette.addColorStop(1, `rgba(0, 0, 0, ${0.35 * intensity})`);
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);

    // Faint supernatural pulse.
    const pulse = Math.pow(Math.max(0, Math.sin(time * 0.72)), 12);
    if (pulse > 0.02) {
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = timeline === 1
        ? `rgba(110, 170, 190, ${pulse * 0.03 * intensity})`
        : `rgba(192, 150, 100, ${pulse * 0.035 * intensity})`;
      ctx.fillRect(0, 0, width, height);
    }

    ctx.restore();
  }

  /** Film grain, scanlines, flicker and glitch — the final "haunted footage" pass. */
  private drawHorrorOverlay(view: View, time: number, timeline: PlayerIndex, intensity = 1): void {
    const ctx = view.ctx;
    const width = view.canvas.width;
    const height = view.canvas.height;

    if (!width || !height) return;

    ctx.save();

    // Animated film grain: random offset of the tile each frame.
    const gx = Math.floor(Math.random() * 160);
    const gy = Math.floor(Math.random() * 160);
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = (timeline === 1 ? 0.06 : 0.09) * intensity;
    ctx.translate(-gx, -gy);
    const grainPattern = ctx.createPattern(this.grain, 'repeat');
    if (grainPattern) {
      ctx.fillStyle = grainPattern;
      ctx.fillRect(0, 0, width + 160, height + 160);
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // Future: scanlines for a degraded-camera feel.
    if (timeline === 1) {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 0.12 * intensity;
      const lines = ctx.createPattern(this.scanlines, 'repeat');
      if (lines) {
        ctx.fillStyle = lines;
        ctx.fillRect(0, 0, width, height);
      }
    }

    // Light-starvation flicker: brief darkening bursts.
    const flick = Math.sin(time * 23 + (timeline === 1 ? 1.7 : 0)) * Math.sin(time * 7.3);
    if (flick > (timeline === 1 ? 0.975 : 0.93)) {
      ctx.globalAlpha = (flick - 0.93) * (timeline === 1 ? 2 : 5) * intensity;
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, width, height);
    }

    // Future: rare horizontal glitch tear.
    if (timeline === 1 && time % 11 < 0.14) {
      const stripY = Math.floor(((time * 37) % 1) * (height - 40));
      const stripH = 14 + Math.floor(((time * 91) % 1) * 24);
      const shift = (Math.random() - 0.5) * 26;
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      ctx.drawImage(view.canvas, 0, stripY, width, stripH, shift, stripY, width, stripH);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = '#b4aaa0';
      ctx.fillRect(0, stripY, width, 1);
    }

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

      const radius = index % 9 === 0 ? 1.5 : 0.8;

      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);

      ctx.fillStyle = index % 5 === 0
        ? `rgba(194, 174, 132, ${0.24 * shimmer * intensity})`
        : `rgba(205, 198, 178, ${0.16 * shimmer * intensity})`;

      ctx.fill();
    });

    ctx.restore();
  }

  /** Slowly drifting camera behind the menu. */
  drawMenu(state: GameState): void {
    const t = state.time * 0.5;
    const timeline: PlayerIndex = state.time % 40 > 20 ? 1 : 0;

    renderScene({
      view: this.menuView,
      assets: this.assets,
      dust: this.dust,
      state,
      timeline,
      cx: 300 + (Math.sin(t * 0.3) * 0.5 + 0.5) * 1000,
      cy: 250 + (Math.cos(t * 0.2) * 0.5 + 0.5) * 600,
      t: state.time,
      player: null,
    });

    this.drawParticles(this.menuView, state.time, 0.8);
    this.drawAtmosphere(this.menuView, state.time, timeline, 0.6);
    this.drawHorrorOverlay(this.menuView, state.time, timeline, 0.9);
  }

  drawTimeline(state: GameState, index: PlayerIndex): void {
    const player = state.players[index];
    const view = this.timelineViews[index];
    const pose = this.samplePose(player, index, state.time);
    const partnerPose = this.samplePose(state.players[index === 0 ? 1 : 0], index === 0 ? 1 : 0, state.time);

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
      playerPose: pose,
      partnerPose,
    });

    this.drawParticles(view, state.time, index === 1 ? 0.55 : 1);
    this.drawAtmosphere(view, state.time, index, index === 1 ? 0.25 : 0.6);
    this.drawHorrorOverlay(view, state.time, index, 1);
  }

  private samplePose(player: Player, index: PlayerIndex, time: number): CharacterPose {
    const sample = this.playerSamples[index];
    if (sample.time === time) {
      return { facingX: sample.facingX, facingY: sample.facingY, moving: sample.moving, phase: sample.phase + (sample.moving ? time * 0.12 : 0) };
    }
    const dx = player.x - sample.x;
    const dy = player.y - sample.y;
    const moving = Math.hypot(dx, dy) > 0.2;
    if (moving) {
      const length = Math.hypot(dx, dy);
      sample.facingX = dx / length;
      sample.facingY = dy / length;
      sample.phase += length * 0.18;
    }
    sample.x = player.x;
    sample.y = player.y;
    sample.time = time;
    sample.moving = moving;
    return { facingX: sample.facingX, facingY: sample.facingY, moving: sample.moving, phase: sample.phase + (moving ? time * 0.12 : 0) };
  }
}
