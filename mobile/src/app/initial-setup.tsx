import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { NonCredentialTextInput } from '@/components/non-credential-text-input';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SetForgeColors } from '@/constants/setforge-theme';
import type { LiftingExperience, PrimaryObjective, UnitSystem } from '@/models/user';
import { completeOnboarding, getUserProfile } from '@/services/user-api';

const objectives: { label: string; value: PrimaryObjective }[] = [
  { label: 'Strength', value: 'STRENGTH' },
  { label: 'Hypertrophy / Muscle', value: 'HYPERTROPHY' },
  { label: 'General Fitness', value: 'GENERAL_FITNESS' },
];

const experienceLevels: { label: string; value: LiftingExperience }[] = [
  { label: 'Beginner', value: 'BEGINNER' },
  { label: 'Intermediate', value: 'INTERMEDIATE' },
  { label: 'Advanced', value: 'ADVANCED' },
];

export default function InitialSetupScreen() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('METRIC');
  const [primaryObjective, setPrimaryObjective] = useState<PrimaryObjective>('STRENGTH');
  const [liftingExperience, setLiftingExperience] = useState<LiftingExperience>('INTERMEDIATE');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let current = true;
    getUserProfile()
      .then((profile) => {
        if (!current) return;
        if (profile.onboardingCompleted) {
          router.replace('/home');
          return;
        }
        setDisplayName(profile.displayName);
        setUnitSystem(profile.unitSystem ?? 'METRIC');
        setPrimaryObjective(profile.primaryObjective ?? 'STRENGTH');
        setLiftingExperience(profile.liftingExperience ?? 'INTERMEDIATE');
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
  }, [router]);

  async function saveProfile() {
    const normalizedName = displayName.trim();
    if (!normalizedName) {
      setError('Enter the name you want to use in SetForge.');
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      await completeOnboarding({
        displayName: normalizedName,
        unitSystem,
        primaryObjective,
        liftingExperience,
      });
      router.replace('/home');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save your profile.');
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <View style={styles.loadingState}>
          <ActivityIndicator color={SetForgeColors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardArea}>
        <View style={styles.screen}>
          <View style={styles.header}>
            <Text style={styles.step}>STEP 1 OF 1</Text>
            <Text style={styles.title}>Profile Setup</Text>
            <Text style={styles.subtitle}>Optimize metrics for raw performance metrics.</Text>
          </View>

          <View style={styles.questions}>
            <View style={styles.field}>
              <Text style={styles.label}>PREFERRED NAME</Text>
              <NonCredentialTextInput
                autoCapitalize="words"
                maxLength={100}
                onChangeText={setDisplayName}
                placeholder="Alex"
                placeholderTextColor={SetForgeColors.textDisabled}
                returnKeyType="done"
                style={styles.input}
                value={displayName}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>UNIT SYSTEM</Text>
              <View style={styles.segmentedControl}>
                <Segment
                  active={unitSystem === 'METRIC'}
                  label="METRIC (KG)"
                  onPress={() => setUnitSystem('METRIC')}
                />
                <Segment
                  active={unitSystem === 'IMPERIAL'}
                  label="IMPERIAL (LB)"
                  onPress={() => setUnitSystem('IMPERIAL')}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>PRIMARY OBJECTIVE</Text>
              <View style={styles.wrappingOptions}>
                {objectives.map((objective) => (
                  <ChoiceChip
                    active={primaryObjective === objective.value}
                    key={objective.value}
                    label={objective.label}
                    onPress={() => setPrimaryObjective(objective.value)}
                  />
                ))}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>LIFTING EXPERIENCE</Text>
              <View style={styles.experienceOptions}>
                {experienceLevels.map((level) => (
                  <ChoiceChip
                    active={liftingExperience === level.value}
                    fill
                    key={level.value}
                    label={level.label}
                    onPress={() => setLiftingExperience(level.value)}
                  />
                ))}
              </View>
            </View>
          </View>

          <View style={styles.footer}>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Pressable
              accessibilityRole="button"
              disabled={isSaving}
              onPress={() => void saveProfile()}
              style={({ pressed }) => [
                styles.getStartedButton,
                (pressed || isSaving) && styles.pressed,
              ]}>
              {isSaving ? (
                <ActivityIndicator color={SetForgeColors.canvas} />
              ) : (
                <Text style={styles.getStartedLabel}>GET STARTED</Text>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Segment({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [styles.segment, active && styles.activeSegment, pressed && styles.pressed]}>
      <Text style={[styles.segmentLabel, active && styles.activeSegmentLabel]}>{label}</Text>
    </Pressable>
  );
}

function ChoiceChip({
  active,
  fill = false,
  label,
  onPress,
}: {
  active: boolean;
  fill?: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.choice,
        fill && styles.choiceFill,
        active && styles.activeChoice,
        pressed && styles.pressed,
      ]}>
      <Text style={[styles.choiceLabel, active && styles.activeChoiceLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: SetForgeColors.canvas },
  keyboardArea: { flex: 1 },
  screen: {
    flex: 1,
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    justifyContent: 'space-between',
  },
  loadingState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { gap: 8, paddingHorizontal: 24, paddingTop: 24 },
  step: { color: SetForgeColors.accent, fontFamily: 'monospace', fontSize: 11 },
  title: { color: SetForgeColors.textPrimary, fontSize: 24, lineHeight: 31, fontWeight: '800' },
  subtitle: { color: SetForgeColors.textSecondary, fontSize: 14, lineHeight: 18 },
  questions: { gap: 24, paddingHorizontal: 24 },
  field: { gap: 8 },
  label: { color: SetForgeColors.textSecondary, fontSize: 12, lineHeight: 16, fontWeight: '600' },
  input: {
    height: 48,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: SetForgeColors.border,
    borderRadius: 4,
    backgroundColor: SetForgeColors.surface,
    color: SetForgeColors.textPrimary,
    fontSize: 14,
  },
  segmentedControl: {
    height: 44,
    flexDirection: 'row',
    padding: 4,
    borderWidth: 1,
    borderColor: SetForgeColors.border,
    borderRadius: 6,
    backgroundColor: SetForgeColors.surface,
  },
  segment: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 4 },
  activeSegment: { backgroundColor: SetForgeColors.accent },
  segmentLabel: { color: SetForgeColors.textSecondary, fontSize: 14, fontWeight: '600' },
  activeSegmentLabel: { color: SetForgeColors.canvas, fontWeight: '700' },
  wrappingOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  experienceOptions: { flexDirection: 'row', gap: 8 },
  choice: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 37,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: SetForgeColors.border,
    borderRadius: 4,
    backgroundColor: SetForgeColors.surface,
  },
  choiceFill: { flex: 1, paddingHorizontal: 4 },
  activeChoice: { borderColor: SetForgeColors.accent, backgroundColor: SetForgeColors.accentTint },
  choiceLabel: { color: SetForgeColors.textPrimary, fontSize: 13, fontWeight: '600' },
  activeChoiceLabel: { color: SetForgeColors.accent, fontWeight: '700' },
  footer: { gap: 10, paddingHorizontal: 24, paddingBottom: 40 },
  error: { color: '#FCA5A5', fontSize: 11, lineHeight: 15, textAlign: 'center' },
  getStartedButton: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
    backgroundColor: SetForgeColors.accent,
  },
  getStartedLabel: { color: SetForgeColors.canvas, fontSize: 14, fontWeight: '700' },
  pressed: { opacity: 0.7 },
});
