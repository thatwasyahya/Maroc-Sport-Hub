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
 * Geocodes an address using the OpenCage Geocoding API.
 * This function runs on the server to protect the API key.
 * @param input The address to geocode.
 * @returns A promise that resolves to an object with lat and lng.
 */
export async function geocodeAddressWithOpenCage(
  input: GeocodeAddressInput
): Promise<GeocodeAddressOutput> {
  const { address } = input;
  const apiKey = process.env.OPENCAGE_API_KEY;

  if (!apiKey) {
    console.error('OpenCage API key is missing.');
    // Fallback to a default location if the key is not set
    return { lat: 33.5731, lng: -7.5898 }; // Default to Casablanca
  }

  const query = encodeURIComponent(address);
  // Bias results to Morocco using the countrycode parameter
  const url = `https://api.opencagedata.com/geocode/v1/json?q=${query}&key=${apiKey}&countrycode=MA&limit=1`;

  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenCage API returned an error: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();

    if (data.status.code === 200 && data.results && data.results.length > 0) {
      const location = data.results[0].geometry;
      return {
        lat: location.lat,
        lng: location.lng,
      };
    } else if (data.results.length === 0) {
       throw new Error('No results found for the address.');
    } else {
        console.error('Geocoding error from OpenCage API:', data.status.message);
        throw new Error(`OpenCage API error: ${data.status.message}`);
    }
  } catch (error) {
    console.error('Geocoding fetch error:', error);
    // Fallback to a default location if geocoding fails
    return { lat: 33.5731, lng: -7.5898 }; // Default to Casablanca
  }
}
