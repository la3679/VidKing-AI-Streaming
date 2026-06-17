import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('../lib/tmdb', () => ({
  getPersonDetails: vi.fn(),
  getPersonCredits: vi.fn(() => Promise.resolve([])),
  getImageUrl: (p: string, s = 'original') => (p ? `https://img/${s}${p}` : 'data:fallback'),
}));

import { ActorProfile } from './ActorProfile';
import { getPersonDetails } from '../lib/tmdb';
import { useUIStore } from '../store/useUIStore';

const getPerson = getPersonDetails as unknown as Mock;

describe('ActorProfile image composition', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useUIStore.setState({ selectedActorId: '287' });
  });

  it('renders a framed portrait image (object-cover) when a profile photo exists', async () => {
    getPerson.mockResolvedValue({
      name: 'Jane Doe',
      profile_path: '/p.jpg',
      known_for_department: 'Acting',
    });
    render(<ActorProfile />);
    const img = await screen.findByAltText('Jane Doe');
    expect(img).toBeInTheDocument();
    expect(img.className).toContain('object-cover');
  });

  it('falls back to initials when there is no profile photo', async () => {
    getPerson.mockResolvedValue({ name: 'John Smith', profile_path: null });
    render(<ActorProfile />);
    expect(await screen.findByText('JS')).toBeInTheDocument();
  });

  it('keeps the close control accessible', async () => {
    getPerson.mockResolvedValue({ name: 'A B', profile_path: '/x.jpg' });
    render(<ActorProfile />);
    expect(await screen.findByRole('button', { name: /close actor profile/i })).toBeInTheDocument();
  });
});
