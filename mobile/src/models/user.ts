export type AccountType = 'ADMIN' | 'PERSONAL_TRAINER' | 'INDIVIDUAL';

export type UserProfile = {
  id: number;
  email: string;
  displayName: string;
  accountType: AccountType;
  onboardingCompleted: boolean;
  createdAt: string;
};
