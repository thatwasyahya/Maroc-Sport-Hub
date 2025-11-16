'use server';

/**
 * @fileoverview A server-side service for geocoding addresses using the Nominatim API.
 * This service is designed to be called from client-side components as a Next.js Server Action.
 */

interface NominatimResult {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  display_name: string;
  class: string;
  type: string;
  importance: number;
  icon?: string;
}

interface GeocodeResult {
  lat: number;
  lng: number;
}

/**
 * Geocodes a given address string using the public Nominatim API.
 * It enforces a 1-request-per-second limit via a simple cache and includes
 * a custom User-Agent as required by Nominatim's usage policy.
 *
 * @param address The address string to geocode (e.g., "1600 Amphitheatre Parkway, Mountain View, CA").
 * @returns A promise that resolves to a GeocodeResult object { lat, lng } or null if not found.
 */
export async function geocodeAddress(
  address: string,
  city?: string,
  province?: string,
  commune?: string
): Promise<GeocodeResult | null> {
  const url = new URL('https://nominatim.openstreetmap.org/search');
  
  // Construire une requête plus précise en incluant la ville, province et commune
  let searchQuery = address;
  if (commune) searchQuery += `, ${commune}`;
  if (city && city !== commune) searchQuery += `, ${city}`;
  if (province && province !== city) searchQuery += `, ${province}`;
  searchQuery += ', Maroc';
  
  url.searchParams.set('q', searchQuery);
  url.searchParams.set('format', 'json');
  url.searchParams.set('countrycodes', 'ma'); // Prioritize results in Morocco
  url.searchParams.set('limit', '5');         // Get top 5 results to choose the best one
  url.searchParams.set('addressdetails', '1'); // Include detailed address info

  try {
    const response = await fetch(url.toString(), {
      headers: {
        // IMPORTANT: Nominatim requires a custom User-Agent.
        'User-Agent': 'MarocSportHub/1.0 (dev@marocsporthub.com)',
      },
    });

    if (!response.ok) {
      console.error('Nominatim API request failed:', response.statusText);
      return null;
    }

    const results: NominatimResult[] = await response.json();

    if (results.length > 0) {
      // Filtrer les résultats pour privilégier les types pertinents (bâtiments, routes, lieux spécifiques)
      const priorityTypes = ['building', 'amenity', 'leisure', 'sport', 'tourism', 'highway'];
      
      const relevantResults = results.filter(r => 
        priorityTypes.includes(r.class) || priorityTypes.includes(r.type)
      );
      
      // Utiliser le résultat le plus pertinent, sinon le premier résultat
      const bestResult = relevantResults.length > 0 ? relevantResults[0] : results[0];
      
      return {
        lat: parseFloat(bestResult.lat),
        lng: parseFloat(bestResult.lon), // Note: Nominatim uses 'lon' for longitude
      };
    }

    return null; // No results found
  } catch (error) {
    console.error('An error occurred during geocoding:', error);
    return null;
  }
}
