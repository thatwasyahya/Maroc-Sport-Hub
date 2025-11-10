'use server';

import { initializeApp, getApp, getApps } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { firebaseConfig } from '@/firebase/config';

// Initialize Firebase Admin SDK
const app = getApps().length ? getApp() : initializeApp({
    credential: {
        projectId: firebaseConfig.projectId,
        clientEmail: `firebase-adminsdk-hgg3j@${firebaseConfig.projectId}.iam.gserviceaccount.com`,
        privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
    },
    storageBucket: firebaseConfig.storageBucket,
});

const storage = getStorage(app);
const bucket = storage.bucket();

export async function uploadFile(formData: FormData): Promise<{ success: boolean, url?: string, error?: string }> {
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
