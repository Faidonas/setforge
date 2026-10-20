import type { AccountType } from '@/models/user';

export const COACH_DASHBOARD_MIN_WIDTH = 900;

export function canAccessCoachDashboard(accountType: AccountType) {
  return accountType === 'ADMIN' || accountType === 'PERSONAL_TRAINER';
}

export function getInitialWorkspaceRoute(accountType: AccountType, viewportWidth: number) {
  const hasDesktopViewport = viewportWidth >= COACH_DASHBOARD_MIN_WIDTH;
  return canAccessCoachDashboard(accountType) && hasDesktopViewport
    ? ('/coach' as const)
    : ('/home' as const);
}
