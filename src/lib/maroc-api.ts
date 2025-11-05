// This is a simulated API module.
// In a real-world application, you would replace these functions with
// actual API calls (e.g., using `fetch`) to an external service.

export const regions = [
    { name: "Tanger-Tétouan-Al Hoceïma" },
    { name: "L'Oriental" },
    { name: "Fès-Meknès" },
    { name: "Rabat-Salé-Kénitra" },
    { name: "Béni Mellal-Khénifra" },
    { name: "Casablanca-Settat" },
    { name: "Marrakech-Safi" },
    { name: "Drâa-Tafilalet" },
    { name: "Souss-Massa" },
    { name: "Guelmim-Oued Noun" },
    { name: "Laâyoune-Sakia El Hamra" },
    { name: "Dakhla-Oued Ed-Dahab" }
];

export const cities: Record<string, string[]> = {
    "Tanger-Tétouan-Al Hoceïma": ["Tanger", "Tétouan", "Al Hoceïma", "Chefchaouen", "Larache"],
    "L'Oriental": ["Oujda", "Nador", "Berkane", "Saidia"],
    "Fès-Meknès": ["Fès", "Meknès", "Ifrane", "Taza"],
    "Rabat-Salé-Kénitra": ["Rabat", "Salé", "Kénitra", "Skhirat"],
    "Béni Mellal-Khénifra": ["Béni Mellal", "Khénifra", "Azilal"],
    "Casablanca-Settat": ["Casablanca", "Settat", "Mohammedia", "El Jadida"],
    "Marrakech-Safi": ["Marrakech", "Safi", "Essaouira", "Béni Guerir"],
    "Drâa-Tafilalet": ["Errachidia", "Ouarzazate", "Tinghir"],
    "Souss-Massa": ["Agadir", "Inezgane", "Aït Melloul", "Taroudant"],
    "Guelmim-Oued Noun": ["Guelmim", "Sidi Ifni", "Tan-Tan"],
    "Laâyoune-Sakia El Hamra": ["Laâyoune", "Boujdour", "Tarfaya"],
    "Dakhla-Oued Ed-Dahab": ["Dakhla", "Aousserd"]
};

/**
 * Simulates fetching all regions.
 * @returns A promise that resolves to an array of region objects.
 */
export function getRegions(): { name: string }[] {
    return regions;
}

/**
 * Simulates fetching cities for a given region.
 * @param regionName The name of the region.
 * @returns A promise that resolves to an array of city names.
 */
export function getCities(regionName: string): string[] {
    return cities[regionName] || [];
}
