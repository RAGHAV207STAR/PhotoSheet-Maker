
"use client";

import { useEffect } from 'react';
import { useUser, useFirestore, useDoc, useAuth, useMemoFirebase } from '@/firebase';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { manageSession } from '@/lib/session-manager';
import { usePathname } from 'next/navigation';

interface UserProfile {
  sessionId?: string;
}

export default function SessionValidator() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const auth = useAuth();
  const { toast } = useToast();
  const pathname = usePathname();

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile } = useDoc<UserProfile>(userDocRef);

  // 1. Validate session on profile data change
  useEffect(() => {
    // This logic is disabled to allow multi-device login.
    // if (isUserLoading || !user || !userProfile) return;

    // const localSessionId = manageSession.getSessionId();
    // const remoteSessionId = userProfile.sessionId;

    // if (remoteSessionId && localSessionId && remoteSessionId !== localSessionId) {
    //   // Mismatch found, another device has logged in.
    //   manageSession.endSession();
    //   signOut(auth);
    //   toast({
    //     variant: 'destructive',
    //     title: 'Session Expired',
    //     description: 'You have been logged out because you signed in on another device.',
    //     duration: 5000,
    //   });
    // }
  }, [userProfile, user, isUserLoading, auth, toast]);

  // 2. Update lastSeen timestamp on user activity (navigation)
  useEffect(() => {
    if (userDocRef) {
      updateDoc(userDocRef, { lastSeen: serverTimestamp() });
    }
  }, [pathname, userDocRef]);

  return null; // This component does not render anything
}
