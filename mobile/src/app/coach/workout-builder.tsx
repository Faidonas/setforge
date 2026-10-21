import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { NonCredentialTextInput } from '@/components/non-credential-text-input';

import { formatRestTime, RestTimerControl } from '@/components/rest-timer-control';
import { CoachColors } from '@/constants/setforge-theme';
import {
  ActionButton,
  HoverPressable,
  PageHeading,
  Panel,
  StatusBadge,
  coachStyles,
  useCoachLayout,
} from '@/features/coach/coach-ui';
import { useCoachResource } from '@/features/coach/use-coach-resource';
import {
  CreateTemplateDraftProvider,
  type DraftExercise,
  type DraftSet,
  useCreateTemplateDraft,
} from '@/features/workouts/create-template/create-template-draft-context';
import { toWorkoutTemplateExerciseRequests } from '@/features/workouts/create-template/draft-to-request';
import type { Exercise } from '@/models/exercise';
import { createCoachWorkoutTemplate } from '@/services/coach-api';
import { getExercises } from '@/services/exercise-api';

export default function WorkoutBuilderScreen() {
  return (
    <CreateTemplateDraftProvider>
      <WorkoutBuilder />
    </CreateTemplateDraftProvider>
  );
}

function WorkoutBuilder() {
  const router = useRouter();
  const { isCompact } = useCoachLayout();
  const { data: exercises, error: exerciseError, loading } = useCoachResource(getExercises);
  const draft = useCreateTemplateDraft();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  function toggleExercise(exercise: Exercise) {
    const selected = draft.exercises.find((item) => item.exercise.id === exercise.id);
    if (selected) draft.removeExercise(selected.clientId);
    else draft.addExercises([exercise]);
  }

  async function saveTemplate() {
    const name = draft.name.trim();
    if (!name) {
      setSaveError('Enter a template name.');
      return;
    }
    if (!draft.exercises.length) {
      setSaveError('Select at least one exercise.');
      return;
    }

    setSaving(true);
    setSaveError(null);
    try {
      await createCoachWorkoutTemplate({
        name,
        description: draft.description.trim() || undefined,
        exercises: toWorkoutTemplateExerciseRequests(draft.exercises),
      });
      draft.reset();
      router.replace('/coach/templates' as Href);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Could not save this template.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={[coachStyles.page, isCompact && coachStyles.pageCompact]}>
      <PageHeading
        title="Workout builder"
        subtitle="Build each exercise set by set, using the same controls as the training app."
        actions={
          <>
            <ActionButton label="Cancel" secondary onPress={() => router.back()} />
            <ActionButton
              label={saving ? 'Saving…' : 'Save template'}
              onPress={() => void saveTemplate()}
            />
          </>
        }
      />

      {saveError || exerciseError ? (
        <Panel style={styles.error}>
          <Text style={styles.errorText}>{saveError ?? exerciseError}</Text>
        </Panel>
      ) : null}

      <View style={[styles.columns, isCompact && styles.columnsCompact]}>
        <View style={styles.builderColumn}>
          <Panel style={[styles.details, isCompact && styles.panelCompact]}>
            <View style={styles.libraryNotice}>
              <StatusBadge>Unassigned</StatusBadge>
              <Text style={styles.ownerHelp}>
                Save this to your coaching library, then assign it from the Templates page.
              </Text>
            </View>
            <Text style={styles.label}>TEMPLATE NAME</Text>
            <NonCredentialTextInput
              onChangeText={draft.setName}
              placeholder="e.g. Upper Body A"
              placeholderTextColor={CoachColors.textDisabled}
              style={styles.input}
              value={draft.name}
            />
            <Text style={styles.label}>DESCRIPTION</Text>
            <NonCredentialTextInput
              multiline
              onChangeText={draft.setDescription}
              placeholder="Training focus and coaching context…"
              placeholderTextColor={CoachColors.textDisabled}
              style={styles.textarea}
              value={draft.description}
            />
          </Panel>

          <View style={styles.selectedHeader}>
            <Text style={coachStyles.sectionTitle}>Workout exercises</Text>
            <StatusBadge>{draft.exercises.length}</StatusBadge>
          </View>

          {draft.exercises.length ? (
            draft.exercises.map((exercise, index) => (
              <ExerciseCard
                exercise={exercise}
                index={index}
                isFirst={index === 0}
                isLast={index === draft.exercises.length - 1}
                key={exercise.clientId}
              />
            ))
          ) : (
            <Panel style={styles.emptyPanel}>
              <Text style={styles.emptyTitle}>No exercises yet</Text>
              <Text style={styles.muted}>Choose exercises from the library to configure their sets.</Text>
            </Panel>
          )}
        </View>

        <Panel style={[styles.library, isCompact && styles.libraryCompact]}>
          <Text style={coachStyles.sectionTitle}>Exercise library</Text>
          <Text style={styles.muted}>
            {loading ? 'Loading exercises…' : 'Select an exercise to add or remove it.'}
          </Text>
          {exercises?.map((exercise) => {
            const active = draft.exercises.some((item) => item.exercise.id === exercise.id);
            return (
              <HoverPressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: active }}
                hoverStyle={styles.libraryRowHovered}
                key={exercise.id}
                onPress={() => toggleExercise(exercise)}
                pressedStyle={styles.pressed}
                style={[
                  styles.libraryRow,
                  active && styles.libraryRowActive,
                ]}>
                <View style={styles.libraryCopy}>
                  <Text style={styles.exerciseName}>{exercise.name}</Text>
                  <Text style={styles.muted}>{exercise.primaryMuscle} · {exercise.equipment}</Text>
                </View>
                <Text style={styles.add}>{active ? '✓' : '+'}</Text>
              </HoverPressable>
            );
          })}
        </Panel>
      </View>
    </View>
  );
}

function ExerciseCard({
  exercise,
  index,
  isFirst,
  isLast,
}: {
  exercise: DraftExercise;
  index: number;
  isFirst: boolean;
  isLast: boolean;
}) {
  const draft = useCreateTemplateDraft();
  const isTimed = exercise.exercise.exerciseType === 'TIMED';
  const lastSet = exercise.sets[exercise.sets.length - 1];

  return (
    <Panel style={styles.exerciseCard}>
      <View style={styles.exerciseHeader}>
        <View style={styles.exerciseNumber}><Text style={styles.exerciseNumberText}>{index + 1}</Text></View>
        <View style={styles.exerciseCopy}>
          <Text style={styles.exerciseTitle}>{exercise.exercise.name}</Text>
          <Text style={styles.muted}>{exercise.exercise.primaryMuscle} · {exercise.exercise.equipment}</Text>
        </View>
        <View style={styles.orderActions}>
          <SmallAction disabled={isFirst} label="↑" onPress={() => draft.moveExercise(index, index - 1)} />
          <SmallAction disabled={isLast} label="↓" onPress={() => draft.moveExercise(index, index + 1)} />
          <SmallAction danger label="×" onPress={() => draft.removeExercise(exercise.clientId)} />
        </View>
      </View>

      <NonCredentialTextInput
        onChangeText={(value) => draft.updateExerciseNotes(exercise.clientId, value)}
        placeholder="Add exercise notes"
        placeholderTextColor={CoachColors.textDisabled}
        style={styles.notesInput}
        value={exercise.notes}
      />

      <SetHeader isTimed={isTimed} />
      {exercise.sets.map((set, setIndex) => (
        <SetEditor
          canRemove={exercise.sets.length > 1}
          exercise={exercise}
          isTimed={isTimed}
          key={set.clientId}
          set={set}
          setIndex={setIndex}
        />
      ))}

      <HoverPressable
        accessibilityRole="button"
        hoverStyle={styles.addSetButtonHovered}
        onPress={() => draft.addSet(exercise.clientId)}
        pressedStyle={styles.pressed}
        style={styles.addSetButton}>
        <Text style={styles.addSetText}>+ ADD SET ({formatRestTime(lastSet?.restSeconds)})</Text>
      </HoverPressable>
    </Panel>
  );
}

function SetHeader({ isTimed }: { isTimed: boolean }) {
  return (
    <View style={styles.setRow}>
      <Text style={[styles.setHeading, styles.numberColumn]}>SET</Text>
      <View style={styles.metrics}>
        {!isTimed ? <Text style={styles.setHeading}>KG</Text> : null}
        <Text style={styles.setHeading}>{isTimed ? 'TIME (SEC)' : 'REPS'}</Text>
      </View>
      <View style={styles.removeColumn} />
    </View>
  );
}

function SetEditor({
  exercise,
  set,
  setIndex,
  isTimed,
  canRemove,
}: {
  exercise: DraftExercise;
  set: DraftSet;
  setIndex: number;
  isTimed: boolean;
  canRemove: boolean;
}) {
  const draft = useCreateTemplateDraft();
  return (
    <View style={styles.setBlock}>
      <View style={styles.setRow}>
        <View style={[styles.setNumber, styles.numberColumn]}>
          <Text style={styles.setNumberText}>{setIndex + 1}</Text>
        </View>
        <View style={styles.metrics}>
          {!isTimed ? (
            <NumericInput
              accessibilityLabel={`Set ${setIndex + 1} weight`}
              onChangeText={(value) => draft.updateSet(exercise.clientId, set.clientId, 'targetWeight', value)}
              placeholder="—"
              value={set.targetWeight}
            />
          ) : null}
          <NumericInput
            accessibilityLabel={`Set ${setIndex + 1} ${isTimed ? 'time' : 'reps'}`}
            onChangeText={(value) => draft.updateSet(
              exercise.clientId,
              set.clientId,
              isTimed ? 'targetTimeSeconds' : 'targetReps',
              value,
            )}
            placeholder="0"
            value={isTimed ? set.targetTimeSeconds : set.targetReps}
          />
        </View>
        <HoverPressable
          accessibilityLabel={`Remove set ${setIndex + 1}`}
          accessibilityRole="button"
          disabled={!canRemove}
          hoverStyle={styles.removeSetHovered}
          onPress={() => draft.removeSet(exercise.clientId, set.clientId)}
          pressedStyle={styles.pressed}
          style={styles.removeColumn}>
          <Text style={[styles.removeSet, !canRemove && styles.removeSetDisabled]}>×</Text>
        </HoverPressable>
      </View>
      <RestTimerControl
        onChange={(value) => draft.updateSet(exercise.clientId, set.clientId, 'restSeconds', value)}
        value={set.restSeconds}
      />
    </View>
  );
}

function NumericInput({
  accessibilityLabel,
  onChangeText,
  placeholder,
  value,
}: {
  accessibilityLabel: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  return (
    <NonCredentialTextInput
      accessibilityLabel={accessibilityLabel}
      inputMode="decimal"
      keyboardType="decimal-pad"
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={CoachColors.textDisabled}
      style={styles.numericInput}
      value={value}
    />
  );
}

function SmallAction({
  label,
  onPress,
  disabled = false,
  danger = false,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <HoverPressable
      accessibilityRole="button"
      disabled={disabled}
      hoverStyle={danger ? styles.smallActionDangerHovered : styles.smallActionHovered}
      onPress={onPress}
      pressedStyle={styles.pressed}
      style={[styles.smallAction, disabled && styles.disabled]}>
      <Text style={[styles.smallActionText, danger && styles.danger]}>{label}</Text>
    </HoverPressable>
  );
}

const styles = StyleSheet.create({
  columns: { flexDirection: 'row', alignItems: 'flex-start', gap: 24 },
  columnsCompact: { flexDirection: 'column', gap: 16 },
  builderColumn: { flex: 1, minWidth: 0, gap: 16 },
  libraryNotice: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ownerHelp: { color: CoachColors.textSecondary, fontSize: 10, lineHeight: 15 },
  details: { padding: 24, gap: 12 },
  panelCompact: { width: '100%', padding: 18 },
  library: { width: 370, padding: 20, gap: 12 },
  libraryCompact: { width: '100%', padding: 18 },
  label: { color: CoachColors.textSecondary, fontFamily: 'monospace', fontSize: 9 },
  input: { height: 48, paddingHorizontal: 14, color: CoachColors.textPrimary, fontSize: 13, borderWidth: 1, borderColor: CoachColors.inputBorder, borderRadius: 7, backgroundColor: CoachColors.surface, outlineStyle: 'none' } as never,
  textarea: { minHeight: 86, padding: 14, color: CoachColors.textPrimary, fontSize: 13, textAlignVertical: 'top', borderWidth: 1, borderColor: CoachColors.inputBorder, borderRadius: 7, backgroundColor: CoachColors.surface, outlineStyle: 'none' } as never,
  selectedHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  exerciseCard: { padding: 20, gap: 12 },
  exerciseHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  exerciseNumber: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 7, backgroundColor: CoachColors.surfaceMuted },
  exerciseNumberText: { color: CoachColors.accentText, fontFamily: 'monospace', fontSize: 14, fontWeight: '900' },
  exerciseCopy: { flex: 1, minWidth: 0 },
  exerciseTitle: { color: CoachColors.textPrimary, fontSize: 15, fontWeight: '900' },
  exerciseName: { color: CoachColors.textPrimary, fontSize: 13, fontWeight: '800' },
  orderActions: { flexDirection: 'row', gap: 6 },
  smallAction: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: CoachColors.border, borderRadius: 6, backgroundColor: CoachColors.surface },
  smallActionHovered: { borderColor: CoachColors.accentText, backgroundColor: CoachColors.accentTint, transform: [{ translateY: -1 }] },
  smallActionDangerHovered: { borderColor: CoachColors.danger, backgroundColor: 'rgba(185, 28, 28, 0.08)', transform: [{ translateY: -1 }] },
  smallActionText: { color: CoachColors.accentText, fontSize: 17, fontWeight: '900' },
  danger: { color: CoachColors.danger },
  disabled: { opacity: 0.28 },
  notesInput: { height: 42, paddingHorizontal: 12, color: CoachColors.textPrimary, fontSize: 12, borderWidth: 1, borderColor: CoachColors.inputBorder, borderRadius: 7, backgroundColor: CoachColors.surface, outlineStyle: 'none' } as never,
  setBlock: { gap: 2 },
  setRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  numberColumn: { width: 42 },
  metrics: { flex: 1, flexDirection: 'row', gap: 10 },
  removeColumn: { width: 32, height: 42, alignItems: 'center', justifyContent: 'center' },
  removeSetHovered: { borderRadius: 6, backgroundColor: 'rgba(185, 28, 28, 0.08)' },
  setHeading: { flex: 1, color: CoachColors.textSecondary, fontFamily: 'monospace', fontSize: 9, fontWeight: '700', textAlign: 'center' },
  setNumber: { height: 42, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: CoachColors.accentText, borderRadius: 7 },
  setNumberText: { color: CoachColors.accentText, fontFamily: 'monospace', fontSize: 13, fontWeight: '900' },
  numericInput: { flex: 1, height: 42, minWidth: 0, paddingHorizontal: 8, color: CoachColors.textPrimary, fontSize: 13, fontWeight: '800', textAlign: 'center', borderWidth: 1, borderColor: CoachColors.inputBorder, borderRadius: 7, backgroundColor: CoachColors.surface, outlineStyle: 'none' } as never,
  removeSet: { color: CoachColors.danger, fontSize: 21, fontWeight: '800' },
  removeSetDisabled: { color: CoachColors.textDisabled },
  addSetButton: { height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 7, backgroundColor: CoachColors.surfaceMuted },
  addSetButtonHovered: { borderWidth: 1, borderColor: CoachColors.accentText, backgroundColor: CoachColors.accentTint, transform: [{ translateY: -1 }] },
  addSetText: { color: CoachColors.textPrimary, fontSize: 11, fontWeight: '900' },
  emptyPanel: { padding: 28, alignItems: 'center' },
  emptyTitle: { color: CoachColors.textPrimary, fontSize: 14, fontWeight: '800' },
  muted: { marginTop: 4, color: CoachColors.textSecondary, fontSize: 10, lineHeight: 15 },
  libraryRow: { minHeight: 58, padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderWidth: 1, borderColor: CoachColors.border, borderRadius: 7 },
  libraryRowHovered: { paddingLeft: 15, borderColor: CoachColors.accentText, backgroundColor: CoachColors.surfaceMuted },
  libraryCopy: { flex: 1, minWidth: 0 },
  libraryRowActive: { borderColor: CoachColors.accentText, backgroundColor: CoachColors.accentTint },
  pressed: { opacity: 0.68 },
  add: { color: CoachColors.accentText, fontSize: 20 },
  error: { padding: 18, borderColor: CoachColors.danger },
  errorText: { color: CoachColors.danger, fontSize: 12 },
});
