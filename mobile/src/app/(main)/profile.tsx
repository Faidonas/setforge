import { useCallback, useEffect, useState } from 'react';
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
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';

import { SetForgeColors } from '@/constants/setforge-theme';
import { useAuth } from '@/features/auth/auth-context';
import type { UserProfile } from '@/models/user';
import { getUserProfile } from '@/services/user-api';
import { getWorkoutHistory } from '@/services/workout-session-api';
import { getWorkoutTemplates } from '@/services/workout-template-api';

type ProfileData = {
  user: UserProfile;
  workoutCount: number;
  completedSetCount: number;
  templateCount: number;
};

async function fetchProfileData(): Promise<ProfileData> {
  const [user, workouts, templates] = await Promise.all([
    getUserProfile(),
    getWorkoutHistory(),
    getWorkoutTemplates(),
  ]);

  return {
    user,
    workoutCount: workouts.length,
    completedSetCount: workouts.reduce(
      (workoutTotal, workout) =>
        workoutTotal +
        workout.exercises.reduce(
          (exerciseTotal, exercise) =>
            exerciseTotal + exercise.sets.filter((set) => set.completed).length,
          0,
        ),
      0,
    ),
    templateCount: templates.length,
  };
}

export default function ProfileScreen() {
  const auth = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signOut() {
    setIsSigningOut(true);
    setError(null);
    try {
      await auth.signOut();
    } catch (signOutError) {
      setError(signOutError instanceof Error ? signOutError.message : 'Could not sign out.');
      setIsSigningOut(false);
    }
  }

  const loadProfile = useCallback(async (refreshing = false) => {
    if (refreshing) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      setProfile(await fetchProfileData());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load your profile.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let current = true;
    fetchProfileData()
      .then((data) => {
        if (current) setProfile(data);
      })
      .catch((loadError: unknown) => {
        if (current) {
          setError(loadError instanceof Error ? loadError.message : 'Could not load your profile.');
        }
      })
      .finally(() => {
        if (current) setIsLoading(false);
      });

    return () => {
      current = false;
    };
  }, []);

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>Profile</Text>
            <Text style={styles.subtitle}>Your SetForge account and training overview</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            disabled={isSigningOut}
            onPress={() => void signOut()}
            style={({ pressed }) => [styles.headerSignOut, (pressed || isSigningOut) && styles.pressed]}>
            <Text style={styles.headerSignOutLabel}>{isSigningOut ? 'SIGNING OUT…' : 'SIGN OUT'}</Text>
          </Pressable>
        </View>

        {isLoading ? (
          <ProfileState loading title="Loading your profile..." />
        ) : error && !profile ? (
          <ProfileState
            message={error}
            onRetry={() => void loadProfile()}
            title="Could not load your profile"
          />
        ) : profile ? (
          <ScrollView
            contentContainerStyle={styles.content}
            refreshControl={
              <RefreshControl
                colors={[SetForgeColors.accent]}
                onRefresh={() => void loadProfile(true)}
                refreshing={isRefreshing}
                tintColor={SetForgeColors.accent}
              />
            }
            showsVerticalScrollIndicator={false}>
            {error ? <Text style={styles.inlineError}>{error}</Text> : null}

            <View style={styles.identityCard}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getInitials(profile.user.displayName)}</Text>
              </View>
              <View style={styles.identityText}>
                <Text numberOfLines={1} style={styles.displayName}>
                  {profile.user.displayName}
                </Text>
                <Text numberOfLines={1} style={styles.email}>
                  {profile.user.email}
                </Text>
                <View style={styles.roleBadge}>
                  <Text style={styles.roleLabel}>{formatAccountType(profile.user.accountType)}</Text>
                </View>
              </View>
            </View>

            <View style={styles.statsRow}>
              <ProfileStat label="WORKOUTS" value={profile.workoutCount} />
              <View style={styles.statDivider} />
              <ProfileStat label="SETS" value={profile.completedSetCount} />
              <View style={styles.statDivider} />
              <ProfileStat label="TEMPLATES" value={profile.templateCount} />
            </View>

            <ProfileSection title="ACCOUNT">
              <ProfileRow label="Email" value={profile.user.email} />
              <View style={styles.rowDivider} />
              <ProfileRow label="Access" value={formatAccountType(profile.user.accountType)} />
              <View style={styles.rowDivider} />
              <ProfileRow label="Member since" value={formatMemberSince(profile.user.createdAt)} />
            </ProfileSection>

            <ProfileSection title="TRAINING">
              <ProfileRow label="Weight unit" value="Kilograms (kg)" />
              <View style={styles.rowDivider} />
              <ProfileRow label="Saved workouts" value={profile.workoutCount.toString()} />
            </ProfileSection>

            {profile.user.accountType === 'PERSONAL_TRAINER' ? (
              <View style={styles.trainerCard}>
                <View style={styles.trainerCardHeader}>
                  <Text style={styles.trainerTitle}>Coach workspace</Text>
                </View>
                <Text style={styles.trainerMessage}>
                  Manage clients and templates while keeping your own workouts in this account.
                </Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.push('/coach' as Href)}
                  style={({ pressed }) => [styles.coachButton, pressed && styles.pressed]}>
                  <Text style={styles.coachButtonLabel}>OPEN COACH DASHBOARD</Text>
                </Pressable>
              </View>
            ) : null}
          </ScrollView>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

function ProfileStat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ProfileSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.profileRow}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text numberOfLines={1} style={styles.rowValue}>
        {value}
      </Text>
    </View>
  );
}

function ProfileState({
  title,
  message,
  loading,
  onRetry,
}: {
  title: string;
  message?: string;
  loading?: boolean;
  onRetry?: () => void;
}) {
  return (
    <View style={styles.stateContainer}>
      {loading ? <ActivityIndicator color={SetForgeColors.accent} /> : null}
      <Text style={styles.stateTitle}>{title}</Text>
      {message ? <Text style={styles.stateMessage}>{message}</Text> : null}
      {onRetry ? (
        <Pressable onPress={onRetry} style={styles.retryButton}>
          <Text style={styles.retryLabel}>TRY AGAIN</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function getInitials(displayName: string) {
  const initials = displayName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
  return initials || 'SF';
}

function formatAccountType(accountType: UserProfile['accountType']) {
  return accountType === 'PERSONAL_TRAINER' ? 'Athlete + Coach' : 'Athlete';
}

function formatMemberSince(createdAt: string) {
  return new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(
    new Date(createdAt),
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: SetForgeColors.canvas },
  screen: { flex: 1, width: '100%', maxWidth: 440, alignSelf: 'center' },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerCopy: { flex: 1 },
  title: { color: SetForgeColors.textPrimary, fontSize: 24, fontWeight: '800' },
  subtitle: { marginTop: 3, color: SetForgeColors.textSecondary, fontSize: 13 },
  headerSignOut: { minWidth: 76, height: 36, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#7F1D1D', borderRadius: 7 },
  headerSignOutLabel: { color: '#F87171', fontSize: 10, fontWeight: '900' },
  content: { gap: 20, paddingHorizontal: 20, paddingBottom: 30 },
  inlineError: {
    padding: 10,
    borderRadius: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    color: '#FCA5A5',
    fontSize: 12,
  },
  identityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    padding: 18,
    borderWidth: 1,
    borderColor: SetForgeColors.border,
    borderRadius: 12,
    backgroundColor: SetForgeColors.surface,
  },
  avatar: {
    width: 66,
    height: 66,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: SetForgeColors.accent,
    borderRadius: 33,
    backgroundColor: SetForgeColors.accentTint,
  },
  avatarText: { color: SetForgeColors.accent, fontSize: 22, fontWeight: '900' },
  identityText: { flex: 1, alignItems: 'flex-start' },
  displayName: { color: SetForgeColors.textPrimary, fontSize: 20, fontWeight: '800' },
  email: { marginTop: 4, color: SetForgeColors.textSecondary, fontSize: 12 },
  roleBadge: {
    marginTop: 10,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 5,
    backgroundColor: SetForgeColors.accentTint,
  },
  roleLabel: { color: SetForgeColors.accent, fontSize: 10, fontWeight: '800' },
  statsRow: {
    height: 78,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: SetForgeColors.border,
    borderRadius: 10,
    backgroundColor: SetForgeColors.surfaceMuted,
  },
  stat: { flex: 1, alignItems: 'center', gap: 4 },
  statDivider: { width: 1, height: 34, backgroundColor: SetForgeColors.border },
  statValue: { color: SetForgeColors.textPrimary, fontFamily: 'monospace', fontSize: 20, fontWeight: '900' },
  statLabel: { color: SetForgeColors.textSecondary, fontFamily: 'monospace', fontSize: 9, fontWeight: '700' },
  sectionTitle: { marginBottom: 9, color: SetForgeColors.textSecondary, fontSize: 11, fontWeight: '800', letterSpacing: 0.7 },
  sectionCard: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: SetForgeColors.border,
    borderRadius: 10,
    backgroundColor: SetForgeColors.surface,
  },
  profileRow: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 15 },
  rowLabel: { color: SetForgeColors.textPrimary, fontSize: 13, fontWeight: '600' },
  rowValue: { flex: 1, color: SetForgeColors.textSecondary, fontSize: 12, textAlign: 'right' },
  rowDivider: { height: 1, marginLeft: 15, backgroundColor: SetForgeColors.border },
  trainerCard: {
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.24)',
    borderRadius: 10,
    backgroundColor: SetForgeColors.accentTint,
  },
  trainerCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  trainerTitle: { color: SetForgeColors.textPrimary, fontSize: 15, fontWeight: '800' },
  trainerMessage: { marginTop: 8, color: SetForgeColors.textSecondary, fontSize: 12, lineHeight: 17 },
  coachButton: { height: 42, marginTop: 14, alignItems: 'center', justifyContent: 'center', borderRadius: 6, backgroundColor: SetForgeColors.accent },
  coachButtonLabel: { color: SetForgeColors.canvas, fontSize: 11, fontWeight: '900' },
  stateContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 28 },
  stateTitle: { color: SetForgeColors.textPrimary, fontSize: 16, fontWeight: '700', textAlign: 'center' },
  stateMessage: { color: SetForgeColors.textSecondary, fontSize: 13, lineHeight: 18, textAlign: 'center' },
  retryButton: { paddingHorizontal: 18, paddingVertical: 10, borderWidth: 1, borderColor: SetForgeColors.accent, borderRadius: 5 },
  retryLabel: { color: SetForgeColors.accent, fontSize: 12, fontWeight: '800' },
  pressed: { opacity: 0.7 },
});
