
"use client";

import { useEffect } from 'react';
import { useUser, useFirestore, setDocumentNonBlocking } from '@/firebase';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { usePathname } from 'next/navigation';

export default function SessionValidator() {
  const { user } = useUser();
  const firestore = useFirestore();
  const pathname = usePathname();

  useEffect(() => {
    if (user && firestore) {
      const userDocRef = doc(firestore, 'users', user.uid);
      const userData = {
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        lastSeen: serverTimestamp(),
      };
      // Non-blocking write to create or update the user profile on auth change or navigation.
      setDocumentNonBlocking(userDocRef, userData, { merge: true });
    }
  }, [user, firestore, pathname]); // Reruns on user change or navigation

  return null; // This component does not render anything
}
