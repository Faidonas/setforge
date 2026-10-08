import type { CreateWorkoutTemplateRequest, UpdateWorkoutTemplateRequest, WorkoutTemplate } from '@/models/workout-template';
import { apiFetch, apiJson } from '@/services/api-client';

function asTemplate(value: unknown): WorkoutTemplate {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('SetForge returned an unexpected template response.');
  return value as WorkoutTemplate;
}

export async function getWorkoutTemplate(templateId: number) { return asTemplate(await apiJson(`/api/workout-templates/${templateId}`)); }
export async function getWorkoutTemplates(): Promise<WorkoutTemplate[]> { const value = await apiJson('/api/workout-templates'); if (!Array.isArray(value)) throw new Error('SetForge returned an unexpected template list.'); return value as WorkoutTemplate[]; }
export async function createWorkoutTemplate(template: CreateWorkoutTemplateRequest) { return asTemplate(await apiJson('/api/workout-templates', { method: 'POST', body: JSON.stringify(template) })); }
export async function updateWorkoutTemplate(templateId: number, template: UpdateWorkoutTemplateRequest) { return asTemplate(await apiJson(`/api/workout-templates/${templateId}`, { method: 'PUT', body: JSON.stringify(template) })); }
export async function deleteWorkoutTemplate(templateId: number) { const response = await apiFetch(`/api/workout-templates/${templateId}`, { method: 'DELETE' }); if (!response.ok) throw new Error(`Could not delete template (${response.status}).`); }
export async function reorderWorkoutTemplates(templateIds: number[]) { await apiJson('/api/workout-templates/order', { method: 'PUT', body: JSON.stringify({ templateIds }) }); }
