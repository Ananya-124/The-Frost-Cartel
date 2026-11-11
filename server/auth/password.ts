import * as crypto from 'node:crypto';

export function hashPassword(password: string, existingSalt?: string): { hash: string; salt: string } {
  const salt = existingSalt || crypto.randomBytes(16).toString('hex');
  return { hash: crypto.scryptSync(password, salt, 64).toString('hex'), salt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  try {
    const computed = crypto.scryptSync(password, salt, 64);
    const expected = Buffer.from(hash, 'hex');
    return expected.length === computed.length && crypto.timingSafeEqual(computed, expected);
  } catch { return false; }
}
