export type CoachWorkoutSummary = {
  id: number;
  clientId: number;
  clientName: string;
  name: string;
  startedAt: string;
  completedAt: string | null;
  durationMinutes: number | null;
  totalVolume: number;
};

export type CoachClientSummary = {
  id: number;
  displayName: string;
  email: string;
  relationshipStatus: 'PENDING' | 'ACTIVE' | 'ENDED';
  coachingSince: string;
  completedWorkoutsLast28Days: number;
  lastWorkoutAt: string | null;
  lastWorkoutName: string | null;
};

export type CoachClientDetail = Omit<CoachClientSummary, 'lastWorkoutName'> & {
  totalVolumeLast28Days: number;
  recentWorkouts: CoachWorkoutSummary[];
};

export type CoachDashboard = {
  coachId: number;
  coachName: string;
  activeClientCount: number;
  templateCount: number;
  completedWorkoutsLast28Days: number;
  clientsNeedingAttention: number;
  attentionClients: CoachClientSummary[];
  recentWorkouts: CoachWorkoutSummary[];
};
