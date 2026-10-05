import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { SetForgeColors } from '@/constants/setforge-theme';

const presets = [0, 30, 60, 90, 120, 180];

export function RestTimerControl({
  value,
  onChange,
  flushBottom = false,
}: {
  value: string | number | null | undefined;
  onChange: (seconds: string) => void;
  flushBottom?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const seconds = normalizeRestSeconds(value);

  const changeBy = (amount: number) => {
    onChange(Math.max(0, Math.min(3599, seconds + amount)).toString());
  };

  return (
    <>
      <View style={[styles.inlineTimer, flushBottom && styles.flushInlineTimer]}>
        <View style={styles.line} />
        <Pressable
          accessibilityLabel={`Rest timer ${formatRestTime(seconds)}`}
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => setIsOpen(true)}
          style={({ pressed }) => [
            styles.timeButton,
            flushBottom && styles.flushTimeButton,
            pressed && styles.pressed,
          ]}>
          <Text style={styles.timeText}>{formatRestTime(seconds)}</Text>
        </Pressable>
        <View style={styles.line} />
      </View>

      <Modal
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
        statusBarTranslucent
        transparent
        visible={isOpen}>
        <Pressable onPress={() => setIsOpen(false)} style={styles.backdrop}>
          <Pressable
            accessibilityViewIsModal
            onPress={(event) => event.stopPropagation()}
            style={styles.dialog}>
            <Text style={styles.title}>Rest Timer</Text>
            <Text style={styles.subtitle}>Minutes and seconds</Text>

            <View style={styles.adjustmentRow}>
              <AdjustmentButton label="−15" onPress={() => changeBy(-15)} />
              <Text style={styles.dialogTime}>{formatRestTime(seconds)}</Text>
              <AdjustmentButton label="+15" onPress={() => changeBy(15)} />
            </View>

            <View style={styles.presets}>
              {presets.map((preset) => (
                <Pressable
                  accessibilityRole="button"
                  key={preset}
                  onPress={() => onChange(preset.toString())}
                  style={[styles.preset, seconds === preset && styles.selectedPreset]}>
                  <Text style={[styles.presetLabel, seconds === preset && styles.selectedPresetLabel]}>
                    {formatRestTime(preset)}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={() => setIsOpen(false)}
              style={styles.doneButton}>
              <Text style={styles.doneLabel}>DONE</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

function AdjustmentButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.adjustmentButton}>
      <Text style={styles.adjustmentLabel}>{label}s</Text>
    </Pressable>
  );
}

export function normalizeRestSeconds(value: string | number | null | undefined) {
  const parsed = typeof value === 'number' ? value : Number(value ?? 0);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.min(3599, Math.round(parsed)));
}

export function formatRestTime(value: string | number | null | undefined) {
  const seconds = normalizeRestSeconds(value);
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  inlineTimer: {
    height: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 2,
  },
  flushInlineTimer: { height: 18, marginTop: 2, marginBottom: 0 },
  line: { flex: 1, height: 1, backgroundColor: 'rgba(0, 240, 255, 0.16)' },
  timeButton: { minWidth: 46, height: 24, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  flushTimeButton: { height: 18 },
  pressed: { opacity: 0.6 },
  timeText: { color: SetForgeColors.accent, fontFamily: 'monospace', fontSize: 13, fontWeight: '800' },
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: 'rgba(0, 0, 0, 0.72)' },
  dialog: { width: '100%', maxWidth: 320, padding: 18, borderWidth: 1, borderColor: SetForgeColors.border, borderRadius: 14, backgroundColor: SetForgeColors.surface },
  title: { color: SetForgeColors.textPrimary, fontSize: 18, fontWeight: '800', textAlign: 'center' },
  subtitle: { marginTop: 3, color: SetForgeColors.textSecondary, fontSize: 11, textAlign: 'center' },
  adjustmentRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 20 },
  adjustmentButton: { width: 66, height: 40, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: SetForgeColors.border, borderRadius: 7, backgroundColor: SetForgeColors.surfaceMuted },
  adjustmentLabel: { color: SetForgeColors.accent, fontSize: 12, fontWeight: '800' },
  dialogTime: { color: SetForgeColors.textPrimary, fontFamily: 'monospace', fontSize: 28, fontWeight: '800' },
  presets: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 18 },
  preset: { width: '31%', height: 36, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: SetForgeColors.border, borderRadius: 6, backgroundColor: SetForgeColors.surfaceMuted },
  selectedPreset: { borderColor: SetForgeColors.accent, backgroundColor: SetForgeColors.accentTint },
  presetLabel: { color: SetForgeColors.textSecondary, fontFamily: 'monospace', fontSize: 11, fontWeight: '700' },
  selectedPresetLabel: { color: SetForgeColors.accent },
  doneButton: { height: 44, alignItems: 'center', justifyContent: 'center', marginTop: 18, borderRadius: 7, backgroundColor: SetForgeColors.accent },
  doneLabel: { color: SetForgeColors.canvas, fontSize: 12, fontWeight: '900' },
});
