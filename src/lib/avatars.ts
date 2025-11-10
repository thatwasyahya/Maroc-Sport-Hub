// A list of fun, cartoonish avatars for users to choose from.
// Avatars provided by https://avatar.iran.liara.run/

const avatarBaseUrl = 'https://avatar.iran.liara.run/public';

// Generate a list of avatar URLs
export const avatars: string[] = Array.from({ length: 30 }, (_, i) => `${avatarBaseUrl}/${i + 1}`);