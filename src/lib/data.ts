import { faker } from "@faker-js/faker";
import type { Facility, User, UserRole, EquipmentItem } from "./types";
import { regions, cities } from "./maroc-api";

const createRandomUser = (role: UserRole, id: number): User => ({
  id: faker.string.uuid(),
  name: faker.person.fullName(),
  firstName: faker.person.firstName(),
  lastName: faker.person.lastName(),
  email: faker.internet.email(),
  avatarUrl: `https://avatar.iran.liara.run/public/${id}`,
  role,
  createdAt: faker.date.recent(),
  updatedAt: faker.date.recent(),
});

export const sports = [
    "Aérobic", "Aïkido", "Athlétisme", "Aviron", "Badminton", "Baseball", "Basketball", 
    "Biathlon", "Billard", "BMX", "Bobsleigh", "Boxe", "Canoë-kayak", "Canyonisme", 
    "Capoeira", "Cheerleading", "Course d'orientation", "Cricket", "CrossFit", "Curling", 
    "Cyclisme", "Danse", "Deltaplane", "Équitation", "Escalade", "Escrime", "Football", 
    "Football américain", "Futsal", "Golf", "Gymnastique", "Haltérophilie", "Handball", 
    "Hockey sur gazon", "Hockey sur glace", "Jiu-jitsu", "Judo", "Karaté", "Kendo", 
    "Kitesurf", "Kung-fu", "Luge", "Lutte", "MMA (Arts martiaux mixtes)", "Motocross", 
    "Musculation", "Natation", "Natation synchronisée", "Padel", "Parachutisme", "Parkour", 
    "Patinage artistique", "Patinage de vitesse", "Pêche sportive", "Pentathlon moderne", 
    "Pétanque", "Plongée", "Racquetball", "Randonnée", "Rafting", "Roller", "Rugby", 
    "Skateboard", "Ski", "Snowboard", "Softball", "Spéléologie", "Squash", "Sumo", 
    "Surf", "Taekwondo", "Tennis", "Tennis de table", "Tir à l'arc", "Triathlon", 
    "Voile", "Volleyball", "VTT (Vélo tout terrain)", "Water-polo", "Yoga"
].sort();

export const equipmentList = [
    "Haltères", "Tapis de course", "Vélos elliptiques", "Balles de yoga", "Filets de volley-ball", 
    "Paniers de basket", "Buts de football", "Raquettes de tennis", "Kettlebells", "Cages à squat",
    "Bancs de musculation", "Cordes à sauter", "Sacs de frappe"
].sort();

const generateRandomEquipments = (): EquipmentItem[] => {
    const selectedEquipments = faker.helpers.arrayElements(equipmentList, { min: 2, max: 5 });
    return selectedEquipments.map(name => ({
        name,
        quantity: faker.helpers.arrayElement(['X', ...Array.from({ length: 10 }, (_, i) => String(i + 1))])
    }));
};

const createRandomFacility = (): Facility => {
    const region = faker.helpers.arrayElement(regions);
    const city = faker.helpers.arrayElement(cities[region.name] || []);
    
    return {
        id: faker.string.uuid(),
        adminId: faker.string.uuid(),
        external_id: `ext_${faker.string.alphanumeric(10)}`,
        name: `${faker.company.name()} Sports Complex`,
        region: region.name,
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
        equipments: generateRandomEquipments(),
    };
};

export const users: User[] = [
    { id: 'super-admin-0', name: 'Super Admin', firstName: 'Super', lastName: 'Admin', email: 'super@admin.com', avatarUrl: `https://avatar.iran.liara.run/public/super-admin`, role: 'super_admin', createdAt: new Date(), updatedAt: new Date() },
    ...Array.from({ length: 10 }, (_, i) => createRandomUser("admin", i)),
    ...Array.from({ length: 50 }, (_, i) => createRandomUser("user", i + 10)),
];

export const facilities: Facility[] = Array.from({ length: 20 }, () => createRandomFacility());
