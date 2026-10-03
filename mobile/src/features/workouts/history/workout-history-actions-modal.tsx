import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { SetForgeColors } from '@/constants/setforge-theme';
import type { WorkoutSession } from '@/models/workout-session';

export function WorkoutHistoryActionsModal({
  workout,
  onClose,
  onEdit,
  onDelete,
  onPerformAgain,
}: {
  workout: WorkoutSession | null;
  onClose: () => void;
  onEdit: (workout: WorkoutSession) => void;
  onDelete: (workout: WorkoutSession) => void;
  onPerformAgain: (workout: WorkoutSession) => void;
}) {
  return (
    <Modal animationType="fade" onRequestClose={onClose} statusBarTranslucent transparent visible={workout !== null}>
      <Pressable onPress={onClose} style={styles.backdrop}>
        <Pressable onPress={(event) => event.stopPropagation()} style={styles.sheet}>
          {workout && (
            <>
              <Text numberOfLines={2} style={styles.title}>{workout.name}</Text>
              <Action label="EDIT WORKOUT" onPress={() => onEdit(workout)} />
              <Action label="PERFORM AGAIN" onPress={() => onPerformAgain(workout)} />
              <View style={[styles.action, styles.disabledAction]}>
                <Text style={styles.disabledLabel}>SHARE</Text>
                <Text style={styles.comingSoon}>COMING SOON</Text>
              </View>
              <Action destructive label="DELETE WORKOUT" onPress={() => onDelete(workout)} />
              <Pressable onPress={onClose} style={styles.cancel}><Text style={styles.cancelLabel}>CANCEL</Text></Pressable>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Action({ label, onPress, destructive }: { label: string; onPress: () => void; destructive?: boolean }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
      <Text style={[styles.actionLabel, destructive && styles.destructive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0, 0, 0, 0.72)' },
  sheet: { width: '100%', maxWidth: 520, alignSelf: 'center', paddingHorizontal: 18, paddingTop: 18, paddingBottom: 26, borderTopLeftRadius: 17, borderTopRightRadius: 17, backgroundColor: SetForgeColors.surface },
  title: { marginBottom: 12, color: SetForgeColors.textPrimary, fontSize: 17, fontWeight: '800', textAlign: 'center' },
  action: { height: 49, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginTop: 8, borderRadius: 7, backgroundColor: SetForgeColors.surfaceMuted },
  pressed: { opacity: 0.65 },
  actionLabel: { color: SetForgeColors.textPrimary, fontSize: 12, fontWeight: '800' },
  destructive: { color: '#F87171' },
  disabledAction: { opacity: 0.55 },
  disabledLabel: { color: SetForgeColors.textSecondary, fontSize: 12, fontWeight: '800' },
  comingSoon: { color: SetForgeColors.accent, fontSize: 9, fontWeight: '900' },
  cancel: { alignItems: 'center', paddingTop: 18, paddingBottom: 2 },
  cancelLabel: { color: SetForgeColors.textSecondary, fontSize: 12, fontWeight: '800' },
});
