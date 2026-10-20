import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SetForgeColors } from '@/constants/setforge-theme';
import { useActiveWorkout } from '@/features/workouts/active-workout/active-workout-context';
import type { UserProfile } from '@/models/user';
import type { WorkoutSession } from '@/models/workout-session';
import type { WorkoutTemplate } from '@/models/workout-template';
import { getUserProfile } from '@/services/user-api';
import { getWorkoutHistory, startWorkoutSession } from '@/services/workout-session-api';
import { getWorkoutTemplates } from '@/services/workout-template-api';

const calendarIcon = require('@/assets/images/figma/home-stat-calendar.svg');
const activityIcon = require('@/assets/images/figma/home-stat-activity.svg');
const checkIcon = require('@/assets/images/figma/check.svg');

type HomeData = {
  profile: UserProfile;
  templates: WorkoutTemplate[];
  workouts: WorkoutSession[];
};

export default function HomeScreen() {
  const router = useRouter();
  const activeWorkout = useActiveWorkout();
  const [data, setData] = useState<HomeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHome = useCallback(async (refreshing = false) => {
    if (refreshing) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);
    try {
      const [profile, templates, workouts] = await Promise.all([
        getUserProfile(),
        getWorkoutTemplates(),
        getWorkoutHistory(),
      ]);
      setData({ profile, templates, workouts });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load your dashboard.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadHome();
    }, [loadHome]),
  );

  const recommendedTemplate = data?.templates[0];
  const lastWorkout = data?.workouts[0];
  const weeklyWorkoutCount = useMemo(
    () => countThisWeek(data?.workouts ?? []),
    [data?.workouts],
  );
  const streak = useMemo(() => calculateStreak(data?.workouts ?? []), [data?.workouts]);

  async function startRecommendedWorkout() {
    if (!recommendedTemplate || isStarting || activeWorkout.isHydrating) return;
    if (activeWorkout.session?.status === 'IN_PROGRESS') {
      activeWorkout.expand();
      return;
    }
    try {
      setIsStarting(true);
      setError(null);
      const session = await startWorkoutSession({ templateId: recommendedTemplate.id });
      activeWorkout.loadSession(session);
      activeWorkout.expand();
    } catch (startError) {
      setError(startError instanceof Error ? startError.message : 'Could not start the workout.');
    } finally {
      setIsStarting(false);
    }
  }

  if (isLoading && !data) {
    return (
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.stateContainer}>
          <ActivityIndicator color={SetForgeColors.accent} />
          <Text style={styles.stateTitle}>Loading your dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!data) {
    return (
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.stateContainer}>
          <Text style={styles.stateTitle}>Could not load your dashboard</Text>
          {error ? <Text style={styles.stateMessage}>{error}</Text> : null}
          <Pressable onPress={() => void loadHome()} style={styles.retryButton}>
            <Text style={styles.retryLabel}>TRY AGAIN</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            colors={[SetForgeColors.accent]}
            onRefresh={() => void loadHome(true)}
            refreshing={isRefreshing}
            tintColor={SetForgeColors.accent}
          />
        }
        showsVerticalScrollIndicator={false}>
        <View style={styles.greetingHeader}>
          <View style={styles.greetingCopy}>
            <Text numberOfLines={1} style={styles.greeting}>
              {getGreeting()}, {firstName(data.profile.displayName)}
            </Text>
            <Text style={styles.date}>{formatToday()}</Text>
          </View>
          <Pressable
            accessibilityLabel="Open profile"
            accessibilityRole="button"
            onPress={() => router.navigate('/profile')}
            style={({ pressed }) => [styles.avatar, pressed && styles.pressed]}>
            <Text style={styles.avatarLabel}>{initial(data.profile.displayName)}</Text>
          </Pressable>
        </View>

        <View style={styles.statsRow}>
          <StatCard
            icon={calendarIcon}
            label="WORKOUTS THIS WEEK"
            value={`${weeklyWorkoutCount} / 4`}
          />
          <StatCard
            icon={activityIcon}
            label="CURRENT STREAK"
            value={`${streak} ${streak === 1 ? 'Day' : 'Days'}`}
          />
        </View>

        {error ? <Text style={styles.inlineError}>{error}</Text> : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>RECOMMENDED TODAY</Text>
          {recommendedTemplate ? (
            <View style={styles.spotlightCard}>
              <View style={styles.spotlightHeader}>
                <View style={styles.spotlightCopy}>
                  <Text numberOfLines={1} style={styles.workoutTitle}>{recommendedTemplate.name}</Text>
                  <Text style={styles.workoutMeta}>
                    {recommendedTemplate.exercises.length} Exercises • {estimateDuration(recommendedTemplate)} Min
                  </Text>
                </View>
                <View style={styles.tag}><Text style={styles.tagLabel}>TARGETED</Text></View>
              </View>
              <View style={styles.exercisePreview}>
                {recommendedTemplate.exercises.slice(0, 3).map((exercise) => (
                  <Text key={exercise.id} numberOfLines={1} style={styles.exerciseName}>
                    • {exercise.exerciseName}
                  </Text>
                ))}
                {recommendedTemplate.exercises.length === 0 ? (
                  <Text style={styles.exerciseName}>Build this template before training.</Text>
                ) : null}
              </View>
              <Pressable
                accessibilityRole="button"
                disabled={isStarting || activeWorkout.isHydrating || recommendedTemplate.exercises.length === 0}
                onPress={() => void startRecommendedWorkout()}
                style={({ pressed }) => [
                  styles.startButton,
                  (pressed || isStarting || recommendedTemplate.exercises.length === 0) && styles.buttonDisabled,
                ]}>
                <Text style={styles.startButtonLabel}>
                  {activeWorkout.session?.status === 'IN_PROGRESS'
                    ? 'RESUME WORKOUT'
                    : isStarting
                      ? 'STARTING...'
                      : 'START WORKOUT'}
                </Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.emptySpotlight}>
              <Text style={styles.emptyTitle}>Plan your first workout</Text>
              <Text style={styles.emptyMessage}>Create a template and it will be recommended here.</Text>
              <Pressable onPress={() => router.push('/create-template/new')} style={styles.outlineButton}>
                <Text style={styles.outlineButtonLabel}>CREATE TEMPLATE</Text>
              </Pressable>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>MY TEMPLATES</Text>
            <Pressable onPress={() => router.navigate('/start-workout')}>
              <Text style={styles.sectionAction}>VIEW ALL</Text>
            </Pressable>
          </View>
          <View style={styles.templateRow}>
            {data.templates.slice(0, 2).map((template) => (
              <Pressable
                key={template.id}
                onPress={() => router.navigate('/start-workout')}
                style={({ pressed }) => [styles.templateCard, pressed && styles.pressed]}>
                <Text numberOfLines={1} style={styles.templateName}>{template.name}</Text>
                <Text style={styles.templateMeta}>{template.exercises.length} exercises</Text>
              </Pressable>
            ))}
            {data.templates.length === 0 ? (
              <Pressable onPress={() => router.push('/create-template/new')} style={styles.addTemplateCard}>
                <Text style={styles.addTemplateLabel}>+ NEW TEMPLATE</Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        <View style={[styles.section, styles.lastSection]}>
          <Text style={styles.sectionTitle}>LAST SESSION</Text>
          {lastWorkout ? (
            <Pressable
              onPress={() => router.navigate('/history')}
              style={({ pressed }) => [styles.lastSessionCard, pressed && styles.pressed]}>
              <View style={styles.checkWrapper}>
                <Image source={checkIcon} style={styles.checkIcon} contentFit="contain" />
              </View>
              <View style={styles.lastSessionCopy}>
                <Text numberOfLines={1} style={styles.lastSessionTitle}>{lastWorkout.name}</Text>
                <Text numberOfLines={1} style={styles.lastSessionMeta}>
                  {formatSessionSummary(lastWorkout, data.profile)}
                </Text>
              </View>
            </Pressable>
          ) : (
            <View style={styles.lastSessionCard}>
              <View style={styles.lastSessionCopy}>
                <Text style={styles.lastSessionTitle}>No sessions yet</Text>
                <Text style={styles.lastSessionMeta}>Your completed workouts will appear here.</Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ icon, label, value }: { icon: number; label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Image source={icon} style={styles.statIcon} contentFit="contain" tintColor={SetForgeColors.accent} />
      <View style={styles.statCopy}>
        <Text style={styles.statValue}>{value}</Text>
        <Text numberOfLines={1} style={styles.statLabel}>{label}</Text>
      </View>
    </View>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function firstName(value: string) {
  return value.trim().split(/\s+/)[0] || 'Athlete';
}

function initial(value: string) {
  return firstName(value).charAt(0).toUpperCase() || 'S';
}

function formatToday() {
  return new Intl.DateTimeFormat(undefined, { weekday: 'long', day: 'numeric', month: 'short' })
    .format(new Date())
    .toUpperCase();
}

function countThisWeek(workouts: WorkoutSession[]) {
  const now = new Date();
  const start = new Date(now);
  const day = start.getDay();
  start.setDate(start.getDate() - ((day + 6) % 7));
  start.setHours(0, 0, 0, 0);
  return workouts.filter((workout) => new Date(workout.completedAt ?? workout.startedAt) >= start).length;
}

function calculateStreak(workouts: WorkoutSession[]) {
  const completedDays = new Set(
    workouts.map((workout) => localDayKey(new Date(workout.completedAt ?? workout.startedAt))),
  );
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  if (!completedDays.has(localDayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (completedDays.has(localDayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function localDayKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function estimateDuration(template: WorkoutTemplate) {
  const sets = template.exercises.reduce((total, exercise) => total + Math.max(exercise.sets.length, 1), 0);
  return Math.max(15, Math.round((sets * 2.5) / 5) * 5);
}

function formatSessionSummary(workout: WorkoutSession, profile: UserProfile) {
  const date = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' }).format(
    new Date(workout.completedAt ?? workout.startedAt),
  );
  const kgVolume = workout.exercises.reduce(
    (workoutTotal, exercise) => workoutTotal + exercise.sets.reduce(
      (setTotal, set) => setTotal + (set.completed ? (set.weight ?? 0) * (set.reps ?? 0) : 0),
      0,
    ),
    0,
  );
  const isImperial = profile.unitSystem === 'IMPERIAL';
  const volume = isImperial ? kgVolume * 2.2046226218 : kgVolume;
  const unit = isImperial ? 'lb' : 'kg';
  const duration = formatDuration(workout.startedAt, workout.completedAt);
  return `${date} • ${Math.round(volume).toLocaleString()} ${unit} Volume • ${duration}`;
}

function formatDuration(startedAt: string, completedAt?: string) {
  if (!completedAt) return '—';
  const minutes = Math.max(
    0,
    Math.round((new Date(completedAt).getTime() - new Date(startedAt).getTime()) / 60000),
  );
  return minutes >= 60 ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : `${minutes}m`;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: SetForgeColors.canvas },
  content: { flexGrow: 1, paddingBottom: 28 },
  greetingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  greetingCopy: { flex: 1, gap: 4, paddingRight: 16 },
  greeting: { color: SetForgeColors.textPrimary, fontSize: 18, lineHeight: 23, fontWeight: '800' },
  date: { color: SetForgeColors.textSecondary, fontFamily: 'monospace', fontSize: 11, lineHeight: 14 },
  avatar: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: SetForgeColors.accent,
    borderRadius: 20,
    backgroundColor: SetForgeColors.surface,
  },
  avatarLabel: { color: SetForgeColors.accent, fontFamily: 'monospace', fontSize: 12, fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingTop: 20 },
  statCard: {
    flex: 1,
    minWidth: 0,
    height: 60,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: SetForgeColors.border,
    borderRadius: 6,
    backgroundColor: SetForgeColors.surface,
  },
  statIcon: { width: 20, height: 20 },
  statCopy: { flex: 1, minWidth: 0, gap: 2 },
  statValue: { color: SetForgeColors.textPrimary, fontFamily: 'monospace', fontSize: 16, lineHeight: 21, fontWeight: '700' },
  statLabel: { color: SetForgeColors.textSecondary, fontSize: 10, lineHeight: 13 },
  inlineError: {
    marginHorizontal: 20,
    marginTop: 14,
    padding: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    color: '#FCA5A5',
    fontSize: 11,
  },
  section: { gap: 12, paddingHorizontal: 20, paddingTop: 24 },
  lastSection: { paddingBottom: 4 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { color: SetForgeColors.textSecondary, fontSize: 11, lineHeight: 14, fontWeight: '700' },
  sectionAction: { color: SetForgeColors.accent, fontSize: 11, lineHeight: 14, fontWeight: '600' },
  spotlightCard: {
    gap: 16,
    padding: 18,
    borderWidth: 1.5,
    borderColor: SetForgeColors.accent,
    borderRadius: 8,
    backgroundColor: SetForgeColors.surface,
  },
  spotlightHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  spotlightCopy: { flex: 1, minWidth: 0, gap: 4 },
  workoutTitle: { color: SetForgeColors.textPrimary, fontSize: 18, lineHeight: 23, fontWeight: '800' },
  workoutMeta: { color: SetForgeColors.textSecondary, fontFamily: 'monospace', fontSize: 12, lineHeight: 16 },
  tag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, backgroundColor: SetForgeColors.accentTint },
  tagLabel: { color: SetForgeColors.accent, fontFamily: 'monospace', fontSize: 10, lineHeight: 13, fontWeight: '700' },
  exercisePreview: { gap: 6 },
  exerciseName: { color: SetForgeColors.textSecondary, fontSize: 13, lineHeight: 17 },
  startButton: { height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 4, backgroundColor: SetForgeColors.accent },
  startButtonLabel: { color: SetForgeColors.canvas, fontSize: 14, lineHeight: 18, fontWeight: '700' },
  buttonDisabled: { opacity: 0.55 },
  emptySpotlight: { gap: 9, padding: 18, borderWidth: 1, borderColor: SetForgeColors.border, borderRadius: 8, backgroundColor: SetForgeColors.surface },
  emptyTitle: { color: SetForgeColors.textPrimary, fontSize: 16, fontWeight: '800' },
  emptyMessage: { color: SetForgeColors.textSecondary, fontSize: 12, lineHeight: 17 },
  outlineButton: { height: 40, alignItems: 'center', justifyContent: 'center', marginTop: 4, borderWidth: 1, borderColor: SetForgeColors.accent, borderRadius: 4 },
  outlineButtonLabel: { color: SetForgeColors.accent, fontSize: 12, fontWeight: '800' },
  templateRow: { flexDirection: 'row', gap: 8 },
  templateCard: { flex: 1, minWidth: 0, gap: 4, padding: 12, borderWidth: 1, borderColor: SetForgeColors.border, borderRadius: 6, backgroundColor: SetForgeColors.surface },
  templateName: { color: SetForgeColors.textPrimary, fontSize: 13, lineHeight: 17, fontWeight: '700' },
  templateMeta: { color: SetForgeColors.textSecondary, fontFamily: 'monospace', fontSize: 10, lineHeight: 13 },
  addTemplateCard: { flex: 1, minHeight: 58, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: SetForgeColors.border, borderRadius: 6, backgroundColor: SetForgeColors.surface },
  addTemplateLabel: { color: SetForgeColors.accent, fontSize: 11, fontWeight: '700' },
  lastSessionCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderWidth: 1, borderColor: SetForgeColors.border, borderRadius: 6, backgroundColor: SetForgeColors.surfaceMuted },
  checkWrapper: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 4, backgroundColor: SetForgeColors.surface },
  checkIcon: { width: 20, height: 20 },
  lastSessionCopy: { flex: 1, minWidth: 0, gap: 2 },
  lastSessionTitle: { color: SetForgeColors.textPrimary, fontSize: 14, lineHeight: 18, fontWeight: '700' },
  lastSessionMeta: { color: SetForgeColors.textSecondary, fontFamily: 'monospace', fontSize: 11, lineHeight: 14 },
  stateContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 28 },
  stateTitle: { color: SetForgeColors.textPrimary, fontSize: 16, fontWeight: '700', textAlign: 'center' },
  stateMessage: { color: SetForgeColors.textSecondary, fontSize: 13, lineHeight: 18, textAlign: 'center' },
  retryButton: { paddingHorizontal: 18, paddingVertical: 10, borderWidth: 1, borderColor: SetForgeColors.accent, borderRadius: 5 },
  retryLabel: { color: SetForgeColors.accent, fontSize: 12, fontWeight: '800' },
  pressed: { opacity: 0.7 },
});
