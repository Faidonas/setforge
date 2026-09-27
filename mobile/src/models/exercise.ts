export type ExerciseType = 'WEIGHT_AND_REPS' | 'TIMED';

export type Exercise = {
  id: number;
  name: string;
  primaryMuscle: string;
  equipment: string;
  exerciseType: ExerciseType;
  instructions: string | null;
  bodyPart: string | null;
  muscleGroup: string | null;
  secondaryMuscles: string | null;
  sourceId: string | null;
  thumbnailUrl: string | null;
  animationUrl: string | null;
  attribution: string | null;
};
