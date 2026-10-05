import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AnchoredMenuModal, type MenuAnchor } from '@/components/anchored-menu-modal';
import { SetForgeColors } from '@/constants/setforge-theme';
import type { WorkoutTemplate } from '@/models/workout-template';

type ActionView = 'menu' | 'rename' | 'duplicate' | 'delete';

type WorkoutTemplateActionsModalProps = {
  template: WorkoutTemplate | null;
  anchor: MenuAnchor | null;
  onClose: () => void;
  onEdit: () => void;
  onRename: (name: string) => Promise<void>;
  onDuplicate: () => Promise<void>;
  onDelete: () => Promise<void>;
};

export function WorkoutTemplateActionsModal({
  template,
  anchor,
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

  const submitRename = () => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError('The template name cannot be empty.');
      return;
    }

    void runAction(() => onRename(trimmedName));
  };

  return (
    <AnchoredMenuModal
      anchor={anchor}
      anchorContentInset={14}
      estimatedHeight={view === 'menu' ? 216 : view === 'rename' ? 150 : 142}
      horizontalAlign="start-if-fits"
      onClose={close}
      placement={view === 'menu' ? 'anchor' : 'center'}
      visible={template !== null}
      width={212}>
      <View accessibilityViewIsModal style={styles.menu}>
        {template && view === 'menu' && (
          <>
            <MenuAction busy={isWorking} label="Edit Template" onPress={onEdit} />
            <MenuAction busy={isWorking} label="Rename" onPress={showRename} />
            <MenuAction
              label="Duplicate"
              onPress={() => {
                setError(null);
                setView('duplicate');
              }}
            />
            <MenuAction disabled label="Share" />
            <MenuAction
              busy={isWorking}
              destructive
              label="Delete"
              onPress={() => setView('delete')}
            />
            {error && <Text style={styles.error}>{error}</Text>}
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

        {template && view === 'duplicate' && (
          <>
            <Text style={styles.dialogTitle}>Duplicate Template?</Text>
            <Text style={styles.confirmationText}>Create a new copy of “{template.name}”?</Text>
            {error && <Text style={styles.error}>{error}</Text>}
            <View style={styles.dialogActions}>
              <Pressable
                accessibilityRole="button"
                disabled={isWorking}
                onPress={() => void runAction(onDuplicate)}
                style={[styles.dialogButton, styles.primaryButton]}>
                {isWorking ? (
                  <ActivityIndicator color={SetForgeColors.canvas} size="small" />
                ) : (
                  <Text style={styles.primaryButtonLabel}>DUPLICATE</Text>
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
      </View>
    </AnchoredMenuModal>
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
  menu: {
    width: '100%',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: SetForgeColors.border,
    borderRadius: 12,
    backgroundColor: SetForgeColors.surface,
  },
  menuAction: {
    minHeight: 43,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: SetForgeColors.border,
  },
  menuActionPressed: { backgroundColor: SetForgeColors.surfaceMuted },
  menuActionLabel: { flex: 1, color: SetForgeColors.textPrimary, fontSize: 13, fontWeight: '700' },
  destructiveLabel: { color: '#F87171' },
  disabledLabel: { color: SetForgeColors.textDisabled },
  soonLabel: {
    marginRight: 8,
    color: SetForgeColors.textDisabled,
    fontSize: 9,
    fontWeight: '800',
  },
  chevron: { color: SetForgeColors.textSecondary, fontSize: 17, fontWeight: '300' },
  dialogTitle: {
    paddingHorizontal: 14,
    paddingTop: 14,
    color: SetForgeColors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
  },
  nameInput: {
    height: 40,
    marginHorizontal: 14,
    marginTop: 11,
    paddingHorizontal: 11,
    borderWidth: 1,
    borderColor: SetForgeColors.accent,
    borderRadius: 6,
    backgroundColor: SetForgeColors.surfaceMuted,
    color: SetForgeColors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  confirmationText: {
    paddingHorizontal: 14,
    paddingTop: 9,
    color: SetForgeColors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  error: {
    marginHorizontal: 14,
    marginTop: 9,
    color: '#FCA5A5',
    fontSize: 12,
    lineHeight: 17,
  },
  dialogActions: { flexDirection: 'row', gap: 8, padding: 14 },
  dialogButton: { flex: 1, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 5 },
  primaryButton: { backgroundColor: SetForgeColors.accent },
  deleteButton: { backgroundColor: '#DC2626' },
  primaryButtonLabel: { color: SetForgeColors.canvas, fontSize: 12, fontWeight: '800' },
  deleteButtonLabel: { color: SetForgeColors.textPrimary, fontSize: 12, fontWeight: '800' },
});
