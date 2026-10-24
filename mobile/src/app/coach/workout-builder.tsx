import { Image } from 'expo-image';
import type { Href } from 'expo-router';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
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
import { CoachTypography } from '@/features/coach/coach-typography';
import {
  CreateTemplateDraftProvider,
  type DraftExercise,
  type DraftSet,
  useCreateTemplateDraft,
} from '@/features/workouts/create-template/create-template-draft-context';
import { toWorkoutTemplateExerciseRequests } from '@/features/workouts/create-template/draft-to-request';
import type { Exercise } from '@/models/exercise';
import type { CoachWorkoutTemplate } from '@/models/coach';
import { createCoachWorkoutTemplate, getCoachTemplates } from '@/services/coach-api';
import { getExerciseAssetUrl, getExercises } from '@/services/exercise-api';
import { getWorkoutTemplate, updateWorkoutTemplate } from '@/services/workout-template-api';

const searchIcon = require('@/assets/images/coach-web-light/search.svg');
type BuilderMode = 'choose' | 'create' | 'edit' | 'copy';
type ExistingTemplateIntent = 'edit' | 'copy';

export default function WorkoutBuilderScreen() {
  const { templateId } = useLocalSearchParams<{ templateId?: string }>();
  return (
    <CreateTemplateDraftProvider key={templateId ?? 'new-template'}>
      <WorkoutBuilder />
    </CreateTemplateDraftProvider>
  );
}

function WorkoutBuilder() {
  const router = useRouter();
  const { templateId: templateIdParam } = useLocalSearchParams<{ templateId?: string }>();
  const { isCompact } = useCoachLayout();
  const { data: exercises, error: exerciseError, loading } = useCoachResource(getExercises);
  const {
    data: coachTemplates,
    error: templatesError,
    loading: templatesLoading,
  } = useCoachResource(getCoachTemplates);
  const draft = useCreateTemplateDraft();
  const { loadTemplate } = draft;
  const requestedTemplateId = Number(templateIdParam);
  const hasRequestedTemplate = Number.isInteger(requestedTemplateId) && requestedTemplateId > 0;
  const [mode, setMode] = useState<BuilderMode>(hasRequestedTemplate ? 'edit' : 'choose');
  const [editingTemplateId, setEditingTemplateId] = useState<number | null>(
    hasRequestedTemplate ? requestedTemplateId : null,
  );
  const [existingIntent, setExistingIntent] = useState<ExistingTemplateIntent | null>(null);
  const [exerciseQuery, setExerciseQuery] = useState('');
  const [templateLoading, setTemplateLoading] = useState(hasRequestedTemplate);
  const [templateLoadError, setTemplateLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const filteredExercises = useMemo(() => {
    const normalizedQuery = exerciseQuery.trim().toLowerCase();
    if (!normalizedQuery) return exercises ?? [];
    return (exercises ?? []).filter((exercise) =>
      [exercise.name, exercise.primaryMuscle, exercise.equipment]
        .some((value) => value.toLowerCase().includes(normalizedQuery)),
    );
  }, [exerciseQuery, exercises]);

  useEffect(() => {
    if (!hasRequestedTemplate) return;

    let current = true;
    getWorkoutTemplate(requestedTemplateId)
      .then((template) => {
        if (current) {
          loadTemplate(template);
          setEditingTemplateId(template.id);
          setMode('edit');
        }
      })
      .catch((error: unknown) => {
        if (current) {
          setTemplateLoadError(error instanceof Error ? error.message : 'Could not load this template.');
        }
      })
      .finally(() => {
        if (current) setTemplateLoading(false);
      });

    return () => {
      current = false;
    };
  }, [hasRequestedTemplate, loadTemplate, requestedTemplateId]);

  function startNewTemplate() {
    draft.reset();
    setEditingTemplateId(null);
    setExistingIntent(null);
    setTemplateLoading(false);
    setTemplateLoadError(null);
    setSaveError(null);
    setMode('create');
  }

  function startFromTemplate(item: CoachWorkoutTemplate, intent: ExistingTemplateIntent) {
    draft.loadTemplate(item.template);
    setTemplateLoading(false);
    setTemplateLoadError(null);
    setSaveError(null);
    setExistingIntent(null);
    if (intent === 'edit') {
      setEditingTemplateId(item.template.id);
      setMode('edit');
      return;
    }

    draft.setName(nextCopyName(item.template.name, coachTemplates ?? []));
    setEditingTemplateId(null);
    setMode('copy');
  }

  function returnToIntentChooser() {
    draft.reset();
    setEditingTemplateId(null);
    setExistingIntent(null);
    setExerciseQuery('');
    setTemplateLoading(false);
    setTemplateLoadError(null);
    setSaveError(null);
    setMode('choose');
  }

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
      const request = {
        name,
        description: draft.description.trim() || undefined,
        exercises: toWorkoutTemplateExerciseRequests(draft.exercises),
      };
      if (mode === 'edit' && editingTemplateId) await updateWorkoutTemplate(editingTemplateId, request);
      else await createCoachWorkoutTemplate(request);
      draft.reset();
      router.replace('/coach/templates' as Href);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Could not save this template.');
    } finally {
      setSaving(false);
    }
  }

  if (mode === 'choose') {
    return (
      <View style={[coachStyles.page, isCompact && coachStyles.pageCompact]}>
        <PageHeading
          title="Workout builder"
          subtitle="Choose what you want to build before entering the editor."
        />
        <View style={styles.intentHeader}>
          <Text style={styles.intentEyebrow}>START A WORKFLOW</Text>
          <Text style={styles.intentTitle}>What would you like to do?</Text>
          <Text style={styles.intentHelp}>Create from scratch, revise a live template, or use one as a starting point.</Text>
        </View>
        <View style={[styles.intentGrid, isCompact && styles.intentGridCompact]}>
          <IntentCard
            description="Start with a name and an empty exercise list."
            label="Create new template"
            marker="NEW"
            onPress={startNewTemplate}
          />
          <IntentCard
            active={existingIntent === 'edit'}
            description="Update an existing template and keep its assignments."
            label="Edit existing template"
            marker="EDIT"
            onPress={() => setExistingIntent('edit')}
          />
          <IntentCard
            active={existingIntent === 'copy'}
            description="Clone a template, rename it, and edit the new version."
            label="Copy existing template"
            marker="COPY"
            onPress={() => setExistingIntent('copy')}
          />
        </View>

        {templatesError ? <Panel style={styles.error}><Text style={styles.errorText}>{templatesError}</Text></Panel> : null}
        {existingIntent ? (
          <Panel style={styles.templatePicker}>
            <View style={styles.templatePickerHeader}>
              <View>
                <Text style={styles.label}>{existingIntent === 'edit' ? 'CHOOSE A TEMPLATE TO EDIT' : 'CHOOSE A TEMPLATE TO COPY'}</Text>
                <Text style={styles.pickerHelp}>
                  {existingIntent === 'edit'
                    ? 'Your changes will apply to everyone currently assigned.'
                    : 'The original template and its assignments will stay unchanged.'}
                </Text>
              </View>
              <StatusBadge>{coachTemplates?.length ?? 0}</StatusBadge>
            </View>
            {templatesLoading ? <Text style={styles.pickerState}>Loading templates…</Text> : null}
            {!templatesLoading && !coachTemplates?.length ? <Text style={styles.pickerState}>No templates are available yet.</Text> : null}
            <View style={styles.templatePickerList}>
              {coachTemplates?.map((item) => (
                <TemplateChoice
                  intent={existingIntent}
                  item={item}
                  key={item.template.id}
                  onPress={() => startFromTemplate(item, existingIntent)}
                />
              ))}
            </View>
          </Panel>
        ) : null}
      </View>
    );
  }

  return (
    <View style={[coachStyles.page, isCompact && coachStyles.pageCompact]}>
      <PageHeading
        title={mode === 'edit' ? 'Edit workout template' : mode === 'copy' ? 'Copy workout template' : 'Create workout template'}
        subtitle={mode === 'edit'
          ? 'Update the workout structure, targets, and coaching notes for this template.'
          : mode === 'copy'
            ? 'Adjust this copy before saving it as a new, unassigned template.'
            : 'Build each exercise set by set, using the same controls as the training app.'}
        actions={
          <>
            <ActionButton label="Change intent" secondary onPress={returnToIntentChooser} />
            {!templateLoading && !templateLoadError ? (
              <ActionButton
                label={saving ? 'Saving…' : mode === 'edit' ? 'Save changes' : 'Save template'}
                onPress={() => void saveTemplate()}
              />
            ) : null}
          </>
        }
      />

      {saveError || exerciseError || templateLoadError ? (
        <Panel style={styles.error}>
          <Text style={styles.errorText}>{saveError ?? exerciseError ?? templateLoadError}</Text>
        </Panel>
      ) : null}

      {templateLoading ? (
        <Panel style={styles.loadingPanel}><Text style={styles.muted}>Loading template…</Text></Panel>
      ) : null}

      {!templateLoading && !templateLoadError ? <View style={[styles.columns, isCompact && styles.columnsCompact]}>
        <View style={styles.builderColumn}>
          <Panel style={[styles.details, isCompact && styles.panelCompact]}>
            <View style={styles.libraryNotice}>
              <StatusBadge>{mode === 'edit' ? 'Editing live' : mode === 'copy' ? 'New copy' : 'New template'}</StatusBadge>
              <Text style={styles.ownerHelp}>
                {mode === 'edit'
                  ? 'Changes apply to this template for everyone currently assigned to it.'
                  : 'Save this to your coaching library, then assign it from the Templates page.'}
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
          <View style={styles.libraryHeader}>
            <View>
              <Text style={coachStyles.sectionTitle}>Exercise library</Text>
              <Text style={styles.muted}>{filteredExercises.length} movements</Text>
            </View>
            <StatusBadge>{draft.exercises.length} selected</StatusBadge>
          </View>
          <View style={styles.exerciseSearch}>
            <Image contentFit="contain" source={searchIcon} style={styles.searchIcon} tintColor={CoachColors.textSecondary} />
            <NonCredentialTextInput
              accessibilityLabel="Search builder exercise library"
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={setExerciseQuery}
              placeholder="Search exercises…"
              placeholderTextColor={CoachColors.textDisabled}
              returnKeyType="search"
              style={styles.exerciseSearchInput}
              value={exerciseQuery}
            />
          </View>
          {loading ? <Text style={styles.libraryState}>Loading exercises…</Text> : null}
          {!loading && !filteredExercises.length ? <Text style={styles.libraryState}>No exercises match your search.</Text> : null}
          {filteredExercises.map((exercise) => {
            const active = draft.exercises.some((item) => item.exercise.id === exercise.id);
            const thumbnailUrl = getExerciseAssetUrl(exercise.thumbnailUrl);
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
                <View style={styles.libraryThumb}>
                  {thumbnailUrl ? (
                    <Image
                      accessibilityLabel={`${exercise.name} preview`}
                      contentFit="contain"
                      source={{ uri: thumbnailUrl }}
                      style={styles.libraryThumbnail}
                      transition={120}
                    />
                  ) : (
                    <Text style={styles.libraryThumbFallback}>{exercise.name.charAt(0).toUpperCase()}</Text>
                  )}
                </View>
                <View style={styles.libraryCopy}>
                  <Text numberOfLines={1} style={styles.exerciseName}>{exercise.name}</Text>
                  <Text numberOfLines={1} style={styles.libraryMeta}>{exercise.primaryMuscle} · {exercise.equipment}</Text>
                </View>
                <Text style={styles.add}>{active ? '✓' : '+'}</Text>
              </HoverPressable>
            );
          })}
        </Panel>
      </View> : null}
    </View>
  );
}

function IntentCard({
  active = false,
  description,
  label,
  marker,
  onPress,
}: {
  active?: boolean;
  description: string;
  label: string;
  marker: string;
  onPress: () => void;
}) {
  return (
    <HoverPressable
      accessibilityRole="button"
      hoverStyle={styles.intentCardHovered}
      onPress={onPress}
      pressedStyle={styles.pressed}
      style={[styles.intentCard, active && styles.intentCardActive]}>
      <View style={[styles.intentMarker, active && styles.intentMarkerActive]}>
        <Text style={styles.intentMarkerText}>{marker}</Text>
      </View>
      <Text style={styles.intentCardTitle}>{label}</Text>
      <Text style={styles.intentCardDescription}>{description}</Text>
      <Text style={styles.intentCardAction}>{active ? 'SELECT A TEMPLATE BELOW' : 'CONTINUE →'}</Text>
    </HoverPressable>
  );
}

function TemplateChoice({
  intent,
  item,
  onPress,
}: {
  intent: ExistingTemplateIntent;
  item: CoachWorkoutTemplate;
  onPress: () => void;
}) {
  return (
    <HoverPressable
      accessibilityLabel={`${intent === 'edit' ? 'Edit' : 'Copy'} ${item.template.name}`}
      accessibilityRole="button"
      hoverStyle={styles.templateChoiceHovered}
      onPress={onPress}
      pressedStyle={styles.pressed}
      style={styles.templateChoice}>
      <View style={styles.templateChoiceCopy}>
        <Text numberOfLines={1} style={styles.templateChoiceName}>{item.template.name}</Text>
        <Text style={styles.templateChoiceMeta}>
          {item.template.exercises.length} exercises · {item.assignees.length} assignments
        </Text>
      </View>
      <Text style={styles.templateChoiceAction}>{intent === 'edit' ? 'EDIT' : 'COPY'} →</Text>
    </HoverPressable>
  );
}

function nextCopyName(sourceName: string, templates: CoachWorkoutTemplate[]) {
  const existingNames = new Set(templates.map(({ template }) => template.name.toLowerCase()));
  let copyNumber = 1;
  while (true) {
    const suffix = copyNumber === 1 ? ' Copy' : ` Copy ${copyNumber}`;
    const base = sourceName.slice(0, Math.max(0, 100 - suffix.length)).trimEnd();
    const candidate = `${base}${suffix}`;
    if (!existingNames.has(candidate.toLowerCase())) return candidate;
    copyNumber += 1;
  }
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
  intentHeader: { gap: 6 },
  intentEyebrow: { color: CoachColors.accentText, fontSize: 9, letterSpacing: 1, ...CoachTypography.inter600 },
  intentTitle: { color: CoachColors.textPrimary, fontSize: 22, lineHeight: 28, letterSpacing: -.44, ...CoachTypography.sora700 },
  intentHelp: { color: CoachColors.textSecondary, fontSize: 12, lineHeight: 18, ...CoachTypography.inter400 },
  intentGrid: { flexDirection: 'row', gap: 14 },
  intentGridCompact: { flexDirection: 'column' },
  intentCard: { flex: 1, minHeight: 184, padding: 20, gap: 10, borderWidth: 1, borderColor: CoachColors.border, borderRadius: 12, backgroundColor: CoachColors.surface },
  intentCardActive: { borderColor: CoachColors.accentText, backgroundColor: CoachColors.accentTint },
  intentCardHovered: { transform: [{ translateY: -3 }], borderColor: CoachColors.accentText, boxShadow: '0 12px 26px rgba(0, 185, 198, 0.12)' },
  intentMarker: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 5, backgroundColor: CoachColors.surfaceMuted },
  intentMarkerActive: { backgroundColor: CoachColors.accent },
  intentMarkerText: { color: CoachColors.textPrimary, fontSize: 9, ...CoachTypography.inter600 },
  intentCardTitle: { marginTop: 4, color: CoachColors.textPrimary, fontSize: 16, letterSpacing: -.32, ...CoachTypography.sora700 },
  intentCardDescription: { flex: 1, color: CoachColors.textSecondary, fontSize: 11, lineHeight: 17, ...CoachTypography.inter400 },
  intentCardAction: { color: CoachColors.accentText, fontSize: 9, ...CoachTypography.inter600 },
  templatePicker: { padding: 20, gap: 14 },
  templatePickerHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 },
  pickerHelp: { marginTop: 5, color: CoachColors.textSecondary, fontSize: 11, lineHeight: 16, ...CoachTypography.inter400 },
  pickerState: { paddingVertical: 16, color: CoachColors.textSecondary, fontSize: 11, ...CoachTypography.inter400 },
  templatePickerList: { gap: 8 },
  templateChoice: { minHeight: 62, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderColor: CoachColors.border, borderRadius: 8, backgroundColor: CoachColors.surface },
  templateChoiceHovered: { paddingLeft: 18, borderColor: CoachColors.accentText, backgroundColor: CoachColors.surfaceMuted },
  templateChoiceCopy: { flex: 1, minWidth: 0 },
  templateChoiceName: { color: CoachColors.textPrimary, fontSize: 13, ...CoachTypography.sora600 },
  templateChoiceMeta: { marginTop: 4, color: CoachColors.textSecondary, fontSize: 9, ...CoachTypography.inter400 },
  templateChoiceAction: { color: CoachColors.accentText, fontSize: 9, ...CoachTypography.inter600 },
  columns: { flexDirection: 'row', alignItems: 'flex-start', gap: 24 },
  columnsCompact: { flexDirection: 'column', gap: 16 },
  builderColumn: { flex: 1, minWidth: 0, gap: 16 },
  libraryNotice: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ownerHelp: { color: CoachColors.textSecondary, fontSize: 10, lineHeight: 15, ...CoachTypography.inter400 },
  details: { padding: 24, gap: 12 },
  panelCompact: { width: '100%', padding: 18 },
  library: { width: 340, padding: 14, gap: 8 },
  libraryCompact: { width: '100%', padding: 14 },
  libraryHeader: { marginBottom: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  exerciseSearch: { height: 40, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: CoachColors.inputBorder, borderRadius: 7, backgroundColor: CoachColors.surfaceMuted },
  searchIcon: { width: 16, height: 16 },
  exerciseSearchInput: { flex: 1, height: '100%', color: CoachColors.textPrimary, fontSize: 11, outlineStyle: 'none', ...CoachTypography.inter400 } as never,
  libraryState: { paddingVertical: 16, color: CoachColors.textSecondary, fontSize: 10, textAlign: 'center', ...CoachTypography.inter400 },
  label: { color: CoachColors.textSecondary, fontSize: 9, ...CoachTypography.inter600 },
  input: { height: 48, paddingHorizontal: 14, color: CoachColors.textPrimary, fontSize: 13, borderWidth: 1, borderColor: CoachColors.inputBorder, borderRadius: 7, backgroundColor: CoachColors.surface, outlineStyle: 'none', ...CoachTypography.inter400 } as never,
  textarea: { minHeight: 86, padding: 14, color: CoachColors.textPrimary, fontSize: 13, textAlignVertical: 'top', borderWidth: 1, borderColor: CoachColors.inputBorder, borderRadius: 7, backgroundColor: CoachColors.surface, outlineStyle: 'none', ...CoachTypography.inter400 } as never,
  selectedHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  exerciseCard: { padding: 20, gap: 12 },
  exerciseHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  exerciseNumber: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 7, backgroundColor: CoachColors.surfaceMuted },
  exerciseNumberText: { color: CoachColors.accentText, fontSize: 14, ...CoachTypography.sora700 },
  exerciseCopy: { flex: 1, minWidth: 0 },
  exerciseTitle: { color: CoachColors.textPrimary, fontSize: 15, letterSpacing: -.3, ...CoachTypography.sora700 },
  exerciseName: { color: CoachColors.textPrimary, fontSize: 13, ...CoachTypography.sora600 },
  orderActions: { flexDirection: 'row', gap: 6 },
  smallAction: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: CoachColors.border, borderRadius: 6, backgroundColor: CoachColors.surface },
  smallActionHovered: { borderColor: CoachColors.accentText, backgroundColor: CoachColors.accentTint, transform: [{ translateY: -1 }] },
  smallActionDangerHovered: { borderColor: CoachColors.danger, backgroundColor: 'rgba(185, 28, 28, 0.08)', transform: [{ translateY: -1 }] },
  smallActionText: { color: CoachColors.accentText, fontSize: 17, ...CoachTypography.inter600 },
  danger: { color: CoachColors.danger },
  disabled: { opacity: 0.28 },
  notesInput: { height: 42, paddingHorizontal: 12, color: CoachColors.textPrimary, fontSize: 12, borderWidth: 1, borderColor: CoachColors.inputBorder, borderRadius: 7, backgroundColor: CoachColors.surface, outlineStyle: 'none', ...CoachTypography.inter400 } as never,
  setBlock: { gap: 2 },
  setRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  numberColumn: { width: 42 },
  metrics: { flex: 1, flexDirection: 'row', gap: 10 },
  removeColumn: { width: 32, height: 42, alignItems: 'center', justifyContent: 'center' },
  removeSetHovered: { borderRadius: 6, backgroundColor: 'rgba(185, 28, 28, 0.08)' },
  setHeading: { flex: 1, color: CoachColors.textSecondary, fontSize: 9, textAlign: 'center', ...CoachTypography.inter600 },
  setNumber: { height: 42, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: CoachColors.accentText, borderRadius: 7 },
  setNumberText: { color: CoachColors.accentText, fontSize: 13, letterSpacing: -.26, ...CoachTypography.sora700 },
  numericInput: { flex: 1, height: 42, minWidth: 0, paddingHorizontal: 8, color: CoachColors.textPrimary, fontSize: 13, textAlign: 'center', borderWidth: 1, borderColor: CoachColors.inputBorder, borderRadius: 7, backgroundColor: CoachColors.surface, outlineStyle: 'none', ...CoachTypography.sora700 } as never,
  removeSet: { color: CoachColors.danger, fontSize: 21, ...CoachTypography.inter600 },
  removeSetDisabled: { color: CoachColors.textDisabled },
  addSetButton: { height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 7, backgroundColor: CoachColors.surfaceMuted },
  addSetButtonHovered: { borderWidth: 1, borderColor: CoachColors.accentText, backgroundColor: CoachColors.accentTint, transform: [{ translateY: -1 }] },
  addSetText: { color: CoachColors.textPrimary, fontSize: 11, ...CoachTypography.inter600 },
  emptyPanel: { padding: 28, alignItems: 'center' },
  loadingPanel: { padding: 28, alignItems: 'center' },
  emptyTitle: { color: CoachColors.textPrimary, fontSize: 14, ...CoachTypography.sora600 },
  muted: { marginTop: 4, color: CoachColors.textSecondary, fontSize: 10, lineHeight: 15, ...CoachTypography.inter400 },
  libraryRow: { minHeight: 52, padding: 7, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 9, borderWidth: 1, borderColor: CoachColors.border, borderRadius: 7 },
  libraryRowHovered: { paddingLeft: 10, borderColor: CoachColors.accentText, backgroundColor: CoachColors.surfaceMuted },
  libraryThumb: { width: 38, height: 38, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: CoachColors.border, borderRadius: 6, backgroundColor: CoachColors.surfaceMuted },
  libraryThumbnail: { width: '100%', height: '100%' },
  libraryThumbFallback: { color: CoachColors.accentText, fontSize: 13, ...CoachTypography.inter600 },
  libraryCopy: { flex: 1, minWidth: 0 },
  libraryMeta: { marginTop: 2, color: CoachColors.textSecondary, fontSize: 9, textTransform: 'capitalize', ...CoachTypography.inter400 },
  libraryRowActive: { borderColor: CoachColors.accentText, backgroundColor: CoachColors.accentTint },
  pressed: { opacity: 0.68 },
  add: { color: CoachColors.accentText, fontSize: 20, ...CoachTypography.inter600 },
  error: { padding: 18, borderColor: CoachColors.danger },
  errorText: { color: CoachColors.danger, fontSize: 12, ...CoachTypography.inter400 },
});
