import { ExercisePicker } from '@/features/workouts/create-template/exercise-picker-screen';
import { useActiveWorkout } from '@/features/workouts/active-workout/active-workout-context';

export default function ActiveWorkoutExercisePickerScreen() {
  const { addExercises, exercises } = useActiveWorkout();

  return (
    <ExercisePicker
      existingExerciseIds={exercises.map(({ exercise }) => exercise.id)}
      onAddExercises={addExercises}
    />
  );
}
