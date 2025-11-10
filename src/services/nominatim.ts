'use server';

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
 * Geocodes an address using the Nominatim (OpenStreetMap) API.
 * This function runs on the server.
 * @param input The address to geocode.
 * @returns A promise that resolves to an object with lat and lng.
 */
export async function geocodeAddressWithNominatim(
  input: GeocodeAddressInput
): Promise<GeocodeAddressOutput> {
  const { address } = input;
  const query = encodeURIComponent(address);
  
  // Construct the URL with parameters to improve result accuracy for Morocco
  const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&addressdetails=1&limit=1&countrycodes=ma`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'MarocSportHub/1.0 (contact@marocsporthub.com)' // Nominatim requires a User-Agent
      }
    });

    if (!response.ok) {
      throw new Error(`Nominatim API returned an error: ${response.statusText}`);
    }

    const data = await response.json();

    if (data && data.length > 0) {
      const location = data[0];
      const result: GeocodeAddressOutput = {
        lat: parseFloat(location.lat),
        lng: parseFloat(location.lon), // Nominatim uses 'lon' for longitude
      };
      return result;
    } else {
      console.warn(`No results found for the address: ${address}`);
      // Return default coordinates (Casablanca) if no results found
      return { lat: 33.5731, lng: -7.5898 };
    }
  } catch (error) {
    console.error('Geocoding fetch error:', error);
    // Return default coordinates on any error
    return { lat: 33.5731, lng: -7.5898 };
  }
}
