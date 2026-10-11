import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { SetForgeColors } from '@/constants/setforge-theme';
import { ActionButton, CoachShell, PageHeading, Panel, coachStyles } from '@/features/coach/coach-ui';
import type { UserProfile } from '@/models/user';
import { createCoachUser } from '@/services/coach-api';

export default function CreateCoachScreen() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [temporaryPassword, setTemporaryPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [createdCoach, setCreatedCoach] = useState<UserProfile | null>(null);
  const [createdPassword, setCreatedPassword] = useState<string | null>(null);
  const [supabaseUserCreated, setSupabaseUserCreated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (submitting || !displayName.trim() || !email.trim()) return;
    if (temporaryPassword.length < 8) {
      setError('Temporary password must be at least 8 characters.');
      return;
    }
    if (temporaryPassword !== confirmPassword) {
      setError('The passwords do not match.');
      return;
    }
    setSubmitting(true);
    setError(null);
    setCreatedCoach(null);
    try {
      const result = await createCoachUser({
        displayName: displayName.trim(),
        email: email.trim(),
        temporaryPassword,
      });
      setCreatedCoach(result.coach);
      setSupabaseUserCreated(result.supabaseUserCreated);
      setCreatedPassword(result.supabaseUserCreated ? temporaryPassword : null);
      setDisplayName('');
      setEmail('');
      setTemporaryPassword('');
      setConfirmPassword('');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Could not create the coach account.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <CoachShell>
      <View style={coachStyles.page}>
        <PageHeading
          title="Create coach"
          subtitle="Prepare a trainer account or promote an existing SetForge user."
          actions={<ActionButton label="Back to dashboard" secondary onPress={() => router.back()} />}
        />
        <View style={styles.columns}>
          <Panel style={styles.form}>
            <Text style={styles.label}>DISPLAY NAME</Text>
            <TextInput
              autoCapitalize="words"
              maxLength={100}
              onChangeText={setDisplayName}
              placeholder="Coach name"
              placeholderTextColor={SetForgeColors.textDisabled}
              style={styles.input}
              value={displayName}
            />
            <Text style={styles.label}>EMAIL ADDRESS</Text>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              maxLength={255}
              onChangeText={setEmail}
              onSubmitEditing={() => void submit()}
              placeholder="coach@example.com"
              placeholderTextColor={SetForgeColors.textDisabled}
              style={styles.input}
              value={email}
            />
            <Text style={styles.label}>TEMPORARY PASSWORD</Text>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={72}
              onChangeText={setTemporaryPassword}
              placeholder="At least 8 characters"
              placeholderTextColor={SetForgeColors.textDisabled}
              secureTextEntry
              style={styles.input}
              value={temporaryPassword}
            />
            <Text style={styles.label}>CONFIRM PASSWORD</Text>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={72}
              onChangeText={setConfirmPassword}
              onSubmitEditing={() => void submit()}
              placeholder="Enter the temporary password again"
              placeholderTextColor={SetForgeColors.textDisabled}
              secureTextEntry
              style={styles.input}
              value={confirmPassword}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <ActionButton label={submitting ? 'Creating…' : 'Create coach'} onPress={() => void submit()} />
          </Panel>
          <View style={styles.rail}>
            {createdCoach ? (
              <Panel style={styles.successPanel}>
                <Text style={styles.successTitle}>Coach access enabled</Text>
                <Text style={styles.coachName}>{createdCoach.displayName}</Text>
                <Text style={styles.muted}>{createdCoach.email}</Text>
                {supabaseUserCreated && createdPassword ? (
                  <View style={styles.passwordBox}>
                    <Text style={styles.passwordLabel}>TEMPORARY PASSWORD · SHOWN ONCE</Text>
                    <Text selectable style={styles.password}>{createdPassword}</Text>
                  </View>
                ) : null}
                <Text style={styles.instructions}>{supabaseUserCreated
                  ? 'The Supabase login is ready. Give these credentials to the coach and ask them to change the password after signing in.'
                  : 'This email already had a Supabase login. Its existing password was preserved and coach access is now enabled.'}</Text>
              </Panel>
            ) : (
              <Panel style={styles.infoPanel}>
                <Text style={coachStyles.sectionTitle}>How access works</Text>
                <Text style={styles.instructions}>
                  New emails create a prepared coach profile. Existing individual accounts are promoted
                  to coach. New Supabase logins are confirmed immediately. Only an administrator can perform this action.
                </Text>
              </Panel>
            )}
          </View>
        </View>
      </View>
    </CoachShell>
  );
}

const styles = StyleSheet.create({
  columns: { flexDirection: 'row', alignItems: 'flex-start', gap: 20 },
  form: { width: '58%', padding: 24, gap: 12 },
  rail: { flex: 1 },
  label: { marginTop: 4, color: SetForgeColors.textSecondary, fontFamily: 'monospace', fontSize: 10 },
  input: {
    height: 48,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: SetForgeColors.border,
    borderRadius: 6,
    color: SetForgeColors.textPrimary,
    backgroundColor: SetForgeColors.surfaceMuted,
    fontSize: 14,
    outlineStyle: 'none',
  } as never,
  infoPanel: { padding: 22, gap: 12 },
  successPanel: { padding: 22, gap: 9, borderColor: 'rgba(50,213,131,.45)' },
  successTitle: { color: '#32D583', fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
  coachName: { color: SetForgeColors.textPrimary, fontSize: 19, fontWeight: '800' },
  muted: { color: SetForgeColors.textSecondary, fontSize: 12 },
  passwordBox: { marginTop: 6, padding: 14, gap: 7, borderWidth: 1, borderColor: SetForgeColors.accent, borderRadius: 6, backgroundColor: SetForgeColors.accentTint },
  passwordLabel: { color: SetForgeColors.accent, fontFamily: 'monospace', fontSize: 9, fontWeight: '800' },
  password: { color: SetForgeColors.textPrimary, fontFamily: 'monospace', fontSize: 15, fontWeight: '700' },
  instructions: { color: SetForgeColors.textSecondary, fontSize: 12, lineHeight: 19 },
  error: { color: '#FF8A98', fontSize: 12, lineHeight: 18 },
});
