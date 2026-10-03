import type { ExerciseType, WorkoutSetType } from '@/models/workout-template';

export type WorkoutSessionStatus = 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export type WorkoutSet = {
  id: number;
  position: number;
  setType: WorkoutSetType;
  targetReps?: number;
  targetWeight?: number;
  targetTimeSeconds?: number;
  restSeconds?: number;
  reps?: number;
  weight?: number;
  timeSeconds?: number;
  completed: boolean;
  completedAt?: string;
};

export type WorkoutSessionExercise = {
  id: number;
  exerciseId: number;
  exerciseName: string;
  primaryMuscle: string;
  equipment: string;
  exerciseType: ExerciseType;
  thumbnailUrl?: string | null;
  position: number;
  notes?: string;
  sets: WorkoutSet[];
};

export type WorkoutSession = {
  id: number;
  userId: number;
  sourceTemplateId?: number;
  name: string;
  notes?: string;
  status: WorkoutSessionStatus;
  startedAt: string;
  completedAt?: string;
  exercises: WorkoutSessionExercise[];
};

export type StartWorkoutSessionRequest = {
  userId: number;
  templateId?: number;
  sourceWorkoutSessionId?: number;
  name?: string;
};

export type CompleteWorkoutSetRequest = {
  id?: number;
  setType: WorkoutSetType;
  targetReps?: number;
  targetWeight?: number;
  targetTimeSeconds?: number;
  restSeconds?: number;
  reps?: number;
  weight?: number;
  timeSeconds?: number;
  completed: boolean;
};

export type CompleteWorkoutExerciseRequest = {
  id?: number;
  exerciseId: number;
  notes?: string;
  sets: CompleteWorkoutSetRequest[];
};

export type CompleteWorkoutSessionRequest = {
  notes?: string;
  exercises: CompleteWorkoutExerciseRequest[];
};

export type UpdateWorkoutSessionRequest = CompleteWorkoutSessionRequest & {
  name: string;
};
