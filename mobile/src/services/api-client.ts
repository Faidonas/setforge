import { supabase } from '@/services/supabase';

const apiUrl = process.env.EXPO_PUBLIC_API_URL;

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  if (!apiUrl) {
    throw new Error('The API URL is not configured. Set EXPO_PUBLIC_API_URL in your Expo environment.');
  }

  const { data, error } = await supabase.auth.getSession();
  if (error) throw new Error('Could not read your sign-in session. Please sign in again.');
  if (!data.session?.access_token) throw new Error('Your session has expired. Please sign in again.');

  const headers = new Headers(options.headers);
  headers.set('Authorization', `Bearer ${data.session.access_token}`);
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

  try {
    return await fetch(`${apiUrl.replace(/\/$/, '')}${path}`, { ...options, headers });
  } catch {
    throw new Error('Could not connect to SetForge. Check your network and API URL.');
  }
}

export async function apiJson(path: string, options?: RequestInit): Promise<unknown> {
  const response = await apiFetch(path, options);
  if (!response.ok) {
    const details = await response.text().catch(() => '');
    throw new Error(`SetForge returned ${response.status}${details ? `: ${details}` : ''}`);
  }
  return response.status === 204 ? null : response.json();
}
