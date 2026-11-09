import { useCallback, useEffect, useRef, useState } from 'react';
import type { Round3RunState } from '../../../../../types/round3.types';
import { round3Service } from '../../../../../services/round3Service';

export function formatRound3Time(milliseconds: number): string {
  const seconds = Math.max(0, Math.ceil(milliseconds / 1000));
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

/** Uses server-computed remaining time and a monotonic local delta between server syncs. */
export function useRound3RunTimer(initialRun: Round3RunState) {
  const [run, setRun] = useState(initialRun);
  const [tick, setTick] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [refreshVersion, setRefreshVersion] = useState(0);
  const runRef = useRef(initialRun);
  const baseRemaining = useRef(initialRun.remainingMs);
  const syncedAt = useRef(performance.now());
  const refreshInFlight = useRef(false);
  const transitionInFlight = useRef<Promise<Round3RunState | null> | null>(null);
  const requestVersion = useRef(0);

  const acceptRun = useCallback((next: Round3RunState) => {
    runRef.current = next;
    baseRemaining.current = next.remainingMs;
    syncedAt.current = performance.now();
    setRun(next);
    setError('');
  }, []);

  const remainingMs = run.status === 'running'
    ? Math.ceil(Math.max(0, baseRemaining.current - (performance.now() - syncedAt.current)))
    : run.remainingMs;
  const remainingSeconds = Math.ceil(remainingMs / 1000);

  const refresh = useCallback(async () => {
    if (refreshInFlight.current || transitionInFlight.current) return;
    refreshInFlight.current = true;
    const version = requestVersion.current;
    try {
      const result = await round3Service.getRun();
      if (version === requestVersion.current) {
        acceptRun(result.run);
        setRefreshVersion((value) => value + 1);
      }
    } catch (reason) {
      if (version === requestVersion.current) setError(reason instanceof Error ? reason.message : 'Could not reconnect to the Round 3 timer.');
    } finally { refreshInFlight.current = false; }
  }, [acceptRun]);

  const transition = useCallback(async (operation: 'start' | 'pause' | 'resume') => {
    if (transitionInFlight.current) return transitionInFlight.current;
    requestVersion.current += 1;
    const pending = (async () => {
      setBusy(true);
      setError('');
      try {
        const result = operation === 'start' ? await round3Service.startRun()
          : operation === 'pause' ? await round3Service.pauseRun()
            : await round3Service.resumeRun();
        if (result.run) acceptRun(result.run);
        setRefreshVersion((value) => value + 1);
        return result.run ?? runRef.current;
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : 'Could not update the Round 3 timer.');
        throw reason;
      } finally { transitionInFlight.current = null; setBusy(false); }
    })();
    transitionInFlight.current = pending;
    return pending;
  }, [acceptRun]);

  const ensureRunning = useCallback(async () => {
    const current = runRef.current;
    if (current.status === 'running') return current;
    if (current.status === 'not_started') return transition('start');
    if (current.status === 'paused') return transition('resume');
    return current;
  }, [transition]);

  const start = useCallback(() => transition('start'), [transition]);
  const pause = useCallback(() => transition('pause'), [transition]);
  const resume = useCallback(() => transition('resume'), [transition]);

  useEffect(() => {
    const timer = window.setInterval(() => setTick((value) => value + 1), 250);
    const sync = () => { void refresh(); };
    const interval = window.setInterval(sync, 5000);
    window.addEventListener('focus', sync);
    window.addEventListener('online', sync);
    return () => {
      window.clearInterval(timer);
      window.clearInterval(interval);
      window.removeEventListener('focus', sync);
      window.removeEventListener('online', sync);
    };
  }, [refresh]);

  useEffect(() => {
    if (run.status === 'running' && remainingMs <= 0) void refresh();
  }, [run.status, remainingMs, tick, refresh]);

  return {
    run, remainingMs, remainingSeconds, busy, error, refreshVersion,
    gameplayEnabled: run.status === 'running' && remainingMs > 0 && !busy,
    refresh,
    start,
    pause,
    resume,
    ensureRunning,
    setError,
  };
}
