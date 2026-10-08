import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RestTimerControl, formatRestTime } from '@/components/rest-timer-control';
import { ReorderableExerciseList } from '@/components/reorderable-exercise-list';
import { SetForgeColors } from '@/constants/setforge-theme';
import {
  type DraftExercise,
  type DraftSet,
  useCreateTemplateDraft,
} from '@/features/workouts/create-template/create-template-draft-context';
import { toWorkoutTemplateExerciseRequests } from '@/features/workouts/create-template/draft-to-request';
import {
  formatPreviousResult,
  previousSetAt,
  usePreviousPerformances,
} from '@/features/workouts/previous-performance';
import type { PreviousExercisePerformance } from '@/models/workout-session';
import { getWorkoutTemplate, updateWorkoutTemplate } from '@/services/workout-template-api';

export default function EditTemplateScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const draft = useCreateTemplateDraft();
  const { loadTemplate, sourceTemplateId } = draft;
  const templateId = Number(id);
  const [isLoading, setIsLoading] = useState(sourceTemplateId !== templateId);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const previousPerformances = usePreviousPerformances(
    draft.exercises.map(({ exercise }) => exercise.id),
  );

  useEffect(() => {
    if (!Number.isInteger(templateId) || templateId <= 0 || sourceTemplateId === templateId) {
      return;
    }

    let isCurrent = true;

    getWorkoutTemplate(templateId)
      .then((template) => {
        if (isCurrent) {
          loadTemplate(template);
        }
      })
      .catch((loadError: unknown) => {
        if (isCurrent) {
          setError(loadError instanceof Error ? loadError.message : 'Could not load the template.');
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
  }, [loadTemplate, sourceTemplateId, templateId]);

  const saveTemplate = async () => {
    if (!Number.isInteger(templateId) || templateId <= 0) {
      setError('The template identifier is invalid.');
      return;
    }

    try {
      const exercises = toWorkoutTemplateExerciseRequests(draft.exercises);
      setIsSaving(true);
      setError(null);
      await updateWorkoutTemplate(templateId, {
        name: draft.name,
        description: draft.description || undefined,
        exercises,
      });
      draft.reset();
      router.replace('/start-workout');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not update the template.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!Number.isInteger(templateId) || templateId <= 0) {
    return <EditorState message="The template identifier is invalid." onBack={() => router.back()} />;
  }

  if (isLoading) {
    return <EditorState loading message="Loading template..." onBack={() => router.back()} />;
  }

  if (error && sourceTemplateId !== templateId) {
    return <EditorState message={error} onBack={() => router.back()} />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}>
        <View style={styles.screen}>
          <View style={styles.header}>
            <Pressable
              accessibilityLabel="Close template editor"
              accessibilityRole="button"
              hitSlop={10}
              onPress={() => router.back()}
              style={styles.headerSide}>
              <Text style={styles.closeLabel}>×</Text>
            </Pressable>
            <View style={styles.headerCopy}>
              <Text numberOfLines={1} style={styles.templateName}>
                {draft.name}
              </Text>
              <Text style={styles.editingLabel}>EDIT TEMPLATE</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              disabled={isSaving}
              onPress={() => void saveTemplate()}
              style={[styles.saveButton, styles.headerSide, isSaving && styles.saveButtonDisabled]}>
              {isSaving ? (
                <ActivityIndicator color={SetForgeColors.canvas} size="small" />
              ) : (
                <Text style={styles.saveLabel}>SAVE</Text>
              )}
            </Pressable>
          </View>

          <ReorderableExerciseList
            contentContainerStyle={styles.content}
            data={draft.exercises}
            getExerciseMeta={({ exercise }) => `${exercise.primaryMuscle} · ${exercise.equipment}`}
            getExerciseName={({ exercise }) => exercise.name}
            keyExtractor={(item) => item.clientId}
            onMove={draft.moveExercise}
            emptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>No exercises in this template</Text>
                <Text style={styles.emptyMessage}>Add an exercise to start rebuilding the plan.</Text>
              </View>
            }
            footerComponent={<>
              {error && <Text style={styles.errorText}>{error}</Text>}
              <View style={styles.globalActions}>
              <Pressable
                accessibilityRole="button"
                onPress={() =>
                  router.push({
                    pathname: '/edit-template/exercises',
                    params: { templateId: templateId.toString() },
                  })
                }
                style={styles.addExerciseButton}>
                <Text style={styles.addExerciseLabel}>+ ADD EXERCISE</Text>
              </Pressable>
              </View>
            </>}
            renderExpandedItem={({ drag, index, isActive, item }) => (
              <ExpandedExercise
                draftExercise={item}
                exerciseNumber={index + 1}
                isDragging={isActive}
                onLongPressDrag={drag}
                previousPerformance={previousPerformances.get(item.exercise.id)}
              />
            )}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ExpandedExercise({
  draftExercise,
  exerciseNumber,
  isDragging,
  onLongPressDrag,
  previousPerformance,
}: {
  draftExercise: DraftExercise;
  exerciseNumber: number;
  isDragging: boolean;
  onLongPressDrag: () => void;
  previousPerformance?: PreviousExercisePerformance;
}) {
  const { addSet, removeExercise, removeSet, updateExerciseNotes, updateSet } =
    useCreateTemplateDraft();
  const isTimed = draftExercise.exercise.exerciseType === 'TIMED';

  const confirmRemoveExercise = () => {
    Alert.alert(
      'Remove exercise?',
      `${draftExercise.exercise.name} will be removed from this template.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => removeExercise(draftExercise.clientId),
        },
      ],
    );
  };

  return (
    <View style={[styles.exerciseBlock, isDragging && styles.draggingExerciseBlock]}>
      <View style={styles.exerciseTitleRow}>
        <Pressable delayLongPress={300} onLongPress={onLongPressDrag} style={styles.exerciseHeading}>
          <Text style={styles.exerciseName}>
            {exerciseNumber}. {draftExercise.exercise.name}
          </Text>
          <Text style={styles.exerciseMeta}>
            {draftExercise.exercise.primaryMuscle} · {draftExercise.exercise.equipment}
          </Text>
        </Pressable>
        <Pressable
          accessibilityLabel={`Hold and drag to reorder ${draftExercise.exercise.name}`}
          accessibilityRole="button"
          delayLongPress={300}
          onLongPress={onLongPressDrag}
          style={styles.dragHandle}>
          <Text style={styles.dragHandleIcon}>≡</Text>
        </Pressable>
        <Pressable
          accessibilityLabel={`Remove ${draftExercise.exercise.name}`}
          accessibilityRole="button"
          hitSlop={10}
          onPress={confirmRemoveExercise}
          style={styles.removeExerciseButton}>
          <Text style={styles.removeExerciseIcon}>×</Text>
        </Pressable>
      </View>

      <TextInput
        accessibilityLabel={`Notes for ${draftExercise.exercise.name}`}
        maxLength={500}
        onChangeText={(notes) => updateExerciseNotes(draftExercise.clientId, notes)}
        placeholder="Add exercise notes"
        placeholderTextColor={SetForgeColors.textDisabled}
        style={styles.notesInput}
        value={draftExercise.notes}
      />

      <SetHeader isTimed={isTimed} />
      <View>
        {draftExercise.sets.map((set, index) => (
          <EditableSetRow
            canRemove={draftExercise.sets.length > 1}
            index={index}
            isTimed={isTimed}
            key={set.clientId}
            previousPerformance={previousPerformance}
            onRemove={() => removeSet(draftExercise.clientId, set.clientId)}
            onUpdate={(field, value) =>
              updateSet(draftExercise.clientId, set.clientId, field, value)
            }
            set={set}
          />
        ))}
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => addSet(draftExercise.clientId)}
        style={styles.addSetButton}>
        <Text style={styles.addSetLabel}>
          + ADD SET ({formatRestTime(draftExercise.sets.at(-1)?.restSeconds)})
        </Text>
      </Pressable>
    </View>
  );
}

function SetHeader({ isTimed }: { isTimed: boolean }) {
  return (
    <View style={styles.setHeader}>
      <Text style={[styles.columnLabel, styles.setNumberColumn]}>Set</Text>
      <View style={styles.previousColumn}>
        <Text style={styles.columnLabel}>Previous</Text>
      </View>
      {!isTimed && (
        <View style={styles.metricColumn}>
          <Text style={styles.columnLabel}>kg</Text>
        </View>
      )}
      <View style={styles.metricColumn}>
        <Text style={styles.columnLabel}>{isTimed ? 'Time' : 'Reps'}</Text>
      </View>
      <View style={styles.removeColumn} />
    </View>
  );
}

type EditableSetRowProps = {
  set: DraftSet;
  index: number;
  isTimed: boolean;
  canRemove: boolean;
  previousPerformance?: PreviousExercisePerformance;
  onRemove: () => void;
  onUpdate: (
    field: 'targetReps' | 'targetWeight' | 'targetTimeSeconds' | 'restSeconds',
    value: string,
  ) => void;
};

function EditableSetRow({
  set,
  index,
  isTimed,
  canRemove,
  previousPerformance,
  onRemove,
  onUpdate,
}: EditableSetRowProps) {
  return (
    <View style={styles.setGroup}>
      <View style={styles.setRow}>
        <View style={[styles.setNumber, styles.setNumberColumn]}>
          <Text style={styles.setNumberText}>{formatSetLabel(set, index)}</Text>
        </View>
        <View style={styles.previousColumn}>
          <Text numberOfLines={1} style={styles.previousValue}>
            {formatPreviousResult(previousSetAt(previousPerformance, index), isTimed ? 'TIMED' : 'WEIGHT_AND_REPS')}
          </Text>
        </View>
        {!isTimed && (
          <SetInput
            accessibilityLabel={`Set ${index + 1} weight in kilograms`}
            onChangeText={(value) => onUpdate('targetWeight', value)}
            placeholder="—"
            value={set.targetWeight}
          />
        )}
        <SetInput
          accessibilityLabel={`Set ${index + 1} ${isTimed ? 'time in seconds' : 'repetitions'}`}
          onChangeText={(value) =>
            onUpdate(isTimed ? 'targetTimeSeconds' : 'targetReps', value)
          }
          placeholder={isTimed ? '30' : '10'}
          value={isTimed ? set.targetTimeSeconds : set.targetReps}
        />
        <Pressable
          accessibilityLabel={`Remove set ${index + 1}`}
          accessibilityRole="button"
          disabled={!canRemove}
          hitSlop={6}
          onPress={onRemove}
          style={styles.removeColumn}>
          <TrashIcon disabled={!canRemove} />
        </Pressable>
      </View>
      <RestTimerControl
        onChange={(value) => onUpdate('restSeconds', value)}
        value={set.restSeconds}
      />
    </View>
  );
}

function TrashIcon({ disabled }: { disabled: boolean }) {
  return (
    <View style={[styles.trashIcon, disabled && styles.trashIconDisabled]}>
      <View style={styles.trashHandle} />
      <View style={styles.trashLid} />
      <View style={styles.trashBody}>
        <View style={styles.trashLine} />
        <View style={styles.trashLine} />
      </View>
    </View>
  );
}

function SetInput({
  accessibilityLabel,
  value,
  placeholder,
  onChangeText,
}: {
  accessibilityLabel: string;
  value: string;
  placeholder: string;
  onChangeText: (value: string) => void;
}) {
  return (
    <View style={styles.metricColumn}>
      <TextInput
        accessibilityLabel={accessibilityLabel}
        keyboardType="decimal-pad"
        maxLength={7}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={SetForgeColors.textDisabled}
        selectTextOnFocus
        style={styles.setInput}
        value={value}
      />
    </View>
  );
}

function formatSetLabel(set: DraftSet, index: number) {
  if (set.setType === 'WARM_UP') return 'W';
  if (set.setType === 'DROP_SET') return 'D';
  if (set.setType === 'FAILURE') return 'F';
  return (index + 1).toString();
}

function EditorState({
  message,
  loading,
  onBack,
}: {
  message: string;
  loading?: boolean;
  onBack: () => void;
}) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.stateContainer}>
        {loading && <ActivityIndicator color={SetForgeColors.accent} />}
        <Text style={styles.stateMessage}>{message}</Text>
        {!loading && (
          <Pressable accessibilityRole="button" onPress={onBack} style={styles.backButton}>
            <Text style={styles.backButtonLabel}>GO BACK</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: SetForgeColors.canvas },
  keyboardView: { flex: 1 },
  screen: { flex: 1, width: '100%', maxWidth: 520, alignSelf: 'center' },
  header: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: SetForgeColors.border,
    backgroundColor: SetForgeColors.surface,
  },
  headerSide: { width: 68 },
  closeLabel: {
    color: SetForgeColors.textSecondary,
    fontSize: 30,
    lineHeight: 32,
    fontWeight: '300',
  },
  headerCopy: { flex: 1, alignItems: 'center', gap: 2 },
  templateName: {
    width: '100%',
    color: SetForgeColors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  editingLabel: { color: SetForgeColors.accent, fontSize: 10, fontWeight: '800' },
  saveButton: {
    minWidth: 68,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
    backgroundColor: SetForgeColors.accent,
  },
  saveButtonDisabled: { opacity: 0.5 },
  saveLabel: { color: SetForgeColors.canvas, fontSize: 12, fontWeight: '900' },
  content: { paddingBottom: 44 },
  exerciseBlock: {
    gap: 9,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: SetForgeColors.border,
  },
  draggingExerciseBlock: { backgroundColor: SetForgeColors.surfaceMuted },
  exerciseTitleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  exerciseHeading: { flex: 1, gap: 2 },
  dragHandle: {
    width: 32,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dragHandleIcon: { color: SetForgeColors.textSecondary, fontSize: 23, lineHeight: 25 },
  exerciseName: {
    color: SetForgeColors.textPrimary,
    fontSize: 17,
    lineHeight: 21,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  exerciseMeta: {
    color: SetForgeColors.textSecondary,
    fontSize: 11,
    lineHeight: 15,
    textTransform: 'capitalize',
  },
  removeExerciseButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.5)',
    borderRadius: 14,
    backgroundColor: 'rgba(248, 113, 113, 0.1)',
  },
  removeExerciseIcon: { color: '#F87171', fontSize: 21, lineHeight: 23, fontWeight: '500' },
  notesInput: {
    minHeight: 34,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: SetForgeColors.border,
    borderRadius: 6,
    backgroundColor: SetForgeColors.surface,
    color: SetForgeColors.textPrimary,
    fontSize: 13,
  },
  setHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  columnLabel: {
    color: SetForgeColors.textDisabled,
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
  setNumberColumn: { width: 34, flexGrow: 0, flexShrink: 0 },
  previousColumn: { flex: 1.45, minWidth: 0 },
  metricColumn: { flex: 0.85, minWidth: 0 },
  previousValue: {
    color: SetForgeColors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
  },
  setGroup: { marginBottom: 0 },
  setRow: { height: 36, flexDirection: 'row', alignItems: 'center', gap: 6 },
  setNumber: {
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.2)',
    borderRadius: 7,
    backgroundColor: 'rgba(0, 240, 255, 0.05)',
  },
  setNumberText: {
    color: SetForgeColors.accent,
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: '800',
  },
  setInput: {
    width: '100%',
    height: 36,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: SetForgeColors.border,
    borderRadius: 7,
    backgroundColor: SetForgeColors.surface,
    color: SetForgeColors.textPrimary,
    fontFamily: 'monospace',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  removeColumn: { width: 26, alignItems: 'center', justifyContent: 'center' },
  trashIcon: { width: 16, height: 18, alignItems: 'center' },
  trashIconDisabled: { opacity: 0.25 },
  trashHandle: {
    width: 6,
    height: 2,
    borderRadius: 1,
    backgroundColor: SetForgeColors.textSecondary,
  },
  trashLid: {
    width: 16,
    height: 2,
    marginTop: 1,
    borderRadius: 1,
    backgroundColor: SetForgeColors.textSecondary,
  },
  trashBody: {
    width: 12,
    height: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 3,
    paddingTop: 3,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: SetForgeColors.textSecondary,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  trashLine: {
    width: 1,
    height: 6,
    backgroundColor: SetForgeColors.textSecondary,
  },
  addSetButton: {
    width: '100%',
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    borderRadius: 6,
    backgroundColor: SetForgeColors.surfaceMuted,
  },
  addSetLabel: {
    color: SetForgeColors.textPrimary,
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: '800',
  },
  globalActions: { padding: 20 },
  addExerciseButton: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: SetForgeColors.accent,
  },
  addExerciseLabel: { color: SetForgeColors.canvas, fontSize: 13, fontWeight: '800' },
  emptyState: { alignItems: 'center', gap: 8, paddingHorizontal: 24, paddingVertical: 48 },
  emptyTitle: { color: SetForgeColors.textPrimary, fontSize: 16, fontWeight: '700' },
  emptyMessage: { color: SetForgeColors.textSecondary, fontSize: 13, textAlign: 'center' },
  errorText: {
    marginHorizontal: 20,
    marginTop: 16,
    padding: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    color: '#FCA5A5',
    fontSize: 12,
    lineHeight: 18,
  },
  stateContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 28 },
  stateMessage: { color: SetForgeColors.textSecondary, fontSize: 14, textAlign: 'center' },
  backButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: SetForgeColors.accent,
    borderRadius: 5,
  },
  backButtonLabel: { color: SetForgeColors.accent, fontSize: 12, fontWeight: '800' },
});
