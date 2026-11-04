/**
 * Web Audio API procedural horror-game sound effects synthesizer.
 * Does not require external MP3 files.
 * Does NOT autoplay.
 * Respects user mute toggle.
 */

class SoundController {
  private audioCtx: AudioContext | null = null;
  private muted = false;

  private getContext(): AudioContext | null {
    if (this.muted) return null;
    if (!this.audioCtx && typeof window !== 'undefined') {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx?.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  isMuted(): boolean {
    return this.muted;
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    return this.muted;
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
  }

  playClick(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch {
      // AudioContext unavailable
    }
  }

  playDiscover(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch {
      // AudioContext unavailable
    }
  }

  playError(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(90, now + 0.2);

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.2);
    } catch {
      // AudioContext unavailable
    }
  }

  playVictory(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const notes = [440, 554.37, 659.25, 880]; // A major arpeggio
      notes.forEach((freq, idx) => {
        if (!ctx) return;
        const now = ctx.currentTime + idx * 0.12;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.5);
      });
    } catch {
      // AudioContext unavailable
    }
  }

  playHorrorJumpscare(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;

      // 1. Earthquake Sub-Bass Drop (Deep physical punch)
      const subOsc = ctx.createOscillator();
      const subGain = ctx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(60, now);
      subOsc.frequency.exponentialRampToValueAtTime(26, now + 1.2);
      subGain.gain.setValueAtTime(0.5, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);
      subOsc.connect(subGain);
      subGain.connect(ctx.destination);
      subOsc.start(now);
      subOsc.stop(now + 1.4);

      // 2. High-Pitched Demonic Shriek (Sawtooth with rapid vibrato)
      const screamOsc = ctx.createOscillator();
      const screamGain = ctx.createGain();
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();

      lfo.frequency.setValueAtTime(16, now); // 16Hz violent wobble
      lfoGain.gain.setValueAtTime(140, now);
      lfo.connect(screamOsc.frequency);
      lfo.start(now);
      lfo.stop(now + 2.4);

      screamOsc.type = 'sawtooth';
      screamOsc.frequency.setValueAtTime(2100, now);
      screamOsc.frequency.exponentialRampToValueAtTime(780, now + 2.2);

      screamGain.gain.setValueAtTime(0.35, now);
      screamGain.gain.linearRampToValueAtTime(0.42, now + 0.2);
      screamGain.gain.exponentialRampToValueAtTime(0.001, now + 2.4);

      screamOsc.connect(screamGain);
      screamGain.connect(ctx.destination);
      screamOsc.start(now);
      screamOsc.stop(now + 2.4);

      // 3. Piercing Discordant Dissonance (Square wave harmonic scream)
      const discordOsc = ctx.createOscillator();
      const discordGain = ctx.createGain();
      discordOsc.type = 'square';
      discordOsc.frequency.setValueAtTime(2850, now);
      discordOsc.frequency.exponentialRampToValueAtTime(1120, now + 1.8);
      discordGain.gain.setValueAtTime(0.25, now);
      discordGain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);
      discordOsc.connect(discordGain);
      discordGain.connect(ctx.destination);
      discordOsc.start(now);
      discordOsc.stop(now + 1.8);

      // 4. White Noise Gut-Wrenching Monster Roar
      const bufferSize = ctx.sampleRate * 2.2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400, now);
      filter.frequency.exponentialRampToValueAtTime(450, now + 2.2);
      filter.Q.setValueAtTime(3.5, now);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.3, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 2.2);

      whiteNoise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);

      whiteNoise.start(now);
      whiteNoise.stop(now + 2.2);
    } catch {
      // AudioContext unavailable
    }
  }

  playDoveFlutter(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      for (let i = 0; i < 4; i++) {
        const flapTime = now + i * 0.08;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(140 + i * 15, flapTime);
        osc.frequency.exponentialRampToValueAtTime(70, flapTime + 0.06);

        gain.gain.setValueAtTime(0.08, flapTime);
        gain.gain.exponentialRampToValueAtTime(0.001, flapTime + 0.06);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(flapTime);
        osc.stop(flapTime + 0.06);
      }
    } catch {
      // AudioContext unavailable
    }
  }

  playLetterDrop(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(95, now + 0.12);

      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
    } catch {
      // AudioContext unavailable
    }
  }

  playParchmentOpen(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const chord = [392.0, 523.25, 659.25, 783.99]; // G4, C5, E5, G5
      chord.forEach((freq, idx) => {
        if (!ctx) return;
        const t = now + idx * 0.06;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.09, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.6);
      });
    } catch {
      // AudioContext unavailable
    }
  }

  playPortalWhoosh(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(110, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 1.2);
      osc.frequency.exponentialRampToValueAtTime(1760, now + 2.0);

      gain.gain.setValueAtTime(0.02, now);
      gain.gain.linearRampToValueAtTime(0.22, now + 1.4);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 2.4);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 2.4);
    } catch {
      // AudioContext unavailable
    }
  }
}

export const soundController = new SoundController();

