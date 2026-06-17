/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TMDB_API_KEY: string;
  readonly VITE_API_BASE_URL: string;
  readonly VITE_VIDKING_ORIGIN: string;
  readonly VITE_ENABLE_PLAYER_DEBUG: string;

  // Firebase web config (optional — falls back to firebase-applet-config.json).
  readonly VITE_FIREBASE_API_KEY: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN: string;
  readonly VITE_FIREBASE_PROJECT_ID: string;
  readonly VITE_FIREBASE_APP_ID: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string;
  readonly VITE_FIREBASE_MEASUREMENT_ID: string;
  readonly VITE_FIREBASE_FIRESTORE_DATABASE_ID: string;

  readonly APP_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
