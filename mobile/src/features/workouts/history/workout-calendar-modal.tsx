import { useMemo, useRef, useState } from 'react';
import {
  FlatList,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { SetForgeColors } from '@/constants/setforge-theme';
import type { WorkoutSession } from '@/models/workout-session';

const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const monthRange = 120;
const initialMonthIndex = monthRange;

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
  const months = useMemo(() => {
    const currentMonth = startOfMonth(new Date());
    return Array.from(
      { length: monthRange * 2 + 1 },
      (_, index) => addMonths(currentMonth, index - monthRange),
    );
  }, []);
  const [monthIndex, setMonthIndex] = useState(initialMonthIndex);
  const [calendarWidth, setCalendarWidth] = useState(0);
  const monthListRef = useRef<FlatList<Date>>(null);
  const visibleMonthIndexRef = useRef(initialMonthIndex);
  const month = months[monthIndex];

  const workoutsByDate = useMemo(() => {
    const result = new Map<string, WorkoutSession[]>();
    workouts.forEach((workout) => {
      const date = new Date(workout.completedAt ?? workout.startedAt);
      const key = dateKey(date);
      result.set(key, [...(result.get(key) ?? []), workout]);
    });
    return result;
  }, [workouts]);

  const moveMonth = (amount: number) => {
    const nextIndex = Math.max(0, Math.min(months.length - 1, monthIndex + amount));
    setMonthIndex(nextIndex);
    monthListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
  };

  const trackVisibleMonth = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (calendarWidth === 0) return;
    const nextIndex = Math.max(
      0,
      Math.min(months.length - 1, Math.round(event.nativeEvent.contentOffset.x / calendarWidth)),
    );
    if (nextIndex === visibleMonthIndexRef.current) return;
    visibleMonthIndexRef.current = nextIndex;
    setMonthIndex(nextIndex);
  };

  return (
    <Modal animationType="fade" onRequestClose={onClose} statusBarTranslucent transparent visible={visible}>
      <View style={styles.backdrop}>
        <Pressable accessibilityLabel="Close calendar" onPress={onClose} style={styles.backdropDismissArea} />
        <View style={styles.card}>
          <View style={styles.header}>
            <Pressable accessibilityLabel="Close calendar" hitSlop={10} onPress={onClose} style={styles.headerSide}>
              <Text style={styles.close}>×</Text>
            </Pressable>
            <Text style={styles.title}>Calendar</Text>
            <View style={styles.headerSide} />
          </View>

          <View style={styles.monthNavigation}>
            <Pressable accessibilityLabel="Previous month" onPress={() => moveMonth(-1)} style={styles.monthButton}>
              <Text style={styles.monthButtonLabel}>‹</Text>
            </Pressable>
            <Text style={styles.monthTitle}>{formatMonth(month)}</Text>
            <Pressable accessibilityLabel="Next month" onPress={() => moveMonth(1)} style={styles.monthButton}>
              <Text style={styles.monthButtonLabel}>›</Text>
            </Pressable>
          </View>

          <View style={styles.weekHeader}>
            {weekDays.map((day, index) => <Text key={`${day}-${index}`} style={styles.weekDay}>{day}</Text>)}
          </View>
          <View
            onLayout={(event) => setCalendarWidth(event.nativeEvent.layout.width)}
            style={styles.calendarViewport}>
            {calendarWidth > 0 && (
              <FlatList
                bounces={false}
                data={months}
                decelerationRate="fast"
                disableIntervalMomentum
                directionalLockEnabled
                extraData={workoutsByDate}
                getItemLayout={(_, index) => ({
                  index,
                  length: calendarWidth,
                  offset: calendarWidth * index,
                })}
                horizontal
                initialNumToRender={3}
                initialScrollIndex={initialMonthIndex}
                keyExtractor={monthKey}
                maxToRenderPerBatch={3}
                nestedScrollEnabled
                onMomentumScrollEnd={trackVisibleMonth}
                onScroll={trackVisibleMonth}
                pagingEnabled
                ref={monthListRef}
                renderItem={({ item }) => (
                  <CalendarMonth
                    month={item}
                    onSelectWorkout={onSelectWorkout}
                    width={calendarWidth}
                    workoutsByDate={workoutsByDate}
                  />
                )}
                showsHorizontalScrollIndicator={false}
                snapToInterval={calendarWidth}
                scrollEventThrottle={16}
                style={styles.calendarScroll}
                windowSize={5}
              />
            )}
          </View>
          <Text style={styles.hint}>Swipe between months or select a marked workout day.</Text>
        </View>
      </View>
    </Modal>
  );
}

function CalendarMonth({
  month,
  width,
  workoutsByDate,
  onSelectWorkout,
}: {
  month: Date;
  width: number;
  workoutsByDate: Map<string, WorkoutSession[]>;
  onSelectWorkout: (workout: WorkoutSession) => void;
}) {
  return (
    <View style={[styles.monthPage, { width }]}>
      {calendarDays(month).map((date, index) => {
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
            style={styles.dayCell}>
            <View style={[styles.dayMarker, hasWorkout && styles.workoutDay, isToday && styles.today]}>
              <Text style={[styles.dayNumber, hasWorkout && styles.workoutDayNumber]}>{date.getDate()}</Text>
              {hasWorkout && (
                <View style={styles.checkBadge}>
                  <Text style={styles.check}>
                    {dateWorkouts.length > 1 ? dateWorkouts.length : '✓'}
                  </Text>
                </View>
              )}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

function startOfMonth(date: Date) { return new Date(date.getFullYear(), date.getMonth(), 1); }
function addMonths(date: Date, amount: number) { return new Date(date.getFullYear(), date.getMonth() + amount, 1); }
function monthKey(date: Date) { return `${date.getFullYear()}-${date.getMonth()}`; }
function dateKey(date: Date) { return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`; }
function formatMonth(date: Date) { return new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(date); }
function formatAccessibleDate(date: Date) { return new Intl.DateTimeFormat(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(date); }
function calendarDays(month: Date): (Date | null)[] {
  const firstOffset = (month.getDay() + 6) % 7;
  const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const result: (Date | null)[] = Array.from({ length: firstOffset }, () => null);
  for (let day = 1; day <= count; day += 1) result.push(new Date(month.getFullYear(), month.getMonth(), day));
  while (result.length < 42) result.push(null);
  return result;
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 18, backgroundColor: 'rgba(0, 0, 0, 0.76)' },
  backdropDismissArea: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
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
  calendarViewport: { width: '100%', aspectRatio: 7 / 6, overflow: 'hidden' },
  calendarScroll: { width: '100%', height: '100%' },
  monthPage: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: '14.2857%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  dayMarker: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 19 },
  workoutDay: { backgroundColor: SetForgeColors.accentTint },
  today: { borderWidth: 1, borderColor: SetForgeColors.textDisabled },
  dayNumber: { color: SetForgeColors.textSecondary, fontFamily: 'monospace', fontSize: 13 },
  workoutDayNumber: { color: SetForgeColors.textPrimary, fontWeight: '800' },
  checkBadge: { position: 'absolute', top: -5, right: -5, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3, borderWidth: 2, borderColor: SetForgeColors.surface, borderRadius: 9, backgroundColor: SetForgeColors.accent },
  check: { color: SetForgeColors.canvas, fontSize: 9, lineHeight: 11, fontWeight: '900', textAlign: 'center' },
  hint: { marginTop: 18, color: SetForgeColors.textSecondary, fontSize: 11, textAlign: 'center' },
});
