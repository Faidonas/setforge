import type { CompleteWorkoutSessionRequest, PreviousExercisePerformance, StartWorkoutSessionRequest, UpdateWorkoutSessionRequest, WorkoutSession } from '@/models/workout-session';
import { apiFetch, apiJson } from '@/services/api-client';

function asSession(value: unknown): WorkoutSession { if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('SetForge returned an unexpected workout response.'); return value as WorkoutSession; }
export async function startWorkoutSession(request: StartWorkoutSessionRequest) { return asSession(await apiJson('/api/workout-sessions', { method: 'POST', body: JSON.stringify(request) })); }
export async function getWorkoutSession(id: number) { return asSession(await apiJson(`/api/workout-sessions/${id}`)); }
export async function getActiveWorkoutSession() { const value = await apiJson('/api/workout-sessions/active'); return value === null ? null : asSession(value); }
export async function completeWorkoutSession(id: number, request: CompleteWorkoutSessionRequest) { return asSession(await apiJson(`/api/workout-sessions/${id}/complete`, { method: 'POST', body: JSON.stringify(request) })); }
export async function cancelWorkoutSession(id: number) { const response = await apiFetch(`/api/workout-sessions/${id}/cancel`, { method: 'POST' }); if (!response.ok && response.status !== 404) throw new Error(`Could not cancel workout (${response.status}).`); }
export async function getWorkoutHistory(): Promise<WorkoutSession[]> { const value = await apiJson('/api/workout-sessions'); if (!Array.isArray(value)) throw new Error('SetForge returned an unexpected workout history.'); return value as WorkoutSession[]; }
export async function getPreviousExercisePerformances(exerciseIds: number[]): Promise<PreviousExercisePerformance[]> { if (!exerciseIds.length) return []; const value = await apiJson(`/api/workout-sessions/previous-performances?exerciseIds=${encodeURIComponent(exerciseIds.join(','))}`); if (!Array.isArray(value)) throw new Error('SetForge returned an unexpected previous-performance response.'); return value as PreviousExercisePerformance[]; }
export async function updateWorkoutSession(id: number, request: UpdateWorkoutSessionRequest) { return asSession(await apiJson(`/api/workout-sessions/${id}`, { method: 'PUT', body: JSON.stringify(request) })); }
export async function deleteWorkoutSession(id: number) { const response = await apiFetch(`/api/workout-sessions/${id}`, { method: 'DELETE' }); if (!response.ok) throw new Error(`Could not delete workout (${response.status}).`); }
