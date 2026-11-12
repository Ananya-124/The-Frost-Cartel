import { EventEmitter } from 'node:events';
import { describe, expect, it, vi } from 'vitest';
import type { NextFunction, Request, Response } from 'express';
import { createRequestTimingMiddleware } from './requestTiming.ts';

function fakeResponse(path: string, method = 'GET') {
  const response = new EventEmitter() as EventEmitter & { statusCode: number };
  response.statusCode = 503;
  const request = { path, method, originalUrl: `${path}?session=private` } as Request;
  return { response: response as unknown as Response, request };
}

describe('API request timing middleware', () => {
  it('logs slow API method, path, status and duration without query values', () => {
    const warn = vi.fn();
    const middleware = createRequestTimingMiddleware(0, warn);
    const { request, response } = fakeResponse('/api/team');
    const next = vi.fn() as unknown as NextFunction;

    middleware(request, response, next);
    response.emit('finish');

    expect(next).toHaveBeenCalledOnce();
    expect(warn).toHaveBeenCalledOnce();
    expect(warn.mock.calls[0]?.[0]).toMatch(/^\[Slow API\] GET \/api\/team 503 \d+\.\d+ms$/);
    expect(warn.mock.calls[0]?.[0]).not.toContain('private');
  });

  it('does not log normal requests or long-lived event streams', () => {
    const warn = vi.fn();
    const middleware = createRequestTimingMiddleware(60_000, warn);
    const next = vi.fn() as unknown as NextFunction;
    const normal = fakeResponse('/api/team');
    middleware(normal.request, normal.response, next);
    normal.response.emit('finish');
    const stream = fakeResponse('/api/events/stream');
    middleware(stream.request, stream.response, next);
    stream.response.emit('finish');

    expect(warn).not.toHaveBeenCalled();
  });
});
