import type { Exercise } from '@/models/exercise';

export const exerciseBodyParts = [
  'Any Body Part',
  'Core',
  'Arms',
  'Back',
  'Chest',
  'Legs',
  'Shoulders',
  'Full Body',
  'Olympic',
  'Cardio',
  'Other',
] as const;

export type ExerciseBodyPart = (typeof exerciseBodyParts)[number];

export type ExerciseSection = {
  title: string;
  data: Exercise[];
};

const olympicMovementPattern = /\b(clean|jerk|snatch)\b/i;
const fullBodyMovementPattern = /\b(burpee|farmers? walk|battle|battling ropes)\b/i;

export function getExerciseBodyPart(exercise: Exercise): Exclude<ExerciseBodyPart, 'Any Body Part'> {
  if (olympicMovementPattern.test(exercise.name)) return 'Olympic';
  if (fullBodyMovementPattern.test(exercise.name)) return 'Full Body';

  switch (exercise.primaryMuscle.trim().toLowerCase()) {
    case 'abs':
      return 'Core';
    case 'biceps':
    case 'triceps':
    case 'forearms':
      return 'Arms';
    case 'lats':
    case 'upper back':
    case 'traps':
    case 'spine':
      return 'Back';
    case 'pectorals':
    case 'serratus anterior':
      return 'Chest';
    case 'glutes':
    case 'quads':
    case 'hamstrings':
    case 'calves':
    case 'adductors':
    case 'abductors':
      return 'Legs';
    case 'delts':
      return 'Shoulders';
    case 'cardiovascular system':
      return 'Cardio';
    default:
      return 'Other';
  }
}

export function filterExercises(
  exercises: Exercise[],
  query: string,
  bodyPart: ExerciseBodyPart,
) {
  const normalizedQuery = query.trim().toLowerCase();

  return exercises.filter((exercise) => {
    const matchesBodyPart =
      bodyPart === 'Any Body Part' || getExerciseBodyPart(exercise) === bodyPart;
    const matchesQuery =
      !normalizedQuery ||
      [exercise.name, exercise.primaryMuscle, exercise.bodyPart, exercise.equipment].some((value) =>
        value?.toLowerCase().includes(normalizedQuery),
      );

    return matchesBodyPart && matchesQuery;
  });
}

export function groupExercisesAlphabetically(exercises: Exercise[]): ExerciseSection[] {
  const groups = new Map<string, Exercise[]>();

  [...exercises]
    .sort((left, right) => left.name.localeCompare(right.name, undefined, { sensitivity: 'base' }))
    .forEach((exercise) => {
      const firstCharacter = exercise.name.trim().charAt(0).toUpperCase();
      const title = /^[A-Z]$/.test(firstCharacter) ? firstCharacter : '#';
      const group = groups.get(title) ?? [];
      group.push(exercise);
      groups.set(title, group);
    });

  return [...groups.entries()]
    .sort(([left], [right]) => (left === '#' ? -1 : right === '#' ? 1 : left.localeCompare(right)))
    .map(([title, data]) => ({ title, data }));
}
