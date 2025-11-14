import { initializeApp, getApps, getApp, FirebaseOptions } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// This configuration is safe to be exposed on the server.
const firebaseConfig: FirebaseOptions = {
  "projectId": "studio-7447088707-3956a",
  "appId": "1:443305771721:web:e57fa080e687b413ae8318",
  "apiKey": "AIzaSyC2n1WGYNwxUNPmdymBah4lcxRGXr52pvc",
  "authDomain": "studio-7447088707-3956a.firebaseapp.com",
  "storageBucket": "studio-7447088707-3956a.appspot.com",
  "measurementId": "",
  "messagingSenderId": "443305771721"
};

// Singleton pattern to initialize Firebase only once.
let app: ReturnType<typeof initializeApp>;
let firestore: ReturnType<typeof getFirestore>;
let auth: ReturnType<typeof getAuth>;

if (!getApps().length) {
    app = initializeApp(firebaseConfig);
} else {
    app = getApp();
}

firestore = getFirestore(app);
auth = getAuth(app);


export const initializeFirebase = () => {
    return { firebaseApp: app, firestore, auth };
};
