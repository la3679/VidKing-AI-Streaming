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
const firebaseConfig = {
  apiKey: env.firebase.apiKey || appletConfig.apiKey,
  authDomain: env.firebase.authDomain || appletConfig.authDomain,
  projectId: env.firebase.projectId || appletConfig.projectId,
  appId: env.firebase.appId || appletConfig.appId,
  storageBucket: env.firebase.storageBucket || appletConfig.storageBucket,
  messagingSenderId: env.firebase.messagingSenderId || appletConfig.messagingSenderId,
};

const firestoreDatabaseId =
  env.firebase.firestoreDatabaseId || appletConfig.firestoreDatabaseId || undefined;

/** Whether Firebase has enough config to actually authenticate / read Firestore. */
export const firebaseEnabled = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

if (!firebaseEnabled) {
  logger.warn('Firebase config incomplete — auth and watchlist/progress are disabled.');
}

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
