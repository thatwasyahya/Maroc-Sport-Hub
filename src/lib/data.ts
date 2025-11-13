import { faker } from "@faker-js/faker";
import type { Facility, User, UserRole, EquipmentItem, EstablishmentState, BuildingState, EquipmentState } from "./types";
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
    const hasLocation = faker.datatype.boolean(0.8); // 80% chance of having coordinates

    return {
        id: faker.string.uuid(),
        adminId: faker.string.uuid(),
        
        name: `Complexe Sportif ${faker.location.city()}`,
        description: faker.lorem.paragraph(),
        sports: faker.helpers.arrayElements(sports, { min: 1, max: 4 }),
        equipments: generateRandomEquipments(),

        // Location Info
        region: region.name,
        province: faker.helpers.arrayElement(['Province A', 'Province B', 'Province C']),
        commune: faker.helpers.arrayElement(['Commune X', 'Commune Y', 'Commune Z']),
        address: faker.location.streetAddress(),
        milieu: faker.helpers.arrayElement(['Urbain', 'Rural']),
        location: hasLocation ? {
            lat: faker.location.latitude({ min: 30, max: 35 }),
            lng: faker.location.longitude({ min: -9, max: -2 }),
        } : undefined,

        // Technical & State Info
        installations_sportives: faker.helpers.arrayElement(['Stade', 'Salle Omnisport', 'Piscine', 'Terrain de Proximité']),
        categorie_abregee: faker.helpers.arrayElement(['GS', 'SO', 'PO', 'TP']),
        ownership: faker.helpers.arrayElement(['Public', 'Privé', 'Associatif']),
        managing_entity: faker.helpers.arrayElement(['Commune', 'Ministère', 'Fédération Royale', 'Club Privé']),
        last_renovation_date: faker.date.past({ years: 10 }),
        surface_area: faker.number.int({ min: 500, max: 10000 }),
        capacity: faker.number.int({ min: 100, max: 5000 }),
        establishment_state: faker.helpers.arrayElement<EstablishmentState>(['Opérationnel', 'En arrêt', 'En cours de construction', 'Prêt']),
        developed_space: faker.datatype.boolean(),
        titre_foncier_numero: `TF/${faker.number.int({ min: 1000, max: 9999 })}`,
        building_state: faker.helpers.arrayElement<BuildingState>(['Bon', 'Moyen', 'Mauvais']),
        equipment_state: faker.helpers.arrayElement<EquipmentState>(['Bon', 'Moyen', 'Non équipé']),

        // HR & Needs
        staff_count: faker.number.int({ min: 2, max: 50 }),
        sports_staff_count: faker.number.int({ min: 1, max: 20 }),
        beneficiaries: faker.number.int({ min: 50, max: 2000 }),
        hr_needs: faker.datatype.boolean(),
        besoin_amenagement: faker.datatype.boolean(),
        besoin_equipements: faker.datatype.boolean(),
        rehabilitation_plan: `Programme ${faker.number.int({ min: 2024, max: 2028 })}`,

        // Miscellaneous
        observations: faker.lorem.sentence(),
        type: faker.helpers.arrayElement(["indoor", "outdoor"]),
        accessible: faker.datatype.boolean(),
        city: city, // keep for compatibility if needed
    };
};

export const users: User[] = [
    { id: 'super-admin-0', name: 'Super Admin', firstName: 'Super', lastName: 'Admin', email: 'super@admin.com', avatarUrl: `https://avatar.iran.liara.run/public/super-admin`, role: 'super_admin', createdAt: new Date(), updatedAt: new Date() },
    ...Array.from({ length: 10 }, (_, i) => createRandomUser("admin", i)),
    ...Array.from({ length: 50 }, (_, i) => createRandomUser("user", i + 10)),
];

export const facilities: Facility[] = Array.from({ length: 150 }, () => createRandomFacility());
