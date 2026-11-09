import { getAudioPreferences, type AudioPreferences } from './preferences';

let audio: AudioContext | null = null;
let master: GainNode | null = null;
let drone: { oscs: OscillatorNode[]; lfo: OscillatorNode; noise: AudioBufferSourceNode } | null = null;

function ensureContext(): AudioContext | null {
  if (audio) return audio;
  try {
    audio = new AudioContext();
    master = audio.createGain();
    applyAmbientPreferences(getAudioPreferences());
    master.connect(audio.destination);
  } catch {
    audio = null;
  }
  return audio;
}

export function applyAmbientPreferences(preferences: AudioPreferences): void {
  if (!audio || !master) return;
  master.gain.setTargetAtTime(preferences.muted ? 0 : preferences.volume, audio.currentTime, .08);
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
    gain.connect(master ?? ac.destination);
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
    const low = ac.createOscillator();
    const lfo = ac.createOscillator();
    const gain = ac.createGain();
    const lfoGain = ac.createGain();
    const filter = ac.createBiquadFilter();
    const wind = ac.createBufferSource();
    const windGain = ac.createGain();
    const buffer = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
    const channel = buffer.getChannelData(0);
    for (let i = 0; i < channel.length; i++) channel[i] = (Math.random() * 2 - 1) * .22;
    wind.buffer = buffer;
    wind.loop = true;
    filter.type = 'lowpass'; filter.frequency.value = 175; filter.Q.value = .45;
    osc.type = 'triangle'; osc.frequency.value = 43;
    low.type = 'sine'; low.frequency.value = 56;
    lfo.frequency.value = 0.075;
    lfoGain.gain.value = 0.006;
    gain.gain.value = 0.022;
    windGain.gain.value = 0.055;
    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);
    osc.connect(gain);
    low.connect(gain);
    gain.connect(master ?? ac.destination);
    wind.connect(filter); filter.connect(windGain); windGain.connect(master ?? ac.destination);
    osc.start();
    low.start();
    lfo.start();
    wind.start();
    drone = { oscs: [osc, low], lfo, noise: wind };
  } catch {
    drone = null;
  }
}

/** Stops the drone and releases the audio context. */
export function disposeAudio(): void {
  try {
    drone?.oscs.forEach((osc) => osc.stop());
    drone?.lfo.stop();
    drone?.noise.stop();
  } catch {
    /* already stopped */
  }
  drone = null;
  master = null;
  if (audio) {
    void audio.close().catch(() => undefined);
    audio = null;
  }
}
