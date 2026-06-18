import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TopHeader } from './Navbar';
import { useAuthStore } from '../store/useAuthStore';

function setAuth(state: Partial<ReturnType<typeof useAuthStore.getState>>) {
  useAuthStore.setState(state as any);
}

describe('TopHeader auth state', () => {
  beforeEach(() => setAuth({ user: null, profile: null, loading: false }));

  it('shows Sign In for a guest', () => {
    render(<TopHeader />);
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('does not flash Sign In while auth is initializing', () => {
    setAuth({ loading: true });
    render(<TopHeader />);
    expect(screen.queryByRole('button', { name: /sign in/i })).not.toBeInTheDocument();
  });

  it('shows avatar initials and an account menu when signed in (even without a Firestore profile)', async () => {
    setAuth({
      loading: false,
      user: { uid: 'u1', displayName: 'Jane Doe', email: 'jane@x.co', photoURL: null } as any,
      profile: null, // Firestore unavailable — must still render from auth
    });
    render(<TopHeader />);

    // No "Sign In" — instead an account menu button with initials.
    expect(screen.queryByRole('button', { name: /sign in/i })).not.toBeInTheDocument();
    expect(screen.getByText('JD')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /account menu/i }));
    expect(screen.getByRole('menuitem', { name: /my library/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /sign out/i })).toBeInTheDocument();
    expect(screen.getByText('jane@x.co')).toBeInTheDocument();
  });
});
