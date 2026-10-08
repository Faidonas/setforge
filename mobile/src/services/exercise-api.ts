import type { Exercise } from '@/models/exercise';
import { apiJson } from '@/services/api-client';

const apiUrl = process.env.EXPO_PUBLIC_API_URL;

async function requestExerciseApi(path: string): Promise<unknown> {
  return apiJson(path);
}

export async function getExercises(): Promise<Exercise[]> {
  const exercises = await requestExerciseApi('/api/exercises');

  if (!Array.isArray(exercises)) {
    throw new Error('The exercise API returned an unexpected response.');
  }

  return exercises as Exercise[];
}

export async function getExercise(exerciseId: number): Promise<Exercise> {
  const exercise = await requestExerciseApi(`/api/exercises/${exerciseId}`);

  if (!exercise || typeof exercise !== 'object' || Array.isArray(exercise)) {
    throw new Error('The exercise API returned an unexpected response.');
  }

  return exercise as Exercise;
}

export function getExerciseAssetUrl(path: string | null): string | null {
  if (!path) {
    return null;
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  if (!apiUrl) {
    return null;
  }

  const baseUrl = apiUrl.replace(/\/$/, '');
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
}
