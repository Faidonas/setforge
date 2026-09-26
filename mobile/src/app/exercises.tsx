import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Exercise } from '@/models/exercise';
import { getExercises } from '@/services/exercise-api';

export default function ExerciseListScreen() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const theme = useTheme();

  useEffect(() => {
    let isMounted = true;

    async function loadExercises() {
      try {
        const loadedExercises = await getExercises();

        if (isMounted) {
          setExercises(loadedExercises);
        }
      } catch (caughtError) {
        if (isMounted) {
          setError(
            caughtError instanceof Error ? caughtError.message : 'Could not load exercises.',
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadExercises();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.header}>
        <ThemedText type="subtitle">Exercises</ThemedText>
        <ThemedText themeColor="textSecondary">Choose a movement for your workout.</ThemedText>
      </View>

      {isLoading ? (
        <View style={styles.stateContainer}>
          <ActivityIndicator size="large" color={theme.text} />
          <ThemedText themeColor="textSecondary">Loading exercises…</ThemedText>
        </View>
      ) : error ? (
        <View style={styles.stateContainer}>
          <ThemedText type="smallBold">Unable to load exercises</ThemedText>
          <ThemedText style={styles.stateText} themeColor="textSecondary">
            {error}
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={exercises}
          keyExtractor={(exercise) => exercise.id.toString()}
          renderItem={({ item }) => <ExerciseCard exercise={item} />}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <View style={styles.stateContainer}>
              <ThemedText type="smallBold">No exercises found</ThemedText>
              <ThemedText style={styles.stateText} themeColor="textSecondary">
                Exercises will appear here when they are added to the catalogue.
              </ThemedText>
            </View>
          }
          contentContainerStyle={[
            styles.listContent,
            exercises.length === 0 && styles.emptyListContent,
          ]}
          style={styles.list}
        />
      )}
    </SafeAreaView>
  );
}

function ExerciseCard({ exercise }: { exercise: Exercise }) {
  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <ThemedText type="smallBold" style={styles.exerciseName}>
        {exercise.name}
      </ThemedText>
      <View style={styles.detailsRow}>
        <ThemedText type="small" themeColor="textSecondary">
          {exercise.primaryMuscle}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          ·
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {exercise.equipment}
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.three,
    gap: Spacing.one,
  },
  list: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  listContent: {
    paddingHorizontal: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.four,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  card: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  exerciseName: {
    fontSize: 18,
  },
  detailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  separator: {
    height: Spacing.three,
  },
  stateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
    gap: Spacing.two,
  },
  stateText: {
    textAlign: 'center',
  },
});
