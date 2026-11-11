import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Round3RunState } from '../../../../../types/round3.types';
import { round3Service } from '../../../../../services/round3Service';
import { formatRound3Time, useRound3RunTimer } from './useRound3RunTimer';

vi.mock('../../../../../services/round3Service', () => ({
  round3Service: {
    getRun: vi.fn(), startRun: vi.fn(), pauseRun: vi.fn(), resumeRun: vi.fn(),
  },
}));

const makeRun = (status: Round3RunState['status'], remainingMs: number): Round3RunState => ({
  status, remainingMs, remainingSeconds: Math.ceil(remainingMs / 1000),
  startedAt: status === 'running' ? new Date().toISOString() : null,
  updatedAt: new Date().toISOString(),
});

afterEach(() => { vi.useRealTimers(); vi.clearAllMocks(); });

describe('Round 3 authoritative run timer', () => {
  it('counts down from the server remaining time using monotonic elapsed time', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useRound3RunTimer(makeRun('running', 25_000)));
    expect(result.current.remainingSeconds).toBe(25);
    act(() => { vi.advanceTimersByTime(3_000); });
    expect(result.current.remainingSeconds).toBe(22);
    expect(formatRound3Time(61_000)).toBe('01:01');
  });

  it('restores the server remaining time on a fresh mount', () => {
    const serverState = makeRun('running', 987_000);
    const { result } = renderHook(() => useRound3RunTimer(serverState));
    expect(result.current.remainingMs).toBe(987_000);
  });

  it('keeps the countdown local and synchronizes at a thirty-second recovery interval', async () => {
    vi.useFakeTimers();
    vi.mocked(round3Service.getRun).mockResolvedValue({ success: true, run: makeRun('running', 120_000) });
    const { result } = renderHook(() => useRound3RunTimer(makeRun('running', 120_000)));
    await act(async () => { await vi.advanceTimersByTimeAsync(29_999); });
    expect(result.current.remainingSeconds).toBeGreaterThan(90);
    expect(round3Service.getRun).not.toHaveBeenCalled();
    await act(async () => { await vi.advanceTimersByTimeAsync(1); });
    expect(round3Service.getRun).toHaveBeenCalledTimes(1);
  });

  it('does not poll while the shared run is paused', async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useRound3RunTimer(makeRun('paused', 60_000)));
    await act(async () => { await vi.advanceTimersByTimeAsync(60_000); });
    expect(result.current.remainingSeconds).toBe(60);
    expect(round3Service.getRun).not.toHaveBeenCalled();
  });

  it('starts only when the gameplay entry is requested and coalesces repeats', async () => {
    const running = makeRun('running', 1_500_000);
    vi.mocked(round3Service.startRun).mockResolvedValue({ success: true, run: running });
    const { result } = renderHook(() => useRound3RunTimer(makeRun('not_started', 1_500_000)));
    expect(round3Service.startRun).not.toHaveBeenCalled();
    await act(async () => { await Promise.all([result.current.ensureRunning(), result.current.ensureRunning()]); });
    expect(round3Service.startRun).toHaveBeenCalledTimes(1);
    expect(result.current.run.status).toBe('running');
  });

  it('pauses during a hunt transition and resumes with the saved remainder', async () => {
    const paused = makeRun('paused', 41_000);
    const running = makeRun('running', 41_000);
    vi.mocked(round3Service.pauseRun).mockResolvedValue({ success: true, run: paused });
    vi.mocked(round3Service.resumeRun).mockResolvedValue({ success: true, run: running });
    const { result } = renderHook(() => useRound3RunTimer(makeRun('running', 42_000)));
    await act(async () => { await result.current.pause(); });
    expect(result.current.run.status).toBe('paused');
    expect(result.current.remainingMs).toBe(41_000);
    await act(async () => { await result.current.resume(); });
    expect(result.current.run.status).toBe('running');
    expect(result.current.remainingMs).toBe(41_000);
    expect(round3Service.pauseRun).toHaveBeenCalledTimes(1);
    expect(round3Service.resumeRun).toHaveBeenCalledTimes(1);
  });

  it('uses the server expiry response at zero and does not reset the run', async () => {
    vi.useFakeTimers();
    vi.mocked(round3Service.getRun).mockResolvedValue({ success: true, run: makeRun('expired', 0) });
    const { result } = renderHook(() => useRound3RunTimer(makeRun('running', 1_000)));
    await act(async () => { await vi.advanceTimersByTimeAsync(1_000); });
    expect(result.current.run.status).toBe('expired');
    expect(result.current.remainingSeconds).toBe(0);
  });

  it('recovers on reconnect after a timer request fails', async () => {
    vi.mocked(round3Service.getRun).mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({ success: true, run: makeRun('running', 15_000) });
    const { result } = renderHook(() => useRound3RunTimer(makeRun('running', 16_000)));
    await act(async () => { await result.current.refresh(); });
    expect(result.current.error).toBe('offline');
    await act(async () => { window.dispatchEvent(new Event('online')); });
    await waitFor(() => expect(result.current.error).toBe(''));
    expect(result.current.remainingMs).toBe(15_000);
  });
});
