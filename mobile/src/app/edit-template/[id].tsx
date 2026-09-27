import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SetForgeColors } from '@/constants/setforge-theme';
import {
  type DraftExercise,
  type DraftSet,
  useCreateTemplateDraft,
} from '@/features/workouts/create-template/create-template-draft-context';
import { toWorkoutTemplateExerciseRequests } from '@/features/workouts/create-template/draft-to-request';
import { getWorkoutTemplate, updateWorkoutTemplate } from '@/services/workout-template-api';

const moreIcon = require('@/assets/images/figma/more-horizontal.svg');

export default function EditTemplateScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const draft = useCreateTemplateDraft();
  const { loadTemplate, sourceTemplateId } = draft;
  const templateId = Number(id);
  const [isLoading, setIsLoading] = useState(sourceTemplateId !== templateId);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {draft.exercises.map((draftExercise, index) => (
              <ExpandedExercise
                draftExercise={draftExercise}
                exerciseNumber={index + 1}
                key={draftExercise.clientId}
              />
            ))}

            {draft.exercises.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>No exercises in this template</Text>
                <Text style={styles.emptyMessage}>Add an exercise to start rebuilding the plan.</Text>
              </View>
            )}

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
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ExpandedExercise({
  draftExercise,
  exerciseNumber,
}: {
  draftExercise: DraftExercise;
  exerciseNumber: number;
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
    <View style={styles.exerciseBlock}>
      <View style={styles.exerciseTitleRow}>
        <View style={styles.exerciseHeading}>
          <Text style={styles.exerciseName}>
            {exerciseNumber}. {draftExercise.exercise.name}
          </Text>
          <Text style={styles.exerciseMeta}>
            {draftExercise.exercise.primaryMuscle} · {draftExercise.exercise.equipment}
          </Text>
        </View>
        <Pressable
          accessibilityLabel={`Options for ${draftExercise.exercise.name}`}
          accessibilityRole="button"
          hitSlop={10}
          onPress={confirmRemoveExercise}>
          <Image contentFit="contain" source={moreIcon} style={styles.moreIcon} />
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
      {draftExercise.sets.map((set, index) => (
        <EditableSetRow
          canRemove={draftExercise.sets.length > 1}
          index={index}
          isTimed={isTimed}
          key={set.clientId}
          onRemove={() => removeSet(draftExercise.clientId, set.clientId)}
          onUpdate={(field, value) =>
            updateSet(draftExercise.clientId, set.clientId, field, value)
          }
          set={set}
        />
      ))}

      <Pressable
        accessibilityRole="button"
        onPress={() => addSet(draftExercise.clientId)}
        style={styles.addSetButton}>
        <Text style={styles.addSetLabel}>+ ADD SET</Text>
      </Pressable>
    </View>
  );
}

function SetHeader({ isTimed }: { isTimed: boolean }) {
  return (
    <View style={styles.setHeader}>
      <Text style={[styles.columnLabel, styles.setNumberColumn]}>SET</Text>
      {!isTimed && <Text style={styles.columnLabel}>KG</Text>}
      <Text style={styles.columnLabel}>{isTimed ? 'TIME (SEC)' : 'REPS'}</Text>
      <Text style={styles.columnLabel}>REST (SEC)</Text>
      <View style={styles.removeColumn} />
    </View>
  );
}

type EditableSetRowProps = {
  set: DraftSet;
  index: number;
  isTimed: boolean;
  canRemove: boolean;
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
  onRemove,
  onUpdate,
}: EditableSetRowProps) {
  return (
    <View style={styles.setRow}>
      <View style={[styles.setNumber, styles.setNumberColumn]}>
        <Text style={styles.setNumberText}>{formatSetLabel(set, index)}</Text>
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
      <SetInput
        accessibilityLabel={`Set ${index + 1} rest in seconds`}
        onChangeText={(value) => onUpdate('restSeconds', value)}
        placeholder="90"
        value={set.restSeconds}
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
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: SetForgeColors.border,
  },
  exerciseTitleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  exerciseHeading: { flex: 1, gap: 4 },
  exerciseName: {
    color: SetForgeColors.textPrimary,
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  exerciseMeta: {
    color: SetForgeColors.textSecondary,
    fontSize: 11,
    lineHeight: 15,
    textTransform: 'capitalize',
  },
  moreIcon: { width: 18, height: 18, marginTop: 3 },
  notesInput: {
    minHeight: 38,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: SetForgeColors.border,
    borderRadius: 6,
    backgroundColor: SetForgeColors.surface,
    color: SetForgeColors.textPrimary,
    fontSize: 12,
  },
  setHeader: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  columnLabel: {
    flex: 1,
    color: SetForgeColors.textDisabled,
    fontFamily: 'monospace',
    fontSize: 9,
    fontWeight: '700',
    textAlign: 'center',
  },
  setNumberColumn: { width: 44, flexGrow: 0, flexShrink: 0 },
  setRow: { height: 48, flexDirection: 'row', alignItems: 'center', gap: 7 },
  setNumber: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.2)',
    borderRadius: 8,
    backgroundColor: 'rgba(0, 240, 255, 0.05)',
  },
  setNumberText: {
    color: SetForgeColors.accent,
    fontFamily: 'monospace',
    fontSize: 13,
    fontWeight: '800',
  },
  setInput: {
    flex: 1,
    minWidth: 0,
    height: 48,
    paddingHorizontal: 5,
    borderWidth: 1,
    borderColor: SetForgeColors.border,
    borderRadius: 8,
    backgroundColor: SetForgeColors.surface,
    color: SetForgeColors.textPrimary,
    fontFamily: 'monospace',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  removeColumn: { width: 24, alignItems: 'center', justifyContent: 'center' },
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
  addSetButton: { alignSelf: 'flex-start', paddingVertical: 4 },
  addSetLabel: {
    color: SetForgeColors.accent,
    fontFamily: 'monospace',
    fontSize: 12,
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
