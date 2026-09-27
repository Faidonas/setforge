import type { DraftExercise, DraftSet } from './create-template-draft-context';
import type {
  CreateWorkoutTemplateExerciseRequest,
  CreateWorkoutTemplateSetRequest,
} from '@/models/workout-template';

export function toWorkoutTemplateExerciseRequests(
  draftExercises: DraftExercise[],
): CreateWorkoutTemplateExerciseRequest[] {
  return draftExercises.map((draftExercise) => ({
    exerciseId: draftExercise.exercise.id,
    notes: draftExercise.notes.trim() || undefined,
    sets: draftExercise.sets.map((set, index) =>
      toRequestSet(set, draftExercise.exercise.exerciseType, draftExercise.exercise.name, index),
    ),
  }));
}

function toRequestSet(
  set: DraftSet,
  exerciseType: DraftExercise['exercise']['exerciseType'],
  exerciseName: string,
  index: number,
): CreateWorkoutTemplateSetRequest {
  const restSeconds = parseOptionalNumber(set.restSeconds, 'Rest time', exerciseName, index);

  if (exerciseType === 'TIMED') {
    const targetTimeSeconds = parseRequiredNumber(
      set.targetTimeSeconds,
      'Time',
      exerciseName,
      index,
    );

    return { setType: set.setType, targetTimeSeconds, restSeconds };
  }

  const targetReps = parseRequiredNumber(set.targetReps, 'Reps', exerciseName, index);
  const targetWeight = parseOptionalNumber(set.targetWeight, 'Weight', exerciseName, index);

  return { setType: set.setType, targetReps, targetWeight, restSeconds };
}

function parseRequiredNumber(value: string, field: string, exerciseName: string, index: number) {
  const parsed = Number(value);

  if (!value.trim() || !Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${field} must be greater than zero for ${exerciseName}, set ${index + 1}.`);
  }

  return parsed;
}

function parseOptionalNumber(value: string, field: string, exerciseName: string, index: number) {
  if (!value.trim()) {
    return undefined;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${field} cannot be negative for ${exerciseName}, set ${index + 1}.`);
  }

  return parsed;
}
