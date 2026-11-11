// @vitest-environment node
import type { Pool } from 'pg';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { startRound2AuctionTimer } from './round2.routes.ts';

const flushPromises = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

describe('Round 2 background timer', () => {
  afterEach(() => vi.useRealTimers());

  it('does not schedule polling when the authoritative configuration is disabled', async () => {
    vi.useFakeTimers();
    const pool = {} as Pool;
    const checkEnabled = vi.fn().mockResolvedValue(false);
    const settleExpired = vi.fn();
    startRound2AuctionTimer(pool, { checkEnabled, settleExpired });
    await flushPromises();

    expect(checkEnabled).toHaveBeenCalledOnce();
    expect(settleExpired).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('polls once per second after PostgreSQL explicitly enables Round 2', async () => {
    vi.useFakeTimers();
    const pool = {} as Pool;
    const checkEnabled = vi.fn().mockResolvedValue(true);
    const settleExpired = vi.fn().mockResolvedValue(null);
    const stop = startRound2AuctionTimer(pool, { checkEnabled, settleExpired });
    await flushPromises();

    expect(vi.getTimerCount()).toBe(1);
    await vi.advanceTimersByTimeAsync(999);
    expect(settleExpired).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(settleExpired).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(1);
    stop();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('backs off after database failures instead of retrying at the normal interval', async () => {
    vi.useFakeTimers();
    const pool = {} as Pool;
    const checkEnabled = vi.fn().mockResolvedValue(true);
    const settleExpired = vi.fn()
      .mockRejectedValueOnce(new Error('temporary database failure'))
      .mockResolvedValue(null);
    const stop = startRound2AuctionTimer(pool, {
      checkEnabled,
      settleExpired,
      initialBackoffMs: 1_000,
      maxBackoffMs: 4_000,
      onError: vi.fn(),
    });
    await flushPromises();
    await vi.advanceTimersByTimeAsync(1_000);
    expect(settleExpired).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(1);

    await vi.advanceTimersByTimeAsync(999);
    expect(settleExpired).toHaveBeenCalledOnce();
    await vi.advanceTimersByTimeAsync(1);
    expect(settleExpired).toHaveBeenCalledTimes(2);
    stop();
  });

  it('does not create duplicate pollers for the same pool', async () => {
    vi.useFakeTimers();
    const pool = {} as Pool;
    const checkEnabled = vi.fn().mockResolvedValue(true);
    const settleExpired = vi.fn().mockResolvedValue(null);
    const stopFirst = startRound2AuctionTimer(pool, { checkEnabled, settleExpired });
    const stopSecond = startRound2AuctionTimer(pool, { checkEnabled, settleExpired });
    await flushPromises();

    expect(checkEnabled).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(1);
    await vi.advanceTimersByTimeAsync(1_000);
    expect(settleExpired).toHaveBeenCalledOnce();
    stopSecond();
    expect(vi.getTimerCount()).toBe(0);
    stopFirst();
  });
});
