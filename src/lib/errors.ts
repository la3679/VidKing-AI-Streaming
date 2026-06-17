/**
 * Normalizes errors from various sources (Axios/TMDB, Firebase, fetch, unknown)
 * into a single shape with a user-safe message, so UI code never has to branch
 * on error provenance and never shows raw stack traces to users.
 */
import axios from 'axios';

export interface NormalizedError {
  /** A concise, user-safe message suitable for display. */
  message: string;
  /** HTTP-ish status code when known. */
  status?: number;
  /** Stable-ish code for programmatic handling (e.g. Firebase `auth/...`). */
  code?: string;
  /** The original error, for dev logging only. */
  cause: unknown;
}

const FRIENDLY: Record<number, string> = {
  401: 'Authentication failed. Please check your API credentials.',
  403: 'Access denied. The request was not permitted.',
  404: 'We could not find what you were looking for.',
  429: 'Too many requests. Please slow down and try again shortly.',
  500: 'The service had a problem. Please try again.',
  503: 'The service is temporarily unavailable. Please try again later.',
};

export function normalizeError(error: unknown): NormalizedError {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const apiMessage =
      (error.response?.data as { status_message?: string } | undefined)?.status_message;
    return {
      message:
        apiMessage ||
        (status && FRIENDLY[status]) ||
        'A network error occurred. Check your connection and try again.',
      status,
      code: error.code,
      cause: error,
    };
  }

  if (error instanceof Error) {
    // Firebase errors carry a `.code` like "auth/popup-closed-by-user".
    const code = (error as { code?: string }).code;
    return { message: friendlyFirebaseMessage(code) ?? error.message, code, cause: error };
  }

  return { message: 'Something went wrong. Please try again.', cause: error };
}

function friendlyFirebaseMessage(code?: string): string | undefined {
  switch (code) {
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'Sign-in was cancelled.';
    case 'auth/network-request-failed':
      return 'Network error during sign-in. Please try again.';
    case 'auth/email-already-in-use':
      return 'That email is already registered. Try signing in instead.';
    case 'auth/invalid-email':
      return 'That email address looks invalid.';
    case 'auth/weak-password':
      return 'Please choose a stronger password (at least 6 characters).';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Incorrect email or password.';
    case 'permission-denied':
      return 'You do not have permission to perform that action.';
    default:
      return undefined;
  }
}

export function getErrorMessage(error: unknown): string {
  return normalizeError(error).message;
}
