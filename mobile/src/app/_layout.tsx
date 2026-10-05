import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { KeyboardDismissButton } from '@/components/keyboard-dismiss-button';
import { SetForgeColors } from '@/constants/setforge-theme';
import { ActiveWorkoutProvider } from '@/features/workouts/active-workout/active-workout-context';
import { ActiveWorkoutSheet } from '@/features/workouts/active-workout/active-workout-sheet';

const setForgeNavigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: SetForgeColors.canvas,
    card: SetForgeColors.canvas,
    border: SetForgeColors.border,
    primary: SetForgeColors.accent,
    text: SetForgeColors.textPrimary,
  },
};

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <ThemeProvider value={setForgeNavigationTheme}>
      <ActiveWorkoutProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: SetForgeColors.canvas },
          }}
        />
        <ActiveWorkoutSheet />
        <KeyboardDismissButton />
      </ActiveWorkoutProvider>
    </ThemeProvider>
    </GestureHandlerRootView>
  );
}
