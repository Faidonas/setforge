import type { CoachClientDetail, CoachClientSummary, CoachDashboard } from '@/models/coach';
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
