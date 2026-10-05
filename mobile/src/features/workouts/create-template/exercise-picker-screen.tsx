import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SetForgeColors } from '@/constants/setforge-theme';
import { ExerciseBodyPartFilter } from '@/features/exercises/exercise-body-part-filter';
import {
  filterExercises,
  groupExercisesAlphabetically,
  type ExerciseBodyPart,
} from '@/features/exercises/exercise-library-utils';
import { useCreateTemplateDraft } from '@/features/workouts/create-template/create-template-draft-context';
import type { Exercise } from '@/models/exercise';
import { getExerciseAssetUrl, getExercises } from '@/services/exercise-api';

type ExercisePickerProps = {
  existingExerciseIds: number[];
  onAddExercises: (exercises: Exercise[]) => void;
};

export function ExercisePicker({ existingExerciseIds, onAddExercises }: ExercisePickerProps) {
  const router = useRouter();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(() => new Set());
  const [query, setQuery] = useState('');
  const [bodyPart, setBodyPart] = useState<ExerciseBodyPart>('Any Body Part');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const existingIds = useMemo(
    () => new Set(existingExerciseIds),
    [existingExerciseIds],
  );

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
    return filterExercises(exercises, query, bodyPart);
  }, [bodyPart, exercises, query]);

  const sections = useMemo(
    () => groupExercisesAlphabetically(filteredExercises),
    [filteredExercises],
  );

  const toggleExercise = (exerciseId: number) => {
    if (existingIds.has(exerciseId)) {
      return;
    }

    setSelectedIds((currentIds) => {
      const nextIds = new Set(currentIds);

      if (nextIds.has(exerciseId)) {
        nextIds.delete(exerciseId);
      } else {
        nextIds.add(exerciseId);
      }

      return nextIds;
    });
  };

  const confirmSelection = () => {
    onAddExercises(exercises.filter((exercise) => selectedIds.has(exercise.id)));
    router.back();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" hitSlop={10} onPress={() => router.back()}>
            <Text style={styles.headerAction}>BACK</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Add Exercises</Text>
          <Pressable
            accessibilityRole="button"
            disabled={selectedIds.size === 0}
            hitSlop={10}
            onPress={confirmSelection}>
            <Text
              style={[styles.headerAction, selectedIds.size === 0 && styles.headerActionDisabled]}>
              ADD{selectedIds.size > 0 ? ` (${selectedIds.size})` : ''}
            </Text>
          </Pressable>
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

        <View style={styles.filtersRow}>
          <ExerciseBodyPartFilter onChange={setBodyPart} value={bodyPart} />
          <Text style={styles.resultCount}>{filteredExercises.length} exercises</Text>
        </View>

        {isLoading ? (
          <PickerState loading title="Loading exercises..." />
        ) : error ? (
          <PickerState message={error} onRetry={loadExercises} title="Could not load exercises" />
        ) : (
          <SectionList
            contentContainerStyle={styles.listContent}
            sections={sections}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            keyboardShouldPersistTaps="handled"
            keyExtractor={(exercise) => exercise.id.toString()}
            ListEmptyComponent={
              <PickerState
                message="Try a different exercise, muscle, or equipment name."
                title="No exercises found"
              />
            }
            renderItem={({ item }) => (
              <ExercisePickerRow
                exercise={item}
                isAlreadyAdded={existingIds.has(item.id)}
                isSelected={selectedIds.has(item.id)}
                onPress={() => toggleExercise(item.id)}
              />
            )}
            renderSectionHeader={({ section }) => (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
              </View>
            )}
            stickySectionHeadersEnabled
          />
        )}
      </View>
    </SafeAreaView>
  );
}

export default function ExercisePickerScreen() {
  const { addExercises, exercises } = useCreateTemplateDraft();

  return (
    <ExercisePicker
      existingExerciseIds={exercises.map(({ exercise }) => exercise.id)}
      onAddExercises={addExercises}
    />
  );
}

type ExercisePickerRowProps = {
  exercise: Exercise;
  isAlreadyAdded: boolean;
  isSelected: boolean;
  onPress: () => void;
};

function ExercisePickerRow({ exercise, isAlreadyAdded, isSelected, onPress }: ExercisePickerRowProps) {
  const thumbnailUrl = getExerciseAssetUrl(exercise.thumbnailUrl);

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: isSelected || isAlreadyAdded, disabled: isAlreadyAdded }}
      disabled={isAlreadyAdded}
      onPress={onPress}
      style={({ pressed }) => [
        styles.exerciseRow,
        isSelected && styles.exerciseRowSelected,
        isAlreadyAdded && styles.exerciseRowDisabled,
        pressed && styles.exerciseRowPressed,
      ]}>
      <View style={styles.thumbnailContainer}>
        {thumbnailUrl ? (
          <Image contentFit="contain" source={{ uri: thumbnailUrl }} style={styles.thumbnail} />
        ) : (
          <Text style={styles.thumbnailFallback}>{exercise.name.charAt(0)}</Text>
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
      <View
        style={[
          styles.selectionIndicator,
          (isSelected || isAlreadyAdded) && styles.selectionIndicatorActive,
        ]}>
        {(isSelected || isAlreadyAdded) && <Text style={styles.checkmark}>✓</Text>}
      </View>
    </Pressable>
  );
}

type PickerStateProps = {
  title: string;
  message?: string;
  loading?: boolean;
  onRetry?: () => void;
};

function PickerState({ title, message, loading, onRetry }: PickerStateProps) {
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
  safeArea: { flex: 1, backgroundColor: SetForgeColors.canvas },
  screen: { flex: 1, width: '100%', maxWidth: 520, alignSelf: 'center' },
  header: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: SetForgeColors.border,
  },
  headerTitle: { color: SetForgeColors.textPrimary, fontSize: 17, fontWeight: '800' },
  headerAction: { color: SetForgeColors.accent, fontSize: 12, fontWeight: '800' },
  headerActionDisabled: { color: SetForgeColors.textDisabled },
  searchContainer: {
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    margin: 20,
    marginBottom: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: SetForgeColors.border,
    borderRadius: 6,
    backgroundColor: SetForgeColors.surface,
  },
  searchIcon: { marginRight: 8, color: SetForgeColors.textSecondary, fontSize: 22 },
  searchInput: { flex: 1, height: '100%', color: SetForgeColors.textPrimary, fontSize: 14 },
  filtersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  resultCount: { color: SetForgeColors.textSecondary, fontSize: 11, fontWeight: '600' },
  listContent: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 30 },
  separator: { height: 6 },
  sectionHeader: {
    paddingTop: 8,
    paddingBottom: 7,
    backgroundColor: SetForgeColors.canvas,
    borderBottomWidth: 1,
    borderBottomColor: SetForgeColors.border,
  },
  sectionTitle: {
    color: SetForgeColors.textSecondary,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '800',
  },
  exerciseRow: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
    borderWidth: 1,
    borderColor: SetForgeColors.border,
    borderRadius: 7,
    backgroundColor: SetForgeColors.surface,
  },
  exerciseRowSelected: { borderColor: SetForgeColors.accent, backgroundColor: SetForgeColors.accentTint },
  exerciseRowDisabled: { opacity: 0.48 },
  exerciseRowPressed: { opacity: 0.7 },
  thumbnailContainer: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: 5,
    backgroundColor: '#ECECEC',
  },
  thumbnail: { width: '100%', height: '100%' },
  thumbnailFallback: { color: SetForgeColors.canvas, fontSize: 20, fontWeight: '800' },
  exerciseText: { flex: 1, gap: 3, paddingHorizontal: 10 },
  exerciseName: {
    color: SetForgeColors.textPrimary,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  exerciseMeta: {
    color: SetForgeColors.textSecondary,
    fontSize: 11,
    lineHeight: 15,
    textTransform: 'capitalize',
  },
  selectionIndicator: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 5,
    borderWidth: 1,
    borderColor: SetForgeColors.textDisabled,
    borderRadius: 11,
  },
  selectionIndicatorActive: { borderColor: SetForgeColors.accent, backgroundColor: SetForgeColors.accent },
  checkmark: { color: SetForgeColors.canvas, fontSize: 13, fontWeight: '900' },
  stateContainer: {
    flex: 1,
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 28,
  },
  stateTitle: { color: SetForgeColors.textPrimary, fontSize: 15, fontWeight: '700', textAlign: 'center' },
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
  retryLabel: { color: SetForgeColors.accent, fontSize: 12, fontWeight: '700' },
});
