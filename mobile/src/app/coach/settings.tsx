import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { NonCredentialTextInput } from '@/components/non-credential-text-input';

import { CoachColors } from '@/constants/setforge-theme';
import { useAuth } from '@/features/auth/auth-context';
import { HoverPressable, PageHeading, Panel, coachStyles, useCoachLayout } from '@/features/coach/coach-ui';

export default function CoachSettingsScreen() {
  const auth = useAuth();
  const { isCompact } = useCoachLayout();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const email = auth.user?.email ?? 'Unavailable';
  const metadataName = auth.user?.user_metadata?.full_name;
  const displayName = typeof metadataName === 'string' && metadataName.trim()
    ? metadataName.trim()
    : email.split('@')[0];

  async function updatePassword() {
    if (submitting) return;
    setSuccess(false);
    if (newPassword.length < 8) {
      setMessage('Your new password must contain at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage('The passwords do not match.');
      return;
    }
    setSubmitting(true);
    setMessage(null);
    try {
      await auth.changePassword(newPassword);
      setNewPassword('');
      setConfirmPassword('');
      setSuccess(true);
      setMessage('Password updated successfully.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not update your password.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={[coachStyles.page, isCompact && coachStyles.pageCompact]}>
      <PageHeading
        title="Settings"
        subtitle="Review your SetForge identity and manage your sign-in password."
      />
      <View style={[styles.columns, isCompact && styles.columnsCompact]}>
        <Panel style={[styles.identityPanel, isCompact && styles.panelCompact]}>
          <Text style={styles.sectionLabel}>ACCOUNT</Text>
          <View style={styles.identityRow}>
            <Text style={styles.fieldLabel}>Display name</Text>
            <Text style={styles.fieldValue}>{displayName}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.identityRow}>
            <Text style={styles.fieldLabel}>Email address</Text>
            <Text selectable style={styles.fieldValue}>{email}</Text>
          </View>
        </Panel>

        <Panel style={[styles.passwordPanel, isCompact && styles.panelCompact]}>
          <Text style={styles.sectionLabel}>CHANGE PASSWORD</Text>
          <Text style={styles.help}>Use at least 8 characters. The new password applies to your Supabase login.</Text>
          <NonCredentialTextInput
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={setNewPassword}
            placeholder="New password"
            placeholderTextColor={CoachColors.textDisabled}
            secureTextEntry
            style={styles.input}
            value={newPassword}
          />
          <NonCredentialTextInput
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={setConfirmPassword}
            onSubmitEditing={() => void updatePassword()}
            placeholder="Confirm new password"
            placeholderTextColor={CoachColors.textDisabled}
            secureTextEntry
            style={styles.input}
            value={confirmPassword}
          />
          {message ? <Text style={[styles.message, success && styles.success]}>{message}</Text> : null}
          <HoverPressable
            accessibilityRole="button"
            disabled={submitting}
            hoverStyle={styles.buttonHovered}
            onPress={() => void updatePassword()}
            pressedStyle={styles.pressed}
            style={styles.button}>
            <Text style={styles.buttonLabel}>{submitting ? 'UPDATING…' : 'UPDATE PASSWORD'}</Text>
          </HoverPressable>
        </Panel>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  columns: { flexDirection: 'row', alignItems: 'flex-start', gap: 20 },
  columnsCompact: { flexDirection: 'column', gap: 16 },
  identityPanel: { width: '42%', padding: 24, gap: 16 },
  passwordPanel: { flex: 1, padding: 24, gap: 12 },
  panelCompact: { width: '100%', padding: 18 },
  sectionLabel: { color: CoachColors.textPrimary, fontFamily: 'monospace', fontSize: 10, fontWeight: '800' },
  identityRow: { gap: 5 },
  fieldLabel: { color: CoachColors.textSecondary, fontSize: 10 },
  fieldValue: { color: CoachColors.textPrimary, fontSize: 13, fontWeight: '700' },
  divider: { height: 1, backgroundColor: CoachColors.border },
  help: { color: CoachColors.textSecondary, fontSize: 11, lineHeight: 17 },
  input: { height: 48, paddingHorizontal: 14, borderWidth: 1, borderColor: CoachColors.inputBorder, borderRadius: 6, color: CoachColors.textPrimary, backgroundColor: CoachColors.surfaceMuted, fontSize: 13, outlineStyle: 'none' } as never,
  message: { color: CoachColors.danger, fontSize: 11, lineHeight: 17 },
  success: { color: CoachColors.accentText },
  button: { height: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 7, backgroundColor: CoachColors.accent },
  buttonHovered: { transform: [{ translateY: -2 }], boxShadow: '0 9px 22px rgba(0, 185, 198, 0.18)' },
  buttonLabel: { color: CoachColors.buttonText, fontSize: 11, fontWeight: '900' },
  pressed: { opacity: 0.72 },
});
