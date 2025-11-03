'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  const isEmulator = process.env.NEXT_PUBLIC_USE_EMULATOR === 'true';

  if (!getApps().length) {
    const app = initializeApp(firebaseConfig);
    
    if (isEmulator) {
      console.log('Using Firebase Emulators');
      const firestore = getFirestore(app);
      connectFirestoreEmulator(firestore, 'firestore', 8080);
      const auth = getAuth(app);
      connectAuthEmulator(auth, 'http://auth:9099', { disableWarnings: true });
      return { firebaseApp: app, auth, firestore };
    }
    
    return getSdks(app);
  }

  const app = getApp();

  if (isEmulator) {
      console.log('Using Firebase Emulators');
      const firestore = getFirestore(app);
      try {
        connectFirestoreEmulator(firestore, 'firestore', 8080);
      } catch (e) {
        // already connected
      }

      const auth = getAuth(app);
      try {
        connectAuthEmulator(auth, 'http://auth:9099', { disableWarnings: true });
      } catch(e) {
        // already connected
      }
      return { firebaseApp: app, auth, firestore };
  }


  // If already initialized, return the SDKs with the already initialized App
  return getSdks(app);
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
