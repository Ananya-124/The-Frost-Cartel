let audio: AudioContext | null = null;
let drone: { osc: OscillatorNode; lfo: OscillatorNode } | null = null;

function ensureContext(): AudioContext | null {
  if (audio) return audio;
  try {
    audio = new AudioContext();
  } catch {
    audio = null;
  }
  return audio;
}

/** Short synthesized tone. Failures (no audio support) are ignored, as in the original. */
export function playTone(
  frequency: number,
  duration = 0.15,
  type: OscillatorType = 'sine',
  volume = 0.05,
): void {
  const ac = ensureContext();
  if (!ac) return;
  try {
    if (ac.state === 'suspended') void ac.resume();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.value = frequency;
    gain.gain.value = volume;
    gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + duration);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start();
    osc.stop(ac.currentTime + duration);
  } catch {
    /* audio is optional */
  }
}

/** Low ambient drone. Only one drone ever plays. */
export function startDrone(): void {
  if (drone) return;
  const ac = ensureContext();
  if (!ac) return;
  try {
    const osc = ac.createOscillator();
    const lfo = ac.createOscillator();
    const gain = ac.createGain();
    const lfoGain = ac.createGain();
    osc.type = 'sawtooth';
    osc.frequency.value = 48;
    lfo.frequency.value = 0.13;
    lfoGain.gain.value = 0.012;
    gain.gain.value = 0.02;
    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start();
    lfo.start();
    drone = { osc, lfo };
  } catch {
    drone = null;
  }
}

/** Stops the drone and releases the audio context. */
export function disposeAudio(): void {
  try {
    drone?.osc.stop();
    drone?.lfo.stop();
  } catch {
    /* already stopped */
  }
  drone = null;
  if (audio) {
    void audio.close().catch(() => undefined);
    audio = null;
  }
}
