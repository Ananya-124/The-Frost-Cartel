import { describe, expect, it } from 'vitest';
import { configuredAllowedOrigins, createCorsOptions, sessionCookieOptions } from './security.ts';

describe('production web security configuration', () => {
  it('requires exact HTTPS frontend origins in production', () => {
    const env = { NODE_ENV: 'production', CORS_ALLOWED_ORIGINS: 'https://game.example.com,https://admin.example.com' } as NodeJS.ProcessEnv;
    expect(configuredAllowedOrigins(env)).toEqual(new Set(['https://game.example.com', 'https://admin.example.com']));
    expect(() => configuredAllowedOrigins({ NODE_ENV: 'production' } as NodeJS.ProcessEnv)).toThrow(/CORS_ALLOWED_ORIGINS/);
    expect(() => configuredAllowedOrigins({ NODE_ENV: 'production', CORS_ALLOWED_ORIGINS: '*' } as NodeJS.ProcessEnv)).toThrow(/wildcard/);
    expect(() => configuredAllowedOrigins({ NODE_ENV: 'production', CORS_ALLOWED_ORIGINS: 'http://game.example.com' } as NodeJS.ProcessEnv)).toThrow(/HTTPS/);
  });

  it('enables credentials only with exact origins and issues secure HttpOnly production cookies', () => {
    const options = createCorsOptions({ NODE_ENV: 'production', CORS_ALLOWED_ORIGINS: 'https://game.example.com' } as NodeJS.ProcessEnv);
    expect(options.credentials).toBe(true);
    const allowOrigin = options.origin as (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) => void;
    allowOrigin('https://game.example.com', (_error, allowed) => expect(allowed).toBe(true));
    allowOrigin('https://attacker.example', (_error, allowed) => expect(allowed).toBe(false));
    expect(sessionCookieOptions({ NODE_ENV: 'production' } as NodeJS.ProcessEnv)).toMatchObject({ httpOnly: true, secure: true, sameSite: 'lax', path: '/' });
  });

  it('keeps local cookies usable and disallows insecure SameSite=None', () => {
    expect(sessionCookieOptions({ NODE_ENV: 'development' } as NodeJS.ProcessEnv)).toMatchObject({ httpOnly: true, secure: false, sameSite: 'lax' });
    expect(() => sessionCookieOptions({ NODE_ENV: 'development', SESSION_COOKIE_SAME_SITE: 'none' } as NodeJS.ProcessEnv)).toThrow(/require HTTPS/);
  });
});
