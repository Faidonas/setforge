import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SetForgeColors } from '@/constants/setforge-theme';

const homeIcon = require('@/assets/images/figma/home.svg');
const historyIcon = require('@/assets/images/figma/calendar.svg');
const startIcon = require('@/assets/images/figma/plus-dark.svg');
const exercisesIcon = require('@/assets/images/figma/activity.svg');
const profileIcon = require('@/assets/images/figma/profile.svg');

const items = [
  { label: 'Home', icon: homeIcon },
  { label: 'History', icon: historyIcon },
  { label: 'Start', icon: startIcon, active: true },
  { label: 'Exercises', icon: exercisesIcon },
  { label: 'Profile', icon: profileIcon },
];

export function WorkoutBottomNav() {
  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <View style={styles.navigation}>
        {items.map((item) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={item.label}
            key={item.label}
            style={[styles.item, item.active && styles.activeItem]}>
            <Image source={item.icon} style={styles.icon} contentFit="contain" />
            {!item.active && <Text style={styles.label}>{item.label}</Text>}
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    borderTopWidth: 1,
    borderTopColor: SetForgeColors.border,
    backgroundColor: SetForgeColors.surface,
  },
  navigation: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  item: {
    width: 56,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  activeItem: {
    borderWidth: 1,
    borderColor: SetForgeColors.accent,
    borderRadius: 8,
    backgroundColor: SetForgeColors.accent,
  },
  icon: {
    width: 20,
    height: 20,
  },
  label: {
    color: SetForgeColors.textSecondary,
    fontSize: 10,
    lineHeight: 13,
  },
});
