
'use client';

import React, { useMemo, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase, isFirebaseConfigured } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const isConfigured = isFirebaseConfigured();

  const firebaseServices = useMemo(() => {
    // Ensure this runs only on the client
    if (typeof window === 'undefined' || !isConfigured) return null;
    return initializeFirebase();
  }, [isConfigured]);

  if (!firebaseServices) {
    if (!isConfigured) {
        return (
            <div className="flex flex-col flex-1 items-center justify-center min-h-screen p-4 bg-gradient-to-br from-red-50 to-orange-100">
                <Card className="w-full max-w-lg text-center bg-white/50 backdrop-blur-lg border border-destructive/20 shadow-lg">
                    <CardHeader className="items-center p-6 sm:p-8">
                        <div className="p-4 rounded-full bg-gradient-to-br from-red-400 to-orange-500 shadow-[0_4px_20px_rgba(239,68,68,0.3)] mb-4">
                            <AlertTriangle className="h-12 w-12 text-white" />
                        </div>
                        <CardTitle className="text-3xl font-extrabold tracking-tight text-destructive">
                            Firebase Not Configured
                        </CardTitle>
                        <CardDescription className="text-foreground/80 text-base mt-2">
                            Your Firebase environment variables are missing. Please provide them to continue. This is a common issue that can be resolved by setting up your Firebase project.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 sm:p-8 pt-0">
                        <Button onClick={() => window.location.reload()} size="lg" className="w-full">
                            Refresh Application
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }
    // Render a loading state or null while waiting for client-side execution
    return null;
  }

  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.firebaseApp}
      auth={firebaseServices.auth}
      firestore={firebaseServices.firestore}
    >
      {children}
    </FirebaseProvider>
  );
}
