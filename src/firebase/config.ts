
import { FirebaseOptions } from 'firebase/app';

// This file is used to configure the Firebase project.
// It is used by the Firebase providers to initialize the Firebase app.
// It reads environment variables prefixed with NEXT_PUBLIC_ to be available on the client-side.

let config: FirebaseOptions;

// Only populate the config if the necessary environment variables are set.
// This prevents build errors on platforms like Vercel if the env vars are not yet configured.
if (
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
  process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN &&
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
) {
  config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  // Conditionally add storageBucket and measurementId only if they are set
  if (process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET) {
    config.storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  }
  if (process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID) {
    config.measurementId = process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID;
  }
} else {
  // Provide a fallback empty config for build-time, the client-provider will handle the error gracefully.
  config = {};
}


export const firebaseConfig: FirebaseOptions = config;
