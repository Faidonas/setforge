import { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { SetForgeColors } from '@/constants/setforge-theme';
import type { WorkoutTemplate } from '@/models/workout-template';

type ActionView = 'menu' | 'rename' | 'delete';

type WorkoutTemplateActionsModalProps = {
  template: WorkoutTemplate | null;
  onClose: () => void;
  onEdit: () => void;
  onRename: (name: string) => Promise<void>;
  onDuplicate: () => Promise<void>;
  onDelete: () => Promise<void>;
};

export function WorkoutTemplateActionsModal({
  template,
  onClose,
  onEdit,
  onRename,
  onDuplicate,
  onDelete,
}: WorkoutTemplateActionsModalProps) {
  const [view, setView] = useState<ActionView>('menu');
  const [name, setName] = useState('');
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    if (isWorking) {
      return;
    }

    setView('menu');
    setName('');
    setError(null);
    onClose();
  };

  const runAction = async (action: () => Promise<void>) => {
    setIsWorking(true);
    setError(null);

    try {
      await action();
      setView('menu');
      setName('');
      onClose();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'The action could not be completed.');
    } finally {
      setIsWorking(false);
    }
  };

  const showRename = () => {
    setName(template?.name ?? '');
    setError(null);
    setView('rename');
  };

  const returnToMenu = () => {
    setError(null);
    setView('menu');
  };

  const submitRename = () => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError('The template name cannot be empty.');
      return;
    }

    void runAction(() => onRename(trimmedName));
  };

  return (
    <Modal
      animationType="fade"
      onRequestClose={close}
      statusBarTranslucent
      transparent
      visible={template !== null}>
      <Pressable accessibilityRole="button" onPress={close} style={styles.backdrop}>
        <Pressable
          accessibilityViewIsModal
          onPress={(event) => event.stopPropagation()}
          style={styles.menu}>
          {template && view === 'menu' && (
            <>
              <View style={styles.heading}>
                <Text numberOfLines={1} style={styles.title}>
                  {template.name}
                </Text>
                <Text style={styles.subtitle}>TEMPLATE OPTIONS</Text>
              </View>
              <MenuAction busy={isWorking} label="Edit Template" onPress={onEdit} />
              <MenuAction busy={isWorking} label="Rename" onPress={showRename} />
              <MenuAction
                label="Duplicate"
                onPress={() => void runAction(onDuplicate)}
                working={isWorking}
              />
              <MenuAction disabled label="Share" />
              <MenuAction
                busy={isWorking}
                destructive
                label="Delete"
                onPress={() => setView('delete')}
              />
              {error && <Text style={styles.error}>{error}</Text>}
              <Pressable accessibilityRole="button" onPress={close} style={styles.cancelButton}>
                <Text style={styles.cancelLabel}>CANCEL</Text>
              </Pressable>
            </>
          )}

          {template && view === 'rename' && (
            <>
              <Text style={styles.dialogTitle}>Rename Template</Text>
              <TextInput
                accessibilityLabel="New template name"
                autoFocus
                maxLength={100}
                onChangeText={setName}
                onSubmitEditing={submitRename}
                returnKeyType="done"
                selectTextOnFocus
                style={styles.nameInput}
                value={name}
              />
              {error && <Text style={styles.error}>{error}</Text>}
              <View style={styles.dialogActions}>
                <Pressable
                  accessibilityRole="button"
                  disabled={isWorking}
                  onPress={returnToMenu}
                  style={[styles.dialogButton, styles.secondaryButton]}>
                  <Text style={styles.secondaryButtonLabel}>CANCEL</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  disabled={isWorking}
                  onPress={submitRename}
                  style={[styles.dialogButton, styles.primaryButton]}>
                  {isWorking ? (
                    <ActivityIndicator color={SetForgeColors.canvas} size="small" />
                  ) : (
                    <Text style={styles.primaryButtonLabel}>RENAME</Text>
                  )}
                </Pressable>
              </View>
            </>
          )}

          {template && view === 'delete' && (
            <>
              <Text style={styles.dialogTitle}>Delete Template?</Text>
              <Text style={styles.confirmationText}>
                “{template.name}” and all of its planned exercises and sets will be deleted.
              </Text>
              {error && <Text style={styles.error}>{error}</Text>}
              <View style={styles.dialogActions}>
                <Pressable
                  accessibilityRole="button"
                  disabled={isWorking}
                  onPress={returnToMenu}
                  style={[styles.dialogButton, styles.secondaryButton]}>
                  <Text style={styles.secondaryButtonLabel}>CANCEL</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  disabled={isWorking}
                  onPress={() => void runAction(onDelete)}
                  style={[styles.dialogButton, styles.deleteButton]}>
                  {isWorking ? (
                    <ActivityIndicator color={SetForgeColors.textPrimary} size="small" />
                  ) : (
                    <Text style={styles.deleteButtonLabel}>DELETE</Text>
                  )}
                </Pressable>
              </View>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

type MenuActionProps = {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  busy?: boolean;
  destructive?: boolean;
  working?: boolean;
};

function MenuAction({ label, onPress, disabled, busy, destructive, working }: MenuActionProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || busy || working }}
      disabled={disabled || busy || working}
      onPress={onPress}
      style={({ pressed }) => [styles.menuAction, pressed && styles.menuActionPressed]}>
      <Text
        style={[
          styles.menuActionLabel,
          destructive && styles.destructiveLabel,
          disabled && styles.disabledLabel,
        ]}>
        {label}
      </Text>
      {disabled && <Text style={styles.soonLabel}>SOON</Text>}
      {working ? (
        <ActivityIndicator color={SetForgeColors.accent} size="small" />
      ) : (
        !disabled && <Text style={styles.chevron}>›</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
  },
  menu: {
    width: '100%',
    maxWidth: 360,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: SetForgeColors.border,
    borderRadius: 12,
    backgroundColor: SetForgeColors.surface,
  },
  heading: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: SetForgeColors.border,
  },
  title: { color: SetForgeColors.textPrimary, fontSize: 17, fontWeight: '800' },
  subtitle: {
    marginTop: 4,
    color: SetForgeColors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  menuAction: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: SetForgeColors.border,
  },
  menuActionPressed: { backgroundColor: SetForgeColors.surfaceMuted },
  menuActionLabel: { flex: 1, color: SetForgeColors.textPrimary, fontSize: 14, fontWeight: '600' },
  destructiveLabel: { color: '#F87171' },
  disabledLabel: { color: SetForgeColors.textDisabled },
  soonLabel: {
    marginRight: 8,
    color: SetForgeColors.textDisabled,
    fontSize: 9,
    fontWeight: '800',
  },
  chevron: { color: SetForgeColors.textSecondary, fontSize: 23, fontWeight: '300' },
  cancelButton: { height: 50, alignItems: 'center', justifyContent: 'center' },
  cancelLabel: { color: SetForgeColors.textSecondary, fontSize: 12, fontWeight: '800' },
  dialogTitle: {
    paddingHorizontal: 18,
    paddingTop: 20,
    color: SetForgeColors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  nameInput: {
    height: 48,
    marginHorizontal: 18,
    marginTop: 16,
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: SetForgeColors.accent,
    borderRadius: 6,
    backgroundColor: SetForgeColors.surfaceMuted,
    color: SetForgeColors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  confirmationText: {
    paddingHorizontal: 18,
    paddingTop: 12,
    color: SetForgeColors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  error: {
    marginHorizontal: 18,
    marginTop: 12,
    color: '#FCA5A5',
    fontSize: 12,
    lineHeight: 17,
  },
  dialogActions: { flexDirection: 'row', gap: 10, padding: 18 },
  dialogButton: { flex: 1, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 5 },
  secondaryButton: { borderWidth: 1, borderColor: SetForgeColors.border },
  primaryButton: { backgroundColor: SetForgeColors.accent },
  deleteButton: { backgroundColor: '#DC2626' },
  secondaryButtonLabel: { color: SetForgeColors.textSecondary, fontSize: 12, fontWeight: '800' },
  primaryButtonLabel: { color: SetForgeColors.canvas, fontSize: 12, fontWeight: '800' },
  deleteButtonLabel: { color: SetForgeColors.textPrimary, fontSize: 12, fontWeight: '800' },
});
