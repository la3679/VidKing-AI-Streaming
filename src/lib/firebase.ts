import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';
import appletConfig from '../../firebase-applet-config.json';
import { env } from './env';
import { logger } from './logger';

/**
 * Firebase config is resolved from `VITE_FIREBASE_*` env vars when present,
 * falling back to the committed AI Studio applet config. We initialize the SDK
 * unconditionally (initializeApp does not perform network I/O), so a missing or
 * partial config never crashes the app at import time — auth/Firestore calls
 * simply fail at runtime and are reported through normalized error handling.
 */
const resolvedApiKey = env.firebase.apiKey || appletConfig.apiKey;
const resolvedProjectId = env.firebase.projectId || appletConfig.projectId;

/** A usable Firebase Web API key looks like `AIza...`. The App ID and other
 *  values are commonly pasted here by mistake; reject anything that clearly
 *  isn't an API key so a misconfiguration degrades gracefully (banner) instead
 *  of throwing `auth/invalid-api-key` and blanking the app. */
const looksLikeApiKey = /^AIza[0-9A-Za-z_-]{20,}$/.test(resolvedApiKey);

const configuredFirebase = Boolean(resolvedApiKey && resolvedProjectId && looksLikeApiKey);

if (resolvedApiKey && !looksLikeApiKey) {
  logger.warn(
    'VITE_FIREBASE_API_KEY does not look like a Web API key (expected "AIza..."). ' +
      'Auth/Firestore are disabled until a valid key is provided.',
  );
} else if (!configuredFirebase) {
  logger.warn('Firebase config incomplete — auth and watchlist/progress are disabled.');
}

const SAFE_PLACEHOLDER = 'unconfigured-placeholder-key';

const firebaseConfig = {
  // Only feed a real key to the SDK; otherwise use a placeholder the SDK
  // tolerates without throwing. Real usage is gated by `firebaseEnabled`.
  apiKey: configuredFirebase ? resolvedApiKey : SAFE_PLACEHOLDER,
  authDomain: env.firebase.authDomain || appletConfig.authDomain || 'localhost',
  projectId: resolvedProjectId || 'unconfigured',
  appId: env.firebase.appId || appletConfig.appId || 'unconfigured',
  storageBucket: env.firebase.storageBucket || appletConfig.storageBucket,
  messagingSenderId: env.firebase.messagingSenderId || appletConfig.messagingSenderId,
  measurementId: env.firebase.measurementId || undefined,
};

const firestoreDatabaseId =
  env.firebase.firestoreDatabaseId || appletConfig.firestoreDatabaseId || undefined;

// Initialize defensively: if anything throws (e.g. an unexpected key format),
// disable Firebase rather than crashing the whole app at import time.
let initOk = true;
let app: ReturnType<typeof initializeApp>;
try {
  app = initializeApp(firebaseConfig);
} catch (error) {
  logger.error('Firebase initialization failed; disabling Firebase features.', error);
  initOk = false;
  app = initializeApp({ apiKey: SAFE_PLACEHOLDER, projectId: 'unconfigured' }, 'fallback');
}

/** Whether Firebase can actually authenticate / read Firestore. */
export const firebaseEnabled = configuredFirebase && initOk;

export const db = firestoreDatabaseId ? getFirestore(app, firestoreDatabaseId) : getFirestore(app);
export const auth = getAuth(app);

// Analytics is optional and browser-only. Initialize lazily and defensively so
// it never breaks SSR, tests, or environments without a measurementId.
if (firebaseEnabled && env.firebase.measurementId && typeof window !== 'undefined') {
  isSupported()
    .then((supported) => {
      if (supported) getAnalytics(app);
    })
    .catch(() => {
      /* analytics is non-essential; ignore failures */
    });
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  logger.error('Firestore error:', errInfo);
  throw new Error(errInfo.error);
}
