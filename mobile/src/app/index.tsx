import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SetForgeColors, SetForgeSpacing } from '@/constants/setforge-theme';
import { canAccessCoachDashboard, getInitialWorkspaceRoute } from '@/constants/coach-access';
import { RoleOptionCard } from '@/features/onboarding/components/role-option-card';
import { getUserProfile, updateAccountType } from '@/services/user-api';

const trainMyselfIcon = require('@/assets/images/figma/user.svg');
const personalTrainerIcon = require('@/assets/images/figma/users.svg');

export default function WelcomeRoleSelectionScreen() {
  const router = useRouter();
  const { width: viewportWidth } = useWindowDimensions();
  const [selectedRole, setSelectedRole] = useState<'athlete' | 'coach'>('athlete');
  const [saving, setSaving] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [canUseCoach, setCanUseCoach] = useState(false);
  const [accountType, setAccountType] = useState<'ADMIN' | 'PERSONAL_TRAINER' | 'INDIVIDUAL'>('INDIVIDUAL');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let current = true;
    let routedExistingAccount = false;
    getUserProfile()
      .then((profile) => {
        if (!current) return;
        const hasCoachAccess = canAccessCoachDashboard(profile.accountType);
        if (profile.onboardingCompleted) {
          routedExistingAccount = true;
          router.replace(getInitialWorkspaceRoute(profile.accountType, viewportWidth) as Href);
          return;
        }
        setCanUseCoach(hasCoachAccess);
        setAccountType(profile.accountType);
        setSelectedRole(hasCoachAccess ? 'coach' : 'athlete');
      })
      .catch((loadError: unknown) => {
        if (current) {
          setError(loadError instanceof Error ? loadError.message : 'Could not check account access.');
        }
      })
      .finally(() => {
        if (current && !routedExistingAccount) setCheckingAccess(false);
      });

    return () => {
      current = false;
    };
  }, [router, viewportWidth]);

  async function continueToWorkspace() {
    setSaving(true);
    setError(null);
    try {
      if (selectedRole === 'coach') {
        await updateAccountType(accountType);
        router.replace('/coach' as Href);
      } else {
        router.replace('/initial-setup' as Href);
      }
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save your account type.');
    } finally {
      setSaving(false);
    }
  }

  if (checkingAccess && !error) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.loadingScreen}>
          <ActivityIndicator color={SetForgeColors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.screen}>
        <View style={styles.brandArea}>
          <Text style={styles.logo}>FORGE</Text>
          <Text style={styles.tagline}>PLAN. PERFORM. PROGRESS.</Text>
        </View>

        <View style={styles.roleSelection}>
          <Text style={styles.question}>SELECT YOUR PATH</Text>
          <RoleOptionCard
            title="Train Myself"
            description="Track my workouts, sets, and progressive overload"
            icon={<Image source={trainMyselfIcon} style={styles.icon} contentFit="contain" />}
            selected={selectedRole === 'athlete'}
            onPress={() => setSelectedRole('athlete')}
          />
          {canUseCoach ? (
            <RoleOptionCard
              title="Personal Trainer"
              description="Manage clients, design templates, monitor metrics"
              icon={<Image source={personalTrainerIcon} style={styles.icon} contentFit="contain" />}
              selected={selectedRole === 'coach'}
              onPress={() => setSelectedRole('coach')}
            />
          ) : null}
        </View>

        <View style={styles.footer}>
          <Pressable
            accessibilityRole="button"
            disabled={saving || checkingAccess}
            onPress={() => void continueToWorkspace()}
            style={({ pressed }) => [styles.continueButton, (pressed || saving) && styles.continueDisabled]}>
            <Text style={styles.continueLabel}>
              {checkingAccess ? 'CHECKING ACCESS…' : saving ? 'SAVING…' : 'CONTINUE'}
            </Text>
          </Pressable>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Text style={styles.footnote}>You can change this later in Settings.</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: SetForgeColors.canvas,
  },
  screen: {
    flex: 1,
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    justifyContent: 'space-between',
  },
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandArea: {
    alignItems: 'center',
    gap: SetForgeSpacing.sm,
    paddingHorizontal: SetForgeSpacing.lg,
    paddingTop: 74,
  },
  logo: {
    color: SetForgeColors.textPrimary,
    fontSize: 36,
    lineHeight: 43,
    fontWeight: '900',
    letterSpacing: -1.2,
  },
  tagline: {
    color: SetForgeColors.accent,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
    letterSpacing: 0.35,
    fontFamily: 'monospace',
  },
  roleSelection: {
    width: '100%',
    gap: SetForgeSpacing.md,
    paddingHorizontal: SetForgeSpacing.lg,
  },
  question: {
    color: SetForgeColors.textSecondary,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  icon: {
    width: 24,
    height: 24,
  },
  footer: {
    width: '100%',
    alignItems: 'center',
    gap: SetForgeSpacing.lg,
    paddingHorizontal: SetForgeSpacing.lg,
    paddingBottom: 6,
  },
  continueButton: {
    width: '100%',
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
    backgroundColor: SetForgeColors.accent,
  },
  continueLabel: {
    color: SetForgeColors.canvas,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
  },
  continueDisabled: { opacity: 0.65 },
  error: { color: '#FF6B7C', fontSize: 11, lineHeight: 16, textAlign: 'center' },
  footnote: {
    width: '100%',
    color: SetForgeColors.textDisabled,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '400',
    textAlign: 'center',
  },
});
