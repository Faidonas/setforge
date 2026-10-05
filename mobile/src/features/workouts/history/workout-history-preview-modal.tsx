import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { SetForgeColors } from '@/constants/setforge-theme';
import type { WorkoutSession, WorkoutSet } from '@/models/workout-session';

export function WorkoutHistoryPreviewModal({
  workout,
  onClose,
}: {
  workout: WorkoutSession | null;
  onClose: () => void;
}) {
  return (
    <Modal animationType="fade" onRequestClose={onClose} statusBarTranslucent transparent visible={workout !== null}>
      <View style={styles.backdrop}>
        <Pressable
          accessibilityLabel="Close workout preview"
          onPress={onClose}
          style={styles.backdropDismissArea}
        />
        <View accessibilityViewIsModal style={styles.card}>
          {workout && (
            <>
              <View style={styles.header}>
                <View style={styles.headerSide}>
                  <Pressable accessibilityLabel="Close workout preview" hitSlop={10} onPress={onClose}>
                    <Text style={styles.close}>×</Text>
                  </Pressable>
                </View>
                <View style={styles.headerCopy}>
                  <Text numberOfLines={2} style={styles.title}>{workout.name}</Text>
                  <Text style={styles.date}>{formatDate(workout.completedAt ?? workout.startedAt)}</Text>
                </View>
                <View style={styles.headerSide} />
              </View>

              <View style={styles.summary}>
                <Summary value={formatDuration(workout)} label="DURATION" />
                <View style={styles.divider} />
                <Summary value={workout.exercises.length.toString()} label="EXERCISES" />
                <View style={styles.divider} />
                <Summary value={countCompletedSets(workout).toString()} label="SETS" />
              </View>

              <ScrollView
                contentContainerStyle={styles.content}
                nestedScrollEnabled
                persistentScrollbar
                showsVerticalScrollIndicator
                style={styles.exerciseScroll}>
                {workout.exercises.map((exercise) => (
                  <View key={exercise.id} style={styles.exerciseBlock}>
                    <Text style={styles.exerciseName}>{exercise.exerciseName}</Text>
                    <Text style={styles.exerciseMeta}>
                      {exercise.primaryMuscle} · {exercise.equipment}
                    </Text>
                    {exercise.notes && <Text style={styles.notes}>{exercise.notes}</Text>}
                    <View style={styles.setHeader}>
                      <Text style={[styles.columnLabel, styles.setNumber]}>SET</Text>
                      <Text style={styles.columnLabel}>RESULT</Text>
                      <Text style={[styles.columnLabel, styles.statusColumn]}>STATUS</Text>
                    </View>
                    {exercise.sets.map((set, index) => (
                      <View key={set.id} style={styles.setRow}>
                        <Text style={[styles.setValue, styles.setNumber]}>{index + 1}</Text>
                        <Text style={styles.setResult}>{formatSetResult(set, exercise.exerciseType)}</Text>
                        <Text style={[styles.setStatus, styles.statusColumn, set.completed && styles.completed]}>
                          {set.completed ? '✓' : '—'}
                        </Text>
                      </View>
                    ))}
                  </View>
                ))}
              </ScrollView>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

function Summary({ value, label }: { value: string; label: string }) {
  return <View style={styles.summaryItem}><Text style={styles.summaryValue}>{value}</Text><Text style={styles.summaryLabel}>{label}</Text></View>;
}

function formatSetResult(set: WorkoutSet, exerciseType: 'WEIGHT_AND_REPS' | 'TIMED') {
  if (exerciseType === 'TIMED') return `${set.timeSeconds ?? set.targetTimeSeconds ?? 0} sec`;
  const reps = set.reps ?? set.targetReps ?? 0;
  const weight = set.weight ?? set.targetWeight;
  return weight === undefined ? `${reps} reps` : `${weight} kg × ${reps}`;
}

function countCompletedSets(workout: WorkoutSession) {
  return workout.exercises.reduce((total, exercise) => total + exercise.sets.filter((set) => set.completed).length, 0);
}

function formatDuration(workout: WorkoutSession) {
  if (!workout.completedAt) return '—';
  const seconds = Math.max(0, Math.floor((new Date(workout.completedAt).getTime() - new Date(workout.startedAt).getTime()) / 1000));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 18, backgroundColor: 'rgba(0, 0, 0, 0.76)' },
  backdropDismissArea: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  card: { width: '100%', maxWidth: 440, height: '86%', overflow: 'hidden', borderWidth: 1, borderColor: SetForgeColors.border, borderRadius: 15, backgroundColor: SetForgeColors.surface },
  header: { minHeight: 72, flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: SetForgeColors.border },
  headerSide: { width: 42 },
  headerCopy: { flex: 1, alignItems: 'center', gap: 3 },
  close: { color: SetForgeColors.textSecondary, fontSize: 31, lineHeight: 32 },
  title: { width: '100%', color: SetForgeColors.textPrimary, fontSize: 18, fontWeight: '800', textAlign: 'center' },
  date: { color: SetForgeColors.textSecondary, fontSize: 10, textAlign: 'center' },
  summary: { height: 62, flexDirection: 'row', alignItems: 'center', backgroundColor: SetForgeColors.surfaceMuted },
  summaryItem: { flex: 1, alignItems: 'center', gap: 2 },
  summaryValue: { color: SetForgeColors.accent, fontFamily: 'monospace', fontSize: 14, fontWeight: '800' },
  summaryLabel: { color: SetForgeColors.textDisabled, fontFamily: 'monospace', fontSize: 8, fontWeight: '700' },
  divider: { width: 1, height: 28, backgroundColor: SetForgeColors.border },
  exerciseScroll: { flex: 1 },
  content: { paddingBottom: 28 },
  exerciseBlock: { paddingHorizontal: 18, paddingTop: 17, paddingBottom: 13, borderBottomWidth: 1, borderBottomColor: SetForgeColors.border },
  exerciseName: { color: SetForgeColors.textPrimary, fontSize: 16, lineHeight: 21, fontWeight: '800', textTransform: 'capitalize' },
  exerciseMeta: { marginTop: 2, color: SetForgeColors.textSecondary, fontSize: 10, textTransform: 'capitalize' },
  notes: { marginTop: 8, color: SetForgeColors.textSecondary, fontSize: 12, lineHeight: 17 },
  setHeader: { flexDirection: 'row', marginTop: 12, paddingBottom: 5 },
  columnLabel: { flex: 1, color: SetForgeColors.textDisabled, fontFamily: 'monospace', fontSize: 8, fontWeight: '700' },
  setNumber: { width: 42, flexGrow: 0, flexShrink: 0 },
  statusColumn: { width: 50, flexGrow: 0, flexShrink: 0, textAlign: 'center' },
  setRow: { minHeight: 33, flexDirection: 'row', alignItems: 'center' },
  setValue: { color: SetForgeColors.textSecondary, fontFamily: 'monospace', fontSize: 12 },
  setResult: { flex: 1, color: SetForgeColors.textPrimary, fontFamily: 'monospace', fontSize: 13, fontWeight: '700' },
  setStatus: { color: SetForgeColors.textDisabled, fontSize: 15 },
  completed: { color: SetForgeColors.accent, fontWeight: '900' },
});
