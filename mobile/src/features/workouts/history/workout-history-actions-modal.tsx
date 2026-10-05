import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AnchoredMenuModal, type MenuAnchor } from '@/components/anchored-menu-modal';
import { SetForgeColors } from '@/constants/setforge-theme';
import type { WorkoutSession } from '@/models/workout-session';

export function WorkoutHistoryActionsModal({
  workout,
  anchor,
  onClose,
  onEdit,
  onDelete,
  onPerformAgain,
  onSaveAsTemplate,
}: {
  workout: WorkoutSession | null;
  anchor: MenuAnchor | null;
  onClose: () => void;
  onEdit: (workout: WorkoutSession) => void;
  onDelete: (workout: WorkoutSession) => void;
  onPerformAgain: (workout: WorkoutSession) => void;
  onSaveAsTemplate: (workout: WorkoutSession) => void;
}) {
  return (
    <AnchoredMenuModal
      anchor={anchor}
      estimatedHeight={194}
      onClose={onClose}
      visible={workout !== null}
      width={214}>
        <View accessibilityViewIsModal style={styles.popup}>
          {workout && (
            <>
              <Action icon="✎" label="EDIT WORKOUT" onPress={() => onEdit(workout)} />
              <Action icon="＋" label="SAVE AS TEMPLATE" onPress={() => onSaveAsTemplate(workout)} />
              <Action icon="↶" label="PERFORM AGAIN" onPress={() => onPerformAgain(workout)} />
              <View style={[styles.action, styles.disabledAction]}>
                <Text style={styles.actionIcon}>↥</Text>
                <Text style={styles.disabledLabel}>SHARE</Text>
                <Text style={styles.comingSoon}>SOON</Text>
              </View>
              <Action destructive icon="×" label="DELETE" onPress={() => onDelete(workout)} />
            </>
          )}
        </View>
    </AnchoredMenuModal>
  );
}

function Action({
  icon,
  label,
  onPress,
  destructive,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  destructive?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
      <Text style={[styles.actionIcon, destructive && styles.destructive]}>{icon}</Text>
      <Text style={[styles.actionLabel, destructive && styles.destructive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  popup: {
    width: '100%',
    padding: 5,
    borderWidth: 1,
    borderColor: SetForgeColors.border,
    borderRadius: 14,
    backgroundColor: '#20252A',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.36,
    shadowRadius: 18,
    elevation: 16,
  },
  action: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    borderRadius: 7,
  },
  pressed: { backgroundColor: 'rgba(255, 255, 255, 0.07)' },
  actionIcon: {
    width: 24,
    color: SetForgeColors.accent,
    fontSize: 16,
    lineHeight: 19,
    fontWeight: '500',
    textAlign: 'center',
  },
  actionLabel: {
    flex: 1,
    marginLeft: 6,
    color: SetForgeColors.textPrimary,
    fontSize: 11,
    fontWeight: '800',
  },
  destructive: { color: '#F87171' },
  disabledAction: { opacity: 0.62 },
  disabledLabel: {
    flex: 1,
    marginLeft: 6,
    color: SetForgeColors.textSecondary,
    fontSize: 11,
    fontWeight: '800',
  },
  comingSoon: {
    color: SetForgeColors.accent,
    fontSize: 8,
    fontWeight: '900',
  },
});
