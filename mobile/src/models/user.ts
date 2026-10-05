export type AccountType = 'PERSONAL_TRAINER' | 'INDIVIDUAL';

export type UserProfile = {
  id: number;
  email: string;
  displayName: string;
  accountType: AccountType;
  createdAt: string;
};
