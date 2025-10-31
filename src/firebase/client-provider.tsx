
'use client';

import * as React from 'react';
import { useMemo, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeApp, getApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

interface FirebaseServices {
    app: FirebaseApp | null;
    auth: Auth | null;
    firestore: Firestore | null;
    error: Error | null;
}

function initializeFirebaseOnClient(): FirebaseServices {
    // Check if essential config values are present. These are read from public env vars.
    if (!firebaseConfig.projectId || !firebaseConfig.apiKey) {
        return { 
            app: null, 
            auth: null, 
            firestore: null, 
            error: new Error("Firebase config is missing or incomplete. Ensure NEXT_PUBLIC_FIREBASE_* environment variables are set.") 
        };
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
  // Use useMemo to ensure Firebase is initialized only once per client session.
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
                      Please ensure the environment variables starting with `NEXT_PUBLIC_FIREBASE_` are correctly set in your Vercel project settings.
                  </p>
                  <pre className="mt-4 p-4 bg-secondary text-left text-xs rounded-md w-full max-w-lg overflow-x-auto"><code>{firebaseServices.error?.message || "Unknown initialization error."}</code></pre>
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
