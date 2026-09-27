import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
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
import { getExerciseAssetUrl } from '@/services/exercise-api';
import { createWorkoutTemplate } from '@/services/workout-template-api';

const DEVELOPMENT_OWNER_ID = 1;

export default function CreateTemplateScreen() {
  const router = useRouter();
  const draft = useCreateTemplateDraft();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
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

            {draft.exercises.length === 0 ? (
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
            ) : (
              draft.exercises.map((draftExercise) => (
                <ExerciseEditor draftExercise={draftExercise} key={draftExercise.clientId} />
              ))
            )}

            {error && <Text style={styles.errorText}>{error}</Text>}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ExerciseEditor({ draftExercise }: { draftExercise: DraftExercise }) {
  const { addSet, removeExercise, removeSet, updateSet } = useCreateTemplateDraft();
  const { exercise } = draftExercise;
  const thumbnailUrl = getExerciseAssetUrl(exercise.thumbnailUrl);
  const isTimed = exercise.exerciseType === 'TIMED';

  return (
    <View style={styles.exerciseCard}>
      <View style={styles.exerciseHeader}>
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
        <Text style={styles.addSetLabel}>+ ADD SET</Text>
      </Pressable>
    </View>
  );
}

function SetColumnHeader({ isTimed }: { isTimed: boolean }) {
  return (
    <View style={styles.setHeaderRow}>
      <Text style={[styles.setColumnLabel, styles.setNumberColumn]}>SET</Text>
      {!isTimed && <Text style={styles.setColumnLabel}>KG</Text>}
      <Text style={styles.setColumnLabel}>{isTimed ? 'TIME (SEC)' : 'REPS'}</Text>
      <Text style={styles.setColumnLabel}>REST (SEC)</Text>
      <View style={styles.removeSetColumn} />
    </View>
  );
}

type SetRowProps = {
  draftExercise: DraftExercise;
  set: DraftSet;
  index: number;
  isTimed: boolean;
  onRemove: () => void;
  onUpdate: (field: 'targetReps' | 'targetWeight' | 'targetTimeSeconds' | 'restSeconds', value: string) => void;
};

function SetRow({ draftExercise, set, index, isTimed, onRemove, onUpdate }: SetRowProps) {
  return (
    <View style={styles.setRow}>
      <View style={[styles.setNumber, styles.setNumberColumn]}>
        <Text style={styles.setNumberText}>{index + 1}</Text>
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
      <NumericInput
        accessibilityLabel={`Set ${index + 1} rest in seconds`}
        onChangeText={(value) => onUpdate('restSeconds', value)}
        placeholder="90"
        value={set.restSeconds}
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
    <TextInput
      {...props}
      keyboardType="decimal-pad"
      maxLength={7}
      placeholderTextColor={SetForgeColors.textDisabled}
      selectTextOnFocus
      style={styles.numericInput}
    />
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
    marginBottom: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: SetForgeColors.border,
    borderRadius: 8,
    backgroundColor: SetForgeColors.surface,
  },
  exerciseHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  thumbnailContainer: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: 5,
    backgroundColor: '#ECECEC',
  },
  thumbnail: { width: '100%', height: '100%' },
  thumbnailFallback: { color: SetForgeColors.canvas, fontSize: 18, fontWeight: '800' },
  exerciseHeading: { flex: 1, gap: 3, paddingHorizontal: 10 },
  exerciseName: {
    color: SetForgeColors.textPrimary,
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  exerciseMeta: {
    color: SetForgeColors.textSecondary,
    fontSize: 11,
    textTransform: 'capitalize',
  },
  removeExercise: { paddingHorizontal: 4, color: SetForgeColors.textSecondary, fontSize: 25 },
  setHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 6 },
  setColumnLabel: {
    flex: 1,
    color: SetForgeColors.textSecondary,
    fontSize: 9,
    fontWeight: '800',
    textAlign: 'center',
  },
  setRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 8 },
  setNumberColumn: { width: 30, flexGrow: 0, flexShrink: 0 },
  setNumber: { alignItems: 'center', justifyContent: 'center' },
  setNumberText: { color: SetForgeColors.accent, fontSize: 13, fontWeight: '800' },
  numericInput: {
    flex: 1,
    minWidth: 0,
    height: 40,
    paddingHorizontal: 6,
    borderRadius: 5,
    backgroundColor: SetForgeColors.surfaceMuted,
    color: SetForgeColors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  removeSetColumn: { width: 24, alignItems: 'center', justifyContent: 'center' },
  removeSetText: { color: SetForgeColors.textSecondary, fontSize: 22 },
  removeSetDisabled: { color: SetForgeColors.textDisabled, opacity: 0.35 },
  addSetButton: {
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 3,
    borderRadius: 5,
    backgroundColor: SetForgeColors.accentTint,
  },
  addSetLabel: { color: SetForgeColors.accent, fontSize: 11, fontWeight: '800' },
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
