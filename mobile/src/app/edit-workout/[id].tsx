import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RestTimerControl, formatRestTime } from '@/components/rest-timer-control';
import { ReorderableExerciseList } from '@/components/reorderable-exercise-list';
import { SetForgeColors } from '@/constants/setforge-theme';
import {
  formatPreviousResult,
  previousSetAt,
  usePreviousPerformances,
} from '@/features/workouts/previous-performance';
import type {
  PreviousExercisePerformance,
  WorkoutSession,
  WorkoutSessionExercise,
  WorkoutSet,
} from '@/models/workout-session';
import { getWorkoutSession, updateWorkoutSession } from '@/services/workout-session-api';

type EditableSet = WorkoutSet & { clientId: string; repsText: string; weightText: string; timeText: string };
type EditableExercise = Omit<WorkoutSessionExercise, 'sets'> & { clientId: string; sets: EditableSet[] };

let sequence = 0;
function clientId(prefix: string) { sequence += 1; return `${prefix}-${sequence}`; }

export default function EditWorkoutScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const workoutId = Number(id);
  const [workout, setWorkout] = useState<WorkoutSession | null>(null);
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [exercises, setExercises] = useState<EditableExercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const previousPerformances = usePreviousPerformances(
    exercises.map(({ exerciseId }) => exerciseId),
  );

  useEffect(() => {
    if (!Number.isInteger(workoutId) || workoutId <= 0) return;
    let current = true;
    getWorkoutSession(workoutId)
      .then((loaded) => {
        if (!current) return;
        setWorkout(loaded);
        setName(loaded.name);
        setNotes(loaded.notes ?? '');
        setExercises(loaded.exercises.map(toEditableExercise));
      })
      .catch((loadError: unknown) => {
        if (current) setError(loadError instanceof Error ? loadError.message : 'Could not load the workout.');
      })
      .finally(() => { if (current) setIsLoading(false); });
    return () => { current = false; };
  }, [workoutId]);

  const updateSet = (exerciseClientId: string, setClientId: string, field: 'repsText' | 'weightText' | 'timeText', value: string) => {
    setExercises((current) => current.map((exercise) => exercise.clientId === exerciseClientId
      ? { ...exercise, sets: exercise.sets.map((set) => set.clientId === setClientId ? { ...set, [field]: value } : set) }
      : exercise));
  };

  const updateRestSeconds = (exerciseClientId: string, setClientId: string, value: string) => {
    setExercises((current) => current.map((exercise) => exercise.clientId === exerciseClientId
      ? { ...exercise, sets: exercise.sets.map((set) => set.clientId === setClientId ? { ...set, restSeconds: Number(value) } : set) }
      : exercise));
  };

  const addSet = (exerciseClientId: string) => {
    setExercises((current) => current.map((exercise) => {
      if (exercise.clientId !== exerciseClientId) return exercise;
      const previous = exercise.sets[exercise.sets.length - 1];
      const next: EditableSet = {
        ...(previous ?? {
          id: 0,
          position: 0,
          setType: 'NORMAL' as const,
          completed: false,
          repsText: exercise.exerciseType === 'WEIGHT_AND_REPS' ? '10' : '',
          weightText: '',
          timeText: exercise.exerciseType === 'TIMED' ? '30' : '',
          restSeconds: exercise.exerciseType === 'TIMED' ? 60 : 90,
        }),
        id: 0,
        clientId: clientId('set'),
        position: exercise.sets.length,
        completed: true,
        completedAt: undefined,
      };
      return { ...exercise, sets: [...exercise.sets, next] };
    }));
  };

  const removeSet = (exerciseClientId: string, setClientId: string) => {
    setExercises((current) => current.map((exercise) => exercise.clientId === exerciseClientId && exercise.sets.length > 1
      ? { ...exercise, sets: exercise.sets.filter((set) => set.clientId !== setClientId) }
      : exercise));
  };

  const removeExercise = (exercise: EditableExercise) => {
    Alert.alert('Remove exercise?', `${exercise.exerciseName} will be removed from this saved workout.`, [
      { text: 'Keep', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => setExercises((current) => current.filter((item) => item.clientId !== exercise.clientId)) },
    ]);
  };

  const updateExerciseNotes = (exerciseClientId: string, exerciseNotes: string) => {
    setExercises((current) => current.map((exercise) =>
      exercise.clientId === exerciseClientId ? { ...exercise, notes: exerciseNotes } : exercise,
    ));
  };

  const moveExercise = (fromIndex: number, toIndex: number) => {
    setExercises((current) => {
      if (fromIndex === toIndex) return current;
      const reordered = [...current];
      const [moved] = reordered.splice(fromIndex, 1);
      reordered.splice(toIndex, 0, moved);
      return reordered;
    });
  };

  const save = async () => {
    if (!name.trim()) { setError('Workout name is required.'); return; }
    try {
      setIsSaving(true);
      setError(null);
      await updateWorkoutSession(workoutId, {
        name: name.trim(),
        notes: notes.trim() || undefined,
        exercises: exercises.map((exercise) => ({
          id: exercise.id,
          exerciseId: exercise.exerciseId,
          notes: exercise.notes,
          sets: exercise.sets.map((set) => ({
            id: set.id || undefined,
            setType: set.setType,
            targetReps: set.targetReps,
            targetWeight: set.targetWeight,
            targetTimeSeconds: set.targetTimeSeconds,
            restSeconds: set.restSeconds,
            reps: optionalNumber(set.repsText),
            weight: optionalNumber(set.weightText),
            timeSeconds: optionalNumber(set.timeText),
            completed: set.completed,
          })),
        })),
      });
      router.replace('/history');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not update the workout.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!Number.isInteger(workoutId) || workoutId <= 0) return <State message="Invalid workout identifier." onBack={() => router.back()} />;
  if (isLoading) return <State loading message="Loading workout..." />;
  if (!workout) return <State message={error ?? 'Workout not found.'} onBack={() => router.back()} />;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <View style={styles.screen}>
          <View style={styles.header}>
            <Pressable
              accessibilityLabel="Close workout editor"
              accessibilityRole="button"
              hitSlop={10}
              onPress={() => router.back()}
              style={styles.headerSide}>
              <Text style={styles.closeLabel}>×</Text>
            </Pressable>
            <View style={styles.headerCopy}>
              <Text numberOfLines={1} style={styles.workoutName}>{name}</Text>
              <Text style={styles.editingLabel}>EDIT WORKOUT</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              disabled={isSaving}
              onPress={() => void save()}
              style={[styles.saveButton, styles.headerSide, isSaving && styles.saveButtonDisabled]}>
              {isSaving ? <ActivityIndicator color={SetForgeColors.canvas} size="small" /> : <Text style={styles.saveLabel}>SAVE</Text>}
            </Pressable>
          </View>
          <ReorderableExerciseList
            contentContainerStyle={styles.content}
            data={exercises}
            getExerciseMeta={(exercise) => `${exercise.primaryMuscle} · ${exercise.equipment}`}
            getExerciseName={(exercise) => exercise.exerciseName}
            keyExtractor={(exercise) => exercise.clientId}
            onMove={moveExercise}
            emptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>No exercises in this workout</Text>
                <Text style={styles.emptyMessage}>This saved workout has no exercise results.</Text>
              </View>
            }
            footerComponent={error ? <Text style={styles.errorText}>{error}</Text> : null}
            renderExpandedItem={({ drag, index: exerciseIndex, isActive, item: exercise }) => {
              const timed = exercise.exerciseType === 'TIMED';
              return (
                <View style={[styles.exerciseBlock, isActive && styles.draggingExerciseBlock]}>
                  <View style={styles.exerciseTitleRow}>
                    <Pressable delayLongPress={300} onLongPress={drag} style={styles.exerciseHeading}>
                      <Text style={styles.exerciseName}>{exerciseIndex + 1}. {exercise.exerciseName}</Text>
                      <Text style={styles.exerciseMeta}>{exercise.primaryMuscle} · {exercise.equipment}</Text>
                    </Pressable>
                    <ExerciseDragHandle exerciseName={exercise.exerciseName} onLongPress={drag} />
                    <Pressable
                      accessibilityLabel={`Remove ${exercise.exerciseName}`}
                      accessibilityRole="button"
                      hitSlop={10}
                      onPress={() => removeExercise(exercise)}
                      style={styles.removeExerciseButton}>
                      <Text style={styles.removeExerciseIcon}>×</Text>
                    </Pressable>
                  </View>

                  <TextInput
                    accessibilityLabel={`Notes for ${exercise.exerciseName}`}
                    maxLength={500}
                    onChangeText={(value) => updateExerciseNotes(exercise.clientId, value)}
                    placeholder="Add exercise notes"
                    placeholderTextColor={SetForgeColors.textDisabled}
                    style={styles.notesInput}
                    value={exercise.notes ?? ''}
                  />

                  <SetHeader isTimed={timed} />
                  <View>
                    {exercise.sets.map((set, index) => (
                      <EditableSetRow
                        canRemove={exercise.sets.length > 1}
                        index={index}
                        isTimed={timed}
                        key={set.clientId}
                        onRemove={() => removeSet(exercise.clientId, set.clientId)}
                        onUpdate={(field, value) => updateSet(exercise.clientId, set.clientId, field, value)}
                        onUpdateRest={(value) => updateRestSeconds(exercise.clientId, set.clientId, value)}
                        previousPerformance={previousPerformances.get(exercise.exerciseId)}
                        set={set}
                      />
                    ))}
                  </View>
                  <Pressable onPress={() => addSet(exercise.clientId)} style={styles.addSetButton}>
                    <Text style={styles.addSetLabel}>+ ADD SET ({formatRestTime(exercise.sets.at(-1)?.restSeconds)})</Text>
                  </Pressable>
                </View>
              );
            }}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function toEditableExercise(exercise: WorkoutSessionExercise): EditableExercise {
  return { ...exercise, clientId: clientId('exercise'), sets: exercise.sets.map((set) => ({ ...set, clientId: clientId('set'), repsText: set.reps?.toString() ?? '', weightText: set.weight?.toString() ?? '', timeText: set.timeSeconds?.toString() ?? '' })) };
}
function optionalNumber(value: string) { const normalized = value.trim().replace(',', '.'); if (!normalized) return undefined; const parsed = Number(normalized); return Number.isFinite(parsed) ? parsed : undefined; }

function SetHeader({ isTimed }: { isTimed: boolean }) {
  return (
    <View style={styles.setHeader}>
      <Text style={[styles.columnLabel, styles.setNumberColumn]}>Set</Text>
      <View style={styles.previousColumn}><Text style={styles.columnLabel}>Previous</Text></View>
      {!isTimed && <View style={styles.metricColumn}><Text style={styles.columnLabel}>kg</Text></View>}
      <View style={styles.metricColumn}>
        <Text style={styles.columnLabel}>{isTimed ? 'Time' : 'Reps'}</Text>
      </View>
      <View style={styles.removeColumn} />
    </View>
  );
}

function EditableSetRow({
  set,
  index,
  isTimed,
  canRemove,
  previousPerformance,
  onRemove,
  onUpdate,
  onUpdateRest,
}: {
  set: EditableSet;
  index: number;
  isTimed: boolean;
  canRemove: boolean;
  previousPerformance?: PreviousExercisePerformance;
  onRemove: () => void;
  onUpdate: (field: 'repsText' | 'weightText' | 'timeText', value: string) => void;
  onUpdateRest: (value: string) => void;
}) {
  return (
    <View style={styles.setGroup}>
      <View style={styles.setRow}>
        <View style={[styles.setNumber, styles.setNumberColumn]}>
          <Text style={styles.setNumberText}>{formatSetLabel(set, index)}</Text>
        </View>
        <View style={styles.previousColumn}>
          <Text numberOfLines={1} style={styles.previousValue}>
            {formatPreviousResult(
              previousSetAt(previousPerformance, index),
              isTimed ? 'TIMED' : 'WEIGHT_AND_REPS',
            )}
          </Text>
        </View>
        {!isTimed && (
          <SetInput
            accessibilityLabel={`Set ${index + 1} weight in kilograms`}
            onChangeText={(value) => onUpdate('weightText', value)}
            placeholder="—"
            value={set.weightText}
          />
        )}
        <SetInput
          accessibilityLabel={`Set ${index + 1} ${isTimed ? 'time in seconds' : 'repetitions'}`}
          onChangeText={(value) => onUpdate(isTimed ? 'timeText' : 'repsText', value)}
          placeholder={isTimed ? '30' : '10'}
          value={isTimed ? set.timeText : set.repsText}
        />
        <Pressable
          accessibilityLabel={`Remove set ${index + 1}`}
          accessibilityRole="button"
          disabled={!canRemove}
          hitSlop={6}
          onPress={onRemove}
          style={styles.removeColumn}>
          <TrashIcon disabled={!canRemove} />
        </Pressable>
      </View>
      <RestTimerControl onChange={onUpdateRest} value={set.restSeconds} />
    </View>
  );
}

function SetInput({
  accessibilityLabel,
  value,
  placeholder,
  onChangeText,
}: {
  accessibilityLabel: string;
  value: string;
  placeholder: string;
  onChangeText: (value: string) => void;
}) {
  return (
    <View style={styles.metricColumn}>
      <TextInput
        accessibilityLabel={accessibilityLabel}
        keyboardType="decimal-pad"
        maxLength={7}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={SetForgeColors.textDisabled}
        selectTextOnFocus
        style={styles.setInput}
        value={value}
      />
    </View>
  );
}

function TrashIcon({ disabled }: { disabled: boolean }) {
  return (
    <View style={[styles.trashIcon, disabled && styles.trashIconDisabled]}>
      <View style={styles.trashHandle} />
      <View style={styles.trashLid} />
      <View style={styles.trashBody}>
        <View style={styles.trashLine} />
        <View style={styles.trashLine} />
      </View>
    </View>
  );
}

function formatSetLabel(set: EditableSet, index: number) {
  if (set.setType === 'WARM_UP') return 'W';
  if (set.setType === 'DROP_SET') return 'D';
  if (set.setType === 'FAILURE') return 'F';
  return (index + 1).toString();
}

function ExerciseDragHandle({ exerciseName, onLongPress }: { exerciseName: string; onLongPress: () => void }) {
  return <Pressable accessibilityLabel={`Hold and drag to reorder ${exerciseName}`} accessibilityRole="button" delayLongPress={300} onLongPress={onLongPress} style={styles.dragHandle}><Text style={styles.dragHandleIcon}>≡</Text></Pressable>;
}

function State({ message, loading, onBack }: { message: string; loading?: boolean; onBack?: () => void }) {
  return <SafeAreaView style={styles.safeArea}><View style={styles.stateContainer}>{loading && <ActivityIndicator color={SetForgeColors.accent} />}<Text style={styles.stateMessage}>{message}</Text>{onBack && <Pressable onPress={onBack} style={styles.backButton}><Text style={styles.backButtonLabel}>GO BACK</Text></Pressable>}</View></SafeAreaView>;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: SetForgeColors.canvas },
  screen: { flex: 1, width: '100%', maxWidth: 520, alignSelf: 'center' },
  header: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: SetForgeColors.border,
    backgroundColor: SetForgeColors.surface,
  },
  headerSide: { width: 68 },
  closeLabel: {
    color: SetForgeColors.textSecondary,
    fontSize: 30,
    lineHeight: 32,
    fontWeight: '300',
  },
  headerCopy: { flex: 1, alignItems: 'center', gap: 2 },
  workoutName: {
    width: '100%',
    color: SetForgeColors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  editingLabel: { color: SetForgeColors.accent, fontSize: 10, fontWeight: '800' },
  saveButton: {
    minWidth: 68,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
    backgroundColor: SetForgeColors.accent,
  },
  saveButtonDisabled: { opacity: 0.5 },
  saveLabel: { color: SetForgeColors.canvas, fontSize: 12, fontWeight: '900' },
  content: { paddingBottom: 44 },
  exerciseBlock: {
    gap: 9,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: SetForgeColors.border,
  },
  draggingExerciseBlock: { backgroundColor: SetForgeColors.surfaceMuted },
  exerciseTitleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  exerciseHeading: { flex: 1, gap: 2 },
  dragHandle: { width: 32, height: 34, alignItems: 'center', justifyContent: 'center' },
  dragHandleIcon: { color: SetForgeColors.textSecondary, fontSize: 23, lineHeight: 25 },
  exerciseName: {
    color: SetForgeColors.textPrimary,
    fontSize: 17,
    lineHeight: 21,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  exerciseMeta: {
    color: SetForgeColors.textSecondary,
    fontSize: 11,
    lineHeight: 15,
    textTransform: 'capitalize',
  },
  removeExerciseButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.5)',
    borderRadius: 14,
    backgroundColor: 'rgba(248, 113, 113, 0.1)',
  },
  removeExerciseIcon: { color: '#F87171', fontSize: 21, lineHeight: 23, fontWeight: '500' },
  notesInput: {
    minHeight: 34,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: SetForgeColors.border,
    borderRadius: 6,
    backgroundColor: SetForgeColors.surface,
    color: SetForgeColors.textPrimary,
    fontSize: 13,
  },
  setHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  columnLabel: {
    color: SetForgeColors.textDisabled,
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
  setNumberColumn: { width: 34, flexGrow: 0, flexShrink: 0 },
  previousColumn: { flex: 1.45, minWidth: 0 },
  metricColumn: { flex: 0.85, minWidth: 0 },
  previousValue: { color: SetForgeColors.textSecondary, fontSize: 12, textAlign: 'center' },
  setGroup: { marginBottom: 0 },
  setRow: { height: 36, flexDirection: 'row', alignItems: 'center', gap: 6 },
  setNumber: {
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.2)',
    borderRadius: 7,
    backgroundColor: 'rgba(0, 240, 255, 0.05)',
  },
  setNumberText: {
    color: SetForgeColors.accent,
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: '800',
  },
  setInput: {
    width: '100%',
    height: 36,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: SetForgeColors.border,
    borderRadius: 7,
    backgroundColor: SetForgeColors.surface,
    color: SetForgeColors.textPrimary,
    fontFamily: 'monospace',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  removeColumn: { width: 26, alignItems: 'center', justifyContent: 'center' },
  trashIcon: { width: 16, height: 18, alignItems: 'center' },
  trashIconDisabled: { opacity: 0.25 },
  trashHandle: { width: 6, height: 2, borderRadius: 1, backgroundColor: SetForgeColors.textSecondary },
  trashLid: { width: 16, height: 2, marginTop: 1, borderRadius: 1, backgroundColor: SetForgeColors.textSecondary },
  trashBody: {
    width: 12,
    height: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 3,
    paddingTop: 3,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: SetForgeColors.textSecondary,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  trashLine: { width: 1, height: 6, backgroundColor: SetForgeColors.textSecondary },
  addSetButton: {
    width: '100%',
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    borderRadius: 6,
    backgroundColor: SetForgeColors.surfaceMuted,
  },
  addSetLabel: {
    color: SetForgeColors.textPrimary,
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: '800',
  },
  emptyState: { alignItems: 'center', gap: 8, paddingHorizontal: 24, paddingVertical: 48 },
  emptyTitle: { color: SetForgeColors.textPrimary, fontSize: 16, fontWeight: '700' },
  emptyMessage: { color: SetForgeColors.textSecondary, fontSize: 13, textAlign: 'center' },
  errorText: {
    marginHorizontal: 20,
    marginTop: 16,
    padding: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    color: '#FCA5A5',
    fontSize: 12,
    lineHeight: 18,
  },
  stateContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 28 },
  stateMessage: { color: SetForgeColors.textSecondary, fontSize: 14, textAlign: 'center' },
  backButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: SetForgeColors.accent,
    borderRadius: 5,
  },
  backButtonLabel: { color: SetForgeColors.accent, fontSize: 12, fontWeight: '800' },
});
