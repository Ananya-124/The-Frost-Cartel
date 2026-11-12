import type { NextFunction, Request, Response } from 'express';

type SlowRequestLogger = (message: string) => void;

/** Log slow API requests only; route labels exclude query strings and user data. */
export function createRequestTimingMiddleware(
  thresholdMs = Number(process.env.SLOW_REQUEST_MS || 1000),
  warn: SlowRequestLogger = (message) => console.warn(message),
) {
  const safeThreshold = Number.isFinite(thresholdMs) && thresholdMs >= 0 ? thresholdMs : 1000;

  return (_req: Request, res: Response, next: NextFunction): void => {
    if (!_req.path.startsWith('/api/') || _req.path === '/api/events/stream') {
      next();
      return;
    }
    const startedAt = performance.now();
    res.once('finish', () => {
      const durationMs = performance.now() - startedAt;
      if (durationMs < safeThreshold) return;
      const route = (_req.route?.path as string | undefined) ?? _req.path;
      warn(`[Slow API] ${_req.method} ${route} ${res.statusCode} ${durationMs.toFixed(1)}ms`);
    });
    next();
  };
}

export const requestTimingMiddleware = createRequestTimingMiddleware();
