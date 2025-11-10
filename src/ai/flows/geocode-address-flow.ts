'use server';
/**
 * @fileOverview A flow for geocoding an address string into coordinates.
 *
 * - geocodeAddress - A function that handles the geocoding process.
 * - GeocodeAddressInput - The input type for the geocodeAddress function.
 * - GeocodeAddressOutput - The return type for the geocodeAddress function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const GeocodeAddressInputSchema = z.object({
  address: z.string().describe('The address to geocode.'),
});
export type GeocodeAddressInput = z.infer<typeof GeocodeAddressInputSchema>;

export const GeocodeAddressOutputSchema = z.object({
  lat: z.number().describe('The latitude.'),
  lng: z.number().describe('The longitude.'),
});
export type GeocodeAddressOutput = z.infer<typeof GeocodeAddressOutputSchema>;

export async function geocodeAddress(
  input: GeocodeAddressInput
): Promise<GeocodeAddressOutput> {
  return geocodeAddressFlow(input);
}

const prompt = ai.definePrompt({
  name: 'geocodeAddressPrompt',
  input: { schema: GeocodeAddressInputSchema },
  output: { schema: GeocodeAddressOutputSchema },
  prompt: `Geocode the following address and return the latitude and longitude. The user is in Morocco, use this as a hint.

Address: {{{address}}}`,
});

const geocodeAddressFlow = ai.defineFlow(
  {
    name: 'geocodeAddressFlow',
    inputSchema: GeocodeAddressInputSchema,
    outputSchema: GeocodeAddressOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('Could not geocode address.');
    }
    return output;
  }
);
