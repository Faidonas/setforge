import { Platform } from 'react-native';

export const SetForgeColors = {
  canvas: '#09090B',
  surface: '#121214',
  surfaceMuted: '#18181B',
  border: '#27272A',
  accent: '#00F0FF',
  accentTint: 'rgba(0, 240, 255, 0.08)',
  textPrimary: '#FFFFFF',
  textSecondary: '#A1A1AA',
  textDisabled: '#52525B',
} as const;

export const CoachLightColors = {
  canvas: '#F7F7F8',
  surface: '#FFFFFF',
  surfaceMuted: '#F0F0F2',
  border: '#E4E4E7',
  inputBorder: '#8A8A93',
  accent: '#00F0FF',
  accentText: '#006B75',
  accentTint: '#E0FAFC',
  buttonText: '#09090B',
  textPrimary: '#18181B',
  textSecondary: '#52525B',
  textDisabled: '#8A8A93',
  warning: '#92400E',
  danger: '#B91C1C',
} as const;

export type CoachThemeColors = { [Key in keyof typeof CoachLightColors]: string };

export const CoachDarkColors: CoachThemeColors = {
  canvas: '#09090B',
  surface: '#121214',
  surfaceMuted: '#18181B',
  border: '#27272A',
  inputBorder: '#52525B',
  accent: '#00F0FF',
  accentText: '#00F0FF',
  accentTint: 'rgba(0, 240, 255, 0.08)',
  buttonText: '#09090B',
  textPrimary: '#FFFFFF',
  textSecondary: '#A1A1AA',
  textDisabled: '#52525B',
  warning: '#FFBB33',
  danger: '#FF4C61',
};

function coachColor(variable: string, fallback: string) {
  return Platform.OS === 'web' ? `var(${variable}, ${fallback})` : fallback;
}

/**
 * Coach web styles use CSS variables so every existing dashboard screen can
 * change theme without remounting or duplicating its StyleSheet definitions.
 * Native receives the light fallbacks and keeps the coach web theme isolated.
 */
export const CoachColors = {
  canvas: coachColor('--coach-canvas', '#F7F7F8'),
  surface: coachColor('--coach-surface', '#FFFFFF'),
  surfaceMuted: coachColor('--coach-surface-muted', '#F0F0F2'),
  border: coachColor('--coach-border', '#E4E4E7'),
  inputBorder: coachColor('--coach-input-border', '#8A8A93'),
  accent: coachColor('--coach-accent', '#00F0FF'),
  accentText: coachColor('--coach-accent-text', '#006B75'),
  accentTint: coachColor('--coach-accent-tint', '#E0FAFC'),
  buttonText: coachColor('--coach-button-text', '#09090B'),
  textPrimary: coachColor('--coach-text-primary', '#18181B'),
  textSecondary: coachColor('--coach-text-secondary', '#52525B'),
  textDisabled: coachColor('--coach-text-disabled', '#8A8A93'),
  warning: coachColor('--coach-warning', '#92400E'),
  danger: coachColor('--coach-danger', '#B91C1C'),
} as const;


export const SetForgeSpacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;
