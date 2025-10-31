
"use client";

import { useEffect } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { usePathname } from 'next/navigation';

interface UserProfile {
  sessionId?: string;
}

export default function SessionValidator() {
  const { user } = useUser();
  const firestore = useFirestore();
  const pathname = usePathname();

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  useDoc<UserProfile>(userDocRef);

  // Update lastSeen timestamp on user activity (navigation)
  useEffect(() => {
    if (userDocRef) {
      updateDoc(userDocRef, { lastSeen: serverTimestamp() });
    }
  }, [pathname, userDocRef]);

  return null; // This component does not render anything
}
