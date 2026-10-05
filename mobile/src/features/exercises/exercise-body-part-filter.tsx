import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AnchoredMenuModal, type MenuAnchor } from '@/components/anchored-menu-modal';
import { SetForgeColors } from '@/constants/setforge-theme';
import {
  exerciseBodyParts,
  type ExerciseBodyPart,
} from '@/features/exercises/exercise-library-utils';

type ExerciseBodyPartFilterProps = {
  value: ExerciseBodyPart;
  onChange: (value: ExerciseBodyPart) => void;
};

export function ExerciseBodyPartFilter({ value, onChange }: ExerciseBodyPartFilterProps) {
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
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}>
        <Text numberOfLines={1} style={styles.buttonLabel}>{value}</Text>
        <Text style={styles.chevron}>⌄</Text>
      </Pressable>

      <AnchoredMenuModal
        anchor={anchor}
        estimatedHeight={466}
        horizontalAlign="start-if-fits"
        onClose={() => setIsOpen(false)}
        visible={isOpen}
        width={224}>
        <View style={styles.menu}>
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
                  index > 0 && styles.menuItemBorder,
                  selected && styles.menuItemSelected,
                  pressed && styles.menuItemPressed,
                ]}>
                <Text style={[styles.menuItemLabel, selected && styles.menuItemLabelSelected]}>
                  {bodyPart}
                </Text>
                {selected && <Text style={styles.checkmark}>✓</Text>}
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
  buttonLabel: {
    flex: 1,
    color: SetForgeColors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  chevron: {
    marginLeft: 10,
    color: SetForgeColors.textSecondary,
    fontSize: 18,
    lineHeight: 18,
  },
  menu: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: SetForgeColors.border,
    borderRadius: 10,
    backgroundColor: SetForgeColors.surfaceMuted,
  },
  menuItem: {
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  menuItemBorder: { borderTopWidth: 1, borderTopColor: SetForgeColors.border },
  menuItemSelected: { backgroundColor: SetForgeColors.accentTint },
  menuItemPressed: { backgroundColor: SetForgeColors.surface },
  menuItemLabel: { color: SetForgeColors.textPrimary, fontSize: 14, fontWeight: '600' },
  menuItemLabelSelected: { color: SetForgeColors.accent },
  checkmark: { color: SetForgeColors.accent, fontSize: 15, fontWeight: '900' },
});
