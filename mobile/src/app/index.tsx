import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SetForgeColors, SetForgeSpacing } from '@/constants/setforge-theme';
import { RoleOptionCard } from '@/features/onboarding/components/role-option-card';

const trainMyselfIcon = require('@/assets/images/figma/user.svg');
const personalTrainerIcon = require('@/assets/images/figma/users.svg');

export default function WelcomeRoleSelectionScreen() {
  const router = useRouter();

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
            selected
          />
          <RoleOptionCard
            title="Personal Trainer"
            description="Manage clients, design templates, monitor metrics"
            icon={<Image source={personalTrainerIcon} style={styles.icon} contentFit="contain" />}
          />
        </View>

        <View style={styles.footer}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/start-workout')}
            style={styles.continueButton}>
            <Text style={styles.continueLabel}>CONTINUE</Text>
          </Pressable>
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
  footnote: {
    width: '100%',
    color: SetForgeColors.textDisabled,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '400',
    textAlign: 'center',
  },
});
