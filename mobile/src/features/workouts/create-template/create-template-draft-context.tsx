import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

import type { Exercise } from '@/models/exercise';
import type { WorkoutSetType, WorkoutTemplate } from '@/models/workout-template';

export type DraftSet = {
  clientId: string;
  setType: WorkoutSetType;
  targetReps: string;
  targetWeight: string;
  targetTimeSeconds: string;
  restSeconds: string;
};

export type DraftExercise = {
  clientId: string;
  exercise: Exercise;
  notes: string;
  sets: DraftSet[];
};

type DraftSetField = Exclude<keyof DraftSet, 'clientId' | 'setType'>;

type CreateTemplateDraft = {
  name: string;
  setName: (name: string) => void;
  description: string;
  setDescription: (description: string) => void;
  sourceTemplateId: number | null;
  exercises: DraftExercise[];
  loadTemplate: (template: WorkoutTemplate) => void;
  addExercises: (exercises: Exercise[]) => void;
  moveExercise: (fromIndex: number, toIndex: number) => void;
  removeExercise: (exerciseClientId: string) => void;
  updateExerciseNotes: (exerciseClientId: string, notes: string) => void;
  addSet: (exerciseClientId: string) => void;
  removeSet: (exerciseClientId: string, setClientId: string) => void;
  updateSet: (
    exerciseClientId: string,
    setClientId: string,
    field: DraftSetField,
    value: string,
  ) => void;
  reset: () => void;
};

const CreateTemplateDraftContext = createContext<CreateTemplateDraft | null>(null);

let nextClientId = 0;

function createClientId(prefix: string) {
  nextClientId += 1;
  return `${prefix}-${Date.now()}-${nextClientId}`;
}

function createDefaultSet(exercise: Exercise): DraftSet {
  return {
    clientId: createClientId('set'),
    setType: 'NORMAL',
    targetReps: exercise.exerciseType === 'WEIGHT_AND_REPS' ? '10' : '',
    targetWeight: '',
    targetTimeSeconds: exercise.exerciseType === 'TIMED' ? '30' : '',
    restSeconds: exercise.exerciseType === 'TIMED' ? '60' : '90',
  };
}

function createDraftExercise(exercise: Exercise): DraftExercise {
  return {
    clientId: createClientId('exercise'),
    exercise,
    notes: '',
    sets: Array.from({ length: 3 }, () => createDefaultSet(exercise)),
  };
}

export function CreateTemplateDraftProvider({ children }: { children: ReactNode }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sourceTemplateId, setSourceTemplateId] = useState<number | null>(null);
  const [exercises, setExercises] = useState<DraftExercise[]>([]);

  const loadTemplate = useCallback((template: WorkoutTemplate) => {
    setSourceTemplateId(template.id);
    setName(template.name);
    setDescription(template.description ?? '');
    setExercises(
      template.exercises.map((templateExercise) => ({
        clientId: createClientId('exercise'),
        exercise: {
          id: templateExercise.exerciseId,
          name: templateExercise.exerciseName,
          primaryMuscle: templateExercise.primaryMuscle,
          equipment: templateExercise.equipment,
          exerciseType: templateExercise.exerciseType,
          instructions: null,
          bodyPart: null,
          muscleGroup: null,
          secondaryMuscles: null,
          sourceId: null,
          thumbnailUrl: templateExercise.thumbnailUrl ?? null,
          animationUrl: null,
          attribution: null,
        },
        notes: templateExercise.notes ?? '',
        sets: templateExercise.sets.map((set) => ({
          clientId: createClientId('set'),
          setType: set.setType,
          targetReps: set.targetReps?.toString() ?? '',
          targetWeight: set.targetWeight?.toString() ?? '',
          targetTimeSeconds: set.targetTimeSeconds?.toString() ?? '',
          restSeconds: set.restSeconds?.toString() ?? '',
        })),
      })),
    );
  }, []);

  const addExercises = useCallback((selectedExercises: Exercise[]) => {
    setExercises((currentExercises) => {
      const existingIds = new Set(currentExercises.map(({ exercise }) => exercise.id));
      const newExercises = selectedExercises
        .filter((exercise) => !existingIds.has(exercise.id))
        .map(createDraftExercise);

      return [...currentExercises, ...newExercises];
    });
  }, []);

  const removeExercise = useCallback((exerciseClientId: string) => {
    setExercises((currentExercises) =>
      currentExercises.filter((exercise) => exercise.clientId !== exerciseClientId),
    );
  }, []);

  const moveExercise = useCallback((fromIndex: number, toIndex: number) => {
    setExercises((currentExercises) => {
      if (fromIndex === toIndex) return currentExercises;
      const reordered = [...currentExercises];
      const [movedExercise] = reordered.splice(fromIndex, 1);
      if (!movedExercise) return currentExercises;
      reordered.splice(toIndex, 0, movedExercise);
      return reordered;
    });
  }, []);

  const updateExerciseNotes = useCallback((exerciseClientId: string, notes: string) => {
    setExercises((currentExercises) =>
      currentExercises.map((exercise) =>
        exercise.clientId === exerciseClientId ? { ...exercise, notes } : exercise,
      ),
    );
  }, []);

  const addSet = useCallback((exerciseClientId: string) => {
    setExercises((currentExercises) =>
      currentExercises.map((draftExercise) => {
        if (draftExercise.clientId !== exerciseClientId) {
          return draftExercise;
        }

        const previousSet = draftExercise.sets[draftExercise.sets.length - 1];
        const nextSet = previousSet
          ? { ...previousSet, clientId: createClientId('set') }
          : createDefaultSet(draftExercise.exercise);

        return { ...draftExercise, sets: [...draftExercise.sets, nextSet] };
      }),
    );
  }, []);

  const removeSet = useCallback((exerciseClientId: string, setClientId: string) => {
    setExercises((currentExercises) =>
      currentExercises.map((draftExercise) => {
        if (draftExercise.clientId !== exerciseClientId || draftExercise.sets.length === 1) {
          return draftExercise;
        }

        return {
          ...draftExercise,
          sets: draftExercise.sets.filter((set) => set.clientId !== setClientId),
        };
      }),
    );
  }, []);

  const updateSet = useCallback(
    (exerciseClientId: string, setClientId: string, field: DraftSetField, value: string) => {
      setExercises((currentExercises) =>
        currentExercises.map((draftExercise) => {
          if (draftExercise.clientId !== exerciseClientId) {
            return draftExercise;
          }

          return {
            ...draftExercise,
            sets: draftExercise.sets.map((set) =>
              set.clientId === setClientId ? { ...set, [field]: value } : set,
            ),
          };
        }),
      );
    },
    [],
  );

  const reset = useCallback(() => {
    setName('');
    setDescription('');
    setSourceTemplateId(null);
    setExercises([]);
  }, []);

  const value = useMemo(
    () => ({
      name,
      setName,
      description,
      setDescription,
      sourceTemplateId,
      exercises,
      loadTemplate,
      addExercises,
      moveExercise,
      removeExercise,
      updateExerciseNotes,
      addSet,
      removeSet,
      updateSet,
      reset,
    }),
    [
      addExercises,
      addSet,
      description,
      exercises,
      loadTemplate,
      moveExercise,
      name,
      removeExercise,
      removeSet,
      reset,
      sourceTemplateId,
      updateExerciseNotes,
      updateSet,
    ],
  );

  return (
    <CreateTemplateDraftContext.Provider value={value}>
      {children}
    </CreateTemplateDraftContext.Provider>
  );
}

export function useCreateTemplateDraft() {
  const context = useContext(CreateTemplateDraftContext);

  if (!context) {
    throw new Error('useCreateTemplateDraft must be used inside CreateTemplateDraftProvider.');
  }

  return context;
}
