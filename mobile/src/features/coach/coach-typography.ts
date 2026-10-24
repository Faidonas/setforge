import type { TextStyle } from 'react-native';

const tabularNumbers: TextStyle['fontVariant'] = ['tabular-nums'];

export const CoachTypography = {
  inter400: {
    fontFamily: 'Inter_400Regular',
    fontWeight: '400',
    fontVariant: tabularNumbers,
  } satisfies TextStyle,
  inter500: {
    fontFamily: 'Inter_500Medium',
    fontWeight: '500',
    fontVariant: tabularNumbers,
  } satisfies TextStyle,
  inter600: {
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    fontVariant: tabularNumbers,
  } satisfies TextStyle,
  sora600: {
    fontFamily: 'Sora_600SemiBold',
    fontWeight: '600',
    fontVariant: tabularNumbers,
  } satisfies TextStyle,
  sora700: {
    fontFamily: 'Sora_700Bold',
    fontWeight: '700',
    fontVariant: tabularNumbers,
  } satisfies TextStyle,
} as const;
