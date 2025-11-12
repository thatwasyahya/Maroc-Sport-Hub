'use server';

/**
 * @fileoverview Server Action to proxy file conversion requests to an external API.
 * This is necessary to avoid CORS issues when calling the conversion API from the client.
 */

export async function convertFile(formData: FormData): Promise<any> {
    try {
        const response = await fetch('https://api2.docconversion.online/v1/convert/xls-to-json', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error('Conversion API Error:', errorBody);
            throw new Error(`Erreur du service de conversion: ${response.statusText}`);
        }

        const jsonResult = await response.json();
        return jsonResult;

    } catch (err: any) {
        console.error('Server Action convertFile error:', err);
        throw new Error(err.message || 'An unexpected error occurred during file conversion.');
    }
}
