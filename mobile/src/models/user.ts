export type AccountType = 'ADMIN' | 'PERSONAL_TRAINER' | 'INDIVIDUAL';
export type UnitSystem = 'METRIC' | 'IMPERIAL';
export type PrimaryObjective = 'STRENGTH' | 'HYPERTROPHY' | 'GENERAL_FITNESS';
export type LiftingExperience = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
export type ThemePreference = 'DARK' | 'LIGHT';

export type UserProfile = {
  id: number;
  email: string;
  displayName: string;
  accountType: AccountType;
  onboardingCompleted: boolean;
  unitSystem: UnitSystem;
  primaryObjective: PrimaryObjective;
  liftingExperience: LiftingExperience;
  themePreference: ThemePreference;
  createdAt: string;
};

export type CompleteOnboardingRequest = {
  displayName: string;
  unitSystem: UnitSystem;
  primaryObjective: PrimaryObjective;
  liftingExperience: LiftingExperience;
};
