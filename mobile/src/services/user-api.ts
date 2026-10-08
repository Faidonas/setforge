import type { UserProfile } from '@/models/user';
import { apiJson } from '@/services/api-client';
export async function getUserProfile(): Promise<UserProfile> { const value = await apiJson('/api/users/me'); if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('SetForge returned an unexpected profile response.'); return value as UserProfile; }
