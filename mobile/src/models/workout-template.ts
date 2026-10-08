export type ExerciseType = 'WEIGHT_AND_REPS' | 'TIMED';

export type WorkoutSetType = 'WARM_UP' | 'NORMAL' | 'DROP_SET' | 'FAILURE';

export type WorkoutTemplateSet = {
  id: number;
  position: number;
  setType: WorkoutSetType;
  targetReps?: number;
  targetWeight?: number;
  targetTimeSeconds?: number;
  restSeconds?: number;
};

export type WorkoutTemplateExercise = {
  id: number;
  exerciseId: number;
  exerciseName: string;
  primaryMuscle: string;
  equipment: string;
  exerciseType: ExerciseType;
  thumbnailUrl?: string | null;
  position: number;
  notes?: string;
  sets: WorkoutTemplateSet[];
};

export type WorkoutTemplate = {
  id: number;
  ownerId: number;
  name: string;
  description?: string;
  position?: number;
  exercises: WorkoutTemplateExercise[];
  createdAt: string;
  updatedAt: string;
};

export type CreateWorkoutTemplateSetRequest = {
  setType: WorkoutSetType;
  targetReps?: number;
  targetWeight?: number;
  targetTimeSeconds?: number;
  restSeconds?: number;
};

export type CreateWorkoutTemplateExerciseRequest = {
  exerciseId: number;
  notes?: string;
  sets: CreateWorkoutTemplateSetRequest[];
};

export type CreateWorkoutTemplateRequest = {
  name: string;
  description?: string;
  exercises: CreateWorkoutTemplateExerciseRequest[];
};

export type UpdateWorkoutTemplateRequest = CreateWorkoutTemplateRequest;
