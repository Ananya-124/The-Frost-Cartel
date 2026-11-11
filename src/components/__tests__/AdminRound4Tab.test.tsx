import '@testing-library/jest-dom/vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { AdminRound4Tab } from '../admin/round4/AdminRound4Tab';
import { apiUrl } from '../../services/apiBaseUrl';

const overview = {
  success: true,
  settings: { id: '1', is_released: 0, common_final_location_id: 'obs', common_final_floor_id: 'floor-7', common_final_room_name: 'Observatory', common_final_x: 1, common_final_y: 2, common_final_radius: 30, physical_entry_instructions: 'Server instructions' },
  routes: [{ id: 'route-1', route_number: 1, roman_numeral: 'I', route_name: 'Database Route', route_subtitle: 'From server' }],
  qualifiedTeams: [], availableTeams: [], steps: [], winner: null,
};
const response = (data: unknown, status = 200) => ({ ok: status >= 200 && status < 300, status, json: async () => data });

describe('Round 04 admin PostgreSQL overview', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('shows API errors and never substitutes fabricated teams or routes', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => response({ message: 'Administrator session expired.' }, 401)));
    render(<AdminRound4Tab />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Administrator session expired.');
    expect(screen.getByRole('button', { name: 'Retry Round 04 data' })).toBeInTheDocument();
    expect(screen.queryByText(/Mock Team|TEST_1|Expedition Sector/i)).not.toBeInTheDocument();
  });

  it('displays empty state and route catalog from the authenticated server response', async () => {
    const fetchMock = vi.fn(async () => response(overview));
    vi.stubGlobal('fetch', fetchMock);
    render(<AdminRound4Tab />);
    expect(await screen.findByText('No teams are currently qualified.')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(apiUrl('/api/round4/admin/overview'), expect.objectContaining({ credentials: 'include' }));
    fireEvent.click(screen.getByRole('button', { name: '7-Team Qualification & Routes' }));
    expect(await screen.findByText(/Database Route/)).toBeInTheDocument();
  });

  it('updates the release display only after the protected API confirms the change', async () => {
    let isReleased = 0;
    const fetchMock = vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
      if (String(url) === apiUrl('/api/round4/admin/overview')) return response({ ...overview, settings: { ...overview.settings, is_released: isReleased } });
      if (String(url) === apiUrl('/api/round4/admin/release')) {
        const body = JSON.parse(String(init?.body)) as { isReleased: boolean };
        isReleased = body.isReleased ? 1 : 0;
        return response({ success: true, isReleased: body.isReleased });
      }
      return response({ message: 'Unexpected request' }, 404);
    });
    vi.stubGlobal('fetch', fetchMock);
    render(<AdminRound4Tab />);
    const releaseButton = await screen.findByRole('button', { name: 'Release Round 04' });
    fireEvent.click(releaseButton);
    expect(await screen.findByText('Round 04 is now RELEASED to qualified squads.')).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'Pause / Seal Round 04' })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(apiUrl('/api/round4/admin/release'), expect.objectContaining({ method: 'POST', credentials: 'include' }));
  });
});
