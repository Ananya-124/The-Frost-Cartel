import { beforeEach, describe, expect, it } from 'vitest';
import { round2Service } from '../round2Service';

describe('Round 2 credit transfer', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('reads earned credits from localStorage', () => {
    localStorage.setItem('frost_cartel_round1_sessions', JSON.stringify({ team_alpha: { credits: 240 } }));

    expect(round2Service.getRound1Credits('team_alpha')).toBe(240);
  });

  it('falls back to sessionStorage when no localStorage team record exists', () => {
    sessionStorage.setItem('frost_cartel_round1_sessions', JSON.stringify({ team_alpha: { credits: 160 } }));

    expect(round2Service.getRound1Credits('team_alpha', 20)).toBe(160);
  });

  it('uses the session record when localStorage data is malformed', () => {
    localStorage.setItem('frost_cartel_round1_sessions', '{');
    sessionStorage.setItem('frost_cartel_round1_sessions', JSON.stringify({ team_alpha: { credits: 160 } }));

    expect(round2Service.getRound1Credits('team_alpha', 20)).toBe(160);
  });
});
