import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { KeyboardDismissButton } from '@/components/keyboard-dismiss-button';
import { SetForgeColors } from '@/constants/setforge-theme';
import { ActiveWorkoutProvider } from '@/features/workouts/active-workout/active-workout-context';
import { ActiveWorkoutSheet } from '@/features/workouts/active-workout/active-workout-sheet';
import { AuthProvider, useAuth } from '@/features/auth/auth-context';

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
      <AuthProvider><AuthenticatedApp /></AuthProvider>
    </ThemeProvider>
    </GestureHandlerRootView>
  );
}

function AuthenticatedApp() {
  const { session, loading } = useAuth();
  if (loading) return null;
  return (
      <ActiveWorkoutProvider key={session?.user.id ?? 'signed-out'}>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: SetForgeColors.canvas },
          }}>
          <Stack.Protected guard={!session}><Stack.Screen name="sign-in" /></Stack.Protected>
          <Stack.Protected guard={Boolean(session)}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(main)" />
            <Stack.Screen name="active-workout" />
            <Stack.Screen name="create-template" />
            <Stack.Screen name="edit-template" />
            <Stack.Screen name="edit-workout" />
            <Stack.Screen name="exercise" />
            <Stack.Screen name="explore" />
            <Stack.Screen name="coach" />
          </Stack.Protected>
        </Stack>
        {session ? <><ActiveWorkoutSheet /><KeyboardDismissButton /></> : null}
      </ActiveWorkoutProvider>
  );
}
