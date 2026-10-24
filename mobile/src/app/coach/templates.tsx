import { Image } from 'expo-image';
import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { NonCredentialTextInput } from '@/components/non-credential-text-input';
import { CoachColors } from '@/constants/setforge-theme';
import { CoachTypography } from '@/features/coach/coach-typography';
import { HoverPressable, Panel, coachStyles, useCoachLayout } from '@/features/coach/coach-ui';
import { useCoachResource } from '@/features/coach/use-coach-resource';
import type { CoachWorkoutTemplate } from '@/models/coach';
import type { WorkoutTemplateExercise } from '@/models/workout-template';
import {
  assignCoachWorkoutTemplate,
  deleteCoachWorkoutTemplate,
  duplicateCoachWorkoutTemplate,
  getCoachClients,
  getCoachDashboard,
  getCoachTemplates,
  unassignCoachWorkoutTemplate,
} from '@/services/coach-api';

const searchIcon = require('@/assets/images/coach-web-light/search.svg');
type AssignmentFilter = 'all' | 'assigned' | 'unassigned';

const filterOptions: { label: string; value: AssignmentFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Assigned', value: 'assigned' },
  { label: 'Unassigned', value: 'unassigned' },
];

export default function CoachTemplatesScreen() {
  const router = useRouter();
  const { contentWidth, isCompact } = useCoachLayout();
  const isStacked = contentWidth < 980;
  const { data: dashboard, error: dashboardError, loading: dashboardLoading } = useCoachResource(getCoachDashboard);
  const { data: clients, error: clientsError, loading: clientsLoading } = useCoachResource(getCoachClients);
  const {
    data: templates,
    error: templatesError,
    loading: templatesLoading,
    reload: reloadTemplates,
  } = useCoachResource(getCoachTemplates);
  const [templateQuery, setTemplateQuery] = useState('');
  const [clientQuery, setClientQuery] = useState('');
  const [filter, setFilter] = useState<AssignmentFilter>('all');
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [exercisesExpanded, setExercisesExpanded] = useState(true);
  const [updatingAssignment, setUpdatingAssignment] = useState<string | null>(null);
  const [duplicatingTemplateId, setDuplicatingTemplateId] = useState<number | null>(null);
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<number | null>(null);
  const [deletingTemplateId, setDeletingTemplateId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const filteredTemplates = useMemo(() => {
    const query = templateQuery.trim().toLowerCase();
    return (templates ?? []).filter((item) => {
      const matchesQuery = !query || [item.template.name, item.template.description ?? '']
        .some((value) => value.toLowerCase().includes(query));
      const matchesFilter = filter === 'all'
        || (filter === 'assigned' && item.assignees.length > 0)
        || (filter === 'unassigned' && item.assignees.length === 0);
      return matchesQuery && matchesFilter;
    });
  }, [filter, templateQuery, templates]);

  const selectedItem = filteredTemplates.find((item) => item.template.id === selectedTemplateId)
    ?? filteredTemplates[0]
    ?? null;
  const assignmentTargets = useMemo(() => (
    dashboard
      ? [{ id: dashboard.coachId, displayName: dashboard.coachName, email: 'Your own training account' }, ...(clients ?? [])]
      : clients ?? []
  ), [clients, dashboard]);
  const assignmentCandidates = useMemo(() => {
    if (!selectedItem) return [];
    const assignedIds = new Set(selectedItem.assignees.map((assignee) => assignee.userId));
    const query = clientQuery.trim().toLowerCase();
    return assignmentTargets.filter((target) => !assignedIds.has(target.id) && (!query
      || target.displayName.toLowerCase().includes(query)
      || target.email.toLowerCase().includes(query)));
  }, [assignmentTargets, clientQuery, selectedItem]);

  const loading = dashboardLoading || clientsLoading || templatesLoading;
  const error = actionError ?? dashboardError ?? clientsError ?? templatesError;

  async function toggleAssignment(item: CoachWorkoutTemplate, userId: number) {
    const key = `${item.template.id}:${userId}`;
    const assigned = item.assignees.some((assignee) => assignee.userId === userId);
    setUpdatingAssignment(key);
    setActionError(null);
    try {
      if (assigned) await unassignCoachWorkoutTemplate(item.template.id, userId);
      else await assignCoachWorkoutTemplate(item.template.id, userId);
      await reloadTemplates();
    } catch (updateError) {
      setActionError(updateError instanceof Error ? updateError.message : 'Could not update the template assignment.');
    } finally {
      setUpdatingAssignment(null);
    }
  }

  async function duplicateTemplate(item: CoachWorkoutTemplate) {
    setDuplicatingTemplateId(item.template.id);
    setActionError(null);
    try {
      const duplicate = await duplicateCoachWorkoutTemplate(item.template.id);
      setFilter('all');
      setTemplateQuery('');
      setSelectedTemplateId(duplicate.id);
      await reloadTemplates();
    } catch (duplicateError) {
      setActionError(duplicateError instanceof Error ? duplicateError.message : 'Could not duplicate this template.');
    } finally {
      setDuplicatingTemplateId(null);
    }
  }

  async function deleteTemplate(item: CoachWorkoutTemplate) {
    setDeletingTemplateId(item.template.id);
    setActionError(null);
    try {
      await deleteCoachWorkoutTemplate(item.template.id);
      setDeleteConfirmationId(null);
      setSelectedTemplateId(null);
      await reloadTemplates();
    } catch (deleteError) {
      setActionError(deleteError instanceof Error ? deleteError.message : 'Could not delete this template.');
    } finally {
      setDeletingTemplateId(null);
    }
  }

  return (
    <View style={[coachStyles.page, styles.page, isCompact && coachStyles.pageCompact]}>
      <View style={[styles.header, isCompact && styles.headerCompact]}>
        <View style={styles.headerCopy}>
          <Text style={styles.pageTitle}>Workout templates</Text>
          <Text style={styles.pageSubtitle}>Build your templates, see who can use them, and assign them to clients.</Text>
        </View>
        <HoverPressable
          accessibilityRole="button"
          hoverStyle={styles.newButtonHovered}
          onPress={() => router.push('/coach/workout-builder' as Href)}
          pressedStyle={styles.pressed}
          style={styles.newButton}>
          <Text style={styles.newButtonText}>NEW TEMPLATE</Text>
        </HoverPressable>
      </View>

      <View style={[styles.toolbar, isCompact && styles.toolbarCompact]}>
        <View style={[styles.search, isCompact && styles.searchCompact]}>
          <Image contentFit="contain" source={searchIcon} style={styles.searchIcon} tintColor={CoachColors.textSecondary} />
          <NonCredentialTextInput
            onChangeText={setTemplateQuery}
            placeholder="Search templates"
            placeholderTextColor={CoachColors.textDisabled}
            style={styles.searchInput}
            value={templateQuery}
          />
        </View>
        <View style={styles.filters}>
          {filterOptions.map((option) => {
            const count = option.value === 'all'
              ? templates?.length ?? 0
              : (templates ?? []).filter((item) => option.value === 'assigned' ? item.assignees.length > 0 : item.assignees.length === 0).length;
            const active = filter === option.value;
            return (
              <HoverPressable
                accessibilityRole="button"
                key={option.value}
                onPress={() => setFilter(option.value)}
                pressedStyle={styles.pressed}
                style={[styles.filterChip, active && styles.filterChipActive]}>
                <Text style={[styles.filterText, active && styles.filterTextActive]}>{option.label} {count}</Text>
              </HoverPressable>
            );
          })}
        </View>
      </View>

      {error ? <Panel style={styles.error}><Text style={styles.errorText}>{error}</Text></Panel> : null}
      {loading ? <Panel style={styles.state}><Text style={styles.muted}>Loading workout templates…</Text></Panel> : null}

      {!loading ? (
        <View style={[styles.workspace, isStacked && styles.workspaceStacked]}>
          <View style={[styles.library, isStacked && styles.libraryStacked]}>
            {filteredTemplates.map((item) => (
              <TemplateListItem
                coachId={dashboard?.coachId}
                item={item}
                key={item.template.id}
                onPress={() => {
                  setDeleteConfirmationId(null);
                  setSelectedTemplateId(item.template.id);
                }}
                selected={selectedItem?.template.id === item.template.id}
              />
            ))}
            {!filteredTemplates.length ? (
              <Panel style={styles.emptyList}>
                <Text style={styles.emptyTitle}>No templates found</Text>
                <Text style={styles.muted}>Try a different search or assignment filter.</Text>
              </Panel>
            ) : null}
          </View>

          {selectedItem ? (
            <Panel style={[styles.detail, isStacked && styles.detailStacked]}>
              <View style={[styles.detailHeader, isCompact && styles.detailHeaderCompact]}>
                <View style={styles.detailHeading}>
                  <Text style={styles.detailTitle}>{selectedItem.template.name}</Text>
                  <Text style={styles.detailMeta}>
                    {selectedItem.template.exercises.length} exercises · About {estimateMinutes(selectedItem.template.exercises)} min · {selectedItem.template.description || 'No description'}
                  </Text>
                </View>
                <View style={styles.detailActions}>
                  <SmallButton
                    label="Edit"
                    onPress={() => router.push(`/coach/workout-builder?templateId=${selectedItem.template.id}` as Href)}
                  />
                  <SmallButton
                    disabled={duplicatingTemplateId === selectedItem.template.id}
                    label={duplicatingTemplateId === selectedItem.template.id ? 'Duplicating…' : 'Duplicate'}
                    onPress={() => void duplicateTemplate(selectedItem)}
                  />
                  <SmallButton
                    danger
                    label="Delete"
                    onPress={() => setDeleteConfirmationId(selectedItem.template.id)}
                  />
                </View>
              </View>

              {deleteConfirmationId === selectedItem.template.id ? (
                <View style={[styles.deleteConfirmation, isCompact && styles.deleteConfirmationCompact]}>
                  <View style={styles.deleteConfirmationCopy}>
                    <Text style={styles.deleteConfirmationTitle}>Delete {selectedItem.template.name}?</Text>
                    <Text style={styles.deleteConfirmationText}>This permanently removes the template and its assignments from every client.</Text>
                  </View>
                  <View style={styles.deleteConfirmationActions}>
                    <SmallButton label="Cancel" onPress={() => setDeleteConfirmationId(null)} />
                    <SmallButton
                      danger
                      disabled={deletingTemplateId === selectedItem.template.id}
                      label={deletingTemplateId === selectedItem.template.id ? 'Deleting…' : 'Confirm delete'}
                      onPress={() => void deleteTemplate(selectedItem)}
                    />
                  </View>
                </View>
              ) : null}

              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Exercises</Text>
                <View style={styles.sectionActions}>
                  {exercisesExpanded ? <Text style={styles.sectionHint}>Sets × reps</Text> : null}
                  <HoverPressable
                    accessibilityRole="button"
                    accessibilityState={{ expanded: exercisesExpanded }}
                    hoverStyle={styles.sectionToggleHovered}
                    onPress={() => setExercisesExpanded((current) => !current)}
                    pressedStyle={styles.pressed}
                    style={styles.sectionToggle}>
                    <Text style={styles.sectionToggleText}>{exercisesExpanded ? 'Hide' : `Show ${selectedItem.template.exercises.length}`}</Text>
                    <Text style={[styles.sectionToggleIcon, !exercisesExpanded && styles.sectionToggleIconClosed]}>⌃</Text>
                  </HoverPressable>
                </View>
              </View>
              {exercisesExpanded ? (
                <View style={styles.exerciseList}>
                  {selectedItem.template.exercises.map((exercise, index) => (
                    <View key={exercise.id} style={styles.exerciseRow}>
                      <Text style={styles.exerciseIndex}>{index + 1}</Text>
                      <Text numberOfLines={1} style={styles.exerciseName}>{exercise.exerciseName}</Text>
                      <Text style={styles.exerciseTarget}>{formatTarget(exercise)}</Text>
                      <Text style={styles.exerciseRest}>{formatRest(exercise)}</Text>
                    </View>
                  ))}
                  {!selectedItem.template.exercises.length ? <Text style={styles.emptySection}>No exercises have been added to this template.</Text> : null}
                </View>
              ) : null}

              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Assigned to</Text>
                <Text style={styles.sectionHint}>{selectedItem.assignees.length} people can use this in their app</Text>
              </View>
              <View style={styles.assigneeList}>
                {selectedItem.assignees.map((assignee) => {
                  const busy = updatingAssignment === `${selectedItem.template.id}:${assignee.userId}`;
                  const isCoach = assignee.userId === dashboard?.coachId;
                  return (
                    <View key={assignee.userId} style={styles.personRow}>
                      <Avatar label={isCoach ? 'You' : assignee.displayName} />
                      <View style={styles.personCopy}>
                        <Text style={styles.personName}>{isCoach ? 'You' : assignee.displayName}</Text>
                        <Text style={styles.personMeta}>{isCoach ? 'Your own training' : `Assigned ${formatDate(assignee.assignedAt)}`}</Text>
                      </View>
                      <HoverPressable
                        accessibilityRole="button"
                        disabled={busy}
                        onPress={() => void toggleAssignment(selectedItem, assignee.userId)}
                        pressedStyle={styles.pressed}
                        style={styles.removeButton}>
                        <Text style={styles.removeText}>{busy ? 'Removing…' : 'Remove'}</Text>
                      </HoverPressable>
                    </View>
                  );
                })}
                {!selectedItem.assignees.length ? <Text style={styles.emptySection}>This template is not assigned yet.</Text> : null}
              </View>

              <View style={styles.assignPanel}>
                <Text style={styles.assignTitle}>Assign to clients</Text>
                <View style={styles.clientSearch}>
                  <Image contentFit="contain" source={searchIcon} style={styles.searchIcon} tintColor={CoachColors.textSecondary} />
                  <NonCredentialTextInput
                    onChangeText={setClientQuery}
                    placeholder="Search your clients"
                    placeholderTextColor={CoachColors.textDisabled}
                    style={styles.searchInput}
                    value={clientQuery}
                  />
                </View>
                <View style={styles.candidateList}>
                  {assignmentCandidates.map((target) => {
                    const busy = updatingAssignment === `${selectedItem.template.id}:${target.id}`;
                    return (
                      <View key={target.id} style={styles.personRow}>
                        <Avatar label={target.id === dashboard?.coachId ? 'You' : target.displayName} muted />
                        <View style={styles.personCopy}>
                          <Text style={styles.personName}>{target.id === dashboard?.coachId ? 'You' : target.displayName}</Text>
                          <Text numberOfLines={1} style={styles.personMeta}>{target.email}</Text>
                        </View>
                        <HoverPressable
                          accessibilityRole="button"
                          disabled={busy}
                          hoverStyle={styles.assignButtonHovered}
                          onPress={() => void toggleAssignment(selectedItem, target.id)}
                          pressedStyle={styles.pressed}
                          style={styles.assignButton}>
                          <Text style={styles.assignButtonText}>{busy ? 'Assigning…' : 'Assign'}</Text>
                        </HoverPressable>
                      </View>
                    );
                  })}
                  {!assignmentCandidates.length ? (
                    <Text style={styles.emptySection}>{clientQuery ? 'No available clients match your search.' : 'Everyone is already assigned.'}</Text>
                  ) : null}
                </View>
              </View>
            </Panel>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function TemplateListItem({ coachId, item, onPress, selected }: { coachId?: number; item: CoachWorkoutTemplate; onPress: () => void; selected: boolean }) {
  return (
    <HoverPressable
      accessibilityRole="button"
      hoverStyle={styles.templateItemHovered}
      onPress={onPress}
      pressedStyle={styles.pressed}
      style={[styles.templateItem, selected && styles.templateItemSelected]}>
      <View style={styles.templateItemCopy}>
        <Text numberOfLines={1} style={styles.templateName}>{item.template.name}</Text>
        <Text numberOfLines={1} style={styles.templateMeta}>{item.template.exercises.length} exercises{item.template.description ? ` · ${item.template.description}` : ''}</Text>
      </View>
      <View style={styles.templateAssignment}>
        {item.assignees.length ? (
          <>
            <View style={styles.miniAvatars}>
              {item.assignees.slice(0, 2).map((assignee, index) => (
                <View key={assignee.userId} style={[styles.miniAvatar, index > 0 && styles.miniAvatarOverlap]}>
                  <Text style={styles.miniAvatarText}>{assignee.userId === coachId ? 'You' : initials(assignee.displayName)}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.assignedCount}>Assigned to {item.assignees.length}</Text>
          </>
        ) : (
          <View style={styles.unassignedBadge}><Text style={styles.unassignedText}>Not assigned</Text></View>
        )}
      </View>
    </HoverPressable>
  );
}

function SmallButton({ danger = false, disabled = false, label, onPress }: { danger?: boolean; disabled?: boolean; label: string; onPress: () => void }) {
  return (
    <HoverPressable
      accessibilityRole="button"
      disabled={disabled}
      hoverStyle={danger ? styles.dangerButtonHovered : styles.smallButtonHovered}
      onPress={onPress}
      pressedStyle={styles.pressed}
      style={[styles.smallButton, danger && styles.dangerButton, disabled && styles.buttonDisabled]}>
      <Text style={[styles.smallButtonText, danger && styles.dangerButtonText]}>{label}</Text>
    </HoverPressable>
  );
}

function Avatar({ label, muted = false }: { label: string; muted?: boolean }) {
  return (
    <View style={[styles.avatar, muted && styles.avatarMuted]}>
      <Text style={[styles.avatarText, muted && styles.avatarTextMuted]}>{label === 'You' ? 'You' : initials(label)}</Text>
    </View>
  );
}

function initials(value: string) {
  return value.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || '?';
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(value));
}

function estimateMinutes(exercises: WorkoutTemplateExercise[]) {
  const seconds = exercises.reduce((total, exercise) => total + exercise.sets.reduce((setTotal, set) => (
    setTotal + (set.targetTimeSeconds ?? 45) + (set.restSeconds ?? 60)
  ), 0), 0);
  return Math.max(5, Math.round((seconds / 60) / 5) * 5);
}

function formatTarget(exercise: WorkoutTemplateExercise) {
  const workingSets = exercise.sets.filter((set) => set.setType !== 'WARM_UP');
  const sets = workingSets.length ? workingSets : exercise.sets;
  const target = sets[0];
  if (!target) return '—';
  if (exercise.exerciseType === 'TIMED') return `${sets.length} × ${target.targetTimeSeconds ?? '—'}s`;
  return `${sets.length} × ${target.targetReps ?? '—'}`;
}

function formatRest(exercise: WorkoutTemplateExercise) {
  const restSeconds = exercise.sets.find((set) => set.restSeconds !== undefined)?.restSeconds;
  if (restSeconds === undefined) return 'No rest';
  const minutes = Math.floor(restSeconds / 60);
  const seconds = restSeconds % 60;
  return `Rest ${minutes}:${String(seconds).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  page: { gap: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 20 },
  headerCompact: { alignItems: 'stretch', flexDirection: 'column', gap: 14 },
  headerCopy: { flex: 1, minWidth: 0 },
  pageTitle: { color: CoachColors.textPrimary, fontSize: 28, lineHeight: 34, letterSpacing: -.56, ...CoachTypography.sora700 },
  pageSubtitle: { marginTop: 5, color: CoachColors.textSecondary, fontSize: 13, lineHeight: 19, ...CoachTypography.inter400 },
  newButton: { height: 38, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', borderRadius: 7, backgroundColor: CoachColors.accent },
  newButtonHovered: { transform: [{ translateY: -2 }], boxShadow: '0 8px 18px rgba(0, 240, 255, 0.18)' },
  newButtonText: { color: CoachColors.buttonText, fontSize: 11, ...CoachTypography.inter600 },
  toolbar: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  toolbarCompact: { alignItems: 'stretch', flexDirection: 'column' },
  search: { width: 340, height: 38, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: CoachColors.border, borderRadius: 7, backgroundColor: CoachColors.surface },
  searchCompact: { width: '100%' },
  searchIcon: { width: 15, height: 15 },
  searchInput: { flex: 1, height: '100%', color: CoachColors.textPrimary, fontSize: 13, outlineStyle: 'none', ...CoachTypography.inter400 } as never,
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  filterChip: { height: 32, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: CoachColors.border, borderRadius: 16, backgroundColor: CoachColors.canvas },
  filterChipActive: { borderColor: CoachColors.accentText, backgroundColor: CoachColors.accentTint },
  filterText: { color: CoachColors.textSecondary, fontSize: 11, ...CoachTypography.inter500 },
  filterTextActive: { color: CoachColors.accentText, ...CoachTypography.inter600 },
  workspace: { minHeight: 560, flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  workspaceStacked: { flexDirection: 'column' },
  library: { width: '34%', maxWidth: 430, minWidth: 300, gap: 7 },
  libraryStacked: { width: '100%', maxWidth: '100%', minWidth: 0 },
  templateItem: { minHeight: 70, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: CoachColors.border, borderRadius: 9, backgroundColor: CoachColors.surface },
  templateItemSelected: { borderColor: CoachColors.accentText, backgroundColor: CoachColors.accentTint },
  templateItemHovered: { borderColor: CoachColors.inputBorder, transform: [{ translateX: 3 }] },
  templateItemCopy: { flex: 1, minWidth: 0 },
  templateName: { color: CoachColors.textPrimary, fontSize: 14, ...CoachTypography.sora700 },
  templateMeta: { marginTop: 4, color: CoachColors.textSecondary, fontSize: 11, ...CoachTypography.inter400 },
  templateAssignment: { minWidth: 86, alignItems: 'flex-end', gap: 5 },
  miniAvatars: { flexDirection: 'row', paddingRight: 2 },
  miniAvatar: { minWidth: 23, height: 23, paddingHorizontal: 4, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: CoachColors.surface, borderRadius: 12, backgroundColor: CoachColors.accent },
  miniAvatarOverlap: { marginLeft: -6 },
  miniAvatarText: { color: CoachColors.buttonText, fontSize: 8, ...CoachTypography.inter600 },
  assignedCount: { color: CoachColors.accentText, fontSize: 10, ...CoachTypography.inter600 },
  unassignedBadge: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 10, backgroundColor: 'rgba(255, 187, 51, 0.12)' },
  unassignedText: { color: CoachColors.warning, fontSize: 10, ...CoachTypography.inter600 },
  detail: { flex: 1, minWidth: 0, padding: 20, gap: 18 },
  detailStacked: { width: '100%' },
  detailHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 },
  detailHeaderCompact: { flexDirection: 'column' },
  detailHeading: { flex: 1, minWidth: 0 },
  detailTitle: { color: CoachColors.textPrimary, fontSize: 22, lineHeight: 28, letterSpacing: -.44, ...CoachTypography.sora700 },
  detailMeta: { marginTop: 4, color: CoachColors.textSecondary, fontSize: 12, lineHeight: 18, ...CoachTypography.inter400 },
  detailActions: { flexDirection: 'row', gap: 7 },
  smallButton: { minWidth: 62, height: 34, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: CoachColors.border, borderRadius: 7, backgroundColor: CoachColors.surfaceMuted },
  smallButtonHovered: { borderColor: CoachColors.accentText, backgroundColor: CoachColors.accentTint, transform: [{ translateY: -1 }] },
  smallButtonText: { color: CoachColors.textPrimary, fontSize: 11, ...CoachTypography.inter600 },
  dangerButton: { borderColor: CoachColors.danger },
  dangerButtonHovered: { backgroundColor: 'rgba(239, 68, 68, 0.12)', transform: [{ translateY: -1 }] },
  dangerButtonText: { color: CoachColors.danger },
  buttonDisabled: { opacity: .55 },
  deleteConfirmation: { padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16, borderWidth: 1, borderColor: CoachColors.danger, borderRadius: 8, backgroundColor: 'rgba(239, 68, 68, 0.08)' },
  deleteConfirmationCompact: { alignItems: 'stretch', flexDirection: 'column' },
  deleteConfirmationCopy: { flex: 1, minWidth: 0 },
  deleteConfirmationTitle: { color: CoachColors.textPrimary, fontSize: 13, ...CoachTypography.sora600 },
  deleteConfirmationText: { marginTop: 3, color: CoachColors.textSecondary, fontSize: 11, lineHeight: 16, ...CoachTypography.inter400 },
  deleteConfirmationActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  sectionTitle: { color: CoachColors.textPrimary, fontSize: 15, ...CoachTypography.sora600 },
  sectionActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionHint: { color: CoachColors.textSecondary, fontSize: 10, ...CoachTypography.inter400 },
  sectionToggle: { minHeight: 30, paddingHorizontal: 9, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderColor: CoachColors.border, borderRadius: 6, backgroundColor: CoachColors.surfaceMuted },
  sectionToggleHovered: { borderColor: CoachColors.accentText, backgroundColor: CoachColors.accentTint },
  sectionToggleText: { color: CoachColors.textPrimary, fontSize: 10, ...CoachTypography.inter600 },
  sectionToggleIcon: { color: CoachColors.accentText, fontSize: 13, transform: [{ rotate: '0deg' }], ...CoachTypography.inter600 },
  sectionToggleIconClosed: { transform: [{ rotate: '180deg' }] },
  exerciseList: { borderTopWidth: 1, borderTopColor: CoachColors.border },
  exerciseRow: { minHeight: 39, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: CoachColors.border },
  exerciseIndex: { width: 18, color: CoachColors.textSecondary, fontSize: 11, ...CoachTypography.sora600 },
  exerciseName: { flex: 1, minWidth: 100, color: CoachColors.textPrimary, fontSize: 12, textTransform: 'capitalize', ...CoachTypography.sora600 },
  exerciseTarget: { width: 70, color: CoachColors.textPrimary, fontSize: 12, textAlign: 'right', ...CoachTypography.sora700 },
  exerciseRest: { width: 76, color: CoachColors.textSecondary, fontSize: 10, textAlign: 'right', ...CoachTypography.inter500 },
  assigneeList: { borderTopWidth: 1, borderTopColor: CoachColors.border },
  personRow: { minHeight: 52, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: CoachColors.border },
  avatar: { minWidth: 32, height: 32, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: CoachColors.accent },
  avatarMuted: { backgroundColor: CoachColors.accentTint },
  avatarText: { color: CoachColors.buttonText, fontSize: 10, ...CoachTypography.inter600 },
  avatarTextMuted: { color: CoachColors.accentText },
  personCopy: { flex: 1, minWidth: 0 },
  personName: { color: CoachColors.textPrimary, fontSize: 12, ...CoachTypography.sora600 },
  personMeta: { marginTop: 3, color: CoachColors.textSecondary, fontSize: 10, ...CoachTypography.inter400 },
  removeButton: { paddingHorizontal: 8, paddingVertical: 6, borderRadius: 5 },
  removeText: { color: CoachColors.textSecondary, fontSize: 10, ...CoachTypography.inter500 },
  assignPanel: { padding: 14, gap: 10, borderWidth: 1, borderColor: CoachColors.accentText, borderRadius: 9, backgroundColor: CoachColors.accentTint },
  assignTitle: { color: CoachColors.textPrimary, fontSize: 14, ...CoachTypography.sora600 },
  clientSearch: { height: 36, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: CoachColors.border, borderRadius: 6, backgroundColor: CoachColors.surface },
  candidateList: {},
  assignButton: { minWidth: 58, height: 30, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: CoachColors.accentText, borderRadius: 6 },
  assignButtonHovered: { backgroundColor: CoachColors.surface, transform: [{ translateY: -1 }] },
  assignButtonText: { color: CoachColors.accentText, fontSize: 10, ...CoachTypography.inter600 },
  state: { padding: 24, alignItems: 'center' },
  error: { padding: 14, borderColor: CoachColors.danger },
  errorText: { color: CoachColors.danger, fontSize: 12, ...CoachTypography.inter400 },
  emptyList: { padding: 18, gap: 5 },
  emptyTitle: { color: CoachColors.textPrimary, fontSize: 13, ...CoachTypography.sora600 },
  emptySection: { paddingVertical: 12, color: CoachColors.textSecondary, fontSize: 12, ...CoachTypography.inter400 },
  muted: { color: CoachColors.textSecondary, fontSize: 12, lineHeight: 18, ...CoachTypography.inter400 },
  pressed: { opacity: .68 },
});
