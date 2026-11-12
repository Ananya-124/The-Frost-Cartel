import { afterEach, describe, expect, it, vi } from 'vitest';
import { round2Service } from '../round2Service';

describe('Round 2 API service', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('sends only bid amount and stable request ID with cookie credentials', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ success: true }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    await round2Service.bid(120, 'stable-retry-id');
    const [, options] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(options.credentials).toBe('include');
    expect(options.headers).toEqual({ 'Content-Type': 'application/json' });
    expect(JSON.parse(String(options.body))).toEqual({ amount: 120, requestId: 'stable-retry-id' });
  });

  it('uses authenticated session requests for admin APIs without legacy keys', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ success: true }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    await round2Service.admin.overview();
    await round2Service.admin.start(3, 90, 60);
    const [, overviewOptions] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    const [, startOptions] = fetchMock.mock.calls[1] as unknown as [string, RequestInit];
    expect(overviewOptions.credentials).toBe('include');
    expect(overviewOptions.headers).toEqual({ 'Content-Type': 'application/json' });
    expect(JSON.parse(String(startOptions.body))).toEqual({ cardId: 3, basePrice: 90, durationSeconds: 60 });
    expect(JSON.stringify(fetchMock.mock.calls)).not.toContain('x-round2-key');
  });

  it('retains HTTP error status for authorization and disabled-state UI', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ success: false, message: 'Round 2 auction is disabled.' }), { status: 503 })));
    await expect(round2Service.admin.overview()).resolves.toMatchObject({ success: false, status: 503, message: 'Round 2 auction is disabled.' });
  });
});
