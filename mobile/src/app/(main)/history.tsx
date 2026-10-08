import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { MenuAnchor } from '@/components/anchored-menu-modal';
import { SetForgeColors } from '@/constants/setforge-theme';
import { useActiveWorkout } from '@/features/workouts/active-workout/active-workout-context';
import { WorkoutCalendarModal } from '@/features/workouts/history/workout-calendar-modal';
import { WorkoutHistoryActionsModal } from '@/features/workouts/history/workout-history-actions-modal';
import { WorkoutHistoryPreviewModal } from '@/features/workouts/history/workout-history-preview-modal';
import type { WorkoutSession } from '@/models/workout-session';
import { cancelWorkoutSession, deleteWorkoutSession, getWorkoutHistory, startWorkoutSession } from '@/services/workout-session-api';
import { createWorkoutTemplate } from '@/services/workout-template-api';

export default function WorkoutHistoryScreen() {
  const router = useRouter();
  const activeWorkout = useActiveWorkout();
  const listRef = useRef<FlatList<WorkoutSession>>(null);
  const [workouts, setWorkouts] = useState<WorkoutSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewWorkout, setPreviewWorkout] = useState<WorkoutSession | null>(null);
  const [actionWorkout, setActionWorkout] = useState<WorkoutSession | null>(null);
  const [actionAnchor, setActionAnchor] = useState<MenuAnchor | null>(null);
  const [repeatWorkout, setRepeatWorkout] = useState<WorkoutSession | null>(null);
  const [showConflict, setShowConflict] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [highlightedWorkoutId, setHighlightedWorkoutId] = useState<number | null>(null);

  const loadHistory = useCallback(async (refreshing = false) => {
    if (refreshing) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);
    try { setWorkouts(await getWorkoutHistory()); }
    catch (loadError) { setError(loadError instanceof Error ? loadError.message : 'Could not load workout history.'); }
    finally { setIsLoading(false); setIsRefreshing(false); }
  }, []);

  useEffect(() => {
    let current = true;
    getWorkoutHistory()
      .then((history) => { if (current) setWorkouts(history); })
      .catch((loadError: unknown) => { if (current) setError(loadError instanceof Error ? loadError.message : 'Could not load workout history.'); })
      .finally(() => { if (current) setIsLoading(false); });
    return () => { current = false; };
  }, []);

  const deleteSavedWorkout = (workout: WorkoutSession) => {
    setActionWorkout(null);
    Alert.alert('Delete workout?', `${workout.name} will be permanently removed from your history.`, [
      { text: 'Keep', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => void (async () => {
        try {
          await deleteWorkoutSession(workout.id);
          setWorkouts((current) => current.filter(({ id }) => id !== workout.id));
          setPreviewWorkout((current) => current?.id === workout.id ? null : current);
        } catch (deleteError) {
          setError(deleteError instanceof Error ? deleteError.message : 'Could not delete the workout.');
        }
      })() },
    ]);
  };

  const requestPerformAgain = (workout: WorkoutSession) => {
    setActionWorkout(null);
    setRepeatWorkout(workout);
    if (activeWorkout.session?.status === 'IN_PROGRESS') setShowConflict(true);
    else void performAgain(workout);
  };

  const saveAsTemplate = async (workout: WorkoutSession) => {
    setActionWorkout(null);
    try {
      setError(null);
      const template = await createWorkoutTemplate({
        name: workout.name,
        description: `Created from workout completed ${formatWorkoutDate(
          workout.completedAt ?? workout.startedAt,
        )}.`,
        exercises: workout.exercises.map((exercise) => ({
          exerciseId: exercise.exerciseId,
          notes: exercise.notes,
          sets: exercise.sets.map((set) => ({
            setType: set.setType,
            targetReps:
              exercise.exerciseType === 'WEIGHT_AND_REPS'
                ? (set.reps ?? set.targetReps)
                : undefined,
            targetWeight:
              exercise.exerciseType === 'WEIGHT_AND_REPS'
                ? (set.weight ?? set.targetWeight)
                : undefined,
            targetTimeSeconds:
              exercise.exerciseType === 'TIMED'
                ? (set.timeSeconds ?? set.targetTimeSeconds ?? 30)
                : undefined,
            restSeconds: set.restSeconds,
          })),
        })),
      });
      Alert.alert('Template Saved', `${template.name} is now available in My Templates.`);
    } catch (templateError) {
      setError(
        templateError instanceof Error ? templateError.message : 'Could not save the template.',
      );
    }
  };

  const performAgain = async (workout: WorkoutSession) => {
    try {
      setIsStarting(true); setError(null); setShowConflict(false);
      const session = await startWorkoutSession({ sourceWorkoutSessionId: workout.id });
      activeWorkout.loadSession(session); setRepeatWorkout(null);
      activeWorkout.expand();
    } catch (startError) { setError(startError instanceof Error ? startError.message : 'Could not start the workout.'); }
    finally { setIsStarting(false); }
  };

  const discardAndPerformAgain = async () => {
    if (!activeWorkout.session || !repeatWorkout) return;
    try {
      setIsStarting(true);
      await cancelWorkoutSession(activeWorkout.session.id);
      activeWorkout.reset();
      const session = await startWorkoutSession({ sourceWorkoutSessionId: repeatWorkout.id });
      activeWorkout.loadSession(session); setShowConflict(false); setRepeatWorkout(null);
      activeWorkout.expand();
    } catch (startError) {
      setError(startError instanceof Error ? startError.message : 'Could not start the workout.');
      await activeWorkout.refreshActiveWorkout();
    } finally { setIsStarting(false); }
  };

  const selectCalendarWorkout = (workout: WorkoutSession) => {
    setShowCalendar(false); setHighlightedWorkoutId(workout.id);
    const index = workouts.findIndex(({ id }) => id === workout.id);
    if (index >= 0) {
      setTimeout(() => listRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.15 }), 100);
      setTimeout(() => setHighlightedWorkoutId(null), 2200);
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <View><Text style={styles.title}>History</Text><Text style={styles.subtitle}>Your completed workouts</Text></View>
          <Pressable accessibilityRole="button" onPress={() => setShowCalendar(true)} style={styles.calendarButton}><Text style={styles.calendarButtonLabel}>CALENDAR</Text></Pressable>
        </View>
        {isLoading ? <HistoryState loading title="Loading workout history..." /> : error && workouts.length === 0 ? (
          <HistoryState message={error} onRetry={() => void loadHistory()} title="Could not load your history" />
        ) : (
          <FlatList
            ref={listRef}
            contentContainerStyle={styles.listContent}
            data={workouts}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            keyExtractor={(workout) => workout.id.toString()}
            ListEmptyComponent={<HistoryState message="Complete a workout and it will appear here." title="No completed workouts yet" />}
            ListHeaderComponent={error ? <Text style={styles.inlineError}>{error}</Text> : null}
            onScrollToIndexFailed={({ index }) => listRef.current?.scrollToOffset({ offset: index * 260, animated: true })}
            refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => void loadHistory(true)} tintColor={SetForgeColors.accent} colors={[SetForgeColors.accent]} />}
            renderItem={({ item, index }) => <View>{(index === 0 || monthKey(workouts[index - 1]) !== monthKey(item)) && <Text style={styles.monthHeading}>{formatMonth(item)}</Text>}<WorkoutHistoryCard highlighted={item.id === highlightedWorkoutId} onMore={(anchor) => { setActionAnchor(anchor); setActionWorkout(item); }} onPress={() => setPreviewWorkout(item)} workout={item} /></View>}
            showsVerticalScrollIndicator={false}
          />
        )}
        <WorkoutHistoryPreviewModal onClose={() => setPreviewWorkout(null)} workout={previewWorkout} />
        <WorkoutHistoryActionsModal
          anchor={actionAnchor}
          onClose={() => { setActionWorkout(null); setActionAnchor(null); }}
          onDelete={deleteSavedWorkout}
          onEdit={(workout) => { setActionWorkout(null); router.push({ pathname: '/edit-workout/[id]', params: { id: workout.id.toString() } }); }}
          onPerformAgain={requestPerformAgain}
          onSaveAsTemplate={(workout) => void saveAsTemplate(workout)}
          workout={actionWorkout}
        />
        <WorkoutCalendarModal onClose={() => setShowCalendar(false)} onSelectWorkout={selectCalendarWorkout} visible={showCalendar} workouts={workouts} />
        <WorkoutConflictModal
          isBusy={isStarting}
          onClose={() => { setShowConflict(false); setRepeatWorkout(null); }}
          onResume={() => { setShowConflict(false); setRepeatWorkout(null); activeWorkout.expand(); }}
          onStartNew={() => void discardAndPerformAgain()}
          visible={showConflict}
        />
      </View>
    </SafeAreaView>
  );
}

function WorkoutHistoryCard({ workout, highlighted, onPress, onMore }: { workout: WorkoutSession; highlighted: boolean; onPress: () => void; onMore: (anchor: MenuAnchor) => void }) {
  const moreButtonRef = useRef<View>(null);
  const completedSets = workout.exercises.reduce((total, exercise) => total + exercise.sets.filter((set) => set.completed).length, 0);
  const totalSets = workout.exercises.reduce((total, exercise) => total + exercise.sets.length, 0);
  const visibleExercises = workout.exercises.slice(0, 3);
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.card, highlighted && styles.highlightedCard, pressed && styles.pressedCard]}>
    <View style={styles.cardHeader}><View style={styles.cardHeading}><Text numberOfLines={2} style={styles.workoutName}>{workout.name}</Text><Text style={styles.workoutDate}>{formatWorkoutDate(workout.completedAt ?? workout.startedAt)}</Text></View><Pressable accessibilityLabel={`Options for ${workout.name}`} hitSlop={10} ref={moreButtonRef} onPress={(event) => { event.stopPropagation(); moreButtonRef.current?.measureInWindow((x, y, width, height) => onMore({ x, y, width, height })); }} style={styles.moreButton}><Text style={styles.moreLabel}>•••</Text></Pressable></View>
    <View style={styles.metrics}><HistoryMetric label="DURATION" value={formatDuration(workout.startedAt, workout.completedAt)} /><View style={styles.metricDivider} /><HistoryMetric label="EXERCISES" value={workout.exercises.length.toString()} /><View style={styles.metricDivider} /><HistoryMetric label="SETS" value={`${completedSets}/${totalSets}`} /></View>
    {visibleExercises.length > 0 && <View style={styles.exerciseList}>{visibleExercises.map((exercise) => <View key={exercise.id} style={styles.exerciseRow}><Text numberOfLines={1} style={styles.exerciseName}>{exercise.exerciseName}</Text><Text style={styles.exerciseSets}>{exercise.sets.filter((set) => set.completed).length}/{exercise.sets.length} sets</Text></View>)}{workout.exercises.length > visibleExercises.length && <Text style={styles.moreExercises}>+ {workout.exercises.length - visibleExercises.length} more exercises</Text>}</View>}
  </Pressable>;
}

function WorkoutConflictModal({ visible, isBusy, onStartNew, onResume, onClose }: { visible: boolean; isBusy: boolean; onStartNew: () => void; onResume: () => void; onClose: () => void }) {
  return <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}><Pressable onPress={onClose} style={styles.conflictBackdrop}><Pressable onPress={(event) => event.stopPropagation()} style={styles.conflictCard}><Text style={styles.conflictEmoji}>🤔</Text><Text style={styles.conflictTitle}>Workout in Progress</Text><Text style={styles.conflictMessage}>Starting this saved workout will cancel your current workout.</Text><Pressable disabled={isBusy} onPress={onStartNew} style={[styles.conflictAction, styles.startNew]}><Text style={styles.startNewLabel}>{isBusy ? 'STARTING...' : 'START NEW WORKOUT'}</Text></Pressable><Pressable onPress={onResume} style={styles.conflictAction}><Text style={styles.conflictActionLabel}>RESUME CURRENT WORKOUT</Text></Pressable><Pressable onPress={onClose} style={styles.conflictAction}><Text style={styles.conflictActionLabel}>DO NOTHING</Text></Pressable></Pressable></Pressable></Modal>;
}

function HistoryMetric({ label, value }: { label: string; value: string }) { return <View style={styles.metric}><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></View>; }
function HistoryState({ title, message, loading, onRetry }: { title: string; message?: string; loading?: boolean; onRetry?: () => void }) { return <View style={styles.stateContainer}>{loading && <ActivityIndicator color={SetForgeColors.accent} />}<Text style={styles.stateTitle}>{title}</Text>{message && <Text style={styles.stateMessage}>{message}</Text>}{onRetry && <Pressable onPress={onRetry} style={styles.retryButton}><Text style={styles.retryLabel}>TRY AGAIN</Text></Pressable>}</View>; }
function workoutDate(workout: WorkoutSession) { return new Date(workout.completedAt ?? workout.startedAt); }
function monthKey(workout: WorkoutSession) { const date = workoutDate(workout); return `${date.getFullYear()}-${date.getMonth()}`; }
function formatMonth(workout: WorkoutSession) { return new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(workoutDate(workout)).toUpperCase(); }
function formatWorkoutDate(value: string) { return new Intl.DateTimeFormat(undefined, { weekday: 'long', day: 'numeric', month: 'short' }).format(new Date(value)); }
function formatDuration(startedAt: string, completedAt?: string) { if (!completedAt) return '—'; const total = Math.max(0, Math.floor((new Date(completedAt).getTime() - new Date(startedAt).getTime()) / 1000)); const hours = Math.floor(total / 3600); const minutes = Math.floor((total % 3600) / 60); return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`; }

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: SetForgeColors.canvas }, screen: { flex: 1, width: '100%', maxWidth: 440, alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16 }, title: { color: SetForgeColors.textPrimary, fontSize: 24, fontWeight: '800' }, subtitle: { marginTop: 3, color: SetForgeColors.textSecondary, fontSize: 13 }, calendarButton: { paddingHorizontal: 12, paddingVertical: 9, borderWidth: 1, borderColor: SetForgeColors.accent, borderRadius: 6 }, calendarButtonLabel: { color: SetForgeColors.accent, fontSize: 10, fontWeight: '900' },
  listContent: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 28 }, separator: { height: 12 }, monthHeading: { marginTop: 8, marginBottom: 10, color: SetForgeColors.textSecondary, fontSize: 12, fontWeight: '800' }, inlineError: { marginBottom: 12, padding: 10, borderRadius: 5, backgroundColor: 'rgba(239, 68, 68, 0.12)', color: '#FCA5A5', fontSize: 12 },
  card: { overflow: 'hidden', borderWidth: 1, borderColor: SetForgeColors.border, borderRadius: 9, backgroundColor: SetForgeColors.surface }, highlightedCard: { borderColor: SetForgeColors.accent, shadowColor: SetForgeColors.accent, shadowOpacity: 0.28, shadowRadius: 9 }, pressedCard: { opacity: 0.78 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 15 }, cardHeading: { flex: 1, gap: 4 }, workoutName: { color: SetForgeColors.textPrimary, fontSize: 17, fontWeight: '800' }, workoutDate: { color: SetForgeColors.textSecondary, fontSize: 11 }, moreButton: { minWidth: 38, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 6, backgroundColor: SetForgeColors.accentTint }, moreLabel: { color: SetForgeColors.accent, fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  metrics: { height: 58, flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderBottomWidth: 1, borderColor: SetForgeColors.border, backgroundColor: SetForgeColors.surfaceMuted }, metric: { flex: 1, alignItems: 'center', gap: 2 }, metricDivider: { width: 1, height: 27, backgroundColor: SetForgeColors.border }, metricValue: { color: SetForgeColors.textPrimary, fontFamily: 'monospace', fontSize: 13, fontWeight: '800' }, metricLabel: { color: SetForgeColors.textDisabled, fontFamily: 'monospace', fontSize: 8, fontWeight: '700' },
  exerciseList: { gap: 8, padding: 13 }, exerciseRow: { flexDirection: 'row', alignItems: 'center', gap: 12 }, exerciseName: { flex: 1, color: SetForgeColors.textPrimary, fontSize: 12, fontWeight: '600', textTransform: 'capitalize' }, exerciseSets: { color: SetForgeColors.textSecondary, fontFamily: 'monospace', fontSize: 10 }, moreExercises: { color: SetForgeColors.accent, fontSize: 10, fontWeight: '700' },
  stateContainer: { flex: 1, minHeight: 260, alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 28 }, stateTitle: { color: SetForgeColors.textPrimary, fontSize: 16, fontWeight: '700', textAlign: 'center' }, stateMessage: { color: SetForgeColors.textSecondary, fontSize: 13, lineHeight: 18, textAlign: 'center' }, retryButton: { paddingHorizontal: 18, paddingVertical: 10, borderWidth: 1, borderColor: SetForgeColors.accent, borderRadius: 5 }, retryLabel: { color: SetForgeColors.accent, fontSize: 12, fontWeight: '800' },
  conflictBackdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 22, backgroundColor: 'rgba(0,0,0,0.78)' }, conflictCard: { width: '100%', maxWidth: 390, padding: 22, borderWidth: 1, borderColor: SetForgeColors.border, borderRadius: 15, backgroundColor: SetForgeColors.surfaceMuted }, conflictEmoji: { fontSize: 38, textAlign: 'center' }, conflictTitle: { marginTop: 10, color: SetForgeColors.textPrimary, fontSize: 20, fontWeight: '800', textAlign: 'center' }, conflictMessage: { marginTop: 10, marginBottom: 18, color: SetForgeColors.textSecondary, fontSize: 14, lineHeight: 20, textAlign: 'center' }, conflictAction: { height: 48, alignItems: 'center', justifyContent: 'center', marginTop: 9, borderRadius: 7, backgroundColor: SetForgeColors.surface }, startNew: { marginTop: 0, backgroundColor: '#FF5964' }, startNewLabel: { color: '#FFF', fontSize: 12, fontWeight: '900' }, conflictActionLabel: { color: SetForgeColors.textPrimary, fontSize: 12, fontWeight: '800' },
});
