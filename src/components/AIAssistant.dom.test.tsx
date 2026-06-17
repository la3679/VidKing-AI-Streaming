import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock the backend client before importing the component.
vi.mock('../lib/api', () => {
  class ApiError extends Error {
    status: number;
    code: string | null;
    constructor(message: string, status: number, code: string | null) {
      super(message);
      this.status = status;
      this.code = code;
    }
    get isUnavailable() {
      return this.status === 503 || this.code === 'ai_unavailable';
    }
  }
  return { chat: vi.fn(), ApiError };
});

import { AIAssistant } from './AIAssistant';
import { chat, ApiError } from '../lib/api';
import { useUIStore } from '../store/useUIStore';

const chatMock = chat as unknown as Mock;

describe('AIAssistant', () => {
  beforeEach(() => {
    localStorage.clear();
    chatMock.mockReset();
    useUIStore.setState({ isAssistantOpen: true });
  });

  it('sends a quick action and renders the assistant reply', async () => {
    chatMock.mockResolvedValue({ reply: 'Try **Arrival** (2016).' });
    render(<AIAssistant />);

    await userEvent.click(screen.getByRole('button', { name: 'Recommend a sci-fi movie' }));

    expect(chatMock).toHaveBeenCalledOnce();
    expect(await screen.findByText(/Arrival/)).toBeInTheDocument();
  });

  it('shows an unavailable message and a retry button on API failure', async () => {
    chatMock.mockRejectedValue(new ApiError('AI off', 503, 'ai_unavailable'));
    render(<AIAssistant />);

    await userEvent.click(screen.getByRole('button', { name: 'A short comedy for tonight' }));

    expect(await screen.findByText(/not available right now/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('disables send for empty input', () => {
    render(<AIAssistant />);
    expect(screen.getByRole('button', { name: 'Send message' })).toBeDisabled();
  });
});
