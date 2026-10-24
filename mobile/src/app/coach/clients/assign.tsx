import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { NonCredentialTextInput } from '@/components/non-credential-text-input';

import { CoachColors } from '@/constants/setforge-theme';
import { CoachTypography } from '@/features/coach/coach-typography';
import { ActionButton, HoverPressable, PageHeading, Panel, StatusBadge, coachStyles, useCoachLayout } from '@/features/coach/coach-ui';
import { useCoachResource } from '@/features/coach/use-coach-resource';
import type { AdminCoachingRelationship } from '@/models/coach';
import type { UserProfile } from '@/models/user';
import { assignClientToCoach, getAdminAssignableCoaches } from '@/services/coach-api';

export default function AssignClientScreen() {
  const router = useRouter();
  const { isCompact } = useCoachLayout();
  const { data: coaches, error: loadError, loading } = useCoachResource(getAdminAssignableCoaches);
  const [clientEmail, setClientEmail] = useState('');
  const [selectedCoachId, setSelectedCoachId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<AdminCoachingRelationship | null>(null);

  async function submit() {
    const email = clientEmail.trim().toLowerCase();
    if (submitting) return;
    if (!email) {
      setError('Enter the client email used in Supabase.');
      return;
    }
    if (selectedCoachId === null) {
      setError('Choose a coach.');
      return;
    }
    setSubmitting(true);
    setError(null);
    setCreated(null);
    try {
      const relationship = await assignClientToCoach({ clientEmail: email, coachId: selectedCoachId });
      setCreated(relationship);
      setClientEmail('');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Could not assign the client.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={[coachStyles.page, isCompact && coachStyles.pageCompact]}>
      <PageHeading
        title="Assign client"
        subtitle="Connect an existing Supabase individual account to a Spotter coach."
        actions={<ActionButton label="Back to dashboard" secondary onPress={() => router.back()} />}
      />

      <View style={[styles.columns, isCompact && styles.columnsCompact]}>
        <Panel style={[styles.form, isCompact && styles.formCompact]}>
          <Text style={styles.label}>CLIENT EMAIL</Text>
          <NonCredentialTextInput
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            onChangeText={setClientEmail}
            placeholder="individual@example.com"
            placeholderTextColor={CoachColors.textDisabled}
            style={styles.input}
            value={clientEmail}
          />
          <Text style={styles.help}>
            The account must already exist in Supabase. Spotter will import it automatically if the client has not logged in yet.
          </Text>

          <Text style={styles.label}>COACH</Text>
          {loading ? <Text style={styles.help}>Loading coaches…</Text> : null}
          <View style={styles.coachList}>
            {(coaches ?? []).map((coach) => (
              <CoachOption
                coach={coach}
                key={coach.id}
                onPress={() => setSelectedCoachId(coach.id)}
                selected={selectedCoachId === coach.id}
              />
            ))}
          </View>

          {error ?? loadError ? <Text style={styles.error}>{error ?? loadError}</Text> : null}
          <ActionButton label={submitting ? 'Assigning…' : 'Assign client'} onPress={() => void submit()} />
        </Panel>

        <View style={[styles.rail, isCompact && styles.railCompact]}>
          {created ? (
            <Panel style={styles.successPanel}>
              <StatusBadge>Active</StatusBadge>
              <Text style={styles.successTitle}>Client assigned</Text>
              <Text style={styles.relationship}>{created.clientName} → {created.coachName}</Text>
              <Text style={styles.help}>{created.clientEmail}</Text>
              <Text style={styles.help}>
                This client now appears in the coach dashboard and can receive templates from the coach library.
              </Text>
            </Panel>
          ) : (
            <Panel style={styles.infoPanel}>
              <Text style={coachStyles.sectionTitle}>Admin access only</Text>
              <Text style={styles.help}>
                Trainers cannot create their own client relationships. The backend checks your admin role before making any change.
              </Text>
            </Panel>
          )}
        </View>
      </View>
    </View>
  );
}

function CoachOption({
  coach,
  onPress,
  selected,
}: {
  coach: UserProfile;
  onPress: () => void;
  selected: boolean;
}) {
  return (
    <HoverPressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      hoverStyle={styles.coachOptionHovered}
      onPress={onPress}
      pressedStyle={styles.pressed}
      style={[
        styles.coachOption,
        selected && styles.coachOptionSelected,
      ]}>
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected ? <View style={styles.radioDot} /> : null}
      </View>
      <View style={styles.coachCopy}>
        <Text style={styles.coachName}>{coach.displayName}</Text>
        <Text style={styles.coachEmail}>{coach.email}</Text>
      </View>
      <StatusBadge tone={coach.accountType === 'ADMIN' ? 'warning' : 'muted'}>
        {coach.accountType === 'ADMIN' ? 'Admin' : 'Coach'}
      </StatusBadge>
    </HoverPressable>
  );
}

const styles = StyleSheet.create({
  columns: { flexDirection: 'row', alignItems: 'flex-start', gap: 20 },
  columnsCompact: { flexDirection: 'column', gap: 16 },
  form: { width: '58%', padding: 24, gap: 12 },
  formCompact: { width: '100%', padding: 18 },
  rail: { flex: 1 },
  railCompact: { width: '100%', flex: 0 },
  label: { ...CoachTypography.inter600, marginTop: 4, color: CoachColors.textSecondary, fontSize: 10 },
  input: { ...CoachTypography.inter400, height: 48, paddingHorizontal: 14, borderWidth: 1, borderColor: CoachColors.inputBorder, borderRadius: 6, color: CoachColors.textPrimary, backgroundColor: CoachColors.surfaceMuted, fontSize: 14, outlineStyle: 'none' } as never,
  help: { ...CoachTypography.inter400, color: CoachColors.textSecondary, fontSize: 11, lineHeight: 18 },
  coachList: { gap: 8 },
  coachOption: { minHeight: 64, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: CoachColors.border, borderRadius: 7, backgroundColor: CoachColors.canvas },
  coachOptionHovered: { borderColor: CoachColors.accentText, backgroundColor: CoachColors.surfaceMuted, transform: [{ translateX: 3 }] },
  coachOptionSelected: { borderColor: CoachColors.accentText, backgroundColor: CoachColors.accentTint },
  radio: { width: 18, height: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: CoachColors.textSecondary, borderRadius: 9 },
  radioSelected: { borderColor: CoachColors.accentText },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: CoachColors.accentText },
  coachCopy: { flex: 1, minWidth: 0 },
  coachName: { ...CoachTypography.sora600, color: CoachColors.textPrimary, fontSize: 13 },
  coachEmail: { ...CoachTypography.inter400, marginTop: 3, color: CoachColors.textSecondary, fontSize: 10 },
  error: { ...CoachTypography.inter400, color: CoachColors.danger, fontSize: 12, lineHeight: 18 },
  successPanel: { padding: 22, gap: 11, borderColor: CoachColors.accentText },
  successTitle: { ...CoachTypography.sora700, color: CoachColors.textPrimary, fontSize: 18, letterSpacing: -0.36 },
  relationship: { ...CoachTypography.sora600, color: CoachColors.accentText, fontSize: 13 },
  infoPanel: { padding: 22, gap: 12 },
  pressed: { opacity: 0.7 },
});
