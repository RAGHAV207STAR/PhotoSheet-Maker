
import { FirebaseOptions } from 'firebase/app';

// This file is used to configure the Firebase project.
// It is used by the Firebase providers to initialize the Firebase app.
// It reads environment variables prefixed with NEXT_PUBLIC_ to be available on the client-side.

const config: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Conditionally add storageBucket and measurementId only if they are set
// This prevents Firebase initialization errors if the env vars are empty strings.
if (process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET) {
  config.storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
}
if (process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID) {
  config.measurementId = process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID;
}

export const firebaseConfig: FirebaseOptions = config;
