import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SetForgeColors } from '@/constants/setforge-theme';
import type { MenuAnchor } from '@/components/anchored-menu-modal';
import { useActiveWorkout } from '@/features/workouts/active-workout/active-workout-context';
import { WorkoutTemplateActionsModal } from '@/features/workouts/components/workout-template-actions-modal';
import { WorkoutTemplateCard } from '@/features/workouts/components/workout-template-card';
import { WorkoutTemplatePreviewModal } from '@/features/workouts/components/workout-template-preview-modal';
import { ReorderableTemplateGrid } from '@/features/workouts/components/reorderable-template-grid';
import type {
  CreateWorkoutTemplateExerciseRequest,
  WorkoutTemplate,
} from '@/models/workout-template';
import {
  createWorkoutTemplate,
  deleteWorkoutTemplate,
  getWorkoutTemplates,
  reorderWorkoutTemplates,
  updateWorkoutTemplate,
} from '@/services/workout-template-api';
import { cancelWorkoutSession, startWorkoutSession } from '@/services/workout-session-api';

const plusIcon = require('@/assets/images/figma/plus.svg');
const templateKeyExtractor = (template: WorkoutTemplate) => template.id.toString();

export default function StartWorkoutScreen() {
  const router = useRouter();
  const activeWorkout = useActiveWorkout();
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<WorkoutTemplate | null>(null);
  const [actionTemplate, setActionTemplate] = useState<WorkoutTemplate | null>(null);
  const [actionAnchor, setActionAnchor] = useState<MenuAnchor | null>(null);
  const [isStartingWorkout, setIsStartingWorkout] = useState(false);
  const [pendingStart, setPendingStart] = useState<{ template?: WorkoutTemplate } | null>(null);
  const reorderQueueRef = useRef<Promise<void>>(Promise.resolve());

  const createWorkout = async (template?: WorkoutTemplate) => {
    const session = await startWorkoutSession({
      templateId: template?.id,
    });
    activeWorkout.loadSession(session);
    activeWorkout.expand();
    setSelectedTemplate(null);
  };

  const startWorkout = async (template?: WorkoutTemplate) => {
    if (isStartingWorkout || activeWorkout.isHydrating) return;
    if (activeWorkout.session?.status === 'IN_PROGRESS') {
      setSelectedTemplate(null);
      setPendingStart({ template });
      return;
    }
    try {
      setIsStartingWorkout(true);
      setError(null);
      await createWorkout(template);
    } catch (startError) {
      setError(startError instanceof Error ? startError.message : 'Could not start the workout.');
    } finally {
      setIsStartingWorkout(false);
    }
  };

  const discardAndStartWorkout = async () => {
    const currentSession = activeWorkout.session;
    const template = pendingStart?.template;
    if (!currentSession || isStartingWorkout) return;
    try {
      setIsStartingWorkout(true);
      setError(null);
      setPendingStart(null);
      await cancelWorkoutSession(currentSession.id);
      activeWorkout.reset();
      await createWorkout(template);
    } catch (startError) {
      setError(startError instanceof Error ? startError.message : 'Could not start the workout.');
      await activeWorkout.refreshActiveWorkout();
    } finally {
      setIsStartingWorkout(false);
    }
  };

  const resumeWorkout = () => {
    setPendingStart(null);
    activeWorkout.expand();
  };

  const loadTemplates = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      setTemplates(await getWorkoutTemplates());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load workout templates.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const renameTemplate = async (name: string) => {
    if (!actionTemplate) {
      return;
    }

    const updatedTemplate = await updateWorkoutTemplate(actionTemplate.id, {
      name,
      description: actionTemplate.description,
      exercises: toWriteExercises(actionTemplate),
    });

    setTemplates((currentTemplates) => currentTemplates.map((template) =>
      template.id === updatedTemplate.id ? updatedTemplate : template,
    ));
    setSelectedTemplate((currentTemplate) =>
      currentTemplate?.id === updatedTemplate.id ? updatedTemplate : currentTemplate,
    );
  };

  const duplicateTemplate = async () => {
    if (!actionTemplate) {
      return;
    }

    const duplicateName = `${actionTemplate.name.slice(0, 95).trimEnd()} Copy`;
    const duplicatedTemplate = await createWorkoutTemplate({
      name: duplicateName,
      description: actionTemplate.description,
      exercises: toWriteExercises(actionTemplate),
    });

    setTemplates((currentTemplates) => [...currentTemplates, duplicatedTemplate]);
  };

  const reorderTemplates = useCallback((orderedTemplates: WorkoutTemplate[]) => {
    const normalizedTemplates = orderedTemplates.map((template, position) => ({
      ...template,
      position,
    }));
    setTemplates(normalizedTemplates);
    setError(null);
    reorderQueueRef.current = reorderQueueRef.current
      .catch(() => undefined)
      .then(() => reorderWorkoutTemplates(normalizedTemplates.map((template) => template.id)))
      .catch((reorderError: unknown) => {
        setError(
          reorderError instanceof Error ? reorderError.message : 'Could not save the template order.',
        );
        void loadTemplates();
      });
  }, [loadTemplates]);

  const deleteTemplate = async () => {
    if (!actionTemplate) {
      return;
    }

    const deletedTemplateId = actionTemplate.id;
    await deleteWorkoutTemplate(deletedTemplateId);
    setTemplates((currentTemplates) =>
      currentTemplates.filter((template) => template.id !== deletedTemplateId),
    );
    setSelectedTemplate((currentTemplate) =>
      currentTemplate?.id === deletedTemplateId ? null : currentTemplate,
    );
  };

  const openTemplateEditor = (template: WorkoutTemplate) => {
    const templateId = template.id.toString();
    setActionTemplate(null);
    setSelectedTemplate(null);
    router.push({ pathname: '/edit-template/[id]', params: { id: templateId } });
  };

  const editTemplate = () => {
    if (actionTemplate) {
      openTemplateEditor(actionTemplate);
    }
  };

  useEffect(() => {
    let isCurrent = true;

    getWorkoutTemplates()
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
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>Start Workout</Text>
          </View>

          <View style={styles.quickStart}>
            <Pressable
              accessibilityRole="button"
              disabled={isStartingWorkout || activeWorkout.isHydrating}
              onPress={() => void startWorkout()}
              style={[
                styles.primaryButton,
                (isStartingWorkout || activeWorkout.isHydrating) && styles.buttonDisabled,
              ]}>
              <Text style={styles.primaryButtonLabel}>
                {isStartingWorkout ? 'STARTING...' : 'START EMPTY WORKOUT'}
              </Text>
            </Pressable>
          </View>

          {error && templates.length > 0 && (
            <Text style={styles.inlineError}>{error}</Text>
          )}

          <View style={styles.templatesHeader}>
            <Text style={styles.templatesTitle}>MY TEMPLATES ({templates.length})</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/create-template/new')}
              style={styles.newTemplateButton}>
              <Image source={plusIcon} style={styles.plusIcon} contentFit="contain" />
              <Text style={styles.newTemplateLabel}>NEW TEMPLATE</Text>
            </Pressable>
          </View>

          {templates.length > 0 ? (
            <ReorderableTemplateGrid
              data={templates}
              keyExtractor={templateKeyExtractor}
              onReorder={reorderTemplates}
              renderItem={(item) => (
                <WorkoutTemplateCard
                  onMorePress={(anchor) => {
                    setActionAnchor(anchor);
                    setActionTemplate(item);
                  }}
                  onPress={() => setSelectedTemplate(item)}
                  template={item}
                />
              )}
            />
          ) : (
            <TemplateListState
              error={error}
              isLoading={isLoading}
              onRetry={() => void loadTemplates()}
            />
          )}
        </ScrollView>
        <WorkoutTemplatePreviewModal
          onClose={() => setSelectedTemplate(null)}
          onEdit={openTemplateEditor}
          onStart={(template) => void startWorkout(template)}
          isStarting={isStartingWorkout || activeWorkout.isHydrating}
          template={selectedTemplate}
        />
        <WorkoutTemplateActionsModal
          anchor={actionAnchor}
          onClose={() => {
            setActionTemplate(null);
            setActionAnchor(null);
          }}
          onDelete={deleteTemplate}
          onDuplicate={duplicateTemplate}
          onEdit={editTemplate}
          onRename={renameTemplate}
          template={actionTemplate}
        />
        <ActiveWorkoutWarningModal
          activeWorkoutName={activeWorkout.session?.name ?? 'Current Workout'}
          isBusy={isStartingWorkout}
          onClose={() => setPendingStart(null)}
          onResume={resumeWorkout}
          onStartNew={() => void discardAndStartWorkout()}
          visible={pendingStart !== null}
        />
      </View>
    </SafeAreaView>
  );
}

function ActiveWorkoutWarningModal({
  visible,
  activeWorkoutName,
  isBusy,
  onStartNew,
  onResume,
  onClose,
}: {
  visible: boolean;
  activeWorkoutName: string;
  isBusy: boolean;
  onStartNew: () => void;
  onResume: () => void;
  onClose: () => void;
}) {
  return (
    <Modal animationType="fade" onRequestClose={onClose} statusBarTranslucent transparent visible={visible}>
      <Pressable accessibilityRole="button" onPress={onClose} style={styles.warningBackdrop}>
        <Pressable onPress={(event) => event.stopPropagation()} style={styles.warningCard}>
          <Text style={styles.warningEmoji}>🤔</Text>
          <Text style={styles.warningTitle}>Workout in Progress</Text>
          <Text style={styles.warningMessage}>
            {activeWorkoutName} is already running. Starting a new workout will cancel your current workout.
          </Text>
          <Pressable
            accessibilityRole="button"
            disabled={isBusy}
            onPress={onStartNew}
            style={[styles.warningAction, styles.destructiveAction]}>
            <Text style={styles.destructiveLabel}>{isBusy ? 'STARTING...' : 'START NEW WORKOUT'}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={onResume} style={styles.warningAction}>
            <Text style={styles.warningActionLabel}>RESUME CURRENT WORKOUT</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={onClose} style={styles.warningAction}>
            <Text style={styles.warningActionLabel}>DO NOTHING</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function toWriteExercises(template: WorkoutTemplate): CreateWorkoutTemplateExerciseRequest[] {
  return template.exercises.map((exercise) => ({
    exerciseId: exercise.exerciseId,
    notes: exercise.notes,
    sets: exercise.sets.map((set) => ({
      setType: set.setType,
      targetReps: set.targetReps,
      targetWeight: set.targetWeight,
      targetTimeSeconds: set.targetTimeSeconds,
      restSeconds: set.restSeconds,
    })),
  }));
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
  buttonDisabled: { opacity: 0.55 },
  inlineError: {
    marginTop: 12,
    padding: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    color: '#FCA5A5',
    fontSize: 12,
    lineHeight: 17,
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
  warningBackdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
  },
  warningCard: {
    width: '100%',
    maxWidth: 390,
    padding: 22,
    borderWidth: 1,
    borderColor: SetForgeColors.border,
    borderRadius: 15,
    backgroundColor: SetForgeColors.surfaceMuted,
  },
  warningEmoji: { fontSize: 38, textAlign: 'center' },
  warningTitle: {
    marginTop: 12,
    color: SetForgeColors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  warningMessage: {
    marginTop: 12,
    marginBottom: 22,
    color: SetForgeColors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  warningAction: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    borderRadius: 7,
    backgroundColor: SetForgeColors.surface,
  },
  destructiveAction: { marginTop: 0, backgroundColor: '#FF5964' },
  destructiveLabel: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  warningActionLabel: { color: SetForgeColors.textPrimary, fontSize: 12, fontWeight: '800' },
});
