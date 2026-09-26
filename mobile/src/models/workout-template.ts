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
  position: number;
  notes?: string;
  sets: WorkoutTemplateSet[];
};

export type WorkoutTemplate = {
  id: number;
  ownerId: number;
  name: string;
  description?: string;
  exercises: WorkoutTemplateExercise[];
  createdAt: string;
  updatedAt: string;
};
