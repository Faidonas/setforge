import type {
  CompleteWorkoutSessionRequest,
  PreviousExercisePerformance,
  StartWorkoutSessionRequest,
  UpdateWorkoutSessionRequest,
  WorkoutSession,
} from '@/models/workout-session';

const apiUrl = process.env.EXPO_PUBLIC_API_URL;

function getBaseUrl() {
  if (!apiUrl) {
    throw new Error(
      'The API URL is not configured. Set EXPO_PUBLIC_API_URL in your Expo environment.',
    );
  }
  return apiUrl.replace(/\/$/, '');
}

async function requestWorkoutSession(path: string, options?: RequestInit): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(`${getBaseUrl()}${path}`, options);
  } catch {
    throw new Error('Could not connect to the workout API. Check your network and API URL.');
  }

  if (!response.ok) {
    const responseDetails = await response.text().catch(() => '');
    const details = responseDetails ? `: ${responseDetails}` : '';
    throw new Error(
      `The workout API returned ${response.status} ${response.statusText}${details}`.trim(),
    );
  }
  return response.json();
}

async function requestOptionalWorkoutSession(path: string): Promise<unknown | null> {
  let response: Response;
  try {
    response = await fetch(`${getBaseUrl()}${path}`);
  } catch {
    throw new Error('Could not connect to the workout API. Check your network and API URL.');
  }
  if (response.status === 204) return null;
  if (!response.ok) {
    const responseDetails = await response.text().catch(() => '');
    const details = responseDetails ? `: ${responseDetails}` : '';
    throw new Error(
      `The workout API returned ${response.status} ${response.statusText}${details}`.trim(),
    );
  }
  return response.json();
}

function asWorkoutSession(value: unknown): WorkoutSession {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('The workout API returned an unexpected response.');
  }
  return value as WorkoutSession;
}

export async function startWorkoutSession(
  request: StartWorkoutSessionRequest,
): Promise<WorkoutSession> {
  return asWorkoutSession(
    await requestWorkoutSession('/api/workout-sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    }),
  );
}

export async function getWorkoutSession(sessionId: number): Promise<WorkoutSession> {
  return asWorkoutSession(await requestWorkoutSession(`/api/workout-sessions/${sessionId}`));
}

export async function getActiveWorkoutSession(userId: number): Promise<WorkoutSession | null> {
  const value = await requestOptionalWorkoutSession(
    `/api/workout-sessions/active?userId=${encodeURIComponent(userId)}`,
  );
  return value === null ? null : asWorkoutSession(value);
}

export async function completeWorkoutSession(
  sessionId: number,
  request: CompleteWorkoutSessionRequest,
): Promise<WorkoutSession> {
  return asWorkoutSession(
    await requestWorkoutSession(`/api/workout-sessions/${sessionId}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    }),
  );
}

export async function cancelWorkoutSession(sessionId: number): Promise<void> {
  let response: Response;
  try {
    response = await fetch(`${getBaseUrl()}/api/workout-sessions/${sessionId}/cancel`, {
      method: 'POST',
    });
  } catch {
    throw new Error('Could not connect to the workout API. Check your network and API URL.');
  }
  if (response.status === 404) return;
  if (!response.ok) {
    const details = await response.text().catch(() => '');
    throw new Error(
      `The workout API returned ${response.status} ${response.statusText}${details ? `: ${details}` : ''}`.trim(),
    );
  }
}

export async function getWorkoutHistory(userId: number): Promise<WorkoutSession[]> {
  const value = await requestWorkoutSession(
    `/api/workout-sessions?userId=${encodeURIComponent(userId)}`,
  );
  if (!Array.isArray(value)) {
    throw new Error('The workout API returned an unexpected history response.');
  }
  return value as WorkoutSession[];
}

export async function getPreviousExercisePerformances(
  userId: number,
  exerciseIds: number[],
): Promise<PreviousExercisePerformance[]> {
  if (exerciseIds.length === 0) return [];
  const value = await requestWorkoutSession(
    `/api/workout-sessions/previous-performances?userId=${encodeURIComponent(userId)}&exerciseIds=${encodeURIComponent(exerciseIds.join(','))}`,
  );
  if (!Array.isArray(value)) {
    throw new Error('The workout API returned an unexpected previous-performance response.');
  }
  return value as PreviousExercisePerformance[];
}

export async function updateWorkoutSession(
  sessionId: number,
  request: UpdateWorkoutSessionRequest,
): Promise<WorkoutSession> {
  return asWorkoutSession(
    await requestWorkoutSession(`/api/workout-sessions/${sessionId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    }),
  );
}

export async function deleteWorkoutSession(sessionId: number): Promise<void> {
  let response: Response;
  try {
    response = await fetch(`${getBaseUrl()}/api/workout-sessions/${sessionId}`, {
      method: 'DELETE',
    });
  } catch {
    throw new Error('Could not connect to the workout API. Check your network and API URL.');
  }
  if (!response.ok) {
    const details = await response.text().catch(() => '');
    throw new Error(
      `The workout API returned ${response.status} ${response.statusText}${details ? `: ${details}` : ''}`.trim(),
    );
  }
}
