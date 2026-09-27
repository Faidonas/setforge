import type {
  CreateWorkoutTemplateRequest,
  UpdateWorkoutTemplateRequest,
  WorkoutTemplate,
} from '@/models/workout-template';

const apiUrl = process.env.EXPO_PUBLIC_API_URL;

export async function getWorkoutTemplate(templateId: number): Promise<WorkoutTemplate> {
  if (!apiUrl) {
    throw new Error(
      'The API URL is not configured. Set EXPO_PUBLIC_API_URL in your Expo environment.',
    );
  }

  const baseUrl = apiUrl.replace(/\/$/, '');
  let response: Response;

  try {
    response = await fetch(`${baseUrl}/api/workout-templates/${templateId}`);
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

  const template: unknown = await response.json();

  if (!template || typeof template !== 'object' || Array.isArray(template)) {
    throw new Error('The workout template API returned an unexpected response.');
  }

  return template as WorkoutTemplate;
}

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

export async function createWorkoutTemplate(
  template: CreateWorkoutTemplateRequest,
): Promise<WorkoutTemplate> {
  if (!apiUrl) {
    throw new Error(
      'The API URL is not configured. Set EXPO_PUBLIC_API_URL in your Expo environment.',
    );
  }

  const baseUrl = apiUrl.replace(/\/$/, '');
  let response: Response;

  try {
    response = await fetch(`${baseUrl}/api/workout-templates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(template),
    });
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

  const createdTemplate: unknown = await response.json();

  if (!createdTemplate || typeof createdTemplate !== 'object' || Array.isArray(createdTemplate)) {
    throw new Error('The workout template API returned an unexpected response.');
  }

  return createdTemplate as WorkoutTemplate;
}

export async function updateWorkoutTemplate(
  templateId: number,
  template: UpdateWorkoutTemplateRequest,
): Promise<WorkoutTemplate> {
  if (!apiUrl) {
    throw new Error(
      'The API URL is not configured. Set EXPO_PUBLIC_API_URL in your Expo environment.',
    );
  }

  const baseUrl = apiUrl.replace(/\/$/, '');
  let response: Response;

  try {
    response = await fetch(`${baseUrl}/api/workout-templates/${templateId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(template),
    });
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

  const updatedTemplate: unknown = await response.json();

  if (!updatedTemplate || typeof updatedTemplate !== 'object' || Array.isArray(updatedTemplate)) {
    throw new Error('The workout template API returned an unexpected response.');
  }

  return updatedTemplate as WorkoutTemplate;
}

export async function deleteWorkoutTemplate(templateId: number): Promise<void> {
  if (!apiUrl) {
    throw new Error(
      'The API URL is not configured. Set EXPO_PUBLIC_API_URL in your Expo environment.',
    );
  }

  const baseUrl = apiUrl.replace(/\/$/, '');
  let response: Response;

  try {
    response = await fetch(`${baseUrl}/api/workout-templates/${templateId}`, {
      method: 'DELETE',
    });
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
}
