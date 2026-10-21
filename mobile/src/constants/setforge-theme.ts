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
  canvas: '#F4F5F7',
  surface: '#FFFFFF',
  surfaceMuted: '#F1F3F5',
  border: '#E1E5E8',
  inputBorder: '#C4CBD1',
  accent: '#00F0FF',
  accentText: '#00727C',
  accentTint: '#E4F9FB',
  buttonText: '#09090B',
  textPrimary: '#151719',
  textSecondary: '#5E666D',
  textDisabled: '#92999F',
  warning: '#92400E',
  danger: '#B91C1C',
} as const;

export type CoachThemeColors = { [Key in keyof typeof CoachLightColors]: string };

export const CoachDarkColors: CoachThemeColors = {
  canvas: '#080A0C',
  surface: '#111417',
  surfaceMuted: '#191D21',
  border: '#272D33',
  inputBorder: '#3A424A',
  accent: '#00F0FF',
  accentText: '#00F0FF',
  accentTint: 'rgba(0, 240, 255, 0.08)',
  buttonText: '#09090B',
  textPrimary: '#FFFFFF',
  textSecondary: '#9CA4AC',
  textDisabled: '#5C646C',
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
  canvas: coachColor('--coach-canvas', '#F4F5F7'),
  surface: coachColor('--coach-surface', '#FFFFFF'),
  surfaceMuted: coachColor('--coach-surface-muted', '#F1F3F5'),
  border: coachColor('--coach-border', '#E1E5E8'),
  inputBorder: coachColor('--coach-input-border', '#C4CBD1'),
  accent: coachColor('--coach-accent', '#00F0FF'),
  accentText: coachColor('--coach-accent-text', '#00727C'),
  accentTint: coachColor('--coach-accent-tint', '#E4F9FB'),
  buttonText: coachColor('--coach-button-text', '#09090B'),
  textPrimary: coachColor('--coach-text-primary', '#151719'),
  textSecondary: coachColor('--coach-text-secondary', '#5E666D'),
  textDisabled: coachColor('--coach-text-disabled', '#92999F'),
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
