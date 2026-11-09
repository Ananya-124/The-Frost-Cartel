import { useEffect, useState } from 'react';
import type { UiSnapshot } from '../../engine/state/snapshot';
import type { Round3RunStatus } from '../../../../../../types/round3.types';
import { getAudioPreferences, saveAudioPreferences } from '../../audio/preferences';
import { applyAmbientPreferences } from '../../audio/sound';
import { soundFx } from '../../audio/soundfx';
import styles from '../canvas/Game.module.css';

const READINESS_LABELS = ['Weakness', 'Entity', 'Past node', 'Future node'] as const;

interface TeamHudProps {
  snapshot: UiSnapshot;
  remainingSeconds: number;
  runStatus: Round3RunStatus;
  runBusy: boolean;
  onToggleRun: () => void;
}

export default function TeamHud({ snapshot, remainingSeconds, runStatus, runBusy, onToggleRun }: TeamHudProps) {
  const [audio, setAudio] = useState(getAudioPreferences);
  useEffect(() => {
    applyAmbientPreferences(audio);
    soundFx.setAudioPreferences(audio.volume, audio.muted);
  }, [audio]);
  const updateAudio = (next: typeof audio) => { setAudio(next); saveAudioPreferences(next); };
  const time = `${String(Math.floor(remainingSeconds / 60)).padStart(2, '0')}:${String(remainingSeconds % 60).padStart(2, '0')}`;
  const terminal = runStatus === 'completed' || runStatus === 'expired';
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
      <div className={`${styles.hudBox} ${styles.readiness}`} aria-label="Capture readiness">
        <span className={styles.hudLabel}>READY</span>
        <div className={styles.dots}>
          {READINESS_LABELS.map((label, i) => (
            <span
              key={label}
              className={snapshot.readiness[i] ? styles.on : undefined}
              title={`${label}: ${snapshot.readiness[i] ? 'ready' : 'not ready'}`}
              aria-label={`${label}: ${snapshot.readiness[i] ? 'ready' : 'not ready'}`}
            >
            </span>
          ))}
        </div>
      </div>
      <div className={`${styles.hudBox} ${styles.runTimer}`} aria-label="Round 3 timer">
        <span className={styles.hudLabel}>TIME</span>
        <strong className={styles.runTime} role="timer" aria-live="off">{time}</strong>
        {!terminal && <button className={styles.runToggle} type="button" disabled={runBusy || runStatus === 'not_started'} onClick={onToggleRun}>
          {runBusy ? '…' : runStatus === 'paused' ? 'RESUME' : 'PAUSE'}
        </button>}
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
