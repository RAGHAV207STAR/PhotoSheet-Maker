
'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener'

interface FirebaseProviderProps {
  children: ReactNode;
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
}

// Internal state for user authentication
interface UserAuthState {
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// Combined state for the Firebase context
export interface FirebaseContextState {
  areServicesAvailable: boolean; // True if core services (app, firestore, auth instance) are provided
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null; // The Auth service instance
  // User authentication state
  user: User | null;
  isUserLoading: boolean; // True during initial auth check
  userError: Error | null; // Error from auth listener
}

// Return type for useFirebase()
export interface FirebaseServicesAndUser {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// Return type for useUser() - specific to user auth state
export interface UserHookResult { // Renamed from UserAuthHookResult for consistency if desired, or keep as UserAuthHookResult
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// React Context
export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

/**
 * FirebaseProvider manages and provides Firebase services and user authentication state.
 */
export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
  children,
  firebaseApp,
  firestore,
  auth,
}) => {
  const [userAuthState, setUserAuthState] = useState<UserAuthState>({
    user: null,
    isUserLoading: true, // Start loading until first auth event
    userError: null,
  });

  // Effect to subscribe to Firebase auth state changes
  useEffect(() => {
    if (!auth) { // If no Auth service instance, cannot determine user state
      setUserAuthState({ user: null, isUserLoading: false, userError: new Error("Auth service not provided.") });
      return;
    }

    setUserAuthState({ user: null, isUserLoading: true, userError: null }); // Reset on auth instance change

    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => { // Auth state determined
        setUserAuthState({ user: firebaseUser, isUserLoading: false, userError: null });
      },
      (error) => { // Auth listener error
        console.error("FirebaseProvider: onAuthStateChanged error:", error);
        setUserAuthState({ user: null, isUserLoading: false, userError: error });
      }
    );
    return () => unsubscribe(); // Cleanup
  }, [auth]); // Depends on the auth instance

  // Memoize the context value
  const contextValue = useMemo((): FirebaseContextState => {
    const servicesAvailable = !!(firebaseApp && firestore && auth);
    return {
      areServicesAvailable: servicesAvailable,
      firebaseApp: servicesAvailable ? firebaseApp : null,
      firestore: servicesAvailable ? firestore : null,
      auth: servicesAvailable ? auth : null,
      user: userAuthState.user,
      isUserLoading: userAuthState.isUserLoading,
      userError: userAuthState.userError,
    };
  }, [firebaseApp, firestore, auth, userAuthState]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};

// Overload for useFirebase to handle the optional parameter
export function useFirebase(optional: true): Partial<FirebaseServicesAndUser>;
export function useFirebase(): FirebaseServicesAndUser;

/**
 * Hook to access core Firebase services and user authentication state.
 * Throws error if core services are not available or used outside provider, unless optional is true.
 */
export function useFirebase(optional: boolean = false): Partial<FirebaseServicesAndUser> {
  const context = useContext(FirebaseContext);

  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider.');
  }

  if (!optional && (!context.areServicesAvailable || !context.firebaseApp || !context.firestore || !context.auth)) {
    throw new Error('Firebase core services not available. Check FirebaseProvider props.');
  }

  return {
    firebaseApp: context.firebaseApp ?? undefined,
    firestore: context.firestore ?? undefined,
    auth: context.auth ?? undefined,
    user: context.user,
    isUserLoading: context.isUserLoading,
    userError: context.userError,
  };
};

export function useAuth(optional: true): Auth | undefined;
export function useAuth(): Auth;
/** Hook to access Firebase Auth instance. */
export function useAuth(optional: boolean = false): Auth | undefined {
  const { auth } = useFirebase(true);
  if (!optional && !auth) {
    throw new Error('Auth service not available. Check FirebaseProvider props.');
  }
  return auth;
};

export function useFirestore(optional: true): Firestore | undefined;
export function useFirestore(): Firestore;
/** Hook to access Firestore instance. */
export function useFirestore(optional: boolean = false): Firestore | undefined {
  const { firestore } = useFirebase(true);
  if (!optional && !firestore) {
    throw new Error('Firestore service not available. Check FirebaseProvider props.');
  }
  return firestore;
};

export function useFirebaseApp(optional: true): FirebaseApp | undefined;
export function useFirebaseApp(): FirebaseApp;
/** Hook to access Firebase App instance. */
export function useFirebaseApp(optional: boolean = false): FirebaseApp | undefined {
  const { firebaseApp } = useFirebase(true);
  if (!optional && !firebaseApp) {
    throw new Error('FirebaseApp not available. Check FirebaseProvider props.');
  }
  return firebaseApp;
};

type MemoFirebase <T> = T & {__memo?: boolean};

export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T | (MemoFirebase<T>) {
  const memoized = useMemo(factory, deps);
  
  if(typeof memoized !== 'object' || memoized === null) return memoized;
  (memoized as MemoFirebase<T>).__memo = true;
  
  return memoized;
}

export function useUser(optional: true): UserHookResult;
export function useUser(): UserHookResult;
/**
 * Hook specifically for accessing the authenticated user's state.
 * This provides the User object, loading status, and any auth errors.
 * @returns {UserHookResult} Object with user, isUserLoading, userError.
 */
export function useUser(optional: boolean = false): UserHookResult {
  const { user, isUserLoading, userError } = useFirebase(true);
  return { user, isUserLoading, userError };
};
