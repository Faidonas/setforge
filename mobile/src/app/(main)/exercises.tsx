import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SetForgeColors, SetForgeSpacing } from '@/constants/setforge-theme';
import type { Exercise } from '@/models/exercise';
import { getExerciseAssetUrl, getExercises } from '@/services/exercise-api';

export default function ExerciseLibraryScreen() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadExercises = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      setExercises(await getExercises());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load exercises.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isCurrent = true;

    getExercises()
      .then((loadedExercises) => {
        if (isCurrent) {
          setExercises(loadedExercises);
        }
      })
      .catch((loadError: unknown) => {
        if (isCurrent) {
          setError(loadError instanceof Error ? loadError.message : 'Could not load exercises.');
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
  }, []);

  const filteredExercises = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return exercises;
    }

    return exercises.filter((exercise) =>
      [exercise.name, exercise.primaryMuscle, exercise.bodyPart, exercise.equipment].some((value) =>
        value?.toLowerCase().includes(normalizedQuery),
      ),
    );
  }, [exercises, query]);

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <Text style={styles.title}>Exercises</Text>
          <Text style={styles.subtitle}>{exercises.length} movements</Text>
        </View>

        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput
            accessibilityLabel="Search exercises"
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={setQuery}
            placeholder="Search exercise, muscle, or equipment"
            placeholderTextColor={SetForgeColors.textDisabled}
            returnKeyType="search"
            style={styles.searchInput}
            value={query}
          />
        </View>

        {isLoading ? (
          <LibraryState title="Loading exercises..." loading />
        ) : error ? (
          <LibraryState title="Could not load exercises" message={error} onRetry={loadExercises} />
        ) : (
          <FlatList
            contentContainerStyle={styles.listContent}
            data={filteredExercises}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            keyExtractor={(exercise) => exercise.id.toString()}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <LibraryState
                title="No exercises found"
                message="Try a different exercise, muscle, or equipment name."
              />
            }
            renderItem={({ item }) => <ExerciseRow exercise={item} />}
          />
        )}

      </View>
    </SafeAreaView>
  );
}

function ExerciseRow({ exercise }: { exercise: Exercise }) {
  const router = useRouter();
  const thumbnailUrl = getExerciseAssetUrl(exercise.thumbnailUrl);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${exercise.name}`}
      onPress={() =>
        router.push({ pathname: '/exercise/[id]', params: { id: exercise.id.toString() } })
      }
      style={({ pressed }) => [styles.exerciseRow, pressed && styles.rowPressed]}>
      <View style={styles.thumbnailContainer}>
        {thumbnailUrl ? (
          <Image
            accessibilityLabel={`${exercise.name} preview`}
            contentFit="contain"
            source={{ uri: thumbnailUrl }}
            style={styles.thumbnail}
            transition={150}
          />
        ) : (
          <Text style={styles.thumbnailFallback}>{exercise.name.charAt(0).toUpperCase()}</Text>
        )}
      </View>

      <View style={styles.exerciseText}>
        <Text numberOfLines={2} style={styles.exerciseName}>
          {exercise.name}
        </Text>
        <Text numberOfLines={1} style={styles.exerciseMeta}>
          {exercise.primaryMuscle} · {exercise.equipment}
        </Text>
      </View>

      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

type LibraryStateProps = {
  title: string;
  message?: string;
  loading?: boolean;
  onRetry?: () => void;
};

function LibraryState({ title, message, loading, onRetry }: LibraryStateProps) {
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    color: SetForgeColors.textPrimary,
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '800',
  },
  subtitle: {
    marginTop: 2,
    color: SetForgeColors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
  },
  searchContainer: {
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: SetForgeColors.border,
    borderRadius: 6,
    backgroundColor: SetForgeColors.surface,
  },
  searchIcon: {
    marginRight: 8,
    color: SetForgeColors.textSecondary,
    fontSize: 22,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    color: SetForgeColors.textPrimary,
    fontSize: 14,
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: SetForgeSpacing.lg,
  },
  separator: {
    height: 8,
  },
  exerciseRow: {
    minHeight: 84,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderWidth: 1,
    borderColor: SetForgeColors.border,
    borderRadius: 8,
    backgroundColor: SetForgeColors.surface,
  },
  rowPressed: {
    opacity: 0.72,
  },
  thumbnailContainer: {
    width: 66,
    height: 66,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: 6,
    backgroundColor: '#ECECEC',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  thumbnailFallback: {
    color: SetForgeColors.canvas,
    fontSize: 24,
    fontWeight: '800',
  },
  exerciseText: {
    flex: 1,
    gap: 5,
    paddingHorizontal: 12,
  },
  exerciseName: {
    color: SetForgeColors.textPrimary,
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  exerciseMeta: {
    color: SetForgeColors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
    textTransform: 'capitalize',
  },
  chevron: {
    paddingHorizontal: 6,
    color: SetForgeColors.textSecondary,
    fontSize: 28,
    fontWeight: '300',
  },
  stateContainer: {
    flex: 1,
    minHeight: 220,
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
