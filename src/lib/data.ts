import { faker } from "@faker-js/faker";
import type { Facility, User, Reservation, Equipment, UserRole } from "./types";

const createRandomUser = (role: UserRole, id: number): User => ({
  id: faker.string.uuid(),
  name: faker.person.fullName(),
  email: faker.internet.email(),
  avatarUrl: `https://i.pravatar.cc/150?u=${id}`,
  role,
});

const sports = ["Football", "Basketball", "Tennis", "Handball", "Volleyball", "Natation", "Athlétisme", "Yoga", "Musculation", "CrossFit", "Padel"].sort();
const regions = ["Rabat-Salé-Kénitra", "Casablanca-Settat", "Marrakech-Safi", "Tanger-Tétouan-Al Hoceïma", "Fès-Meknès", "Souss-Massa"];
const cities: { [key: string]: string[] } = {
  "Rabat-Salé-Kénitra": ["Rabat", "Salé", "Kénitra"],
  "Casablanca-Settat": ["Casablanca", "Settat", "Mohammedia"],
  "Marrakech-Safi": ["Marrakech", "Safi", "Essaouira"],
  "Tanger-Tétouan-Al Hoceïma": ["Tanger", "Tétouan", "Al Hoceïma"],
  "Fès-Meknès": ["Fès", "Meknès"],
  "Souss-Massa": ["Agadir", "Inezgane"],
};

const equipmentList = [
    "Haltères", "Tapis de course", "Vélos elliptiques", "Balles de yoga", "Filets de volley-ball", 
    "Paniers de basket", "Buts de football", "Raquettes de tennis", "Kettlebells", "Cages à squat",
    "Bancs de musculation", "Cordes à sauter", "Sacs de frappe"
].sort();

const createRandomEquipment = (): Equipment => ({
    id: faker.string.uuid(),
    name: faker.helpers.arrayElement(equipmentList),
    quantity: faker.number.int({ min: 1, max: 20 }),
});

const generateTimeSlots = (startHour: number, endHour: number): string[] => {
    const slots = [];
    for (let i = startHour; i < endHour; i++) {
        slots.push(`${String(i).padStart(2, '0')}:00 - ${String(i + 1).padStart(2, '0')}:00`);
    }
    return slots;
};

const createRandomFacility = (): Facility => {
    const region = faker.helpers.arrayElement(regions);
    const city = faker.helpers.arrayElement(cities[region]);
    
    const availability: Record<string, string[]> = {};
    for (let i = 0; i < 7; i++) {
        const date = faker.date.future({ days: i });
        const dateString = date.toISOString().split('T')[0];
        availability[dateString] = generateTimeSlots(8, 22);
    }

    return {
        id: faker.string.uuid(),
        external_id: `ext_${faker.string.alphanumeric(10)}`,
        name: `${faker.company.name()} Sports Complex`,
        region,
        city,
        address: faker.location.streetAddress(),
        location: {
            lat: faker.location.latitude({ min: 30, max: 35 }),
            lng: faker.location.longitude({ min: -9, max: -2 }),
        },
        sports: faker.helpers.arrayElements(sports, { min: 1, max: 3 }),
        type: faker.helpers.arrayElement(["indoor", "outdoor"]),
        accessible: faker.datatype.boolean(),
        description: faker.lorem.paragraph(),
        photos: Array.from({ length: 3 }, (_, i) => `https://picsum.photos/seed/${faker.string.uuid()}/800/600`),
        equipments: faker.helpers.arrayElements(Array.from({ length: equipmentList.length }, (_, i) => ({
            id: faker.string.uuid(),
            name: equipmentList[i],
            quantity: faker.number.int({min: 1, max: 10})
        })), { min: 2, max: 5 }),
        availability,
        pricePerHour: faker.number.int({ min: 50, max: 300 }),
        deposit: faker.helpers.arrayElement([0, 50, 100, 200]),
    };
};

const createRandomReservation = (facilities: Facility[], users: User[]): Reservation => {
    const facility = faker.helpers.arrayElement(facilities);
    const user = faker.helpers.arrayElement(users.filter(u => u.role === 'user'));
    
    const availableDates = Object.keys(facility.availability);
    const date = faker.helpers.arrayElement(availableDates);
    const timeSlot = faker.helpers.arrayElement(facility.availability[date] || []);

    return {
        id: faker.string.uuid(),
        facilityId: facility.id,
        userId: user.id,
        date: date,
        timeSlot: timeSlot,
        status: faker.helpers.arrayElement(["confirmed", "cancelled"]),
        createdAt: faker.date.recent({ days: 10 }),
    };
};

export const users: User[] = [
    { id: 'super-admin-0', name: 'Super Admin', email: 'super@admin.com', avatarUrl: `https://i.pravatar.cc/150?u=super-admin`, role: 'super_admin' },
    ...Array.from({ length: 10 }, (_, i) => createRandomUser("admin", i)),
    ...Array.from({ length: 50 }, (_, i) => createRandomUser("user", i + 10)),
];

export const facilities: Facility[] = Array.from({ length: 20 }, createRandomFacility);

export const reservations: Reservation[] = Array.from({ length: 100 }, () => createRandomReservation(facilities, users));
