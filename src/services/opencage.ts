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

// In-memory cache to store geocoded results
const geocodeCache = new Map<string, GeocodeAddressOutput>();

/**
 * Geocodes an address using the OpenCage Geocoding API with in-memory caching.
 * This function runs on the server to protect the API key.
 * @param input The address to geocode.
 * @returns A promise that resolves to an object with lat and lng.
 */
export async function geocodeAddressWithOpenCage(
  input: GeocodeAddressInput
): Promise<GeocodeAddressOutput> {
  const { address } = input;
  const normalizedAddress = address.trim().toLowerCase();

  // 1. Check if the result is in the cache
  if (geocodeCache.has(normalizedAddress)) {
    console.log(`[Cache HIT] for address: ${normalizedAddress}`);
    return geocodeCache.get(normalizedAddress)!;
  }
  
  console.log(`[Cache MISS] for address: ${normalizedAddress}. Calling API.`);

  const apiKey = process.env.OPENCAGE_API_KEY;

  if (!apiKey) {
    console.error('OpenCage API key is missing.');
    return { lat: 33.5731, lng: -7.5898 }; // Default to Casablanca
  }

  const query = encodeURIComponent(address);
  const url = `https://api.opencagedata.com/geocode/v1/json?q=${query}&key=${apiKey}&countrycode=MA&limit=5`;

  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenCage API returned an error: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();

    if (data.status.code === 200 && data.results && data.results.length > 0) {
      // Find the best result based on confidence
      let bestResult = data.results[0];
      for (const result of data.results) {
        if (result.confidence === 10) { // 10 is the highest confidence
          bestResult = result;
          break; // Found the best possible match
        }
        if (result.confidence > bestResult.confidence) {
          bestResult = result;
        }
      }

      const location = bestResult.geometry;
      const result: GeocodeAddressOutput = {
        lat: location.lat,
        lng: location.lng,
      };

      // Store the successful result in the cache
      geocodeCache.set(normalizedAddress, result);

      return result;
    } else if (data.results.length === 0) {
       throw new Error('No results found for the address.');
    } else {
        console.error('Geocoding error from OpenCage API:', data.status.message);
        throw new Error(`OpenCage API error: ${data.status.message}`);
    }
  } catch (error) {
    console.error('Geocoding fetch error:', error);
    return { lat: 33.5731, lng: -7.5898 }; // Default to Casablanca on error
  }
}
