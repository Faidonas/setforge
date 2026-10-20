import { Image } from 'expo-image';
import { type Href, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SetForgeColors } from '@/constants/setforge-theme';

const homeIcon = require('@/assets/images/figma/home-nav-home.svg');
const historyIcon = require('@/assets/images/figma/home-nav-calendar.svg');
const startIcon = require('@/assets/images/figma/home-nav-plus.svg');
const exercisesIcon = require('@/assets/images/figma/home-nav-activity.svg');
const profileIcon = require('@/assets/images/figma/home-nav-user.svg');

type NavigationLabel = 'Home' | 'History' | 'Start' | 'Exercises' | 'Profile';

type NavigationItem = {
  label: NavigationLabel;
  icon: number;
  href?: Href;
  centerAction?: boolean;
};

const items: NavigationItem[] = [
  { label: 'Home', icon: homeIcon, href: '/home' },
  { label: 'History', icon: historyIcon, href: '/history' },
  { label: 'Start', icon: startIcon, href: '/start-workout', centerAction: true },
  { label: 'Exercises', icon: exercisesIcon, href: '/exercises' },
  { label: 'Profile', icon: profileIcon, href: '/profile' },
];

export function WorkoutBottomNav({ activeItem = 'Start' }: { activeItem?: NavigationLabel }) {
  const router = useRouter();

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <View style={styles.navigation}>
        {items.map((item) => {
          const isActive = item.label === activeItem;
          const href = item.href;

          return (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={item.label}
              accessibilityState={{ disabled: !href, selected: isActive }}
              disabled={!href}
              key={item.label}
              onPress={href ? () => router.navigate(href) : undefined}
              style={({ pressed }) => [styles.item, pressed && styles.pressedItem]}>
              <View style={[styles.iconContainer, item.centerAction && styles.centerAction]}>
                <Image
                  source={item.icon}
                  style={styles.icon}
                  contentFit="contain"
                  tintColor={item.centerAction || isActive ? SetForgeColors.accent : SetForgeColors.textSecondary}
                />
              </View>
              {!item.centerAction ? (
                <Text style={[styles.label, isActive && styles.activeLabel]}>{item.label}</Text>
              ) : null}
            </Pressable>
          );
        })}
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
    gap: 3,
  },
  pressedItem: {
    opacity: 0.65,
  },
  iconContainer: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerAction: {
    width: 56,
    height: 48,
    borderWidth: 1,
    borderColor: SetForgeColors.accent,
    borderRadius: 8,
    backgroundColor: SetForgeColors.accentTint,
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
  activeLabel: {
    color: SetForgeColors.accent,
    fontWeight: '700',
  },
});
