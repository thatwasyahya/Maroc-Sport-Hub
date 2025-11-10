// A list of fun, cartoonish avatars for users to choose from.
// Avatars provided by https://avatar.iran.liara.run/
// This service provides a variety of nice cartoon avatars.

const avatarBaseUrl = 'https://avatar.iran.liara.run/public/';

// Generate a list of avatar URLs with unique IDs to get different images
export const avatars: string[] = Array.from({ length: 30 }, (_, i) => `${avatarBaseUrl}${i + 1}`);
