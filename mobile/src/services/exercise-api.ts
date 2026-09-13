import type { Exercise } from '@/models/exercise';

const apiUrl = process.env.EXPO_PUBLIC_API_URL;

export async function getExercises(): Promise<Exercise[]> {
  if (!apiUrl) {
    throw new Error(
      'The API URL is not configured. Set EXPO_PUBLIC_API_URL in your Expo environment.',
    );
  }

  const baseUrl = apiUrl.replace(/\/$/, '');

  let response: Response;

  try {
    response = await fetch(`${baseUrl}/api/exercises`);
  } catch {
    throw new Error('Could not connect to the exercise API. Check the API URL and your network.');
  }

  if (!response.ok) {
    const responseDetails = await response.text().catch(() => '');
    const details = responseDetails ? `: ${responseDetails}` : '';

    throw new Error(
      `The exercise API returned ${response.status} ${response.statusText}${details}`.trim(),
    );
  }

  const exercises: unknown = await response.json();

  if (!Array.isArray(exercises)) {
    throw new Error('The exercise API returned an unexpected response.');
  }

  return exercises as Exercise[];
}
