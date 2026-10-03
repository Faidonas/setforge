import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SetForgeColors } from '@/constants/setforge-theme';
import {
  type ActiveExercise,
  type ActiveSet,
  useActiveWorkout,
} from '@/features/workouts/active-workout/active-workout-context';
import type {
  CompleteWorkoutExerciseRequest,
  CompleteWorkoutSetRequest,
} from '@/models/workout-session';
import {
  cancelWorkoutSession,
  completeWorkoutSession,
  getWorkoutSession,
} from '@/services/workout-session-api';

type FinishStep = 'closed' | 'options' | 'unfinished' | 'cancel';

export default function ActiveWorkoutScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const workout = useActiveWorkout();
  const sessionId = Number(id);
  const [isLoading, setIsLoading] = useState(workout.session?.id !== sessionId);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(0);
  const [restEndsAt, setRestEndsAt] = useState<number | null>(null);
  const [finishStep, setFinishStep] = useState<FinishStep>('closed');

  useEffect(() => {
    if (!Number.isInteger(sessionId) || sessionId <= 0 || workout.session?.id === sessionId) return;
    let current = true;
    getWorkoutSession(sessionId)
      .then((session) => {
        if (current) workout.loadSession(session);
      })
      .catch((loadError: unknown) => {
        if (current) {
          setError(loadError instanceof Error ? loadError.message : 'Could not load this workout.');
        }
      })
      .finally(() => {
        if (current) setIsLoading(false);
      });
    return () => {
      current = false;
    };
  }, [sessionId, workout]);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const elapsedSeconds = useMemo(() => {
    if (!workout.session) return 0;
    return Math.max(0, Math.floor((now - new Date(workout.session.startedAt).getTime()) / 1000));
  }, [now, workout.session]);
  const restSeconds = restEndsAt ? Math.max(0, Math.ceil((restEndsAt - now) / 1000)) : 0;

  const toggleSet = (exercise: ActiveExercise, set: ActiveSet) => {
    if (!set.completed) {
      const value = exercise.exercise.exerciseType === 'TIMED' ? set.timeSeconds : set.reps;
      if (!value.trim() || Number(value) < 0) {
        Alert.alert(
          'Set result required',
          exercise.exercise.exerciseType === 'TIMED'
            ? 'Enter the completed time before checking this set.'
            : 'Enter the completed reps before checking this set.',
        );
        return;
      }
    }
    const updated = workout.toggleSet(exercise.clientId, set.clientId);
    if (updated?.completed) {
      const seconds = Number(updated.restSeconds);
      if (Number.isFinite(seconds) && seconds > 0) setRestEndsAt(Date.now() + seconds * 1000);
    }
  };

  const hasUnfinishedSets = workout.exercises.some((exercise) =>
    exercise.sets.some((set) => !set.completed),
  );

  const requestFinish = () => setFinishStep('options');

  const chooseComplete = () => {
    setFinishStep(hasUnfinishedSets ? 'unfinished' : 'closed');
    if (!hasUnfinishedSets) void saveCompletedWorkout();
  };

  const saveCompletedWorkout = async () => {
    try {
      setIsSaving(true);
      setError(null);
      setFinishStep('closed');
      await completeWorkoutSession(sessionId, {
        exercises: workout.exercises.map(toCompleteExerciseRequest),
      });
      workout.reset();
      router.replace('/start-workout');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not complete the workout.');
    } finally {
      setIsSaving(false);
    }
  };

  const cancelWorkout = async () => {
    try {
      setIsSaving(true);
      setError(null);
      setFinishStep('closed');
      await cancelWorkoutSession(sessionId);
      workout.reset();
      router.replace('/start-workout');
    } catch (cancelError) {
      setError(cancelError instanceof Error ? cancelError.message : 'Could not cancel the workout.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!Number.isInteger(sessionId) || sessionId <= 0) {
    return <WorkoutState message="The workout identifier is invalid." onBack={() => router.back()} />;
  }
  if (isLoading) return <WorkoutState loading message="Loading workout..." />;
  if (!workout.session) {
    return <WorkoutState message={error ?? 'The workout could not be loaded.'} onBack={() => router.back()} />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <View style={styles.screen}>
          <View style={styles.header}>
            <Pressable
              accessibilityHint="Keeps the workout running in the bottom bar"
              accessibilityLabel="Minimize workout"
              accessibilityRole="button"
              hitSlop={10}
              onPress={() => router.navigate('/start-workout')}
              style={styles.headerSide}>
              <Text style={styles.minimizeLabel}>⌄</Text>
            </Pressable>
            <View style={styles.headerCopy}>
              <Text numberOfLines={1} style={styles.title}>{workout.session.name}</Text>
              <Text style={styles.elapsed}>{formatDuration(elapsedSeconds)}</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              disabled={isSaving}
              onPress={requestFinish}
              style={[styles.finishButton, isSaving && styles.disabled]}>
              {isSaving ? (
                <ActivityIndicator color={SetForgeColors.canvas} size="small" />
              ) : (
                <Text style={styles.finishLabel}>FINISH</Text>
              )}
            </Pressable>
          </View>

          {restSeconds > 0 && (
            <View style={styles.restBanner}>
              <View>
                <Text style={styles.restLabel}>REST TIMER</Text>
                <Text style={styles.restTime}>{formatDuration(restSeconds)}</Text>
              </View>
              <Pressable accessibilityRole="button" onPress={() => setRestEndsAt(null)}>
                <Text style={styles.dismissRest}>SKIP</Text>
              </Pressable>
            </View>
          )}

          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {workout.exercises.map((exercise, index) => (
              <WorkoutExercise
                exercise={exercise}
                exerciseNumber={index + 1}
                key={exercise.clientId}
                onToggleSet={toggleSet}
              />
            ))}

            {workout.exercises.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>Your workout is running</Text>
                <Text style={styles.emptyMessage}>Add your first exercise and start recording sets.</Text>
              </View>
            )}
            {error && <Text style={styles.errorText}>{error}</Text>}
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/active-workout/exercises')}
              style={styles.addExerciseButton}>
              <Text style={styles.addExerciseLabel}>+ ADD EXERCISE</Text>
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
      <FinishWorkoutModal
        isSaving={isSaving}
        onCancelWorkout={() => setFinishStep('cancel')}
        onClose={() => setFinishStep('closed')}
        onComplete={chooseComplete}
        onCompleteAnyway={() => void saveCompletedWorkout()}
        onConfirmCancel={() => void cancelWorkout()}
        step={finishStep}
      />
    </SafeAreaView>
  );
}

function WorkoutExercise({
  exercise,
  exerciseNumber,
  onToggleSet,
}: {
  exercise: ActiveExercise;
  exerciseNumber: number;
  onToggleSet: (exercise: ActiveExercise, set: ActiveSet) => void;
}) {
  const workout = useActiveWorkout();
  const timed = exercise.exercise.exerciseType === 'TIMED';
  const confirmRemove = () => Alert.alert(
    'Remove exercise?',
    `${exercise.exercise.name} and its sets will be removed from this workout.`,
    [
      { text: 'Keep', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => workout.removeExercise(exercise.clientId) },
    ],
  );

  return (
    <View style={styles.exerciseBlock}>
      <View style={styles.exerciseHeadingRow}>
        <View style={styles.exerciseCopy}>
          <Text style={styles.exerciseName}>{exerciseNumber}. {exercise.exercise.name}</Text>
          <Text style={styles.exerciseMeta}>
            {exercise.exercise.primaryMuscle} · {exercise.exercise.equipment}
          </Text>
        </View>
        <Pressable accessibilityLabel={`Remove ${exercise.exercise.name}`} hitSlop={10} onPress={confirmRemove}>
          <Text style={styles.removeExercise}>×</Text>
        </Pressable>
      </View>

      <View style={styles.setHeader}>
        <Text style={[styles.columnLabel, styles.setColumn]}>SET</Text>
        {!timed && <Text style={styles.columnLabel}>KG</Text>}
        <Text style={styles.columnLabel}>{timed ? 'TIME (SEC)' : 'REPS'}</Text>
        <View style={styles.checkColumn} />
      </View>
      {exercise.sets.map((set, index) => (
        <View key={set.clientId} style={[styles.setRow, set.completed && styles.completedRow]}>
          <Pressable
            accessibilityLabel={`Remove set ${index + 1}`}
            accessibilityRole="button"
            disabled={exercise.sets.length === 1}
            onLongPress={() => workout.removeSet(exercise.clientId, set.clientId)}
            style={[styles.setBadge, styles.setColumn]}>
            <Text style={styles.setBadgeText}>{formatSetLabel(set, index)}</Text>
          </Pressable>
          {!timed && (
            <ResultInput
              label={`Set ${index + 1} weight in kilograms`}
              onChange={(value) => workout.updateSet(exercise.clientId, set.clientId, 'weight', value)}
              value={set.weight}
            />
          )}
          <ResultInput
            label={`Set ${index + 1} ${timed ? 'time in seconds' : 'reps'}`}
            onChange={(value) => workout.updateSet(
              exercise.clientId,
              set.clientId,
              timed ? 'timeSeconds' : 'reps',
              value,
            )}
            value={timed ? set.timeSeconds : set.reps}
          />
          <Pressable
            accessibilityLabel={`${set.completed ? 'Mark unfinished' : 'Complete'} set ${index + 1}`}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: set.completed }}
            onPress={() => onToggleSet(exercise, set)}
            style={[styles.checkButton, set.completed && styles.checkButtonCompleted]}>
            <Text style={[styles.checkText, set.completed && styles.checkTextCompleted]}>✓</Text>
          </Pressable>
        </View>
      ))}
      <View style={styles.exerciseActions}>
        <Pressable onPress={() => workout.addSet(exercise.clientId)} style={styles.addSetButton}>
          <Text style={styles.addSetLabel}>+ ADD SET</Text>
        </Pressable>
        <Text style={styles.removeHint}>Hold set number to remove</Text>
      </View>
    </View>
  );
}

function ResultInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <TextInput
      accessibilityLabel={label}
      keyboardType="decimal-pad"
      maxLength={7}
      onChangeText={onChange}
      placeholder="—"
      placeholderTextColor={SetForgeColors.textDisabled}
      selectTextOnFocus
      style={styles.resultInput}
      value={value}
    />
  );
}

function FinishWorkoutModal({
  step,
  isSaving,
  onClose,
  onComplete,
  onCancelWorkout,
  onCompleteAnyway,
  onConfirmCancel,
}: {
  step: FinishStep;
  isSaving: boolean;
  onClose: () => void;
  onComplete: () => void;
  onCancelWorkout: () => void;
  onCompleteAnyway: () => void;
  onConfirmCancel: () => void;
}) {
  const content = step === 'unfinished'
    ? {
        title: 'Complete Unfinished Sets',
        message: 'Some sets are not checked. They will be saved as unfinished in your workout history.',
        primary: 'COMPLETE ANYWAY',
        primaryAction: onCompleteAnyway,
        secondary: 'GO BACK',
        secondaryAction: onClose,
      }
    : step === 'cancel'
      ? {
          title: 'Cancel Workout?',
          message: 'This workout will be cancelled and will not appear in completed history.',
          primary: 'CANCEL WORKOUT',
          primaryAction: onConfirmCancel,
          secondary: 'KEEP TRAINING',
          secondaryAction: onClose,
        }
      : {
          title: 'Finish Workout',
          message: 'Complete and save this workout, or cancel it without adding it to completed history.',
          primary: 'COMPLETE WORKOUT',
          primaryAction: onComplete,
          secondary: 'CANCEL WORKOUT',
          secondaryAction: onCancelWorkout,
        };

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={step !== 'closed'}>
      <Pressable onPress={onClose} style={styles.modalBackdrop}>
        <Pressable onPress={(event) => event.stopPropagation()} style={styles.modalCard}>
          <Text style={styles.modalTitle}>{content.title}</Text>
          <Text style={styles.modalMessage}>{content.message}</Text>
          <Pressable disabled={isSaving} onPress={content.primaryAction} style={styles.modalPrimary}>
            <Text style={styles.modalPrimaryLabel}>{content.primary}</Text>
          </Pressable>
          <Pressable disabled={isSaving} onPress={content.secondaryAction} style={styles.modalSecondary}>
            <Text style={styles.modalSecondaryLabel}>{content.secondary}</Text>
          </Pressable>
          {step === 'options' && (
            <Pressable onPress={onClose} style={styles.keepTraining}>
              <Text style={styles.keepTrainingLabel}>KEEP TRAINING</Text>
            </Pressable>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function WorkoutState({ message, loading, onBack }: { message: string; loading?: boolean; onBack?: () => void }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.stateContainer}>
        {loading && <ActivityIndicator color={SetForgeColors.accent} />}
        <Text style={styles.stateMessage}>{message}</Text>
        {onBack && <Pressable onPress={onBack}><Text style={styles.stateAction}>GO BACK</Text></Pressable>}
      </View>
    </SafeAreaView>
  );
}

function optionalNumber(value: string) {
  const normalized = value.trim().replace(',', '.');
  if (!normalized) return undefined;
  const number = Number(normalized);
  return Number.isFinite(number) ? number : undefined;
}

function toCompleteExerciseRequest(exercise: ActiveExercise): CompleteWorkoutExerciseRequest {
  return {
    id: exercise.id,
    exerciseId: exercise.exercise.id,
    notes: exercise.notes || undefined,
    sets: exercise.sets.map((set): CompleteWorkoutSetRequest => ({
      id: set.id,
      setType: set.setType,
      targetReps: optionalNumber(set.targetReps),
      targetWeight: optionalNumber(set.targetWeight),
      targetTimeSeconds: optionalNumber(set.targetTimeSeconds),
      restSeconds: optionalNumber(set.restSeconds),
      reps: optionalNumber(set.reps),
      weight: optionalNumber(set.weight),
      timeSeconds: optionalNumber(set.timeSeconds),
      completed: set.completed,
    })),
  };
}

function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function formatSetLabel(set: ActiveSet, index: number) {
  if (set.setType === 'WARM_UP') return 'W';
  if (set.setType === 'DROP_SET') return 'D';
  if (set.setType === 'FAILURE') return 'F';
  return (index + 1).toString();
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: SetForgeColors.canvas },
  screen: { flex: 1, width: '100%', maxWidth: 520, alignSelf: 'center' },
  header: {
    minHeight: 66,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: SetForgeColors.border,
    backgroundColor: SetForgeColors.surface,
  },
  headerSide: { width: 76 },
  minimizeLabel: { color: SetForgeColors.textSecondary, fontSize: 30, lineHeight: 30 },
  headerCopy: { flex: 1, alignItems: 'center', gap: 2 },
  title: { width: '100%', color: SetForgeColors.textPrimary, fontSize: 16, fontWeight: '800', textAlign: 'center' },
  elapsed: { color: SetForgeColors.accent, fontFamily: 'monospace', fontSize: 12, fontWeight: '800' },
  finishButton: { width: 76, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 5, backgroundColor: SetForgeColors.accent },
  finishLabel: { color: SetForgeColors.canvas, fontSize: 12, fontWeight: '900' },
  disabled: { opacity: 0.55 },
  restBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 11, backgroundColor: SetForgeColors.accentTint, borderBottomWidth: 1, borderBottomColor: 'rgba(0, 240, 255, 0.28)' },
  restLabel: { color: SetForgeColors.textSecondary, fontSize: 9, fontWeight: '800' },
  restTime: { marginTop: 1, color: SetForgeColors.accent, fontFamily: 'monospace', fontSize: 20, fontWeight: '800' },
  dismissRest: { color: SetForgeColors.accent, fontSize: 11, fontWeight: '800' },
  content: { paddingBottom: 42 },
  exerciseBlock: { gap: 11, paddingHorizontal: 20, paddingTop: 18, paddingBottom: 17, borderBottomWidth: 1, borderBottomColor: SetForgeColors.border },
  exerciseHeadingRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  exerciseCopy: { flex: 1, gap: 3 },
  exerciseName: { color: SetForgeColors.textPrimary, fontSize: 17, lineHeight: 22, fontWeight: '800', textTransform: 'capitalize' },
  exerciseMeta: { color: SetForgeColors.textSecondary, fontSize: 11, textTransform: 'capitalize' },
  removeExercise: { color: SetForgeColors.textSecondary, fontSize: 28, lineHeight: 28 },
  setHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  columnLabel: { flex: 1, color: SetForgeColors.textDisabled, fontFamily: 'monospace', fontSize: 9, fontWeight: '700', textAlign: 'center' },
  setColumn: { width: 45, flexGrow: 0, flexShrink: 0 },
  checkColumn: { width: 46 },
  setRow: { height: 48, flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 8 },
  completedRow: { backgroundColor: 'rgba(0, 240, 255, 0.04)' },
  setBadge: { height: 48, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(0, 240, 255, 0.2)', borderRadius: 8, backgroundColor: 'rgba(0, 240, 255, 0.05)' },
  setBadgeText: { color: SetForgeColors.accent, fontFamily: 'monospace', fontSize: 13, fontWeight: '800' },
  resultInput: { flex: 1, minWidth: 0, height: 48, paddingHorizontal: 5, borderWidth: 1, borderColor: SetForgeColors.border, borderRadius: 8, backgroundColor: SetForgeColors.surface, color: SetForgeColors.textPrimary, fontFamily: 'monospace', fontSize: 14, fontWeight: '700', textAlign: 'center' },
  checkButton: { width: 46, height: 48, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: SetForgeColors.border, borderRadius: 8, backgroundColor: SetForgeColors.surface },
  checkButtonCompleted: { borderColor: SetForgeColors.accent, backgroundColor: SetForgeColors.accent },
  checkText: { color: SetForgeColors.textDisabled, fontSize: 19, fontWeight: '900' },
  checkTextCompleted: { color: SetForgeColors.canvas },
  exerciseActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  addSetButton: { paddingVertical: 4 },
  addSetLabel: { color: SetForgeColors.accent, fontFamily: 'monospace', fontSize: 12, fontWeight: '800' },
  removeHint: { color: SetForgeColors.textDisabled, fontSize: 9 },
  emptyState: { alignItems: 'center', gap: 8, paddingHorizontal: 28, paddingTop: 58, paddingBottom: 36 },
  emptyTitle: { color: SetForgeColors.textPrimary, fontSize: 17, fontWeight: '800' },
  emptyMessage: { color: SetForgeColors.textSecondary, fontSize: 13, lineHeight: 18, textAlign: 'center' },
  errorText: { margin: 20, marginBottom: 0, padding: 12, borderRadius: 6, backgroundColor: 'rgba(239, 68, 68, 0.12)', color: '#FCA5A5', fontSize: 12, lineHeight: 18 },
  addExerciseButton: { height: 49, alignItems: 'center', justifyContent: 'center', margin: 20, borderRadius: 7, backgroundColor: SetForgeColors.accent },
  addExerciseLabel: { color: SetForgeColors.canvas, fontSize: 13, fontWeight: '900' },
  modalBackdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 22, backgroundColor: 'rgba(0, 0, 0, 0.76)' },
  modalCard: { width: '100%', maxWidth: 390, padding: 20, borderWidth: 1, borderColor: SetForgeColors.border, borderRadius: 13, backgroundColor: SetForgeColors.surface },
  modalTitle: { color: SetForgeColors.textPrimary, fontSize: 20, fontWeight: '800', textAlign: 'center' },
  modalMessage: { marginTop: 9, marginBottom: 20, color: SetForgeColors.textSecondary, fontSize: 13, lineHeight: 19, textAlign: 'center' },
  modalPrimary: { height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 6, backgroundColor: SetForgeColors.accent },
  modalPrimaryLabel: { color: SetForgeColors.canvas, fontSize: 12, fontWeight: '900' },
  modalSecondary: { height: 46, alignItems: 'center', justifyContent: 'center', marginTop: 9, borderWidth: 1, borderColor: '#EF4444', borderRadius: 6 },
  modalSecondaryLabel: { color: '#F87171', fontSize: 12, fontWeight: '800' },
  keepTraining: { alignItems: 'center', paddingTop: 16, paddingBottom: 2 },
  keepTrainingLabel: { color: SetForgeColors.textSecondary, fontSize: 11, fontWeight: '800' },
  stateContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 28 },
  stateMessage: { color: SetForgeColors.textSecondary, fontSize: 14, textAlign: 'center' },
  stateAction: { color: SetForgeColors.accent, fontSize: 12, fontWeight: '800' },
});
