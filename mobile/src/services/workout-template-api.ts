import type { WorkoutTemplate } from '@/models/workout-template';

const apiUrl = process.env.EXPO_PUBLIC_API_URL;

export async function getWorkoutTemplates(ownerId: number): Promise<WorkoutTemplate[]> {
  if (!apiUrl) {
    throw new Error(
      'The API URL is not configured. Set EXPO_PUBLIC_API_URL in your Expo environment.',
    );
  }

  const baseUrl = apiUrl.replace(/\/$/, '');
  let response: Response;

  try {
    response = await fetch(
      `${baseUrl}/api/workout-templates?ownerId=${encodeURIComponent(ownerId)}`,
    );
  } catch {
    throw new Error('Could not connect to the workout template API. Check your network and API URL.');
  }

  if (!response.ok) {
    const responseDetails = await response.text().catch(() => '');
    const details = responseDetails ? `: ${responseDetails}` : '';

    throw new Error(
      `The workout template API returned ${response.status} ${response.statusText}${details}`.trim(),
    );
  }

  const templates: unknown = await response.json();

  if (!Array.isArray(templates)) {
    throw new Error('The workout template API returned an unexpected response.');
  }

  return templates as WorkoutTemplate[];
}
