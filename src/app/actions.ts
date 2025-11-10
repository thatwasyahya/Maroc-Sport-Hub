'use server';

import { initializeApp, getApp, getApps } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { firebaseConfig } from '@/firebase/config';

// Check if the private key exists before initializing
if (!process.env.FIREBASE_PRIVATE_KEY) {
  console.error("Firebase Admin SDK private key is not defined. Please set the FIREBASE_PRIVATE_KEY environment variable.");
}

// Initialize Firebase Admin SDK only if the key is present
const app = getApps().length 
  ? getApp() 
  : process.env.FIREBASE_PRIVATE_KEY 
    ? initializeApp({
        credential: {
            projectId: firebaseConfig.projectId,
            clientEmail: `firebase-adminsdk-hgg3j@${firebaseConfig.projectId}.iam.gserviceaccount.com`,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        },
        storageBucket: firebaseConfig.storageBucket,
      })
    : null;

const storage = app ? getStorage(app) : null;
const bucket = storage ? storage.bucket() : null;

export async function uploadFile(formData: FormData): Promise<{ success: boolean, url?: string, error?: string }> {
    if (!bucket) {
        const errorMessage = 'Firebase Admin SDK is not initialized. Cannot upload file.';
        console.error(errorMessage);
        return { success: false, error: errorMessage };
    }

    const file = formData.get('file') as File | null;
    const path = formData.get('path') as string | null;

    if (!file || !path) {
        return { success: false, error: 'File or path not provided.' };
    }

    try {
        const fileBuffer = Buffer.from(await file.arrayBuffer());
        const fileRef = bucket.file(path);

        await fileRef.save(fileBuffer, {
            metadata: {
                contentType: file.type,
            },
        });

        // Make the file public to get a downloadable URL
        await fileRef.makePublic();

        // Return the public URL
        const publicUrl = fileRef.publicUrl();
        
        return { success: true, url: publicUrl };

    } catch (error: any) {
        console.error('Error uploading file to Firebase Storage:', error);
        return { success: false, error: error.message };
    }
}
