import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  BackHandler,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RestTimerControl, formatRestTime } from '@/components/rest-timer-control';
import { ReorderableExerciseList } from '@/components/reorderable-exercise-list';
import { DEVELOPMENT_USER_ID } from '@/constants/development';
import { SetForgeColors } from '@/constants/setforge-theme';
import {
  type ActiveExercise,
  type ActiveSet,
  useActiveWorkout,
} from '@/features/workouts/active-workout/active-workout-context';
import {
  formatPreviousResult,
  previousSetAt,
  usePreviousPerformances,
} from '@/features/workouts/previous-performance';
import type {
  CompleteWorkoutExerciseRequest,
  CompleteWorkoutSetRequest,
  PreviousExercisePerformance,
} from '@/models/workout-session';
import {
  cancelWorkoutSession,
  completeWorkoutSession,
} from '@/services/workout-session-api';

type FinishStep = 'closed' | 'options' | 'unfinished' | 'cancel';
type ActiveRestTimer = {
  setClientId: string;
  endsAt: number;
  totalSeconds: number;
};

export function ActiveWorkoutSheet() {
  const router = useRouter();
  const workout = useActiveWorkout();
  const { collapse, isExpanded } = workout;
  const { height: windowHeight } = useWindowDimensions();
  const [translateY] = useState(() => new Animated.Value(windowHeight));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now);
  const [activeRestTimer, setActiveRestTimer] = useState<ActiveRestTimer | null>(null);
  const [finishStep, setFinishStep] = useState<FinishStep>('closed');
  const cancellationPendingRef = useRef(false);
  const previousPerformances = usePreviousPerformances(
    DEVELOPMENT_USER_ID,
    workout.exercises.map(({ exercise }) => exercise.id),
  );

  const springTo = useCallback((toValue: number, velocity = 0) => {
    translateY.stopAnimation();
    return Animated.spring(translateY, {
      toValue,
      velocity,
      damping: 30,
      stiffness: 290,
      mass: 0.85,
      overshootClamping: true,
      restDisplacementThreshold: 0.5,
      restSpeedThreshold: 0.5,
      useNativeDriver: true,
    });
  }, [translateY]);

  const closeSheet = useCallback((velocity = 0) => {
    springTo(windowHeight, Math.max(0, velocity)).start(({ finished }) => {
      if (finished) collapse();
    });
  }, [collapse, springTo, windowHeight]);

  useEffect(() => {
    if (!workout.session) {
      translateY.setValue(windowHeight);
      return;
    }

    springTo(isExpanded ? 0 : windowHeight).start();
  }, [isExpanded, springTo, translateY, windowHeight, workout.session]);

  useEffect(() => {
    if (!isExpanded) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      closeSheet();
      return true;
    });
    return () => subscription.remove();
  }, [closeSheet, isExpanded]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) =>
          gesture.dy > 7 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
        onPanResponderGrant: () => {
          translateY.stopAnimation();
          translateY.extractOffset();
        },
        onPanResponderMove: (_, gesture) => {
          translateY.setValue(Math.max(0, gesture.dy));
        },
        onPanResponderRelease: (_, gesture) => {
          translateY.flattenOffset();
          const projectedDistance = gesture.dy + Math.max(0, gesture.vy) * 140;
          if (projectedDistance > 105) {
            closeSheet(gesture.vy);
            return;
          }
          springTo(0, gesture.vy).start();
        },
        onPanResponderTerminate: () => {
          translateY.flattenOffset();
          springTo(0).start();
        },
      }),
    [closeSheet, springTo, translateY],
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!activeRestTimer) return;

    const updateRestTimer = () => {
      const currentTime = Date.now();
      setNow(currentTime);
      if (currentTime >= activeRestTimer.endsAt) {
        setActiveRestTimer(null);
      }
    };

    updateRestTimer();
    const interval = setInterval(updateRestTimer, 200);
    return () => clearInterval(interval);
  }, [activeRestTimer]);

  const elapsedSeconds = useMemo(() => {
    if (!workout.session) return 0;
    return Math.max(0, Math.floor((now - new Date(workout.session.startedAt).getTime()) / 1000));
  }, [now, workout.session]);
  const restSeconds = activeRestTimer
    ? Math.max(0, Math.ceil((activeRestTimer.endsAt - now) / 1000))
    : 0;

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
    if (!set.completed) {
      const seconds = Number(set.restSeconds);
      if (Number.isFinite(seconds) && seconds > 0) {
        const startedAt = Date.now();
        setNow(startedAt);
        setActiveRestTimer({
          setClientId: set.clientId,
          endsAt: startedAt + seconds * 1000,
          totalSeconds: seconds,
        });
      }
      requestAnimationFrame(() => workout.toggleSet(exercise.clientId, set.clientId));
    } else if (activeRestTimer?.setClientId === set.clientId) {
      setActiveRestTimer(null);
      workout.toggleSet(exercise.clientId, set.clientId);
    } else {
      workout.toggleSet(exercise.clientId, set.clientId);
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
    if (!workout.session) return;
    try {
      setIsSaving(true);
      setError(null);
      setFinishStep('closed');
      await completeWorkoutSession(workout.session.id, {
        exercises: workout.exercises.map(toCompleteExerciseRequest),
      });
      workout.reset();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not complete the workout.');
    } finally {
      setIsSaving(false);
    }
  };

  const cancelWorkout = async () => {
    if (!workout.session || cancellationPendingRef.current) return;
    cancellationPendingRef.current = true;
    try {
      setIsSaving(true);
      setError(null);
      setFinishStep('closed');
      await cancelWorkoutSession(workout.session.id);
      workout.reset();
    } catch (cancelError) {
      setError(cancelError instanceof Error ? cancelError.message : 'Could not cancel the workout.');
    } finally {
      cancellationPendingRef.current = false;
      setIsSaving(false);
    }
  };

  if (!workout.session) return null;

  return (
    <Animated.View
      pointerEvents={isExpanded ? 'auto' : 'none'}
      style={[styles.sheet, { transform: [{ translateY }] }]}>
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <View style={styles.screen}>
          <View {...panResponder.panHandlers} style={styles.header}>
            <Pressable
              accessibilityHint="Keeps the workout running in the bottom bar"
              accessibilityLabel="Minimize workout"
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => closeSheet()}
              style={styles.dragHandleButton}>
              <View style={styles.dragHandle} />
            </Pressable>
            <View style={styles.headerSide} />
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

          <ReorderableExerciseList
            contentContainerStyle={styles.content}
            data={workout.exercises}
            getExerciseMeta={({ exercise }) => `${exercise.primaryMuscle} · ${exercise.equipment}`}
            getExerciseName={({ exercise }) => exercise.name}
            keyExtractor={(item) => item.clientId}
            onMove={workout.moveExercise}
            emptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>Your workout is running</Text>
                <Text style={styles.emptyMessage}>Add your first exercise and start recording sets.</Text>
              </View>
            }
            footerComponent={<>
              {error && <Text style={styles.errorText}>{error}</Text>}
              <Pressable
              accessibilityRole="button"
              onPress={() => {
                collapse();
                router.push('/active-workout/exercises');
              }}
              style={styles.addExerciseButton}>
              <Text style={styles.addExerciseLabel}>+ ADD EXERCISE</Text>
              </Pressable>
            </>}
            renderExpandedItem={({ drag, index, isActive, item }) => (
              <WorkoutExercise
                exercise={item}
                exerciseNumber={index + 1}
                activeRestSetClientId={activeRestTimer?.setClientId ?? null}
                isDragging={isActive}
                onLongPressDrag={drag}
                onSkipRest={() => setActiveRestTimer(null)}
                onToggleSet={toggleSet}
                previousPerformance={previousPerformances.get(item.exercise.id)}
                restRemainingSeconds={restSeconds}
                restTotalSeconds={activeRestTimer?.totalSeconds ?? 0}
              />
            )}
          />
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
    </Animated.View>
  );
}

function WorkoutExercise({
  exercise,
  exerciseNumber,
  activeRestSetClientId,
  isDragging,
  onLongPressDrag,
  onSkipRest,
  onToggleSet,
  previousPerformance,
  restRemainingSeconds,
  restTotalSeconds,
}: {
  exercise: ActiveExercise;
  exerciseNumber: number;
  activeRestSetClientId: string | null;
  isDragging: boolean;
  onLongPressDrag: () => void;
  onSkipRest: () => void;
  onToggleSet: (exercise: ActiveExercise, set: ActiveSet) => void;
  previousPerformance?: PreviousExercisePerformance;
  restRemainingSeconds: number;
  restTotalSeconds: number;
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
    <View style={[styles.exerciseBlock, isDragging && styles.draggingExerciseBlock]}>
      <View style={styles.exerciseHeadingRow}>
        <Pressable delayLongPress={300} onLongPress={onLongPressDrag} style={styles.exerciseCopy}>
          <Text style={styles.exerciseName}>{exerciseNumber}. {exercise.exercise.name}</Text>
          <Text style={styles.exerciseMeta}>
            {exercise.exercise.primaryMuscle} · {exercise.exercise.equipment}
          </Text>
        </Pressable>
        <Pressable
          accessibilityLabel={`Hold and drag to reorder ${exercise.exercise.name}`}
          accessibilityRole="button"
          delayLongPress={300}
          onLongPress={onLongPressDrag}
          style={styles.exerciseDragHandle}>
          <Text style={styles.exerciseDragHandleIcon}>≡</Text>
        </Pressable>
        <Pressable accessibilityLabel={`Remove ${exercise.exercise.name}`} hitSlop={10} onPress={confirmRemove}>
          <Text style={styles.removeExercise}>×</Text>
        </Pressable>
      </View>

      <View style={styles.setHeader}>
        <Text style={[styles.columnLabel, styles.setColumn]}>Set</Text>
        <View style={styles.previousColumn}>
          <Text style={styles.columnLabel}>Previous</Text>
        </View>
        {!timed && (
          <View style={styles.metricColumn}>
            <Text style={styles.columnLabel}>kg</Text>
          </View>
        )}
        <View style={styles.metricColumn}>
          <Text style={styles.columnLabel}>{timed ? 'Time' : 'Reps'}</Text>
        </View>
        <View style={styles.checkColumn} />
      </View>
      <View>
        {exercise.sets.map((set, index) => {
          const isActiveRestSet = activeRestSetClientId === set.clientId && restRemainingSeconds > 0;
          const previousSetCompleted = index > 0 && exercise.sets[index - 1].completed;
          const nextSetCompleted = index < exercise.sets.length - 1 && exercise.sets[index + 1].completed;

          return (
          <View key={set.clientId} style={styles.setGroup}>
            <View
              style={[
                set.completed && styles.completedSetGroup,
                set.completed && !previousSetCompleted && styles.completedSetGroupStart,
                set.completed && !nextSetCompleted && styles.completedSetGroupEnd,
              ]}>
            <View style={[styles.setRow, set.completed && styles.completedSetRow]}>
              <Pressable
                accessibilityLabel={`Remove set ${index + 1}`}
                accessibilityRole="button"
                disabled={exercise.sets.length === 1}
                onLongPress={() => workout.removeSet(exercise.clientId, set.clientId)}
                style={[styles.setBadge, styles.setColumn, set.completed && styles.completedSetBadge]}>
                <Text style={[styles.setBadgeText, set.completed && styles.completedValue]}>
                  {formatSetLabel(set, index)}
                </Text>
              </Pressable>
              <View style={styles.previousColumn}>
                <Text
                  numberOfLines={1}
                  style={[styles.previousValue, set.completed && styles.completedPreviousValue]}>
                  {formatPreviousResult(previousSetAt(previousPerformance, index), exercise.exercise.exerciseType)}
                </Text>
              </View>
              {!timed && (
                <ResultInput
                  label={`Set ${index + 1} weight in kilograms`}
                  onChange={(value) => workout.updateSet(exercise.clientId, set.clientId, 'weight', value)}
                  completed={set.completed}
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
                completed={set.completed}
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
            {!isActiveRestSet && (
              <RestTimerControl
                flushBottom={set.completed}
                onChange={(value) => workout.updateSet(exercise.clientId, set.clientId, 'restSeconds', value)}
                value={set.restSeconds}
              />
            )}
            </View>
            {isActiveRestSet && (
              <ActiveRestCountdown
                onSkip={onSkipRest}
                remainingSeconds={restRemainingSeconds}
                totalSeconds={restTotalSeconds}
              />
            )}
          </View>
          );
        })}
      </View>
      <View style={styles.exerciseActions}>
        <Pressable onPress={() => workout.addSet(exercise.clientId)} style={styles.addSetButton}>
          <Text style={styles.addSetLabel}>
            + ADD SET ({formatRestTime(exercise.sets.at(-1)?.restSeconds)})
          </Text>
        </Pressable>
        <Text style={styles.removeHint}>Hold set number to remove</Text>
      </View>
    </View>
  );
}

function ActiveRestCountdown({
  remainingSeconds,
  totalSeconds,
  onSkip,
}: {
  remainingSeconds: number;
  totalSeconds: number;
  onSkip: () => void;
}) {
  const progress = totalSeconds > 0
    ? Math.max(0, Math.min(100, (remainingSeconds / totalSeconds) * 100))
    : 0;

  return (
    <Pressable
      accessibilityHint="Double tap to skip the remaining rest time"
      accessibilityLabel={`Rest timer ${formatDuration(remainingSeconds)}`}
      accessibilityRole="button"
      onPress={onSkip}
      style={styles.activeRestTrack}>
      <View style={[styles.activeRestProgress, { width: `${progress}%` }]} />
      <Text style={styles.activeRestTime}>{formatDuration(remainingSeconds)}</Text>
    </Pressable>
  );
}

function ResultInput({
  label,
  value,
  onChange,
  completed,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  completed?: boolean;
}) {
  return (
    <View style={styles.metricColumn}>
      <TextInput
        accessibilityLabel={label}
        keyboardType="decimal-pad"
        maxLength={7}
        onChangeText={onChange}
        placeholder="—"
        placeholderTextColor={SetForgeColors.textDisabled}
        selectTextOnFocus
        style={[styles.resultInput, completed && styles.completedResultInput]}
        value={value}
      />
    </View>
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
          message: 'This workout and its entered results will be permanently discarded.',
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
  sheet: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 100,
    elevation: 20,
    backgroundColor: SetForgeColors.canvas,
  },
  flex: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: SetForgeColors.canvas },
  screen: { flex: 1, width: '100%', maxWidth: 520, alignSelf: 'center' },
  header: {
    minHeight: 74,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 17,
    paddingBottom: 7,
    borderBottomWidth: 1,
    borderBottomColor: SetForgeColors.border,
    backgroundColor: SetForgeColors.surface,
  },
  headerSide: { width: 76 },
  dragHandleButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    left: 0,
    height: 23,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  dragHandle: {
    width: 42,
    height: 5,
    borderRadius: 3,
    backgroundColor: SetForgeColors.textDisabled,
  },
  headerCopy: { flex: 1, alignItems: 'center', gap: 2 },
  title: { width: '100%', color: SetForgeColors.textPrimary, fontSize: 16, fontWeight: '800', textAlign: 'center' },
  elapsed: { color: SetForgeColors.accent, fontFamily: 'monospace', fontSize: 12, fontWeight: '800' },
  finishButton: { width: 76, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 5, backgroundColor: SetForgeColors.accent },
  finishLabel: { color: SetForgeColors.canvas, fontSize: 12, fontWeight: '900' },
  disabled: { opacity: 0.55 },
  content: { paddingBottom: 42 },
  exerciseBlock: { gap: 9, paddingHorizontal: 18, paddingTop: 16, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: SetForgeColors.border },
  draggingExerciseBlock: { borderColor: SetForgeColors.accent, backgroundColor: SetForgeColors.accentTint },
  exerciseHeadingRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  exerciseCopy: { flex: 1, gap: 3 },
  exerciseName: { color: SetForgeColors.textPrimary, fontSize: 17, lineHeight: 21, fontWeight: '800', textTransform: 'capitalize' },
  exerciseMeta: { color: SetForgeColors.textSecondary, fontSize: 11, textTransform: 'capitalize' },
  exerciseDragHandle: { width: 34, height: 30, alignItems: 'center', justifyContent: 'center' },
  exerciseDragHandleIcon: { color: SetForgeColors.textSecondary, fontSize: 25, lineHeight: 25, fontWeight: '700' },
  removeExercise: { color: SetForgeColors.textSecondary, fontSize: 28, lineHeight: 28 },
  setHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  columnLabel: { color: SetForgeColors.textDisabled, fontSize: 10, fontWeight: '700', textAlign: 'center' },
  setColumn: { width: 34, flexGrow: 0, flexShrink: 0 },
  previousColumn: { flex: 1.45, minWidth: 0 },
  metricColumn: { flex: 0.85, minWidth: 0 },
  previousValue: { color: SetForgeColors.textSecondary, fontSize: 13, textAlign: 'center' },
  checkColumn: { width: 34 },
  setGroup: { marginBottom: 0 },
  setRow: { height: 36, flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 7 },
  completedSetRow: { height: 42 },
  completedSetGroup: {
    marginHorizontal: -18,
    paddingHorizontal: 18,
    backgroundColor: 'rgba(0, 240, 255, 0.13)',
  },
  completedSetGroupStart: { marginTop: 4, paddingTop: 4 },
  completedSetGroupEnd: { marginBottom: 5 },
  setBadge: { height: 36, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(0, 240, 255, 0.2)', borderRadius: 7, backgroundColor: 'rgba(0, 240, 255, 0.05)' },
  setBadgeText: { color: SetForgeColors.accent, fontFamily: 'monospace', fontSize: 12, fontWeight: '800' },
  completedSetBadge: { borderColor: 'transparent', backgroundColor: 'transparent' },
  completedValue: { color: SetForgeColors.textPrimary },
  completedPreviousValue: { color: SetForgeColors.textSecondary },
  resultInput: { width: '100%', height: 36, paddingHorizontal: 4, borderWidth: 1, borderColor: SetForgeColors.border, borderRadius: 7, backgroundColor: SetForgeColors.surface, color: SetForgeColors.textPrimary, fontFamily: 'monospace', fontSize: 13, fontWeight: '700', textAlign: 'center' },
  completedResultInput: { borderColor: 'transparent', backgroundColor: 'transparent' },
  checkButton: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: SetForgeColors.border, borderRadius: 7, backgroundColor: SetForgeColors.surface },
  checkButtonCompleted: { borderColor: SetForgeColors.accent, backgroundColor: SetForgeColors.accent },
  checkText: { color: SetForgeColors.textDisabled, fontSize: 16, fontWeight: '600' },
  checkTextCompleted: { color: SetForgeColors.canvas },
  activeRestTrack: {
    height: 30,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderRadius: 5,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
  },
  activeRestProgress: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(217, 119, 6, 0.88)',
  },
  activeRestTime: {
    color: SetForgeColors.textPrimary,
    fontFamily: 'monospace',
    fontSize: 15,
    fontWeight: '900',
  },
  exerciseActions: { alignItems: 'center', gap: 5 },
  addSetButton: { width: '100%', height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 6, backgroundColor: SetForgeColors.surfaceMuted },
  addSetLabel: { color: SetForgeColors.textPrimary, fontFamily: 'monospace', fontSize: 11, fontWeight: '800' },
  removeHint: { color: SetForgeColors.textDisabled, fontSize: 9, textAlign: 'center' },
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
});
