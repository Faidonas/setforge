import { Image } from 'expo-image';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SetForgeColors } from '@/constants/setforge-theme';
import { WorkoutBottomNav } from '@/features/navigation/components/workout-bottom-nav';
import { WorkoutTemplateCard } from '@/features/workouts/components/workout-template-card';
import type { WorkoutTemplate } from '@/models/workout-template';
import { getWorkoutTemplates } from '@/services/workout-template-api';

const moreIcon = require('@/assets/images/figma/more-horizontal.svg');
const plusIcon = require('@/assets/images/figma/plus.svg');

// Authentication is not available yet. Replace this with the signed-in user's ID later.
const DEVELOPMENT_OWNER_ID = 1;

export default function StartWorkoutScreen() {
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTemplates = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      setTemplates(await getWorkoutTemplates(DEVELOPMENT_OWNER_ID));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load workout templates.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isCurrent = true;

    getWorkoutTemplates(DEVELOPMENT_OWNER_ID)
      .then((loadedTemplates) => {
        if (isCurrent) {
          setTemplates(loadedTemplates);
        }
      })
      .catch((loadError: unknown) => {
        if (isCurrent) {
          setError(
            loadError instanceof Error ? loadError.message : 'Could not load workout templates.',
          );
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

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.screen}>
        <FlatList
          contentContainerStyle={styles.content}
          data={templates}
          keyExtractor={(template) => template.id.toString()}
          renderItem={({ item }) => <WorkoutTemplateCard template={item} />}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListHeaderComponent={
            <>
              <View style={styles.header}>
                <Text style={styles.title}>Start Workout</Text>
                <Pressable accessibilityLabel="More workout options" hitSlop={8}>
                  <Image source={moreIcon} style={styles.headerIcon} contentFit="contain" />
                </Pressable>
              </View>

              <View style={styles.quickStart}>
                <Pressable accessibilityRole="button" style={styles.primaryButton}>
                  <Text style={styles.primaryButtonLabel}>START EMPTY WORKOUT</Text>
                </Pressable>
              </View>

              <View style={styles.templatesHeader}>
                <Text style={styles.templatesTitle}>MY TEMPLATES ({templates.length})</Text>
                <Pressable accessibilityRole="button" style={styles.newTemplateButton}>
                  <Image source={plusIcon} style={styles.plusIcon} contentFit="contain" />
                  <Text style={styles.newTemplateLabel}>NEW TEMPLATE</Text>
                </Pressable>
              </View>
            </>
          }
          ListEmptyComponent={
            <TemplateListState
              error={error}
              isLoading={isLoading}
              onRetry={() => void loadTemplates()}
            />
          }
        />
        <WorkoutBottomNav />
      </View>
    </SafeAreaView>
  );
}

type TemplateListStateProps = {
  error: string | null;
  isLoading: boolean;
  onRetry: () => void;
};

function TemplateListState({ error, isLoading, onRetry }: TemplateListStateProps) {
  if (isLoading) {
    return (
      <View style={styles.stateContainer}>
        <ActivityIndicator color={SetForgeColors.accent} />
        <Text style={styles.stateTitle}>Loading templates...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.stateContainer}>
        <Text style={styles.stateTitle}>Could not load your templates</Text>
        <Text style={styles.stateMessage}>{error}</Text>
        <Pressable accessibilityRole="button" onPress={onRetry} style={styles.retryButton}>
          <Text style={styles.retryLabel}>TRY AGAIN</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.stateContainer}>
      <Text style={styles.stateTitle}>No templates yet</Text>
      <Text style={styles.stateMessage}>Create a template to plan your first workout.</Text>
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
  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 20,
  },
  title: {
    color: SetForgeColors.textPrimary,
    fontSize: 24,
    lineHeight: 31,
    fontWeight: '800',
  },
  headerIcon: {
    width: 20,
    height: 20,
    margin: 10,
  },
  quickStart: {
    paddingTop: 20,
  },
  primaryButton: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
    backgroundColor: SetForgeColors.accent,
  },
  primaryButtonLabel: {
    color: SetForgeColors.canvas,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
  },
  templatesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 24,
    paddingBottom: 12,
  },
  templatesTitle: {
    color: SetForgeColors.textSecondary,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
  },
  newTemplateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  plusIcon: {
    width: 14,
    height: 14,
  },
  newTemplateLabel: {
    color: SetForgeColors.accent,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
  separator: {
    height: 12,
  },
  stateContainer: {
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 24,
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
