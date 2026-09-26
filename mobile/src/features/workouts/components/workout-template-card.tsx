import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { SetForgeColors } from '@/constants/setforge-theme';
import type { WorkoutTemplate } from '@/models/workout-template';

const clockIcon = require('@/assets/images/figma/clock.svg');
const moreIcon = require('@/assets/images/figma/more-horizontal.svg');

type WorkoutTemplateCardProps = {
  template: WorkoutTemplate;
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

export function WorkoutTemplateCard({ template }: WorkoutTemplateCardProps) {
  const exerciseSummary = template.exercises
    .slice(0, 3)
    .map((exercise) => exercise.exerciseName)
    .join(', ');

  return (
    <Pressable accessibilityRole="button" style={styles.card}>
      <View style={styles.headingRow}>
        <View style={styles.headingCopy}>
          <Text numberOfLines={1} style={styles.name}>
            {template.name}
          </Text>
          <Text style={styles.exerciseCount}>
            {template.exercises.length} {template.exercises.length === 1 ? 'exercise' : 'exercises'}
          </Text>
        </View>
        <Pressable accessibilityLabel={`More options for ${template.name}`} hitSlop={8}>
          <Image source={moreIcon} style={styles.moreIcon} contentFit="contain" />
        </Pressable>
      </View>

      <Text numberOfLines={1} style={styles.exerciseSummary}>
        {exerciseSummary || 'No exercises added yet'}
      </Text>

      <View style={styles.updatedRow}>
        <Image source={clockIcon} style={styles.clockIcon} contentFit="contain" />
        <Text style={styles.updatedText}>{formatUpdatedAt(template.updatedAt)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: SetForgeColors.border,
    borderRadius: 8,
    backgroundColor: SetForgeColors.surface,
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headingCopy: {
    flex: 1,
    gap: 2,
    paddingRight: 12,
  },
  name: {
    color: SetForgeColors.textPrimary,
    fontSize: 16,
    lineHeight: 19,
    fontWeight: '800',
  },
  exerciseCount: {
    color: SetForgeColors.textSecondary,
    fontFamily: 'monospace',
    fontSize: 11,
    lineHeight: 14,
  },
  moreIcon: {
    width: 18,
    height: 18,
    margin: 7,
  },
  exerciseSummary: {
    color: SetForgeColors.textSecondary,
    fontSize: 13,
    lineHeight: 16,
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
    color: SetForgeColors.textDisabled,
    fontFamily: 'monospace',
    fontSize: 11,
    lineHeight: 14,
  },
});
