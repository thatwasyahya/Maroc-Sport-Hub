
'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, User, signOut as firebaseSignOut } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { UserRole } from '@/lib/types';

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

  const firestore = getFirestore(app);
  const auth = getAuth(app);
  const storage = getStorage(app, firebaseConfig.storageBucket);

  return { firebaseApp: app, auth, firestore, storage };
}

export async function signInWithGoogle() {
    const { auth, firestore } = initializeFirebase();
    const provider = new GoogleAuthProvider();

    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        // Check if the user already exists in Firestore
        const userDocRef = doc(firestore, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
            // User is new, create a profile document
            let role: UserRole = 'user';
            if (user.email === 'super@admin.com') role = 'super_admin';
            else if (user.email === 'admin@admin.com') role = 'admin';

            const [firstName, ...lastName] = (user.displayName || '').split(' ');

            await setDoc(userDocRef, {
                id: user.uid,
                name: user.displayName || 'Anonymous',
                email: user.email,
                role: role,
                firstName: firstName || '',
                lastName: lastName.join(' ') || '',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });
        }
        return user;
    } catch (error) {
        console.error("Error during Google sign-in:", error);
        throw error;
    }
}

export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp),
    storage: getStorage(firebaseApp)
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
