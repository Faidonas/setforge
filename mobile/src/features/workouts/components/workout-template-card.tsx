import { Image } from 'expo-image';
import { useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { MenuAnchor } from '@/components/anchored-menu-modal';
import { SetForgeColors } from '@/constants/setforge-theme';
import type { WorkoutTemplate } from '@/models/workout-template';

const clockIcon = require('@/assets/images/figma/clock.svg');
const moreIcon = require('@/assets/images/figma/more-horizontal.svg');

type WorkoutTemplateCardProps = {
  template: WorkoutTemplate;
  onPress: () => void;
  onMorePress: (anchor: MenuAnchor) => void;
};

function formatUpdatedAt(updatedAt: string) {
  const date = new Date(updatedAt);

  if (Number.isNaN(date.getTime())) {
    return 'Recently updated';
  }

  return `Updated ${new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)}`;
}

export function WorkoutTemplateCard({ template, onPress, onMorePress }: WorkoutTemplateCardProps) {
  const moreButtonRef = useRef<View>(null);
  const measuredAnchorRef = useRef<MenuAnchor | null>(null);
  const visibleExercises = template.exercises.slice(0, 5);

  const measureMoreButton = (onMeasured?: (anchor: MenuAnchor) => void) => {
    moreButtonRef.current?.measureInWindow((x, y, width, height) => {
      const measuredAnchor = { x, y, width, height };
      measuredAnchorRef.current = measuredAnchor;
      onMeasured?.(measuredAnchor);
    });
  };

  return (
    <View style={styles.card}>
      <Pressable
        accessibilityLabel={`Preview ${template.name}`}
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [styles.cardBody, pressed && styles.cardPressed]}>
        <View style={styles.headingRow}>
          <View style={styles.headingCopy}>
            <Text numberOfLines={1} style={styles.name}>
              {template.name}
            </Text>
            <Text style={styles.exerciseCount}>
              {template.exercises.length} {template.exercises.length === 1 ? 'exercise' : 'exercises'}
            </Text>
          </View>
        </View>

        <View style={styles.exerciseList}>
          {visibleExercises.length > 0 ? (
            visibleExercises.map((exercise) => (
              <Text key={exercise.id} numberOfLines={1} style={styles.exerciseName}>
                {exercise.exerciseName}
              </Text>
            ))
          ) : (
            <Text numberOfLines={1} style={styles.exerciseName}>No exercises added yet</Text>
          )}
        </View>

        <View style={styles.updatedRow}>
          <Image source={clockIcon} style={styles.clockIcon} contentFit="contain" />
          <Text numberOfLines={1} style={styles.updatedText}>{formatUpdatedAt(template.updatedAt)}</Text>
        </View>
      </Pressable>
      <View collapsable={false} ref={moreButtonRef} style={styles.moreButtonAnchor}>
        <Pressable
          accessibilityLabel={`More options for ${template.name}`}
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => {
            const measuredAnchor = measuredAnchorRef.current;
            measuredAnchorRef.current = null;

            if (measuredAnchor) {
              onMorePress(measuredAnchor);
              return;
            }

            measureMoreButton(onMorePress);
          }}
          onPressIn={() => {
            measuredAnchorRef.current = null;
            measureMoreButton();
          }}
          style={styles.moreButton}>
          <Image source={moreIcon} style={styles.moreIcon} contentFit="contain" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 184,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: SetForgeColors.border,
    borderRadius: 8,
    backgroundColor: SetForgeColors.surface,
  },
  cardBody: {
    flex: 1,
    gap: 8,
    padding: 12,
  },
  cardPressed: {
    opacity: 0.76,
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headingCopy: {
    flex: 1,
    gap: 2,
    paddingRight: 30,
  },
  name: {
    color: SetForgeColors.textPrimary,
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '800',
  },
  exerciseCount: {
    color: SetForgeColors.textSecondary,
    fontFamily: 'monospace',
    fontSize: 9,
    lineHeight: 12,
  },
  moreIcon: {
    width: 16,
    height: 16,
  },
  moreButtonAnchor: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
  },
  moreButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseList: {
    flex: 1,
    gap: 3,
    overflow: 'hidden',
  },
  exerciseName: {
    color: SetForgeColors.textSecondary,
    fontSize: 11,
    lineHeight: 14,
    textTransform: 'capitalize',
  },
  updatedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  clockIcon: {
    width: 12,
    height: 12,
  },
  updatedText: {
    flex: 1,
    minWidth: 0,
    color: SetForgeColors.textDisabled,
    fontFamily: 'monospace',
    fontSize: 9,
    lineHeight: 12,
  },
});
