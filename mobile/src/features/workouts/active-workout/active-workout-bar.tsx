import { useCallback, useEffect, useMemo, useState } from 'react';
import { PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';

import { SetForgeColors } from '@/constants/setforge-theme';
import { useActiveWorkout } from '@/features/workouts/active-workout/active-workout-context';

export function ActiveWorkoutBar() {
  const { session, expand } = useActiveWorkout();
  const [now, setNow] = useState(0);

  useEffect(() => {
    if (!session) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [session]);

  const openWorkout = useCallback(() => {
    if (session) expand();
  }, [expand, session]);

  const panResponder = useMemo(
    () => PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        gesture.dy < -5 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy < -10 || gesture.vy < -0.25) openWorkout();
      },
    }),
    [openWorkout],
  );

  if (!session || session.status !== 'IN_PROGRESS') return null;

  const elapsedSeconds = Math.max(
    0,
    Math.floor(((now || new Date(session.startedAt).getTime()) - new Date(session.startedAt).getTime()) / 1000),
  );

  return (
    <View {...panResponder.panHandlers} style={styles.container}>
      <Pressable
        accessibilityHint="Opens the workout currently in progress"
        accessibilityLabel={`Resume ${session.name}`}
        accessibilityRole="button"
        onPress={openWorkout}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
        <View style={styles.handle} />
        <Text numberOfLines={1} style={styles.name}>{session.name}</Text>
        <Text style={styles.timer}>{formatDuration(elapsedSeconds)}</Text>
      </Pressable>
    </View>
  );
}

function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderTopColor: SetForgeColors.border,
    backgroundColor: '#101012',
  },
  button: {
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  pressed: { backgroundColor: SetForgeColors.surfaceMuted },
  handle: {
    width: 42,
    height: 4,
    marginBottom: 5,
    borderRadius: 2,
    backgroundColor: SetForgeColors.textDisabled,
  },
  name: {
    maxWidth: '80%',
    color: SetForgeColors.textPrimary,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '800',
  },
  timer: {
    marginTop: 1,
    color: SetForgeColors.textSecondary,
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: '700',
  },
});
