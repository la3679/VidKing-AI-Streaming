import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LegalPages } from './LegalPages';

describe('LegalPages', () => {
  it('renders the Privacy page with TMDB attribution', () => {
    render(<LegalPages page="privacy" onBack={() => {}} />);
    expect(screen.getByRole('heading', { level: 1, name: /privacy policy/i })).toBeInTheDocument();
    // Attribution appears in-content and in the shared footer notice.
    expect(screen.getAllByText(/not endorsed or certified by TMDB/i).length).toBeGreaterThan(0);
  });

  it('renders the Terms page', () => {
    render(<LegalPages page="terms" onBack={() => {}} />);
    expect(screen.getByRole('heading', { level: 1, name: /terms of use/i })).toBeInTheDocument();
    expect(screen.getByText(/acceptable use/i)).toBeInTheDocument();
  });

  it('renders the Help page with TV episode guidance', () => {
    render(<LegalPages page="help" onBack={() => {}} />);
    expect(screen.getByRole('heading', { level: 1, name: /help & faq/i })).toBeInTheDocument();
    expect(screen.getByText(/how do i watch a tv episode/i)).toBeInTheDocument();
    expect(screen.getByText(/season\/episode selection work/i)).toBeInTheDocument();
  });

  it('fires onBack from the Back to Home button', async () => {
    const onBack = vi.fn();
    render(<LegalPages page="help" onBack={onBack} />);
    await userEvent.click(screen.getByRole('button', { name: /back to home/i }));
    expect(onBack).toHaveBeenCalledOnce();
  });
});
