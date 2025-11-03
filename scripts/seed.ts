// tsx scripts/seed.ts
import { initializeApp, App } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { users, facilities, equipments, reservations } from '../src/lib/data';
import { firebaseConfig } from '../src/firebase/config';

let app: App;
if (process.env.NEXT_PUBLIC_USE_EMULATOR) {
    // Connect to emulators
    process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
    process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099";
    app = initializeApp({ projectId: firebaseConfig.projectId });
} else {
    // Connect to production services
    app = initializeApp({ projectId: firebaseConfig.projectId });
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

    // Seed Equipments
    console.log('Seeding equipments...');
    const equipmentBatch = db.batch();
    equipments.forEach(equipment => {
        const docRef = db.collection('equipments').doc(equipment.id);
        equipmentBatch.set(docRef, equipment);
    });
    await equipmentBatch.commit();
    console.log('Equipments seeded.');

    // Seed Facilities
    console.log('Seeding facilities...');
    const facilityBatch = db.batch();
    facilities.forEach(facility => {
        const docRef = db.collection('facilities').doc(facility.id);
        facilityBatch.set(docRef, facility);
    });
    await facilityBatch.commit();
    console.log('Facilities seeded.');

    // Seed Reservations
    console.log('Seeding reservations...');
    for (const reservation of reservations) {
        const userReservationsRef = db.collection('users').doc(reservation.userId).collection('reservations').doc(reservation.id);
        const rootReservationsRef = db.collection('reservations').doc(reservation.id);
        const reservationData = {
            ...reservation,
            startTime: Timestamp.fromDate(reservation.startTime as Date),
            endTime: Timestamp.fromDate(reservation.endTime as Date),
            createdAt: Timestamp.fromDate(reservation.createdAt as Date),
            updatedAt: Timestamp.fromDate(reservation.updatedAt as Date),
        };
        await userReservationsRef.set(reservationData);
        await rootReservationsRef.set(reservationData); // Denormalize for admin view
    }
    console.log('Reservations seeded.');

    console.log('Database seed complete!');
    process.exit(0);
}

seedDatabase().catch(error => {
    console.error('An error occurred during database seeding:', error);
    process.exit(1);
});
