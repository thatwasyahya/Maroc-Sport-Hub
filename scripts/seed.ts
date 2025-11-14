// tsx scripts/seed.ts
import { initializeApp, App } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { users, facilities } from '../src/lib/data';
import { firebaseConfig } from '../src/firebase/config';

let app: App;
// DO NOT connect to emulators. The script should target production.
// process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
// process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099";
app = initializeApp({ projectId: firebaseConfig.projectId });

const db = getFirestore(app);
const auth = getAuth(app);

async function seedDatabase() {
    console.log('Starting database seed...');

    // Seed Users and Auth
    console.log('Seeding users...');
    for (const user of users) {
        try {
            await auth.createUser({
                uid: user.id,
                email: user.email,
                password: 'password123', // Set a default password
                displayName: user.name,
            });
            console.log(`Created auth user: ${user.email}`);

            const userDocRef = db.collection('users').doc(user.id);
            await userDocRef.set({
                ...user,
                createdAt: Timestamp.fromDate(user.createdAt as Date),
                updatedAt: Timestamp.fromDate(user.updatedAt as Date),
            });

            console.log(`Seeded user profile: ${user.name}`);
        } catch (error: any) {
            if (error.code === 'auth/uid-already-exists' || error.code === 'auth/email-already-exists') {
                console.log(`User ${user.email} already exists, skipping...`);
            } else {
                console.error(`Error seeding user ${user.email}:`, error);
            }
        }
    }

    // Seed Facilities
    console.log('Seeding facilities...');
    const facilityBatch = db.batch();
    facilities.forEach(facility => {
        // Generate a new unique ID for each facility to ensure they are added, not overwritten.
        const docRef = db.collection('facilities').doc(); 
        const { id, ...facilityData } = facility; // Exclude the pre-defined ID from the data file.
        
        // Firestore Admin SDK does not allow 'undefined' values.
        // If location is undefined, we remove the key entirely.
        if (facilityData.location === undefined) {
            delete (facilityData as any).location;
        }

        facilityBatch.set(docRef, facilityData);
    });
    await facilityBatch.commit();
    console.log(`${facilities.length} new facilities added.`);

    console.log('Database seed complete!');
    process.exit(0);
}

seedDatabase().catch(error => {
    console.error('An error occurred during database seeding:', error);
    process.exit(1);
});
