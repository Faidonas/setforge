import { Image } from 'expo-image';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AnchoredMenuModal, type MenuAnchor } from '@/components/anchored-menu-modal';
import { CoachColors, SetForgeColors } from '@/constants/setforge-theme';
import {
  exerciseBodyParts,
  type ExerciseBodyPart,
} from '@/features/exercises/exercise-library-utils';

const chevronDownIcon = require('@/assets/images/coach-web-light/chevron-down.svg');

type ExerciseBodyPartFilterProps = {
  value: ExerciseBodyPart;
  onChange: (value: ExerciseBodyPart) => void;
  variant?: 'app' | 'coach';
};

export function ExerciseBodyPartFilter({ value, onChange, variant = 'app' }: ExerciseBodyPartFilterProps) {
  const anchorRef = useRef<View>(null);
  const [anchor, setAnchor] = useState<MenuAnchor | null>(null);
  const [isOpen, setIsOpen] = useState(false);

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
        style={({ pressed }) => [styles.button, variant === 'coach' && styles.coachButton, pressed && styles.buttonPressed]}>
        <Text numberOfLines={1} style={[styles.buttonLabel, variant === 'coach' && styles.coachButtonLabel]}>{value}</Text>
        <Image
          contentFit="contain"
          source={chevronDownIcon}
          style={styles.chevronIcon}
          tintColor={variant === 'coach' ? CoachColors.textSecondary : SetForgeColors.textSecondary}
        />
      </Pressable>

      <AnchoredMenuModal
        anchor={anchor}
        estimatedHeight={466}
        horizontalAlign="start-if-fits"
        onClose={() => setIsOpen(false)}
        visible={isOpen}
        width={224}>
        <View style={[styles.menu, variant === 'coach' && styles.coachMenu]}>
          {exerciseBodyParts.map((bodyPart, index) => {
            const selected = bodyPart === value;
            return (
              <Pressable
                accessibilityRole="menuitem"
                key={bodyPart}
                onPress={() => {
                  onChange(bodyPart);
                  setIsOpen(false);
                }}
                style={({ pressed }) => [
                  styles.menuItem,
                  index > 0 && (variant === 'coach' ? styles.coachMenuItemBorder : styles.menuItemBorder),
                  selected && (variant === 'coach' ? styles.coachMenuItemSelected : styles.menuItemSelected),
                  pressed && (variant === 'coach' ? styles.coachMenuItemPressed : styles.menuItemPressed),
                ]}>
                <Text style={[styles.menuItemLabel, variant === 'coach' && styles.coachMenuItemLabel, selected && (variant === 'coach' ? styles.coachMenuItemLabelSelected : styles.menuItemLabelSelected)]}>
                  {bodyPart}
                </Text>
                {selected && <Text style={[styles.checkmark, variant === 'coach' && styles.coachCheckmark]}>✓</Text>}
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
  menu: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: SetForgeColors.border,
    borderRadius: 10,
    backgroundColor: SetForgeColors.surfaceMuted,
  },
  coachMenu: { borderColor: CoachColors.border, backgroundColor: CoachColors.surface },
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
  checkmark: { color: SetForgeColors.accent, fontSize: 15, fontWeight: '900' },
  coachCheckmark: { color: CoachColors.accentText },
});
