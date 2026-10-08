import { useEffect, useMemo, useState } from 'react';

import type {
  PreviousExercisePerformance,
  PreviousExerciseSet,
} from '@/models/workout-session';
import type { ExerciseType } from '@/models/workout-template';
import { getPreviousExercisePerformances } from '@/services/workout-session-api';

export function usePreviousPerformances(exerciseIds: number[]) {
  const exerciseKey = [...new Set(exerciseIds)].sort((a, b) => a - b).join(',');
  const [performances, setPerformances] = useState<PreviousExercisePerformance[]>([]);

  useEffect(() => {
    const ids = exerciseKey ? exerciseKey.split(',').map(Number) : [];
    if (ids.length === 0) {
      return;
    }

    let current = true;
    getPreviousExercisePerformances(ids)
      .then((result) => {
        if (current) setPerformances(result);
      })
      .catch(() => {
        if (current) setPerformances([]);
      });
    return () => {
      current = false;
    };
  }, [exerciseKey]);

  return useMemo(
    () => {
      const visibleIds = new Set(exerciseKey ? exerciseKey.split(',').map(Number) : []);
      return new Map(
        performances
          .filter((performance) => visibleIds.has(performance.exerciseId))
          .map((performance) => [performance.exerciseId, performance]),
      );
    },
    [exerciseKey, performances],
  );
}

export function previousSetAt(
  performance: PreviousExercisePerformance | undefined,
  position: number,
) {
  return performance?.sets.find((set) => set.position === position) ?? performance?.sets[position];
}

export function formatPreviousResult(
  set: PreviousExerciseSet | undefined,
  exerciseType: ExerciseType,
) {
  if (!set) return '—';
  if (exerciseType === 'TIMED') {
    const seconds = set.timeSeconds ?? 0;
    return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
  }
  if (set.weight === undefined) return set.reps === undefined ? '—' : `${set.reps} reps`;
  return `${set.weight} kg × ${set.reps ?? 0}`;
}
