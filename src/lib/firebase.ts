import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
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

/** Whether Firebase has enough real config to authenticate / read Firestore. */
export const firebaseEnabled = Boolean(resolvedApiKey && resolvedProjectId);

if (!firebaseEnabled) {
  logger.warn('Firebase config incomplete — auth and watchlist/progress are disabled.');
}

const firebaseConfig = {
  // `getAuth()` throws synchronously on an empty apiKey, which would blank the
  // entire app before the error boundary can mount. When Firebase is not
  // configured we initialize with a harmless placeholder so the SDK loads;
  // actual auth/Firestore usage is gated by `firebaseEnabled`.
  apiKey: resolvedApiKey || 'unconfigured-placeholder-key',
  authDomain: env.firebase.authDomain || appletConfig.authDomain || 'localhost',
  projectId: resolvedProjectId || 'unconfigured',
  appId: env.firebase.appId || appletConfig.appId || 'unconfigured',
  storageBucket: env.firebase.storageBucket || appletConfig.storageBucket,
  messagingSenderId: env.firebase.messagingSenderId || appletConfig.messagingSenderId,
};

const firestoreDatabaseId =
  env.firebase.firestoreDatabaseId || appletConfig.firestoreDatabaseId || undefined;

const app = initializeApp(firebaseConfig);
export const db = firestoreDatabaseId ? getFirestore(app, firestoreDatabaseId) : getFirestore(app);
export const auth = getAuth(app);

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
