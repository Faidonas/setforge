import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { SetForgeColors } from '@/constants/setforge-theme';

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
    <ThemeProvider value={setForgeNavigationTheme}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: SetForgeColors.canvas },
        }}
      />
    </ThemeProvider>
  );
}
