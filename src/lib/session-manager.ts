
"use client";

import { DocumentReference, setDoc } from "firebase/firestore";

const SESSION_KEY = 'app_session_id';

const generateSessionId = (): string => {
  // Generates a random string for the session ID
  return crypto.randomUUID();
};

const startSession = async (userDocRef: DocumentReference): Promise<string> => {
  const newSessionId = generateSessionId();
  if (typeof window !== 'undefined') {
    localStorage.setItem(SESSION_KEY, newSessionId);
    // The session ID is set on the user document in the login flow
  }
  return newSessionId;
};

const getSessionId = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(SESSION_KEY);
  }
  return null;
};

const endSession = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SESSION_KEY);
  }
};

export const manageSession = {
  startSession,
  getSessionId,
  endSession,
};
