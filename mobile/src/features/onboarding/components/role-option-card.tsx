import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { SetForgeColors, SetForgeSpacing } from '@/constants/setforge-theme';

type RoleOptionCardProps = {
  title: string;
  description: string;
  icon: ReactNode;
  selected?: boolean;
  onPress?: () => void;
};

export function RoleOptionCard({
  title,
  description,
  icon,
  selected = false,
  onPress,
}: RoleOptionCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.card, selected && styles.selectedCard]}>
      <View style={[styles.iconContainer, selected && styles.selectedIconContainer]}>{icon}</View>
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 97,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SetForgeSpacing.md,
    padding: 20,
    borderWidth: 1,
    borderColor: SetForgeColors.border,
    borderRadius: 8,
    backgroundColor: SetForgeColors.surface,
  },
  selectedCard: {
    borderWidth: 1.5,
    borderColor: SetForgeColors.accent,
  },
  iconContainer: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    backgroundColor: SetForgeColors.surfaceMuted,
  },
  selectedIconContainer: {
    backgroundColor: SetForgeColors.accentTint,
  },
  copy: {
    flex: 1,
    gap: SetForgeSpacing.xs,
  },
  title: {
    color: SetForgeColors.textPrimary,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '700',
  },
  description: {
    color: SetForgeColors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
  },
});
