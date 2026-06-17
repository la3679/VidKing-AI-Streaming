/**
 * Typed, validated access to environment configuration.
 *
 * All client-side config flows through this module so that:
 *  - missing variables fail loudly in development but degrade gracefully in
 *    production (the app shows a banner instead of a white screen),
 *  - we never sprinkle `import.meta.env.*` reads across the codebase,
 *  - features can check capability flags (e.g. `env.firebaseEnabled`).
 */

interface FirebaseClientConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
  storageBucket: string;
  messagingSenderId: string;
  measurementId?: string;
  firestoreDatabaseId?: string;
}

const raw = import.meta.env;

function str(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function bool(value: unknown): boolean {
  return str(value).toLowerCase() === 'true';
}

/**
 * Firebase config can come either from individual `VITE_FIREBASE_*` variables
 * (preferred for portable deployments such as Vercel) or, as a fallback, from
 * the committed AI Studio applet config JSON.
 */
function resolveFirebaseConfig(): FirebaseClientConfig {
  return {
    apiKey: str(raw.VITE_FIREBASE_API_KEY),
    authDomain: str(raw.VITE_FIREBASE_AUTH_DOMAIN),
    projectId: str(raw.VITE_FIREBASE_PROJECT_ID),
    appId: str(raw.VITE_FIREBASE_APP_ID),
    storageBucket: str(raw.VITE_FIREBASE_STORAGE_BUCKET),
    messagingSenderId: str(raw.VITE_FIREBASE_MESSAGING_SENDER_ID),
    measurementId: str(raw.VITE_FIREBASE_MEASUREMENT_ID),
    firestoreDatabaseId: str(raw.VITE_FIREBASE_FIRESTORE_DATABASE_ID) || undefined,
  };
}

const firebase = resolveFirebaseConfig();

/**
 * A Firebase config is usable only if the core fields exist AND the apiKey looks
 * like a real Web API key (`AIza...`). A common mistake is pasting the App ID
 * into the apiKey field, which the SDK rejects with `auth/invalid-api-key`.
 */
const firebaseApiKeyLooksValid = /^AIza[0-9A-Za-z_-]{20,}$/.test(firebase.apiKey);
const firebaseEnabled = Boolean(
  firebase.apiKey &&
    firebase.authDomain &&
    firebase.projectId &&
    firebase.appId &&
    firebaseApiKeyLooksValid,
);

const tmdbApiKey = str(raw.VITE_TMDB_API_KEY);

export const env = {
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,

  tmdbApiKey,
  tmdbEnabled: Boolean(tmdbApiKey),

  /** Base URL of the backend API (Express). Empty string => same-origin `/api`. */
  apiBaseUrl: str(raw.VITE_API_BASE_URL),

  /** Origin used to validate VidKing player postMessage events. */
  vidkingOrigin: str(raw.VITE_VIDKING_ORIGIN) || 'https://www.vidking.net',

  /** Dev-only player diagnostics overlay. */
  enablePlayerDebug: bool(raw.VITE_ENABLE_PLAYER_DEBUG),

  firebase,
  firebaseEnabled,
} as const;

export interface MissingEnvVar {
  name: string;
  purpose: string;
}

/**
 * Returns the list of important-but-missing environment variables so the UI can
 * surface a friendly, actionable banner. This never throws.
 */
export function getMissingEnv(): MissingEnvVar[] {
  const missing: MissingEnvVar[] = [];
  if (!env.tmdbApiKey) {
    missing.push({ name: 'VITE_TMDB_API_KEY', purpose: 'Browse and search the TMDB catalog' });
  }
  if (!env.firebaseEnabled) {
    missing.push({
      name: 'VITE_FIREBASE_* (apiKey, authDomain, projectId, appId)',
      purpose: 'Sign in, watchlist, and saved progress',
    });
  }
  return missing;
}
