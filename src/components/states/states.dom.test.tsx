import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Bookmark } from 'lucide-react';
import { EmptyState } from './EmptyState';
import { ErrorState } from './ErrorState';

describe('EmptyState', () => {
  it('renders title, description, and fires the action', async () => {
    const onClick = vi.fn();
    render(
      <EmptyState
        icon={Bookmark}
        title="Your list is empty"
        description="Add some titles"
        action={{ label: 'Start Exploring', onClick }}
      />,
    );
    expect(screen.getByText('Your list is empty')).toBeInTheDocument();
    expect(screen.getByText('Add some titles')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Start Exploring' }));
    expect(onClick).toHaveBeenCalledOnce();
  });
});

describe('ErrorState', () => {
  it('shows an alert and triggers retry', async () => {
    const onRetry = vi.fn();
    render(<ErrorState title="Couldn't load" onRetry={onRetry} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText("Couldn't load")).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /retry/i }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('omits the retry button when no handler is provided', () => {
    render(<ErrorState />);
    expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
  });
});
