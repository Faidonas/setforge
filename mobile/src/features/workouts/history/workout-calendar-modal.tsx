import { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { SetForgeColors } from '@/constants/setforge-theme';
import type { WorkoutSession } from '@/models/workout-session';

const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function WorkoutCalendarModal({
  visible,
  workouts,
  onClose,
  onSelectWorkout,
}: {
  visible: boolean;
  workouts: WorkoutSession[];
  onClose: () => void;
  onSelectWorkout: (workout: WorkoutSession) => void;
}) {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));

  const workoutsByDate = useMemo(() => {
    const result = new Map<string, WorkoutSession[]>();
    workouts.forEach((workout) => {
      const date = new Date(workout.completedAt ?? workout.startedAt);
      const key = dateKey(date);
      result.set(key, [...(result.get(key) ?? []), workout]);
    });
    return result;
  }, [workouts]);

  const days = calendarDays(month);

  return (
    <Modal animationType="fade" onRequestClose={onClose} statusBarTranslucent transparent visible={visible}>
      <Pressable onPress={onClose} style={styles.backdrop}>
        <Pressable onPress={(event) => event.stopPropagation()} style={styles.card}>
          <View style={styles.header}>
            <Pressable accessibilityLabel="Close calendar" hitSlop={10} onPress={onClose} style={styles.headerSide}>
              <Text style={styles.close}>×</Text>
            </Pressable>
            <Text style={styles.title}>Calendar</Text>
            <View style={styles.headerSide} />
          </View>

          <View style={styles.monthNavigation}>
            <Pressable accessibilityLabel="Previous month" onPress={() => setMonth(addMonths(month, -1))} style={styles.monthButton}>
              <Text style={styles.monthButtonLabel}>‹</Text>
            </Pressable>
            <Text style={styles.monthTitle}>{formatMonth(month)}</Text>
            <Pressable accessibilityLabel="Next month" onPress={() => setMonth(addMonths(month, 1))} style={styles.monthButton}>
              <Text style={styles.monthButtonLabel}>›</Text>
            </Pressable>
          </View>

          <View style={styles.weekHeader}>
            {weekDays.map((day, index) => <Text key={`${day}-${index}`} style={styles.weekDay}>{day}</Text>)}
          </View>
          <View style={styles.grid}>
            {days.map((date, index) => {
              if (!date) return <View key={`empty-${index}`} style={styles.dayCell} />;
              const dateWorkouts = workoutsByDate.get(dateKey(date)) ?? [];
              const hasWorkout = dateWorkouts.length > 0;
              const isToday = dateKey(date) === dateKey(new Date());
              return (
                <Pressable
                  accessibilityLabel={`${formatAccessibleDate(date)}${hasWorkout ? `, ${dateWorkouts.length} workout` : ''}`}
                  disabled={!hasWorkout}
                  key={dateKey(date)}
                  onPress={() => onSelectWorkout(dateWorkouts[0])}
                  style={[styles.dayCell, hasWorkout && styles.workoutDay, isToday && styles.today]}>
                  <Text style={[styles.dayNumber, hasWorkout && styles.workoutDayNumber]}>{date.getDate()}</Text>
                  {hasWorkout && (
                    <View style={styles.checkBadge}>
                      <Text style={styles.check}>{dateWorkouts.length > 1 ? dateWorkouts.length : '✓'}</Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
          <Text style={styles.hint}>Select a marked day to jump to its workout.</Text>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function startOfMonth(date: Date) { return new Date(date.getFullYear(), date.getMonth(), 1); }
function addMonths(date: Date, amount: number) { return new Date(date.getFullYear(), date.getMonth() + amount, 1); }
function dateKey(date: Date) { return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`; }
function formatMonth(date: Date) { return new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(date); }
function formatAccessibleDate(date: Date) { return new Intl.DateTimeFormat(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(date); }
function calendarDays(month: Date): (Date | null)[] {
  const firstOffset = (month.getDay() + 6) % 7;
  const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const result: (Date | null)[] = Array.from({ length: firstOffset }, () => null);
  for (let day = 1; day <= count; day += 1) result.push(new Date(month.getFullYear(), month.getMonth(), day));
  while (result.length % 7 !== 0) result.push(null);
  return result;
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 18, backgroundColor: 'rgba(0, 0, 0, 0.76)' },
  card: { width: '100%', maxWidth: 440, padding: 18, borderWidth: 1, borderColor: SetForgeColors.border, borderRadius: 16, backgroundColor: SetForgeColors.surface },
  header: { height: 42, flexDirection: 'row', alignItems: 'center' },
  headerSide: { width: 42 },
  close: { color: SetForgeColors.textSecondary, fontSize: 31, lineHeight: 32 },
  title: { flex: 1, color: SetForgeColors.textPrimary, fontSize: 20, fontWeight: '800', textAlign: 'center' },
  monthNavigation: { height: 62, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  monthButton: { width: 44, height: 40, alignItems: 'center', justifyContent: 'center' },
  monthButtonLabel: { color: SetForgeColors.accent, fontSize: 30, lineHeight: 31 },
  monthTitle: { color: SetForgeColors.textPrimary, fontSize: 16, fontWeight: '800' },
  weekHeader: { flexDirection: 'row', paddingBottom: 8 },
  weekDay: { width: '14.2857%', color: SetForgeColors.textDisabled, fontFamily: 'monospace', fontSize: 10, fontWeight: '800', textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: '14.2857%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 999 },
  workoutDay: { backgroundColor: SetForgeColors.accentTint },
  today: { borderWidth: 1, borderColor: SetForgeColors.textDisabled },
  dayNumber: { color: SetForgeColors.textSecondary, fontFamily: 'monospace', fontSize: 13 },
  workoutDayNumber: { color: SetForgeColors.textPrimary, fontWeight: '800' },
  checkBadge: { position: 'absolute', top: 1, right: 1, minWidth: 17, height: 17, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3, borderRadius: 9, backgroundColor: SetForgeColors.accent },
  check: { color: SetForgeColors.canvas, fontSize: 9, fontWeight: '900' },
  hint: { marginTop: 18, color: SetForgeColors.textSecondary, fontSize: 11, textAlign: 'center' },
});
