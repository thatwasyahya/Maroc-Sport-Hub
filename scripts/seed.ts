// tsx scripts/seed.ts
import { initializeApp, App } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { users, facilities } from '../src/lib/data';
import { firebaseConfig } from '../src/firebase/config';

let app: App;
// Always connect to emulators for seeding
process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099";
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

            if (user.role === 'admin') {
                await db.collection('roles_admin').doc(user.id).set({ assignedAt: Timestamp.now() });
            }
            if (user.role === 'super_admin') {
                await db.collection('roles_super_admin').doc(user.id).set({ assignedAt: Timestamp.now() });
            }
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
        const docRef = db.collection('facilities').doc(facility.id);
        facilityBatch.set(docRef, facility);
    });
    await facilityBatch.commit();
    console.log('Facilities seeded.');

    console.log('Database seed complete!');
    process.exit(0);
}

seedDatabase().catch(error => {
    console.error('An error occurred during database seeding:', error);
    process.exit(1);
});
