'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  const isEmulator = process.env.NEXT_PUBLIC_USE_EMULATOR === 'true';

  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

  const firestore = getFirestore(app);
  const auth = getAuth(app);

  if (isEmulator) {
    console.log('Using Firebase Emulators');
    try {
      connectFirestoreEmulator(firestore, '127.0.0.1', 8080);
      connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    } catch (e) {
      // Emulators are likely already connected
      // console.warn(e);
    }
  }

  return { firebaseApp: app, auth, firestore };
}

export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp)
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';