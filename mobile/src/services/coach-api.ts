import type {
  AdminCoachingRelationship,
  CoachClientDetail,
  CoachClientSummary,
  CoachDashboard,
  CoachWorkoutTemplate,
} from '@/models/coach';
import type { UserProfile } from '@/models/user';
import type { CreateWorkoutTemplateRequest, WorkoutTemplate } from '@/models/workout-template';
import { apiJson } from '@/services/api-client';

function asObject<T>(value: unknown, label: string): T {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`SetForge returned an unexpected ${label} response.`);
  }
  return value as T;
}

export async function getCoachDashboard(): Promise<CoachDashboard> {
  return asObject<CoachDashboard>(await apiJson('/api/coach/dashboard'), 'coach dashboard');
}

export async function getCoachClients(): Promise<CoachClientSummary[]> {
  const value = await apiJson('/api/coach/clients');
  if (!Array.isArray(value)) throw new Error('SetForge returned an unexpected client list.');
  return value as CoachClientSummary[];
}

export async function getCoachClient(clientId: number): Promise<CoachClientDetail> {
  return asObject<CoachClientDetail>(await apiJson(`/api/coach/clients/${clientId}`), 'client');
}

export async function getCoachTemplates(): Promise<CoachWorkoutTemplate[]> {
  const value = await apiJson('/api/coach/templates');
  if (!Array.isArray(value)) throw new Error('SetForge returned an unexpected coach template list.');
  return value as CoachWorkoutTemplate[];
}

export async function createCoachWorkoutTemplate(
  template: CreateWorkoutTemplateRequest,
): Promise<WorkoutTemplate> {
  return asObject<WorkoutTemplate>(
    await apiJson('/api/coach/templates', {
      method: 'POST',
      body: JSON.stringify(template),
    }),
    'workout template',
  );
}

export async function assignCoachWorkoutTemplate(templateId: number, userId: number) {
  await apiJson(`/api/coach/templates/${templateId}/assignments/${userId}`, { method: 'POST' });
}

export async function unassignCoachWorkoutTemplate(templateId: number, userId: number) {
  await apiJson(`/api/coach/templates/${templateId}/assignments/${userId}`, { method: 'DELETE' });
}

export async function createCoachUser(input: {
  displayName: string;
  email: string;
  temporaryPassword: string;
}): Promise<{ coach: UserProfile; supabaseUserCreated: boolean }> {
  return asObject<{ coach: UserProfile; supabaseUserCreated: boolean }>(
    await apiJson('/api/admin/users/coaches', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
    'coach user',
  );
}

export async function getAdminAssignableCoaches(): Promise<UserProfile[]> {
  const value = await apiJson('/api/admin/coaching-relationships/coaches');
  if (!Array.isArray(value)) throw new Error('SetForge returned an unexpected coach list.');
  return value as UserProfile[];
}

export async function assignClientToCoach(input: {
  clientEmail: string;
  coachId: number;
}): Promise<AdminCoachingRelationship> {
  return asObject<AdminCoachingRelationship>(
    await apiJson('/api/admin/coaching-relationships', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
    'coaching relationship',
  );
}
