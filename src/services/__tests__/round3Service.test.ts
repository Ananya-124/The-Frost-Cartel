import { afterEach, describe, expect, it, vi } from 'vitest';
import { round3Service } from '../round3Service';
import { apiUrl } from '../apiBaseUrl';

const ok = { ok: true, status: 200, json: async () => ({ success: true, message: 'ok', state: {} }) } as Response;

describe('Round 3 Hunt I API client', () => {
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

  it('uses a stable action ID across transport retries and coalesces concurrent duplicate clicks', async () => {
    let resolve!: (response: Response) => void;
    const fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockRejectedValueOnce(new TypeError('network down'))
      .mockImplementationOnce(() => new Promise<Response>((done) => { resolve = done; }));

    const action = { type: 'interact', actor: 'archivist', objectId: 'generatorLog' };
    const stored = new Map<string, string>();
    vi.stubGlobal('sessionStorage', {
      getItem: (key: string) => stored.get(key) ?? null,
      setItem: (key: string, value: string) => { stored.set(key, value); },
      removeItem: (key: string) => { stored.delete(key); },
    });
    await expect(round3Service.hunt1Action(action)).rejects.toThrow('network down');
    expect([...stored.values()][0]).toMatch(/^[0-9a-f-]{36}$/i);
    const retry = round3Service.hunt1Action(action);
    const duplicate = round3Service.hunt1Action(action);
    expect(retry).toBe(duplicate);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const firstBody = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
    const retryBody = JSON.parse(String(fetchMock.mock.calls[1][1]?.body));
    expect(retryBody.actionId).toBe(firstBody.actionId);
    expect(fetchMock.mock.calls[1][0]).toBe(apiUrl('/api/round3/hunt1/action'));
    expect(fetchMock.mock.calls[1][1]).toMatchObject({ method: 'POST', credentials: 'include' });
    resolve(ok);
    await Promise.all([retry, duplicate]);
    expect(stored.size).toBe(0);
  });

  it('sends Hunt II actions with stable IDs and authenticated fetch credentials', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockRejectedValueOnce(new TypeError('network down'))
      .mockResolvedValueOnce(ok);
    const action = { type: 'interact', actor: 'tracker', objectId: 'optionalAnomaly' };
    await expect(round3Service.hunt2Action(action)).rejects.toThrow('network down');
    await round3Service.hunt2Action(action);
    const first = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
    const retry = JSON.parse(String(fetchMock.mock.calls[1][1]?.body));
    expect(retry.actionId).toBe(first.actionId);
    expect(fetchMock.mock.calls[1][0]).toBe(apiUrl('/api/round3/hunt2/action'));
    expect(fetchMock.mock.calls[1][1]).toMatchObject({ method: 'POST', credentials: 'include' });
  });
});
