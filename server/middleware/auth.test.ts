// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import type { Response, NextFunction } from 'express';
import { requireAdminAuth, requireTeamAuth, type AuthenticatedRequest } from './auth.ts';

describe('request authentication reuse', () => {
  it('reuses the team principal attached by an earlier round guard in the same request', async () => {
    const req = { team: { id: 'team-a', teamName: 'A', score: 0, totalCredits: 0, maxCredits: 500, isPaused: false } } as AuthenticatedRequest;
    const next = vi.fn() as unknown as NextFunction;
    await requireTeamAuth(req, {} as Response, next);
    expect(next).toHaveBeenCalledOnce();
  });

  it('reuses the admin principal attached by an earlier protected router in the same request', async () => {
    const req = { admin: { id: 'admin-a', username: 'admin', role: 'admin', mustChangePassword: false }, adminSessionToken: 'validated-token' } as AuthenticatedRequest;
    const next = vi.fn() as unknown as NextFunction;
    await requireAdminAuth(req, {} as Response, next);
    expect(next).toHaveBeenCalledOnce();
  });
});
