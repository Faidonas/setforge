import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SetForgeColors, SetForgeSpacing } from '@/constants/setforge-theme';
import type { Exercise } from '@/models/exercise';
import { getExercise, getExerciseAssetUrl } from '@/services/exercise-api';

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const exerciseId = Number(id);
  const hasInvalidId = !Number.isInteger(exerciseId) || exerciseId <= 0;

  const loadExercise = useCallback(async () => {
    if (hasInvalidId) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      setExercise(await getExercise(exerciseId));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load the exercise.');
    } finally {
      setIsLoading(false);
    }
  }, [exerciseId, hasInvalidId]);

  useEffect(() => {
    if (hasInvalidId) {
      return;
    }

    let isCurrent = true;

    getExercise(exerciseId)
      .then((loadedExercise) => {
        if (isCurrent) {
          setExercise(loadedExercise);
        }
      })
      .catch((loadError: unknown) => {
        if (isCurrent) {
          setError(loadError instanceof Error ? loadError.message : 'Could not load the exercise.');
        }
      })
      .finally(() => {
        if (isCurrent) {
          setIsLoading(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [exerciseId, hasInvalidId]);

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <Pressable
            accessibilityLabel="Back to exercise library"
            accessibilityRole="button"
            hitSlop={10}
            onPress={() => router.back()}
            style={styles.backButton}>
            <Text style={styles.backIcon}>‹</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Exercise</Text>
          <View style={styles.headerSpacer} />
        </View>

        {isLoading && !hasInvalidId ? (
          <DetailState title="Loading exercise..." loading />
        ) : hasInvalidId || error || !exercise ? (
          <DetailState
            title="Could not load exercise"
            message={hasInvalidId ? 'This exercise link is invalid.' : (error ?? 'Exercise not found.')}
            onRetry={hasInvalidId ? undefined : loadExercise}
          />
        ) : (
          <ExerciseDetails exercise={exercise} />
        )}
      </View>
    </SafeAreaView>
  );
}

function ExerciseDetails({ exercise }: { exercise: Exercise }) {
  const animationUrl = getExerciseAssetUrl(exercise.animationUrl);
  const thumbnailUrl = getExerciseAssetUrl(exercise.thumbnailUrl);
  const mediaUrl = animationUrl ?? thumbnailUrl;

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.mediaContainer}>
        {mediaUrl ? (
          <Image
            accessibilityLabel={`${exercise.name} demonstration`}
            autoplay
            cachePolicy="memory-disk"
            contentFit="contain"
            source={{ uri: mediaUrl }}
            style={styles.media}
            transition={150}
          />
        ) : (
          <Text style={styles.noMedia}>No demonstration available</Text>
        )}
      </View>

      <View style={styles.titleBlock}>
        <Text style={styles.exerciseName}>{exercise.name}</Text>
        <Text style={styles.exerciseType}>
          {exercise.exerciseType === 'TIMED' ? 'TIMED EXERCISE' : 'WEIGHT & REPS'}
        </Text>
      </View>

      <View style={styles.factGrid}>
        <Fact label="PRIMARY MUSCLE" value={exercise.primaryMuscle} />
        <Fact label="EQUIPMENT" value={exercise.equipment} />
        {exercise.bodyPart && <Fact label="BODY PART" value={exercise.bodyPart} />}
        {exercise.muscleGroup && <Fact label="SUPPORTING" value={exercise.muscleGroup} />}
      </View>

      {exercise.secondaryMuscles && (
        <Section title="SECONDARY MUSCLES">
          <Text style={styles.bodyText}>{exercise.secondaryMuscles}</Text>
        </Section>
      )}

      <Section title="INSTRUCTIONS">
        <Text style={styles.bodyText}>
          {exercise.instructions || 'Instructions are not available for this exercise yet.'}
        </Text>
      </Section>

      {exercise.attribution && <Text style={styles.attribution}>{exercise.attribution}</Text>}
    </ScrollView>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.fact}>
      <Text style={styles.factLabel}>{label}</Text>
      <Text style={styles.factValue}>{value}</Text>
    </View>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

type DetailStateProps = {
  title: string;
  message?: string;
  loading?: boolean;
  onRetry?: () => void;
};

function DetailState({ title, message, loading, onRetry }: DetailStateProps) {
  return (
    <View style={styles.stateContainer}>
      {loading && <ActivityIndicator color={SetForgeColors.accent} />}
      <Text style={styles.stateTitle}>{title}</Text>
      {message && <Text style={styles.stateMessage}>{message}</Text>}
      {onRetry && (
        <Pressable accessibilityRole="button" onPress={() => void onRetry()} style={styles.retryButton}>
          <Text style={styles.retryLabel}>TRY AGAIN</Text>
        </Pressable>
      )}
    </View>
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
  },
  header: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: SetForgeColors.border,
  },
  backButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    color: SetForgeColors.textPrimary,
    fontSize: 36,
    lineHeight: 38,
    fontWeight: '300',
  },
  headerTitle: {
    color: SetForgeColors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 42,
  },
  content: {
    padding: 20,
    paddingBottom: SetForgeSpacing.xxl,
  },
  mediaContainer: {
    width: '78%',
    maxWidth: 300,
    height: 212,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: 10,
    backgroundColor: SetForgeColors.canvas,
  },
  media: {
    width: '100%',
    height: '100%',
  },
  noMedia: {
    color: SetForgeColors.textDisabled,
    fontSize: 13,
  },
  titleBlock: {
    gap: 8,
    paddingVertical: 22,
  },
  exerciseName: {
    color: SetForgeColors.textPrimary,
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  exerciseType: {
    color: SetForgeColors.accent,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  factGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  fact: {
    width: '48%',
    flexGrow: 1,
    gap: 6,
    padding: 14,
    borderWidth: 1,
    borderColor: SetForgeColors.border,
    borderRadius: 6,
    backgroundColor: SetForgeColors.surface,
  },
  factLabel: {
    color: SetForgeColors.textDisabled,
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  factValue: {
    color: SetForgeColors.textPrimary,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  section: {
    gap: 10,
    marginTop: 24,
  },
  sectionTitle: {
    color: SetForgeColors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  bodyText: {
    color: SetForgeColors.textPrimary,
    fontSize: 14,
    lineHeight: 22,
  },
  attribution: {
    marginTop: 28,
    color: SetForgeColors.textDisabled,
    fontSize: 10,
    lineHeight: 14,
    textAlign: 'center',
  },
  stateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 28,
  },
  stateTitle: {
    color: SetForgeColors.textPrimary,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  stateMessage: {
    color: SetForgeColors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 4,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: SetForgeColors.accent,
    borderRadius: 4,
  },
  retryLabel: {
    color: SetForgeColors.accent,
    fontSize: 12,
    fontWeight: '700',
  },
});
