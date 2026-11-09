export interface AudioPreferences { muted: boolean; volume: number }
const KEY = 'frost-cartel-round3-audio';

export function getAudioPreferences(): AudioPreferences {
  if (typeof localStorage === 'undefined') return { muted: false, volume: 0.28 };
  try {
    const value = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Partial<AudioPreferences> | null;
    return {
      muted: value?.muted === true,
      volume: typeof value?.volume === 'number' ? Math.max(0, Math.min(1, value.volume)) : 0.28,
    };
  } catch { return { muted: false, volume: 0.28 }; }
}

export function saveAudioPreferences(preferences: AudioPreferences): void {
  try { localStorage.setItem(KEY, JSON.stringify(preferences)); } catch { /* audio preferences are optional */ }
}
