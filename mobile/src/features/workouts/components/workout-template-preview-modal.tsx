import { Image } from 'expo-image';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { SetForgeColors } from '@/constants/setforge-theme';
import type { WorkoutTemplate, WorkoutTemplateExercise } from '@/models/workout-template';
import { getExerciseAssetUrl } from '@/services/exercise-api';

type WorkoutTemplatePreviewModalProps = {
  template: WorkoutTemplate | null;
  onClose: () => void;
  onEdit: (template: WorkoutTemplate) => void;
};

export function WorkoutTemplatePreviewModal({
  template,
  onClose,
  onEdit,
}: WorkoutTemplatePreviewModalProps) {
  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible={template !== null}>
      <Pressable accessibilityRole="button" onPress={onClose} style={styles.backdrop}>
        <Pressable
          accessibilityViewIsModal
          onPress={(event) => event.stopPropagation()}
          style={styles.sheet}>
          {template && (
            <>
              <View style={styles.header}>
                <View style={styles.headingCopy}>
                  <Text numberOfLines={2} style={styles.title}>
                    {template.name}
                  </Text>
                  <Text style={styles.exerciseCount}>
                    {template.exercises.length}{' '}
                    {template.exercises.length === 1 ? 'exercise' : 'exercises'}
                  </Text>
                </View>
                <Pressable
                  accessibilityLabel="Close template preview"
                  accessibilityRole="button"
                  hitSlop={10}
                  onPress={onClose}>
                  <Text style={styles.closeButton}>×</Text>
                </Pressable>
              </View>

              {template.description && (
                <Text numberOfLines={3} style={styles.description}>
                  {template.description}
                </Text>
              )}

              <ScrollView
                contentContainerStyle={styles.exerciseList}
                style={styles.exerciseScroll}
                showsVerticalScrollIndicator={false}>
                {template.exercises.length === 0 ? (
                  <Text style={styles.emptyMessage}>This template has no exercises yet.</Text>
                ) : (
                  template.exercises.map((exercise) => (
                    <PreviewExerciseRow exercise={exercise} key={exercise.id} />
                  ))
                )}
              </ScrollView>

              <View style={styles.actions}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => onEdit(template)}
                  style={[styles.actionButton, styles.editButton]}>
                  <Text style={styles.editButtonLabel}>EDIT</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ disabled: true }}
                  disabled
                  style={[styles.actionButton, styles.startButton]}>
                  <Text style={styles.startButtonLabel}>START WORKOUT</Text>
                </Pressable>
              </View>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function PreviewExerciseRow({ exercise }: { exercise: WorkoutTemplateExercise }) {
  const thumbnailUrl = getExerciseAssetUrl(exercise.thumbnailUrl ?? null);
  const setCount = exercise.sets.length;

  return (
    <View style={styles.exerciseRow}>
      <View style={styles.thumbnailContainer}>
        {thumbnailUrl ? (
          <Image
            accessibilityLabel={`${exercise.exerciseName} preview`}
            contentFit="contain"
            source={{ uri: thumbnailUrl }}
            style={styles.thumbnail}
          />
        ) : (
          <Text style={styles.thumbnailFallback}>
            {exercise.exerciseName.charAt(0).toUpperCase()}
          </Text>
        )}
      </View>
      <View style={styles.exerciseCopy}>
        <Text numberOfLines={2} style={styles.exerciseName}>
          {exercise.exerciseName}
        </Text>
        <Text style={styles.setCount}>
          {setCount} {setCount === 1 ? 'set' : 'sets'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 44,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
  },
  sheet: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '78%',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: SetForgeColors.border,
    borderRadius: 14,
    backgroundColor: SetForgeColors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 12,
  },
  headingCopy: { flex: 1, paddingRight: 12 },
  title: {
    color: SetForgeColors.textPrimary,
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '800',
  },
  exerciseCount: {
    marginTop: 3,
    color: SetForgeColors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
  },
  closeButton: {
    marginTop: -5,
    color: SetForgeColors.textSecondary,
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '300',
  },
  description: {
    paddingHorizontal: 18,
    paddingBottom: 12,
    color: SetForgeColors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  exerciseScroll: { flexShrink: 1 },
  exerciseList: {
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  exerciseRow: {
    minHeight: 66,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 7,
    borderRadius: 7,
    backgroundColor: SetForgeColors.surfaceMuted,
  },
  thumbnailContainer: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: 5,
    backgroundColor: '#ECECEC',
  },
  thumbnail: { width: '100%', height: '100%' },
  thumbnailFallback: {
    color: SetForgeColors.canvas,
    fontSize: 20,
    fontWeight: '800',
  },
  exerciseCopy: { flex: 1, gap: 4, paddingHorizontal: 11 },
  exerciseName: {
    color: SetForgeColors.textPrimary,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  setCount: {
    color: SetForgeColors.accent,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
  emptyMessage: {
    paddingVertical: 30,
    color: SetForgeColors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    padding: 18,
  },
  actionButton: {
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 5,
  },
  editButton: {
    width: 90,
    borderWidth: 1,
    borderColor: SetForgeColors.accent,
  },
  startButton: { flex: 1, backgroundColor: SetForgeColors.accent },
  editButtonLabel: { color: SetForgeColors.accent, fontSize: 12, fontWeight: '800' },
  startButtonLabel: { color: SetForgeColors.canvas, fontSize: 12, fontWeight: '800' },
});
