import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
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
import { getExerciseAssetUrl } from '@/services/exercise-api';
import { createWorkoutTemplate } from '@/services/workout-template-api';

const DEVELOPMENT_OWNER_ID = 1;

export default function CreateTemplateScreen() {
  const router = useRouter();
  const draft = useCreateTemplateDraft();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const previousPerformances = usePreviousPerformances(
    DEVELOPMENT_OWNER_ID,
    draft.exercises.map(({ exercise }) => exercise.id),
  );

  const saveTemplate = async () => {
    const trimmedName = draft.name.trim();

    if (!trimmedName) {
      setError('Give the template a name before saving it.');
      return;
    }

    if (draft.exercises.length === 0) {
      setError('Add at least one exercise before saving the template.');
      return;
    }

    try {
      const exercises = toWorkoutTemplateExerciseRequests(draft.exercises);
      setIsSaving(true);
      setError(null);

      await createWorkoutTemplate({
        ownerId: DEVELOPMENT_OWNER_ID,
        name: trimmedName,
        description: draft.description.trim() || undefined,
        exercises,
      });

      draft.reset();
      router.replace('/start-workout');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save the template.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}>
        <View style={styles.screen}>
          <View style={styles.header}>
            <Pressable accessibilityRole="button" hitSlop={10} onPress={() => router.back()}>
              <Text style={styles.headerAction}>CANCEL</Text>
            </Pressable>
            <Text style={styles.headerTitle}>New Template</Text>
            <Pressable
              accessibilityRole="button"
              disabled={isSaving}
              hitSlop={10}
              onPress={() => void saveTemplate()}>
              <Text style={[styles.headerAction, isSaving && styles.actionDisabled]}>
                {isSaving ? 'SAVING' : 'SAVE'}
              </Text>
            </Pressable>
          </View>

          <ReorderableExerciseList
            contentContainerStyle={styles.content}
            data={draft.exercises}
            getExerciseMeta={({ exercise }) => `${exercise.primaryMuscle} · ${exercise.equipment}`}
            getExerciseName={({ exercise }) => exercise.name}
            keyExtractor={(item) => item.clientId}
            onMove={draft.moveExercise}
            headerComponent={<>
            <Text style={styles.fieldLabel}>TEMPLATE NAME</Text>
            <TextInput
              accessibilityLabel="Template name"
              autoFocus
              maxLength={100}
              onChangeText={draft.setName}
              placeholder="Push Day"
              placeholderTextColor={SetForgeColors.textDisabled}
              style={styles.nameInput}
              value={draft.name}
            />

            <Text style={styles.fieldLabel}>DESCRIPTION (OPTIONAL)</Text>
            <TextInput
              accessibilityLabel="Template description"
              maxLength={500}
              multiline
              onChangeText={draft.setDescription}
              placeholder="Add a note about this workout"
              placeholderTextColor={SetForgeColors.textDisabled}
              style={styles.descriptionInput}
              textAlignVertical="top"
              value={draft.description}
            />

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>EXERCISES ({draft.exercises.length})</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/create-template/exercises')}>
                <Text style={styles.addExerciseLabel}>+ ADD EXERCISE</Text>
              </Pressable>
            </View>
            </>}
            emptyComponent={
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/create-template/exercises')}
                style={styles.emptyExercises}>
                <Text style={styles.emptyTitle}>Build your workout</Text>
                <Text style={styles.emptyMessage}>
                  Choose exercises, then set the weight, reps, time, and rest for each set.
                </Text>
                <Text style={styles.emptyAction}>ADD YOUR FIRST EXERCISE</Text>
              </Pressable>
            }
            footerComponent={error ? <Text style={styles.errorText}>{error}</Text> : null}
            renderExpandedItem={({ drag, isActive, item }) => (
              <ExerciseEditor
                draftExercise={item}
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

function ExerciseEditor({
  draftExercise,
  isDragging,
  onLongPressDrag,
  previousPerformance,
}: {
  draftExercise: DraftExercise;
  isDragging: boolean;
  onLongPressDrag: () => void;
  previousPerformance?: PreviousExercisePerformance;
}) {
  const { addSet, removeExercise, removeSet, updateSet } = useCreateTemplateDraft();
  const { exercise } = draftExercise;
  const thumbnailUrl = getExerciseAssetUrl(exercise.thumbnailUrl);
  const isTimed = exercise.exerciseType === 'TIMED';

  return (
    <View style={[styles.exerciseCard, isDragging && styles.draggingExerciseCard]}>
      <View style={styles.exerciseHeader}>
        <Pressable delayLongPress={300} onLongPress={onLongPressDrag} style={styles.exerciseHeaderDragArea}>
          <View style={styles.thumbnailContainer}>
            {thumbnailUrl ? (
              <Image contentFit="contain" source={{ uri: thumbnailUrl }} style={styles.thumbnail} />
            ) : (
              <Text style={styles.thumbnailFallback}>{exercise.name.charAt(0)}</Text>
            )}
          </View>
          <View style={styles.exerciseHeading}>
            <Text numberOfLines={2} style={styles.exerciseName}>
              {exercise.name}
            </Text>
            <Text style={styles.exerciseMeta}>
              {isTimed ? 'Timed exercise' : 'Weight and reps'} · {exercise.equipment}
            </Text>
          </View>
        </Pressable>
        <Pressable
          accessibilityLabel={`Hold and drag to reorder ${exercise.name}`}
          accessibilityRole="button"
          delayLongPress={300}
          onLongPress={onLongPressDrag}
          style={styles.dragHandle}>
          <Text style={styles.dragHandleIcon}>≡</Text>
        </Pressable>
        <Pressable
          accessibilityLabel={`Remove ${exercise.name}`}
          accessibilityRole="button"
          hitSlop={10}
          onPress={() => removeExercise(draftExercise.clientId)}>
          <Text style={styles.removeExercise}>×</Text>
        </Pressable>
      </View>

      <SetColumnHeader isTimed={isTimed} />
      {draftExercise.sets.map((set, index) => (
        <SetRow
          draftExercise={draftExercise}
          index={index}
          isTimed={isTimed}
          key={set.clientId}
          previousPerformance={previousPerformance}
          set={set}
          onRemove={() => removeSet(draftExercise.clientId, set.clientId)}
          onUpdate={(field, value) =>
            updateSet(draftExercise.clientId, set.clientId, field, value)
          }
        />
      ))}

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

function SetColumnHeader({ isTimed }: { isTimed: boolean }) {
  return (
    <View style={styles.setHeaderRow}>
      <Text style={[styles.setColumnLabel, styles.setNumberColumn]}>Set</Text>
      <View style={styles.previousColumn}>
        <Text style={styles.setColumnLabel}>Previous</Text>
      </View>
      {!isTimed && (
        <View style={styles.metricColumn}>
          <Text style={styles.setColumnLabel}>kg</Text>
        </View>
      )}
      <View style={styles.metricColumn}>
        <Text style={styles.setColumnLabel}>{isTimed ? 'Time' : 'Reps'}</Text>
      </View>
      <View style={styles.removeSetColumn} />
    </View>
  );
}

type SetRowProps = {
  draftExercise: DraftExercise;
  set: DraftSet;
  index: number;
  isTimed: boolean;
  previousPerformance?: PreviousExercisePerformance;
  onRemove: () => void;
  onUpdate: (field: 'targetReps' | 'targetWeight' | 'targetTimeSeconds' | 'restSeconds', value: string) => void;
};

function SetRow({
  draftExercise,
  set,
  index,
  isTimed,
  previousPerformance,
  onRemove,
  onUpdate,
}: SetRowProps) {
  return (
    <View style={styles.setGroup}>
      <View style={styles.setRow}>
        <View style={[styles.setNumber, styles.setNumberColumn]}>
          <Text style={styles.setNumberText}>{index + 1}</Text>
        </View>
        <View style={styles.previousColumn}>
          <Text numberOfLines={1} style={styles.previousValue}>
            {formatPreviousResult(previousSetAt(previousPerformance, index), draftExercise.exercise.exerciseType)}
          </Text>
        </View>
        {!isTimed && (
          <NumericInput
            accessibilityLabel={`Set ${index + 1} weight in kilograms`}
            onChangeText={(value) => onUpdate('targetWeight', value)}
            placeholder="—"
            value={set.targetWeight}
          />
        )}
        <NumericInput
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
          disabled={draftExercise.sets.length === 1}
          hitSlop={8}
          onPress={onRemove}
          style={styles.removeSetColumn}>
          <Text
            style={[
              styles.removeSetText,
              draftExercise.sets.length === 1 && styles.removeSetDisabled,
            ]}>
            −
          </Text>
        </Pressable>
      </View>
      <RestTimerControl
        onChange={(value) => onUpdate('restSeconds', value)}
        value={set.restSeconds}
      />
    </View>
  );
}

type NumericInputProps = {
  accessibilityLabel: string;
  value: string;
  placeholder: string;
  onChangeText: (value: string) => void;
};

function NumericInput(props: NumericInputProps) {
  return (
    <View style={styles.metricColumn}>
      <TextInput
        {...props}
        keyboardType="decimal-pad"
        maxLength={7}
        placeholderTextColor={SetForgeColors.textDisabled}
        selectTextOnFocus
        style={styles.numericInput}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: SetForgeColors.canvas },
  keyboardView: { flex: 1 },
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
  actionDisabled: { color: SetForgeColors.textDisabled },
  content: { padding: 20, paddingBottom: 48 },
  fieldLabel: {
    marginBottom: 7,
    color: SetForgeColors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  nameInput: {
    height: 48,
    marginBottom: 18,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: SetForgeColors.border,
    borderRadius: 6,
    backgroundColor: SetForgeColors.surface,
    color: SetForgeColors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  descriptionInput: {
    minHeight: 76,
    marginBottom: 24,
    padding: 14,
    borderWidth: 1,
    borderColor: SetForgeColors.border,
    borderRadius: 6,
    backgroundColor: SetForgeColors.surface,
    color: SetForgeColors.textPrimary,
    fontSize: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: { color: SetForgeColors.textSecondary, fontSize: 12, fontWeight: '800' },
  addExerciseLabel: { color: SetForgeColors.accent, fontSize: 12, fontWeight: '800' },
  emptyExercises: {
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingVertical: 36,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: SetForgeColors.border,
    borderRadius: 8,
    backgroundColor: SetForgeColors.surface,
  },
  emptyTitle: { color: SetForgeColors.textPrimary, fontSize: 16, fontWeight: '700' },
  emptyMessage: {
    marginTop: 8,
    color: SetForgeColors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  emptyAction: { marginTop: 18, color: SetForgeColors.accent, fontSize: 12, fontWeight: '800' },
  exerciseCard: {
    marginBottom: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: SetForgeColors.border,
    borderRadius: 8,
    backgroundColor: SetForgeColors.surface,
  },
  draggingExerciseCard: { borderColor: SetForgeColors.accent },
  exerciseHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 13 },
  exerciseHeaderDragArea: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  thumbnailContainer: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: 5,
    backgroundColor: '#ECECEC',
  },
  thumbnail: { width: '100%', height: '100%' },
  thumbnailFallback: { color: SetForgeColors.canvas, fontSize: 18, fontWeight: '800' },
  exerciseHeading: { flex: 1, gap: 3, paddingHorizontal: 10 },
  dragHandle: {
    width: 32,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dragHandleIcon: { color: SetForgeColors.textSecondary, fontSize: 23, lineHeight: 25 },
  exerciseName: {
    color: SetForgeColors.textPrimary,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  exerciseMeta: {
    color: SetForgeColors.textSecondary,
    fontSize: 11,
    textTransform: 'capitalize',
  },
  removeExercise: { paddingHorizontal: 4, color: SetForgeColors.textSecondary, fontSize: 25 },
  setHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  setColumnLabel: {
    color: SetForgeColors.textSecondary,
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
  },
  setGroup: { marginBottom: 0 },
  setRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  setNumberColumn: { width: 34, flexGrow: 0, flexShrink: 0 },
  previousColumn: { flex: 1.45, minWidth: 0 },
  metricColumn: { flex: 0.85, minWidth: 0 },
  previousValue: {
    color: SetForgeColors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
  },
  setNumber: {
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 7,
    backgroundColor: SetForgeColors.surfaceMuted,
  },
  setNumberText: { color: SetForgeColors.accent, fontSize: 13, fontWeight: '800' },
  numericInput: {
    width: '100%',
    height: 36,
    paddingHorizontal: 4,
    borderRadius: 5,
    backgroundColor: SetForgeColors.surfaceMuted,
    color: SetForgeColors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  removeSetColumn: { width: 26, alignItems: 'center', justifyContent: 'center' },
  removeSetText: { color: SetForgeColors.textSecondary, fontSize: 20 },
  removeSetDisabled: { color: SetForgeColors.textDisabled, opacity: 0.35 },
  addSetButton: {
    width: '100%',
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    borderRadius: 6,
    backgroundColor: SetForgeColors.surfaceMuted,
  },
  addSetLabel: { color: SetForgeColors.textPrimary, fontSize: 11, fontWeight: '800' },
  errorText: {
    marginTop: 6,
    padding: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    color: '#FCA5A5',
    fontSize: 12,
    lineHeight: 18,
  },
});
