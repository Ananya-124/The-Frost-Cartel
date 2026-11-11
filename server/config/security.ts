import type { CookieOptions } from 'express';
import type { CorsOptions } from 'cors';

const LOCAL_ORIGINS = [
  'http://localhost:5173', 'http://127.0.0.1:5173',
  'http://localhost:3000', 'http://127.0.0.1:3000',
  'http://localhost:3001', 'http://127.0.0.1:3001',
];

export function configuredAllowedOrigins(env: NodeJS.ProcessEnv = process.env): Set<string> {
  const configured = env.CORS_ALLOWED_ORIGINS?.split(',').map((origin) => origin.trim()).filter(Boolean);
  if (!configured?.length) {
    if (env.NODE_ENV === 'production') throw new Error('CORS_ALLOWED_ORIGINS must list the exact frontend origins in production.');
    return new Set(LOCAL_ORIGINS);
  }
  for (const origin of configured) {
    if (origin === '*' || origin.includes('*')) throw new Error('CORS_ALLOWED_ORIGINS must not contain wildcard origins.');
    let parsed: URL;
    try { parsed = new URL(origin); } catch { throw new Error(`Invalid CORS origin: ${origin}`); }
    if (!['http:', 'https:'].includes(parsed.protocol) || parsed.origin !== origin || parsed.username || parsed.password) {
      throw new Error(`CORS origin must be an exact http(s) origin without a path: ${origin}`);
    }
    if (env.NODE_ENV === 'production' && parsed.protocol !== 'https:') {
      throw new Error(`Production CORS origins must use HTTPS: ${origin}`);
    }
  }
  return new Set(configured);
}

export function createCorsOptions(env: NodeJS.ProcessEnv = process.env): CorsOptions {
  const allowedOrigins = configuredAllowedOrigins(env);
  return {
    origin: (origin, callback) => callback(null, origin === undefined || allowedOrigins.has(origin)),
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Round2-Key'],
    maxAge: 600,
  };
}

export function sessionCookieOptions(env: NodeJS.ProcessEnv = process.env): CookieOptions {
  const sameSite = (env.SESSION_COOKIE_SAME_SITE || 'lax').toLowerCase();
  if (!['lax', 'strict', 'none'].includes(sameSite)) throw new Error('SESSION_COOKIE_SAME_SITE must be lax, strict, or none.');
  const secure = env.NODE_ENV === 'production';
  if (sameSite === 'none' && !secure) throw new Error('SameSite=None session cookies require HTTPS in production.');
  return { httpOnly: true, secure, sameSite: sameSite as CookieOptions['sameSite'], path: '/' };
}

export function sessionCookieSettings(env: NodeJS.ProcessEnv = process.env) {
  return {
    team: { name: 'fc_team_token', options: sessionCookieOptions(env) },
    admin: { name: 'fc_admin_token', options: sessionCookieOptions(env) },
  } as const;
}
