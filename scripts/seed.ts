
// tsx scripts/seed.ts
import { initializeApp, App } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { users, facilities } from '../src/lib/data';

let app: App;
// Initialize without specific credentials to use Application Default Credentials
// This is the most reliable way in many cloud environments.
try {
  app = initializeApp();
} catch (error: any) {
  console.error("Failed to initialize Firebase Admin SDK. This might happen if the script is run multiple times in a hot-reload environment. If seeding fails, try again.", error.message);
  process.exit(1);
}


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

            const userDocRef = db.collection('users').doc(user.id);
            await userDocRef.set({
                ...user,
                createdAt: Timestamp.fromDate(user.createdAt as Date),
                updatedAt: Timestamp.fromDate(user.updatedAt as Date),
            });

        } catch (error: any) {
            if (error.code === 'auth/uid-already-exists' || error.code === 'auth/email-already-exists') {
                // This is expected if you run the script multiple times.
                // console.log(`User ${user.email} already exists, skipping...`);
            } else {
                console.error(`Error seeding user ${user.email}:`, error);
            }
        }
    }
    console.log('User seeding process complete.');

    // Seed Facilities
    console.log('Seeding new facilities...');
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
    console.log(`${facilities.length} new facilities have been added.`);

    console.log('Database seed complete!');
    process.exit(0);
}

seedDatabase().catch(error => {
    console.error('An error occurred during database seeding:', error);
    process.exit(1);
});
