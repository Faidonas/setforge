import type { WorkoutTemplate } from '@/models/workout-template';

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
  assignedTemplates: WorkoutTemplate[];
  recentWorkouts: CoachWorkoutSummary[];
};

export type CoachDashboard = {
  coachId: number;
  coachName: string;
  admin: boolean;
  activeClientCount: number;
  templateCount: number;
  completedWorkoutsLast28Days: number;
  clientsNeedingAttention: number;
  attentionClients: CoachClientSummary[];
  recentWorkouts: CoachWorkoutSummary[];
};

export type CoachTemplateAssignee = {
  userId: number;
  displayName: string;
  email: string;
  assignedAt: string;
};

export type CoachWorkoutTemplate = {
  template: WorkoutTemplate;
  assignees: CoachTemplateAssignee[];
};

export type AdminCoachingRelationship = {
  relationshipId: number;
  coachId: number;
  coachName: string;
  clientId: number;
  clientName: string;
  clientEmail: string;
  status: 'PENDING' | 'ACTIVE' | 'ENDED';
  startedAt: string;
};
