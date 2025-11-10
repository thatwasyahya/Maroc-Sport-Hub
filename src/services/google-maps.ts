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
 * Geocodes an address using the Google Maps Geocoding API.
 * This function runs on the server to protect the API key.
 * @param input The address to geocode.
 * @returns A promise that resolves to an object with lat and lng.
 */
export async function geocodeAddressWithGoogle(
  input: GeocodeAddressInput
): Promise<GeocodeAddressOutput> {
  const { address } = input;
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    console.error('Google Maps API key is missing.');
    // Fallback to a default location if the key is not set
    return { lat: 33.5731, lng: -7.5898 }; // Default to Casablanca
  }

  const query = encodeURIComponent(address);
  // Bias results to Morocco by adding ", Morocco" to the query
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${query},+Morocco&key=${apiKey}`;

  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google Maps API returned an error: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();

    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      return {
        lat: location.lat,
        lng: location.lng,
      };
    } else if (data.status === 'ZERO_RESULTS') {
       throw new Error('No results found for the address.');
    } else {
        console.error('Geocoding error from Google Maps API:', data.status, data.error_message);
        throw new Error(`Google Maps API error: ${data.status} - ${data.error_message || 'An unknown error occurred.'}`);
    }
  } catch (error) {
    console.error('Geocoding fetch error:', error);
    // Fallback to a default location if geocoding fails
    return { lat: 33.5731, lng: -7.5898 }; // Default to Casablanca
  }
}
