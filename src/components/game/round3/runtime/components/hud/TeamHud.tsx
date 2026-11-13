import { useEffect, useState } from 'react';
import type { UiSnapshot } from '../../engine/state/snapshot';
import type { HuntProgress } from '../../../../../../services/progressionService';
import { getAudioPreferences, saveAudioPreferences } from '../../audio/preferences';
import { applyAmbientPreferences } from '../../audio/sound';
import { soundFx } from '../../audio/soundfx';
import styles from '../canvas/Game.module.css';

interface TeamHudProps {
  snapshot: UiSnapshot;
  remainingSeconds: number;
  huntProgression: readonly HuntProgress[];
}

export default function TeamHud({ snapshot, remainingSeconds, huntProgression: _huntProgression }: TeamHudProps) {
  const [audio, setAudio] = useState(getAudioPreferences);
  useEffect(() => {
    applyAmbientPreferences(audio);
    soundFx.setAudioPreferences(audio.volume, audio.muted);
  }, [audio]);
  const updateAudio = (next: typeof audio) => { setAudio(next); saveAudioPreferences(next); };
  const time = `${String(Math.floor(remainingSeconds / 60)).padStart(2, '0')}:${String(remainingSeconds % 60).padStart(2, '0')}`;

  return (
    <div className={styles.hud} aria-label="Team game status">
      <div className={`${styles.hudBox} ${styles.teamStatus}`}>
        <span className={styles.hudLabel}>TEAM</span>
        <strong className={styles.teamName}>{snapshot.teamName}</strong>
        <b className={styles.score}>{snapshot.score}</b>
      </div>
      <div className={`${styles.hudBox} ${styles.huntStatus}`}>
        <span className={styles.hudLabel}>HUNT {snapshot.huntNumber} / 3</span>
        <strong className={styles.huntTitle}>{snapshot.huntTitle}</strong>
      </div>
      <div className={`${styles.hudBox} ${styles.runTimer}`} aria-label="Round 3 timer">
        <span className={styles.hudLabel}>TIME</span>
        <strong className={styles.runTime} role="timer" aria-live="off">{time}</strong>
      </div>
      <details className={styles.soundControls}>
        <summary>{audio.muted || audio.volume === 0 ? 'SOUND OFF' : 'SOUND'}</summary>
        <label htmlFor="r3-volume">AMBIENCE & EFFECTS <span>{Math.round(audio.volume * 100)}%</span></label>
        <input id="r3-volume" type="range" min="0" max="1" step="0.05" value={audio.volume} onChange={(event) => updateAudio({ ...audio, volume: Number(event.target.value), muted: false })} />
        <button type="button" onClick={() => updateAudio({ ...audio, muted: !audio.muted })}>{audio.muted ? 'UNMUTE' : 'MUTE'}</button>
      </details>
    </div>
  );
}
