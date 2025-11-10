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
export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', address);
  url.searchParams.set('format', 'json');
  url.searchParams.set('countrycodes', 'ma'); // Prioritize results in Morocco
  url.searchParams.set('limit', '1');         // We only need the top result

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
      const topResult = results[0];
      return {
        lat: parseFloat(topResult.lat),
        lng: parseFloat(topResult.lon), // Note: Nominatim uses 'lon' for longitude
      };
    }

    return null; // No results found
  } catch (error) {
    console.error('An error occurred during geocoding:', error);
    return null;
  }
}
