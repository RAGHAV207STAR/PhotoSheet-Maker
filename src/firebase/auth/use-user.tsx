'use client';

import { useFirebase } from '@/firebase/provider';

// This is a new, simplified hook for user management.
// It relies on the central state management in FirebaseProvider.

export interface UserHookResult {
  user: any | null; // Consider using the actual Firebase User type
  isUserLoading: boolean;
  userError: Error | null;
}

/**
 * Hook specifically for accessing the authenticated user's state.
 * This provides the User object, loading status, and any auth errors.
 * @returns {UserHookResult} Object with user, isUserLoading, userError.
 */
export const useUser = (): UserHookResult => {
  const { user, isUserLoading, userError } = useFirebase();
  return { user, isUserLoading, userError };
};
