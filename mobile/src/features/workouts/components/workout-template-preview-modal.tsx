import { Image } from 'expo-image';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { SetForgeColors } from '@/constants/setforge-theme';
import type { WorkoutTemplate, WorkoutTemplateExercise } from '@/models/workout-template';
import { getExerciseAssetUrl } from '@/services/exercise-api';

type WorkoutTemplatePreviewModalProps = {
  template: WorkoutTemplate | null;
  onClose: () => void;
  onEdit: (template: WorkoutTemplate) => void;
  onStart: (template: WorkoutTemplate) => void;
  isStarting?: boolean;
};

export function WorkoutTemplatePreviewModal({
  template,
  onClose,
  onEdit,
  onStart,
  isStarting = false,
}: WorkoutTemplatePreviewModalProps) {
  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible={template !== null}>
      <View style={styles.backdrop}>
        <Pressable
          accessibilityLabel="Close template preview"
          accessibilityRole="button"
          onPress={onClose}
          style={styles.backdropDismissArea}
        />
        <View accessibilityViewIsModal style={styles.sheet}>
          {template && (
            <>
              <View style={styles.header}>
                <Pressable
                  accessibilityLabel="Close template preview"
                  accessibilityRole="button"
                  hitSlop={10}
                  onPress={onClose}
                  style={styles.headerSide}>
                  <Text style={styles.closeButton}>×</Text>
                </Pressable>
                <Text numberOfLines={2} style={styles.title}>
                  {template.name}
                </Text>
                <Pressable
                  accessibilityLabel={`Edit ${template.name}`}
                  accessibilityRole="button"
                  hitSlop={10}
                  onPress={() => onEdit(template)}
                  style={[styles.headerSide, styles.editHeaderButton]}>
                  <Text style={styles.editHeaderLabel}>EDIT</Text>
                </Pressable>
              </View>

              <View style={styles.templateMeta}>
                <Text style={styles.exerciseCount}>
                  {template.exercises.length}{' '}
                  {template.exercises.length === 1 ? 'exercise' : 'exercises'}
                </Text>
                {template.description && (
                  <Text numberOfLines={2} style={styles.description}>
                    {template.description}
                  </Text>
                )}
              </View>

              <ScrollView
                contentContainerStyle={styles.exerciseList}
                nestedScrollEnabled
                persistentScrollbar
                showsVerticalScrollIndicator
                style={styles.exerciseScroll}>
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
                  accessibilityState={{ disabled: isStarting }}
                  disabled={isStarting}
                  onPress={() => onStart(template)}
                  style={[styles.actionButton, styles.startButton]}>
                  <Text style={styles.startButtonLabel}>
                    {isStarting ? 'STARTING...' : 'START WORKOUT'}
                  </Text>
                </Pressable>
              </View>
            </>
          )}
        </View>
      </View>
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
          {setCount} × {exercise.exerciseName}
        </Text>
        <Text style={styles.setCount}>{exercise.primaryMuscle}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 56,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
  },
  backdropDismissArea: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  sheet: {
    width: '100%',
    maxWidth: 390,
    maxHeight: '72%',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: SetForgeColors.border,
    borderRadius: 14,
    backgroundColor: SetForgeColors.surface,
  },
  header: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: SetForgeColors.border,
  },
  headerSide: {
    width: 50,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  editHeaderButton: { alignItems: 'flex-end' },
  title: {
    flex: 1,
    color: SetForgeColors.textPrimary,
    fontSize: 17,
    lineHeight: 21,
    fontWeight: '800',
    textAlign: 'center',
  },
  editHeaderLabel: { color: SetForgeColors.accent, fontSize: 11, fontWeight: '800' },
  templateMeta: {
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 6,
  },
  exerciseCount: {
    color: SetForgeColors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
  },
  closeButton: {
    color: SetForgeColors.textSecondary,
    fontSize: 27,
    lineHeight: 28,
    fontWeight: '300',
  },
  description: {
    marginTop: 3,
    color: SetForgeColors.textSecondary,
    fontSize: 11,
    lineHeight: 15,
  },
  exerciseScroll: { flexGrow: 0, flexShrink: 1 },
  exerciseList: {
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  exerciseRow: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: SetForgeColors.border,
  },
  thumbnailContainer: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: 5,
    backgroundColor: '#ECECEC',
  },
  thumbnail: { width: '100%', height: '100%' },
  thumbnailFallback: {
    color: SetForgeColors.canvas,
    fontSize: 17,
    fontWeight: '800',
  },
  exerciseCopy: { flex: 1, gap: 3, paddingLeft: 11 },
  exerciseName: {
    color: SetForgeColors.textPrimary,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  setCount: {
    color: SetForgeColors.textSecondary,
    fontSize: 11,
    lineHeight: 14,
    textTransform: 'capitalize',
  },
  emptyMessage: {
    paddingVertical: 30,
    color: SetForgeColors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
  },
  actions: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: SetForgeColors.border,
  },
  actionButton: {
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 5,
  },
  startButton: { width: '100%', backgroundColor: SetForgeColors.accent },
  startButtonLabel: { color: SetForgeColors.canvas, fontSize: 12, fontWeight: '800' },
});
