import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, type PropsWithChildren, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, View } from 'react-native';

import {
  CoachDarkColors,
  CoachLightColors,
  type CoachThemeColors,
} from '@/constants/setforge-theme';
import { useAuth } from '@/features/auth/auth-context';
import { getUserProfile, updateThemePreference } from '@/services/user-api';

export type CoachThemeMode = 'light' | 'dark';

const STORAGE_KEY_PREFIX = 'setforge.coach.theme';

type CoachThemeContextValue = {
  colors: CoachThemeColors;
  mode: CoachThemeMode;
  setMode: (mode: CoachThemeMode) => void;
};

const CoachThemeContext = createContext<CoachThemeContextValue | null>(null);

function webThemeVariables(colors: CoachThemeColors) {
  if (Platform.OS !== 'web') return undefined;
  return {
    '--coach-canvas': colors.canvas,
    '--coach-surface': colors.surface,
    '--coach-surface-muted': colors.surfaceMuted,
    '--coach-border': colors.border,
    '--coach-input-border': colors.inputBorder,
    '--coach-accent': colors.accent,
    '--coach-accent-text': colors.accentText,
    '--coach-accent-tint': colors.accentTint,
    '--coach-button-text': colors.buttonText,
    '--coach-text-primary': colors.textPrimary,
    '--coach-text-secondary': colors.textSecondary,
    '--coach-text-disabled': colors.textDisabled,
    '--coach-warning': colors.warning,
    '--coach-danger': colors.danger,
    '--app-input-bg': colors.surfaceMuted,
    '--app-input-border': colors.inputBorder,
    '--app-input-text': colors.textPrimary,
    '--app-selection-bg': colors.accentTint,
    colorScheme: colors === CoachDarkColors ? 'dark' : 'light',
  } as never;
}

export function CoachThemeProvider({ children }: PropsWithChildren) {
  const auth = useAuth();
  const [mode, setModeState] = useState<CoachThemeMode>('dark');
  const colors = mode === 'dark' ? CoachDarkColors : CoachLightColors;
  const userId = auth.user?.id;
  const preferenceVersion = useRef(0);
  const saveQueue = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    if (!userId) return;
    let active = true;
    const versionAtLoad = preferenceVersion.current;
    const storageKey = `${STORAGE_KEY_PREFIX}.${userId}`;
    void (async () => {
      const savedMode = await AsyncStorage.getItem(storageKey).catch(() => null);
      if (active && versionAtLoad === preferenceVersion.current
          && (savedMode === 'light' || savedMode === 'dark')) {
        setModeState(savedMode);
      }
      try {
        const profile = await getUserProfile();
        if (profile.themePreference !== 'DARK' && profile.themePreference !== 'LIGHT') return;
        const serverMode = profile.themePreference.toLowerCase() as CoachThemeMode;
        if (!active || versionAtLoad !== preferenceVersion.current) return;
        setModeState(serverMode);
        await AsyncStorage.setItem(storageKey, serverMode);
      } catch {
        // The per-user cache keeps the dashboard usable while the API is unavailable.
      }
    })();
    return () => {
      active = false;
    };
  }, [userId]);

  const value = useMemo<CoachThemeContextValue>(() => ({
    colors,
    mode,
    setMode(nextMode) {
      preferenceVersion.current += 1;
      setModeState(nextMode);
      if (!userId) return;
      void AsyncStorage.setItem(`${STORAGE_KEY_PREFIX}.${userId}`, nextMode).catch(() => undefined);
      saveQueue.current = saveQueue.current
        .catch(() => undefined)
        .then(() => updateThemePreference(nextMode.toUpperCase() as 'DARK' | 'LIGHT'))
        .then(() => undefined)
        .catch(() => undefined);
    },
  }), [colors, mode, userId]);

  return (
    <CoachThemeContext.Provider value={value}>
      <View style={[{ flex: 1 }, webThemeVariables(colors)]}>{children}</View>
    </CoachThemeContext.Provider>
  );
}

export function useCoachTheme() {
  const context = useContext(CoachThemeContext);
  if (!context) throw new Error('useCoachTheme must be used inside CoachThemeProvider.');
  return context;
}
