'use server';
/**
 * @fileOverview A service for geocoding an address string into coordinates using the Nominatim API.
 *
 * - geocodeAddress - A function that handles the geocoding process.
 */

import { z } from 'zod';

export const GeocodeAddressInputSchema = z.object({
  address: z.string().describe('The address to geocode.'),
});
export type GeocodeAddressInput = z.infer<typeof GeocodeAddressInputSchema>;

export const GeocodeAddressOutputSchema = z.object({
  lat: z.number().describe('The latitude.'),
  lng: z.number().describe('The longitude.'),
});
export type GeocodeAddressOutput = z.infer<typeof GeocodeAddressOutputSchema>;

/**
 * Geocodes an address using the free Nominatim (OpenStreetMap) API.
 * @param input The address to geocode.
 * @returns A promise that resolves to an object with lat and lng.
 */
export async function geocodeAddress(
  input: GeocodeAddressInput
): Promise<GeocodeAddressOutput> {
  const { address } = input;
  const query = encodeURIComponent(address);
  // Using viewbox to bias results towards Morocco
  const viewbox = '-17.2,35.9,-1.0,27.7'; 
  const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&viewbox=${viewbox}&bounded=1`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'MarocSportHub/1.0 (marocsport@hub.com)', // Nominatim requires a User-Agent
      },
    });
    
    if (!response.ok) {
      throw new Error(`Nominatim API returned an error: ${response.statusText}`);
    }

    const data = await response.json();

    if (data && data.length > 0) {
      const { lat, lon } = data[0]; // Correctly read 'lon' from the API response
      return {
        lat: parseFloat(lat),
        lng: parseFloat(lon), // Assign 'lon' to 'lng'
      };
    } else {
      throw new Error('No results found for the address.');
    }
  } catch (error) {
    console.error('Geocoding error:', error);
    // Fallback to a default location if geocoding fails
    return { lat: 33.5731, lng: -7.5898 }; // Default to Casablanca
  }
}
