export type ExerciseType = 'WEIGHT_AND_REPS' | 'TIMED';

export type Exercise = {
  id: number;
  name: string;
  primaryMuscle: string;
  equipment: string;
  exerciseType: ExerciseType;
  instructions: string | null;
};
