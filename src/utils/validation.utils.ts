/**
 * Validation utilities for operative squad login and registration.
 */

export function validateTeamName(name: string): { isValid: boolean; error?: string } {
  const trimmed = name.trim();
  if (!trimmed) {
    return { isValid: false, error: 'Team Name / Login ID cannot be empty.' };
  }
  if (trimmed.length < 2) {
    return { isValid: false, error: 'Team Name must be at least 2 characters.' };
  }
  return { isValid: true };
}

export function validatePasskey(passkey: string): { isValid: boolean; error?: string } {
  const trimmed = passkey.trim();
  if (!trimmed) {
    return { isValid: false, error: 'Master Passkey cannot be empty.' };
  }
  if (trimmed.length < 4) {
    return { isValid: false, error: 'Organizer passkeys are at least 4 characters.' };
  }
  return { isValid: true };
}

