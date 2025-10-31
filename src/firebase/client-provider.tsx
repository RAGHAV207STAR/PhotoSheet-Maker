
'use client';

import * as React from 'react';
import { useMemo, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

function initializeFirebaseOnClient() {
    if (!firebaseConfig.projectId || !firebaseConfig.apiKey) {
        return { app: null, auth: null, firestore: null, error: new Error("Firebase config is missing or incomplete.") };
    }

    try {
        const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
        const auth = getAuth(app);
        const firestore = getFirestore(app);
        return { app, auth, firestore, error: null };
    } catch (error) {
        console.error("Failed to initialize Firebase:", error);
        return { app: null, auth: null, firestore: null, error: error as Error };
    }
}


export function FirebaseClientProvider({ children }: { children: ReactNode }) {
  const firebaseServices = useMemo(() => {
    return initializeFirebaseOnClient();
  }, []); 

  if (firebaseServices.error || !firebaseServices.app) {
      return (
          <div className="w-full h-screen flex items-center justify-center text-center p-4 bg-background">
              <div className="max-w-md p-6 rounded-lg bg-card border border-destructive/50">
                  <h1 className="text-2xl font-bold text-destructive">Firebase Not Configured</h1>
                  <p className="text-muted-foreground mt-2">
                      The application could not connect to Firebase. This is likely because the required
                      environment variables are not set in your hosting provider (e.g., Vercel).
                  </p>
                  <p className="text-sm text-muted-foreground mt-4">
                      Please ensure the following environment variables are correctly set:
                  </p>
                  <ul className="text-xs text-left text-muted-foreground mt-2 bg-secondary p-3 rounded-md font-mono">
                      <li>NEXT_PUBLIC_FIREBASE_API_KEY</li>
                      <li>NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN</li>
                      <li>NEXT_PUBLIC_FIREBASE_PROJECT_ID</li>
                      <li>...and other Firebase config values.</li>
                  </ul>
              </div>
          </div>
      )
  }

  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.app}
      auth={firebaseServices.auth!}
      firestore={firebaseServices.firestore!}
    >
      {children}
    </FirebaseProvider>
  );
}
