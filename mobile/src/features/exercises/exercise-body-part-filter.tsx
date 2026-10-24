import { Image } from 'expo-image';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AnchoredMenuModal, type MenuAnchor } from '@/components/anchored-menu-modal';
import {
  CoachColors,
  CoachDarkColors,
  SetForgeColors,
  type CoachThemeColors,
} from '@/constants/setforge-theme';
import {
  exerciseBodyParts,
  type ExerciseBodyPart,
} from '@/features/exercises/exercise-library-utils';

const chevronDownIcon = require('@/assets/images/coach-web-light/chevron-down.svg');

type ExerciseBodyPartFilterProps = {
  value: ExerciseBodyPart;
  onChange: (value: ExerciseBodyPart) => void;
  variant?: 'app' | 'coach';
  coachThemeColors?: CoachThemeColors;
};

export function ExerciseBodyPartFilter({
  value,
  onChange,
  variant = 'app',
  coachThemeColors = CoachDarkColors,
}: ExerciseBodyPartFilterProps) {
  const anchorRef = useRef<View>(null);
  const [anchor, setAnchor] = useState<MenuAnchor | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredBodyPart, setHoveredBodyPart] = useState<ExerciseBodyPart | null>(null);

  const open = () => {
    anchorRef.current?.measureInWindow((x, y, width, height) => {
      setAnchor({ x, y, width, height });
      setIsOpen(true);
    });
  };

  return (
    <>
      <Pressable
        ref={anchorRef}
        accessibilityLabel={`Body part filter, ${value}`}
        accessibilityRole="button"
        onPress={open}
        style={({ pressed }) => [
          styles.button,
          variant === 'coach' && styles.coachButton,
          variant === 'coach' && {
            borderColor: isOpen ? coachThemeColors.accentText : coachThemeColors.inputBorder,
            backgroundColor: coachThemeColors.surface,
          },
          pressed && styles.buttonPressed,
        ]}>
        <Text
          numberOfLines={1}
          style={[
            styles.buttonLabel,
            variant === 'coach' && styles.coachButtonLabel,
            variant === 'coach' && { color: coachThemeColors.textPrimary },
          ]}>
          {value}
        </Text>
        <Image
          contentFit="contain"
          source={chevronDownIcon}
          style={[styles.chevronIcon, isOpen && styles.chevronIconOpen]}
          tintColor={variant === 'coach' ? coachThemeColors.textSecondary : SetForgeColors.textSecondary}
        />
      </Pressable>

      <AnchoredMenuModal
        anchor={anchor}
        estimatedHeight={466}
        horizontalAlign="start-if-fits"
        onClose={() => setIsOpen(false)}
        visible={isOpen}
        width={224}>
        <View
          style={[
            styles.menu,
            variant === 'coach' && styles.coachMenu,
            variant === 'coach' && {
              borderColor: coachThemeColors.inputBorder,
              backgroundColor: coachThemeColors.surface,
            },
          ]}>
          {exerciseBodyParts.map((bodyPart, index) => {
            const selected = bodyPart === value;
            const hovered = bodyPart === hoveredBodyPart;
            return (
              <Pressable
                accessibilityRole="menuitem"
                key={bodyPart}
                onHoverIn={() => setHoveredBodyPart(bodyPart)}
                onHoverOut={() => setHoveredBodyPart(null)}
                onPress={() => {
                  onChange(bodyPart);
                  setIsOpen(false);
                }}
                style={({ pressed }) => [
                  styles.menuItem,
                  index > 0 && (variant === 'coach' ? styles.coachMenuItemBorder : styles.menuItemBorder),
                  variant === 'coach' && index > 0 && { borderTopColor: coachThemeColors.border },
                  selected && (variant === 'coach' ? styles.coachMenuItemSelected : styles.menuItemSelected),
                  variant === 'coach' && selected && { backgroundColor: coachThemeColors.accentTint },
                  variant === 'coach' && hovered && !selected && { backgroundColor: coachThemeColors.surfaceMuted },
                  pressed && (variant === 'coach' ? styles.coachMenuItemPressed : styles.menuItemPressed),
                  variant === 'coach' && pressed && { backgroundColor: coachThemeColors.accentTint },
                ]}>
                <Text style={[
                  styles.menuItemLabel,
                  variant === 'coach' && styles.coachMenuItemLabel,
                  variant === 'coach' && { color: coachThemeColors.textPrimary },
                  selected && (variant === 'coach' ? styles.coachMenuItemLabelSelected : styles.menuItemLabelSelected),
                  variant === 'coach' && selected && { color: coachThemeColors.accentText },
                ]}>
                  {bodyPart}
                </Text>
                {selected && (
                  <View style={[
                    styles.checkmarkBadge,
                    variant === 'coach' && { backgroundColor: coachThemeColors.accentTint },
                  ]}>
                    <Text style={[
                      styles.checkmark,
                      variant === 'coach' && styles.coachCheckmark,
                      variant === 'coach' && { color: coachThemeColors.accentText },
                    ]}>✓</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      </AnchoredMenuModal>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 42,
    minWidth: 158,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: SetForgeColors.border,
    borderRadius: 7,
    backgroundColor: SetForgeColors.surfaceMuted,
  },
  buttonPressed: { opacity: 0.72 },
  coachButton: { height: 46, minWidth: 174, borderColor: CoachColors.inputBorder, borderRadius: 9, backgroundColor: CoachColors.surface },
  buttonLabel: {
    flex: 1,
    color: SetForgeColors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  coachButtonLabel: { color: CoachColors.textPrimary },
  chevronIcon: { width: 16, height: 16, marginLeft: 10 },
  chevronIconOpen: { transform: [{ rotate: '180deg' }] },
  menu: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: SetForgeColors.border,
    borderRadius: 10,
    backgroundColor: SetForgeColors.surfaceMuted,
  },
  coachMenu: {
    borderColor: CoachColors.border,
    backgroundColor: CoachColors.surface,
    boxShadow: '0 18px 50px rgba(0, 0, 0, 0.42)',
  } as never,
  menuItem: {
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  menuItemBorder: { borderTopWidth: 1, borderTopColor: SetForgeColors.border },
  coachMenuItemBorder: { borderTopWidth: 1, borderTopColor: CoachColors.border },
  menuItemSelected: { backgroundColor: SetForgeColors.accentTint },
  coachMenuItemSelected: { backgroundColor: CoachColors.accentTint },
  menuItemPressed: { backgroundColor: SetForgeColors.surface },
  coachMenuItemPressed: { backgroundColor: CoachColors.surfaceMuted },
  menuItemLabel: { color: SetForgeColors.textPrimary, fontSize: 14, fontWeight: '600' },
  coachMenuItemLabel: { color: CoachColors.textPrimary },
  menuItemLabelSelected: { color: SetForgeColors.accent },
  coachMenuItemLabelSelected: { color: CoachColors.accentText },
  checkmarkBadge: { minWidth: 24, height: 24, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: SetForgeColors.accentTint },
  checkmark: { color: SetForgeColors.accent, fontSize: 15, fontWeight: '900' },
  coachCheckmark: { color: CoachColors.accentText },
});
