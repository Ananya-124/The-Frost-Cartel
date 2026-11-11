import { afterEach, describe, expect, it, vi } from 'vitest';
import { round1Api } from '../round1ApiService';
import { apiUrl } from '../apiBaseUrl';

const ok = (value: unknown) => ({ ok: true, status: 200, json: async () => value });

describe('Round 1 PostgreSQL API client', () => {
  afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

  it('loads the authenticated server state with cookies', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(ok({ success: true }) as Response);
    await round1Api.getState();
    expect(fetchMock).toHaveBeenCalledWith(apiUrl('/api/round1/state'), expect.objectContaining({ credentials: 'include' }));
  });

  it('coalesces concurrent state loads into one request', async () => {
    let resolveResponse!: (value: Response) => void;
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(() => new Promise((resolve) => { resolveResponse = resolve; }));
    const first = round1Api.getState();
    const second = round1Api.getState();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    resolveResponse(ok({ success: true }) as Response);
    await expect(Promise.all([first, second])).resolves.toEqual([{ success: true }, { success: true }]);
  });

  it('ends a stalled request with a retryable timeout error', async () => {
    vi.useFakeTimers();
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation((_input, init) => new Promise((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
    }));
    const pending = round1Api.getState();
    const assertion = expect(pending).rejects.toThrow('Round 1 request timed out');
    await vi.advanceTimersByTimeAsync(15_000);
    await assertion;
    expect(fetchMock).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it('coalesces duplicate clicks and sends a stable idempotency key', async () => {
    let resolveResponse!: (value: Response) => void;
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(() => new Promise((resolve) => { resolveResponse = resolve; }));
    const first = round1Api.action('stage1.begin', { trialIndex: 90 });
    const second = round1Api.action('stage1.begin', { trialIndex: 90 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    resolveResponse(ok({ success: true }) as Response);
    await Promise.all([first, second]);
    const body = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
    expect(body.actionId).toMatch(/^[0-9a-f-]{36}$/i);
    expect(body).toMatchObject({ type: 'stage1.begin', trialIndex: 90 });
  });

  it('reuses the action ID after a network failure so manual retries are safe', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockRejectedValueOnce(new TypeError('network down'))
      .mockResolvedValueOnce(ok({ success: true }) as Response);
    await expect(round1Api.action('stage2.discover', { targetId: 'raven', imageId: 'grave' })).rejects.toThrow('Could not reach the Round 1 server');
    await round1Api.action('stage2.discover', { targetId: 'raven', imageId: 'grave' });
    const first = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
    const retry = JSON.parse(String(fetchMock.mock.calls[1][1]?.body));
    expect(retry.actionId).toBe(first.actionId);
    expect(fetchMock.mock.calls[1][1]).toMatchObject({ credentials: 'include', method: 'POST' });
  });

  it('surfaces expired sessions clearly', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: false, status: 401, json: async () => ({ message: 'expired' }) } as Response);
    await expect(round1Api.getState()).rejects.toThrow('Your session has expired');
  });

  it('routes every Hunt I–III gameplay interaction through the server action endpoint', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(ok({ success: true, session: {}, score: 0, completed: false }) as Response);
    const actions: Array<[string, Record<string, unknown>]> = [
      ['begin', {}], ['enter', { stageId: 'stage-1' }], ['skip', { stageId: 'stage-2' }],
      ['stage1.begin', { trialIndex: 0 }], ['stage1.guess', { trialIndex: 0, guessId: 2 }],
      ['stage2.discover', { targetId: 'raven', imageId: 'gallery' }], ['stage2.missed', {}], ['stage2.hint', {}],
      ['stage3.placeBone', { slotId: 'slot_head', boneId: 'bone_skull' }], ['stage3.readBook', {}],
      ['stage3.moveSkeleton', {}], ['stage3.solveRiddle', { answer: 'ASH' }], ['stage3.unlockChest', {}],
      ['stage3.dig', { soilId: 'north' }], ['stage3.unlockCoffer', { code: '1949' }],
      ['stage3.rotateRune', { ringIndex: 1, direction: 'cw' }], ['stage3.finalAnswer', { answer: 'THE NIGHT RETURNS' }],
    ];
    for (const [type, fields] of actions) await round1Api.action(type, fields);
    expect(fetchMock).toHaveBeenCalledTimes(actions.length);
    const posted = fetchMock.mock.calls.map(([, init]) => JSON.parse(String(init?.body)) as { type: string });
    expect(posted.map((action) => action.type)).toEqual(actions.map(([type]) => type));
    expect(fetchMock.mock.calls.every(([path, init]) => path === apiUrl('/api/round1/actions') && init?.method === 'POST')).toBe(true);
  });

  it('sends admin configuration and timer changes only through credentialed APIs', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(ok({ success: true }) as Response);
    await round1Api.updateAdminConfig('stage3', { correctCode: '1949' });
    await round1Api.timer('pause');
    expect(fetchMock.mock.calls[0][0]).toBe(apiUrl('/api/round1/admin/config/stage3'));
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({ correctCode: '1949' });
    expect(fetchMock.mock.calls[1][0]).toBe(apiUrl('/api/round1/admin/timer/pause'));
    expect(fetchMock.mock.calls.every(([, init]) => init?.credentials === 'include')).toBe(true);
  });
});
