import { ExercisePicker } from '@/features/workouts/create-template/exercise-picker-screen';
import { useActiveWorkout } from '@/features/workouts/active-workout/active-workout-context';

export default function ActiveWorkoutExercisePickerScreen() {
  const { addExercises, exercises, expand } = useActiveWorkout();

  const addAndReturnToWorkout = (selectedExercises: Parameters<typeof addExercises>[0]) => {
    addExercises(selectedExercises);
    setTimeout(expand, 300);
  };

  return (
    <ExercisePicker
      existingExerciseIds={exercises.map(({ exercise }) => exercise.id)}
      onAddExercises={addAndReturnToWorkout}
    />
  );
}
