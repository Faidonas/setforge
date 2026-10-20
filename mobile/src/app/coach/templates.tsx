import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CoachColors } from '@/constants/setforge-theme';
import {
  ActionButton,
  PageHeading,
  Panel,
  StatusBadge,
  coachStyles,
  useCoachLayout,
} from '@/features/coach/coach-ui';
import { useCoachResource } from '@/features/coach/use-coach-resource';
import type { CoachClientSummary, CoachWorkoutTemplate } from '@/models/coach';
import {
  assignCoachWorkoutTemplate,
  getCoachClients,
  getCoachDashboard,
  getCoachTemplates,
  unassignCoachWorkoutTemplate,
} from '@/services/coach-api';

export default function CoachTemplatesScreen() {
  const router = useRouter();
  const { isCompact } = useCoachLayout();
  const { data: dashboard, error: dashboardError, loading: dashboardLoading } = useCoachResource(getCoachDashboard);
  const { data: clients, error: clientsError, loading: clientsLoading } = useCoachResource(getCoachClients);
  const {
    data: templates,
    error: templatesError,
    loading: templatesLoading,
    reload: reloadTemplates,
  } = useCoachResource(getCoachTemplates);
  const [openTemplateId, setOpenTemplateId] = useState<number | null>(null);
  const [updatingAssignment, setUpdatingAssignment] = useState<string | null>(null);
  const [assignmentError, setAssignmentError] = useState<string | null>(null);

  const loading = dashboardLoading || clientsLoading || templatesLoading;
  const error = assignmentError ?? dashboardError ?? clientsError ?? templatesError;
  const assignmentTargets = dashboard
    ? [{ id: dashboard.coachId, displayName: `${dashboard.coachName} (You)`, email: 'Personal training' }, ...(clients ?? [])]
    : clients ?? [];

  async function toggleAssignment(item: CoachWorkoutTemplate, userId: number) {
    const key = `${item.template.id}:${userId}`;
    const assigned = item.assignees.some((assignee) => assignee.userId === userId);
    setUpdatingAssignment(key);
    setAssignmentError(null);
    try {
      if (assigned) await unassignCoachWorkoutTemplate(item.template.id, userId);
      else await assignCoachWorkoutTemplate(item.template.id, userId);
      await reloadTemplates();
    } catch (updateError) {
      setAssignmentError(
        updateError instanceof Error ? updateError.message : 'Could not update the template assignment.',
      );
    } finally {
      setUpdatingAssignment(null);
    }
  }

  return (
    <View style={[coachStyles.page, isCompact && coachStyles.pageCompact]}>
      <PageHeading
        title="Template library"
        subtitle="Create reusable programs first, then assign them to clients or to yourself."
        actions={
          <ActionButton
            label="Create template"
            onPress={() => router.push('/coach/workout-builder' as Href)}
          />
        }
      />

      <View style={styles.summaryRow}>
        <Text style={styles.summary}>{templates?.length ?? 0} LIBRARY TEMPLATES</Text>
        <Text style={styles.summaryMuted}>
          Assigning a template makes it available in that person&apos;s training app.
        </Text>
      </View>

      {loading ? (
        <Panel style={styles.state}><Text style={styles.muted}>Loading template library…</Text></Panel>
      ) : null}
      {error ? (
        <Panel style={styles.error}><Text style={styles.errorText}>{error}</Text></Panel>
      ) : null}
      {!loading && !templates?.length ? (
        <Panel style={styles.state}>
          <Text style={styles.emptyTitle}>Your template library is empty</Text>
          <Text style={styles.muted}>Create a reusable workout, then decide who should receive it.</Text>
        </Panel>
      ) : null}

      <View style={styles.grid}>
        {templates?.map((item) => {
          const isOpen = openTemplateId === item.template.id;
          return (
            <Panel key={item.template.id} style={[styles.card, isCompact && styles.cardCompact]}>
              <View style={styles.cardTop}>
                <StatusBadge>
                  {item.assignees.length ? `Assigned ${item.assignees.length}` : 'Unassigned'}
                </StatusBadge>
                <Text style={styles.position}>#{(item.template.position ?? 0) + 1}</Text>
              </View>
              <Text style={styles.title}>{item.template.name}</Text>
              <Text style={styles.description}>{item.template.description || 'No description'}</Text>
              <View style={styles.line} />
              <Text style={styles.meta}>{item.template.exercises.length} EXERCISES</Text>

              <View style={styles.assignmentSummary}>
                <Text style={styles.assignmentLabel}>AVAILABLE TO</Text>
                {item.assignees.length ? (
                  <View style={styles.assigneeChips}>
                    {item.assignees.map((assignee) => (
                      <View key={assignee.userId} style={styles.assigneeChip}>
                        <Text style={styles.assigneeChipText}>
                          {assignee.userId === dashboard?.coachId ? 'You' : assignee.displayName}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.unassignedText}>Nobody yet</Text>
                )}
              </View>

              <Pressable
                accessibilityRole="button"
                onPress={() => setOpenTemplateId(isOpen ? null : item.template.id)}
                style={({ pressed }) => [styles.assignButton, pressed && styles.pressed]}>
                <Text style={styles.assignButtonText}>{isOpen ? 'DONE' : 'MANAGE ASSIGNMENTS'}</Text>
              </Pressable>

              {isOpen ? (
                <View style={styles.assignmentPanel}>
                  <Text style={styles.assignmentHint}>
                    Select everyone who should see this template in the training app.
                  </Text>
                  {assignmentTargets.map((target) => {
                    const assigned = item.assignees.some((assignee) => assignee.userId === target.id);
                    const busy = updatingAssignment === `${item.template.id}:${target.id}`;
                    return (
                      <AssignmentTarget
                        assigned={assigned}
                        busy={busy}
                        key={target.id}
                        onPress={() => void toggleAssignment(item, target.id)}
                        target={target}
                      />
                    );
                  })}
                </View>
              ) : null}
            </Panel>
          );
        })}
      </View>
    </View>
  );
}

function AssignmentTarget({
  assigned,
  busy,
  onPress,
  target,
}: {
  assigned: boolean;
  busy: boolean;
  onPress: () => void;
  target: Pick<CoachClientSummary, 'id' | 'displayName' | 'email'>;
}) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: assigned, disabled: busy }}
      disabled={busy}
      onPress={onPress}
      style={({ pressed }) => [
        styles.targetRow,
        assigned && styles.targetRowAssigned,
        (pressed || busy) && styles.pressed,
      ]}>
      <View style={styles.targetCopy}>
        <Text style={styles.targetName}>{target.displayName}</Text>
        <Text style={styles.targetEmail}>{target.email}</Text>
      </View>
      <View style={[styles.checkbox, assigned && styles.checkboxAssigned]}>
        <Text style={[styles.checkmark, assigned && styles.checkmarkAssigned]}>
          {busy ? '…' : assigned ? '✓' : '+'}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  summaryRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 16 },
  summary: { color: CoachColors.accentText, fontFamily: 'monospace', fontSize: 11 },
  summaryMuted: { color: CoachColors.textSecondary, fontSize: 11 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', gap: 16 },
  card: { width: '48.8%', padding: 24, gap: 12 },
  cardCompact: { width: '100%', padding: 18 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between' },
  position: { color: CoachColors.textSecondary, fontFamily: 'monospace', fontSize: 10 },
  title: { color: CoachColors.textPrimary, fontSize: 20, fontWeight: '800' },
  description: { minHeight: 36, color: CoachColors.textSecondary, fontSize: 12, lineHeight: 18 },
  line: { height: 1, backgroundColor: CoachColors.border },
  meta: { color: CoachColors.textSecondary, fontFamily: 'monospace', fontSize: 9 },
  assignmentSummary: { gap: 8 },
  assignmentLabel: { color: CoachColors.textSecondary, fontFamily: 'monospace', fontSize: 9 },
  assigneeChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  assigneeChip: { paddingHorizontal: 9, paddingVertical: 5, borderWidth: 1, borderColor: CoachColors.accentText, borderRadius: 12, backgroundColor: CoachColors.accentTint },
  assigneeChipText: { color: CoachColors.accentText, fontSize: 9, fontWeight: '800' },
  unassignedText: { color: CoachColors.textDisabled, fontSize: 11 },
  assignButton: { height: 40, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: CoachColors.accentText, borderRadius: 7 },
  assignButtonText: { color: CoachColors.accentText, fontSize: 10, fontWeight: '900' },
  assignmentPanel: { gap: 8, paddingTop: 4 },
  assignmentHint: { marginBottom: 2, color: CoachColors.textSecondary, fontSize: 10, lineHeight: 15 },
  targetRow: { minHeight: 52, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: CoachColors.border, borderRadius: 7, backgroundColor: CoachColors.surface },
  targetRowAssigned: { borderColor: CoachColors.accentText, backgroundColor: CoachColors.accentTint },
  targetCopy: { flex: 1, minWidth: 0 },
  targetName: { color: CoachColors.textPrimary, fontSize: 11, fontWeight: '800' },
  targetEmail: { marginTop: 2, color: CoachColors.textSecondary, fontSize: 9 },
  checkbox: { width: 25, height: 25, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: CoachColors.border, borderRadius: 5 },
  checkboxAssigned: { borderColor: CoachColors.accent, backgroundColor: CoachColors.accent },
  checkmark: { color: CoachColors.textSecondary, fontSize: 14, fontWeight: '900' },
  checkmarkAssigned: { color: CoachColors.buttonText },
  state: { padding: 24, alignItems: 'center', gap: 6 },
  emptyTitle: { color: CoachColors.textPrimary, fontSize: 14, fontWeight: '800' },
  muted: { color: CoachColors.textSecondary, fontSize: 12 },
  error: { padding: 24, borderColor: CoachColors.danger },
  errorText: { color: CoachColors.danger, fontSize: 12 },
  pressed: { opacity: 0.68 },
});
