import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import type { Exercise } from '@/models/exercise';
import type { WorkoutSetType } from '@/models/workout-template';
import type { WorkoutSession } from '@/models/workout-session';
import { DEVELOPMENT_USER_ID } from '@/constants/development';
import { getActiveWorkoutSession } from '@/services/workout-session-api';

export type ActiveSet = {
  clientId: string;
  id?: number;
  setType: WorkoutSetType;
  targetReps: string;
  targetWeight: string;
  targetTimeSeconds: string;
  restSeconds: string;
  reps: string;
  weight: string;
  timeSeconds: string;
  completed: boolean;
};

export type ActiveExercise = {
  clientId: string;
  id?: number;
  exercise: Exercise;
  notes: string;
  sets: ActiveSet[];
};

type EditableSetField =
  | 'reps'
  | 'weight'
  | 'timeSeconds'
  | 'restSeconds';

type ActiveWorkoutContextValue = {
  session: WorkoutSession | null;
  exercises: ActiveExercise[];
  loadSession: (session: WorkoutSession) => void;
  addExercises: (exercises: Exercise[]) => void;
  addSet: (exerciseClientId: string) => void;
  removeExercise: (exerciseClientId: string) => void;
  removeSet: (exerciseClientId: string, setClientId: string) => void;
  updateSet: (
    exerciseClientId: string,
    setClientId: string,
    field: EditableSetField,
    value: string,
  ) => void;
  toggleSet: (exerciseClientId: string, setClientId: string) => ActiveSet | null;
  reset: () => void;
  isHydrating: boolean;
  hydrationError: string | null;
  refreshActiveWorkout: () => Promise<void>;
};

const ActiveWorkoutContext = createContext<ActiveWorkoutContextValue | null>(null);

let nextClientId = 0;
function clientId(prefix: string) {
  nextClientId += 1;
  return `${prefix}-${Date.now()}-${nextClientId}`;
}

function defaultSet(exercise: Exercise, previous?: ActiveSet): ActiveSet {
  if (previous) {
    return { ...previous, clientId: clientId('set'), id: undefined, completed: false };
  }
  const timed = exercise.exerciseType === 'TIMED';
  return {
    clientId: clientId('set'),
    setType: 'NORMAL',
    targetReps: '',
    targetWeight: '',
    targetTimeSeconds: '',
    restSeconds: timed ? '60' : '90',
    reps: timed ? '' : '10',
    weight: '',
    timeSeconds: timed ? '30' : '',
    completed: false,
  };
}

function newActiveExercise(exercise: Exercise): ActiveExercise {
  return {
    clientId: clientId('exercise'),
    exercise,
    notes: '',
    sets: Array.from({ length: 3 }, () => defaultSet(exercise)),
  };
}

export function ActiveWorkoutProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [exercises, setExercises] = useState<ActiveExercise[]>([]);
  const [isHydrating, setIsHydrating] = useState(true);
  const [hydrationError, setHydrationError] = useState<string | null>(null);

  const loadSession = useCallback((loadedSession: WorkoutSession) => {
    setSession(loadedSession);
    setExercises(
      loadedSession.exercises.map((sessionExercise) => ({
        clientId: clientId('exercise'),
        id: sessionExercise.id,
        exercise: {
          id: sessionExercise.exerciseId,
          name: sessionExercise.exerciseName,
          primaryMuscle: sessionExercise.primaryMuscle,
          equipment: sessionExercise.equipment,
          exerciseType: sessionExercise.exerciseType,
          instructions: null,
          bodyPart: null,
          muscleGroup: null,
          secondaryMuscles: null,
          sourceId: null,
          thumbnailUrl: sessionExercise.thumbnailUrl ?? null,
          animationUrl: null,
          attribution: null,
        },
        notes: sessionExercise.notes ?? '',
        sets: sessionExercise.sets.map((set) => ({
          clientId: clientId('set'),
          id: set.id,
          setType: set.setType,
          targetReps: set.targetReps?.toString() ?? '',
          targetWeight: set.targetWeight?.toString() ?? '',
          targetTimeSeconds: set.targetTimeSeconds?.toString() ?? '',
          restSeconds: set.restSeconds?.toString() ?? '',
          reps: set.reps?.toString() ?? set.targetReps?.toString() ?? '',
          weight: set.weight?.toString() ?? set.targetWeight?.toString() ?? '',
          timeSeconds: set.timeSeconds?.toString() ?? set.targetTimeSeconds?.toString() ?? '',
          completed: set.completed,
        })),
      })),
    );
  }, []);

  const refreshActiveWorkout = useCallback(async () => {
    try {
      const activeSession = await getActiveWorkoutSession(DEVELOPMENT_USER_ID);
      setHydrationError(null);
      if (activeSession) {
        loadSession(activeSession);
      } else {
        setSession(null);
        setExercises([]);
      }
    } catch (error) {
      setHydrationError(
        error instanceof Error ? error.message : 'Could not check for an active workout.',
      );
    } finally {
      setIsHydrating(false);
    }
  }, [loadSession]);

  useEffect(() => {
    let current = true;
    getActiveWorkoutSession(DEVELOPMENT_USER_ID)
      .then((activeSession) => {
        if (!current) return;
        if (activeSession) {
          loadSession(activeSession);
        } else {
          setSession(null);
          setExercises([]);
        }
      })
      .catch((error: unknown) => {
        if (current) {
          setHydrationError(
            error instanceof Error ? error.message : 'Could not check for an active workout.',
          );
        }
      })
      .finally(() => {
        if (current) setIsHydrating(false);
      });
    return () => {
      current = false;
    };
  }, [loadSession]);

  const addExercises = useCallback((selectedExercises: Exercise[]) => {
    setExercises((current) => {
      const existingIds = new Set(current.map(({ exercise }) => exercise.id));
      return [
        ...current,
        ...selectedExercises.filter((exercise) => !existingIds.has(exercise.id)).map(newActiveExercise),
      ];
    });
  }, []);

  const addSet = useCallback((exerciseClientId: string) => {
    setExercises((current) =>
      current.map((exercise) =>
        exercise.clientId === exerciseClientId
          ? {
              ...exercise,
              sets: [
                ...exercise.sets,
                defaultSet(exercise.exercise, exercise.sets[exercise.sets.length - 1]),
              ],
            }
          : exercise,
      ),
    );
  }, []);

  const removeExercise = useCallback((exerciseClientId: string) => {
    setExercises((current) => current.filter(({ clientId: id }) => id !== exerciseClientId));
  }, []);

  const removeSet = useCallback((exerciseClientId: string, setClientId: string) => {
    setExercises((current) =>
      current.map((exercise) =>
        exercise.clientId === exerciseClientId && exercise.sets.length > 1
          ? { ...exercise, sets: exercise.sets.filter(({ clientId: id }) => id !== setClientId) }
          : exercise,
      ),
    );
  }, []);

  const updateSet = useCallback(
    (exerciseClientId: string, setClientId: string, field: EditableSetField, value: string) => {
      setExercises((current) =>
        current.map((exercise) =>
          exercise.clientId === exerciseClientId
            ? {
                ...exercise,
                sets: exercise.sets.map((set) =>
                  set.clientId === setClientId ? { ...set, [field]: value } : set,
                ),
              }
            : exercise,
        ),
      );
    },
    [],
  );

  const toggleSet = useCallback((exerciseClientId: string, setClientId: string) => {
    const currentSet = exercises
      .find(({ clientId: id }) => id === exerciseClientId)
      ?.sets.find(({ clientId: id }) => id === setClientId);
    const updatedSet = currentSet ? { ...currentSet, completed: !currentSet.completed } : null;
    setExercises((current) =>
      current.map((exercise) => {
        if (exercise.clientId !== exerciseClientId) return exercise;
        return {
          ...exercise,
          sets: exercise.sets.map((set) => {
            if (set.clientId !== setClientId) return set;
            return { ...set, completed: !set.completed };
          }),
        };
      }),
    );
    return updatedSet;
  }, [exercises]);

  const reset = useCallback(() => {
    setSession(null);
    setExercises([]);
  }, []);

  const value = useMemo(
    () => ({
      session,
      exercises,
      loadSession,
      addExercises,
      addSet,
      removeExercise,
      removeSet,
      updateSet,
      toggleSet,
      reset,
      isHydrating,
      hydrationError,
      refreshActiveWorkout,
    }),
    [
      addExercises,
      addSet,
      exercises,
      loadSession,
      removeExercise,
      removeSet,
      reset,
      session,
      isHydrating,
      hydrationError,
      refreshActiveWorkout,
      toggleSet,
      updateSet,
    ],
  );

  return <ActiveWorkoutContext.Provider value={value}>{children}</ActiveWorkoutContext.Provider>;
}

export function useActiveWorkout() {
  const context = useContext(ActiveWorkoutContext);
  if (!context) {
    throw new Error('useActiveWorkout must be used inside ActiveWorkoutProvider.');
  }
  return context;
}
