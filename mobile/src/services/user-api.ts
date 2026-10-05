import type { UserProfile } from '@/models/user';

const apiUrl = process.env.EXPO_PUBLIC_API_URL;

export async function getUserProfile(userId: number): Promise<UserProfile> {
  if (!apiUrl) {
    throw new Error(
      'The API URL is not configured. Set EXPO_PUBLIC_API_URL in your Expo environment.',
    );
  }

  let response: Response;
  try {
    response = await fetch(`${apiUrl.replace(/\/$/, '')}/api/users/${userId}`);
  } catch {
    throw new Error('Could not connect to the profile API. Check your network and API URL.');
  }

  if (!response.ok) {
    const responseDetails = await response.text().catch(() => '');
    const details = responseDetails ? `: ${responseDetails}` : '';
    throw new Error(
      `The profile API returned ${response.status} ${response.statusText}${details}`.trim(),
    );
  }

  const profile: unknown = await response.json();
  if (!profile || typeof profile !== 'object' || Array.isArray(profile)) {
    throw new Error('The profile API returned an unexpected response.');
  }

  return profile as UserProfile;
}
