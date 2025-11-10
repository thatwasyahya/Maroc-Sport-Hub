// A list of fun, cartoonish avatars for users to choose from.
// Avatars provided by https://i.pravatar.cc/
// This service provides random avatars, so we generate a list with different IDs.

const avatarBaseUrl = 'https://i.pravatar.cc/150?u=';

// Generate a list of avatar URLs with unique user IDs to get different images
export const avatars: string[] = Array.from({ length: 30 }, (_, i) => `${avatarBaseUrl}user${i + 1}`);
