import { Image } from 'expo-image';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { NonCredentialTextInput } from '@/components/non-credential-text-input';
import { CoachColors } from '@/constants/setforge-theme';
import { ExerciseBodyPartFilter } from '@/features/exercises/exercise-body-part-filter';
import { filterExercises, type ExerciseBodyPart } from '@/features/exercises/exercise-library-utils';
import { PageHeading, Panel, coachStyles, useCoachLayout } from '@/features/coach/coach-ui';
import type { Exercise } from '@/models/exercise';
import { getExerciseAssetUrl, getExercises } from '@/services/exercise-api';
import { useCoachResource } from '@/features/coach/use-coach-resource';

const searchIcon = require('@/assets/images/coach-web-light/search.svg');

export default function CoachExercisesScreen() {
  const { isCompact } = useCoachLayout();
  const [query, setQuery] = useState('');
  const [bodyPart, setBodyPart] = useState<ExerciseBodyPart>('Any Body Part');
  const { data, error, loading } = useCoachResource(getExercises);
  const exercises = useMemo(
    () => filterExercises(data ?? [], query, bodyPart),
    [bodyPart, data, query],
  );

  return <View style={[coachStyles.page, isCompact && coachStyles.pageCompact]}>
    <PageHeading title="Exercise library" subtitle="The live exercise catalogue used by workout templates." />
    <View style={[styles.controls, isCompact && styles.controlsCompact]}>
      <View style={[styles.search, isCompact && styles.searchCompact]}>
        <Image contentFit="contain" source={searchIcon} style={styles.searchIcon} tintColor={CoachColors.textSecondary} />
        <NonCredentialTextInput
          accessibilityLabel="Search exercises"
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={setQuery}
          placeholder="Search exercise, muscle, or equipment"
          placeholderTextColor={CoachColors.textSecondary}
          returnKeyType="search"
          style={styles.searchInput}
          value={query}
        />
      </View>
      <ExerciseBodyPartFilter onChange={setBodyPart} value={bodyPart} variant="coach" />
      <Text style={styles.resultCount}>{exercises.length} {exercises.length === 1 ? 'EXERCISE' : 'EXERCISES'}</Text>
    </View>

    <Panel style={styles.table}>
      <ScrollView horizontal contentContainerStyle={styles.tableWidth} showsHorizontalScrollIndicator={false}>
        <View style={styles.tableBody}>
          <View style={styles.header}>
            <Text style={[styles.head, styles.name]}>EXERCISE</Text>
            <Text style={[styles.head, styles.col]}>PRIMARY MUSCLE</Text>
            <Text style={[styles.head, styles.col]}>EQUIPMENT</Text>
            <Text style={[styles.head, styles.col]}>TRACKING</Text>
          </View>
          {loading ? <Text style={styles.state}>Loading exercises…</Text> : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {!loading && !error && !exercises.length ? <Text style={styles.state}>No exercises match your search and filter.</Text> : null}
          {exercises.map((exercise) => <ExerciseRow exercise={exercise} key={exercise.id} />)}
        </View>
      </ScrollView>
    </Panel>
  </View>;
}

function ExerciseRow({ exercise }: { exercise: Exercise }) {
  const thumbnailUrl = getExerciseAssetUrl(exercise.thumbnailUrl);
  return <View style={styles.row}>
    <View style={[styles.name, styles.exercise]}>
      <View style={styles.thumb}>
        {thumbnailUrl ? <Image accessibilityLabel={`${exercise.name} preview`} contentFit="contain" source={{ uri: thumbnailUrl }} style={styles.thumbnail} transition={150} /> : <Text style={styles.thumbFallback}>{exercise.name.charAt(0).toUpperCase()}</Text>}
      </View>
      <Text numberOfLines={2} style={styles.exerciseName}>{exercise.name}</Text>
    </View>
    <Text numberOfLines={1} style={[styles.cell, styles.col]}>{exercise.primaryMuscle}</Text>
    <Text numberOfLines={1} style={[styles.cell, styles.col]}>{exercise.equipment}</Text>
    <Text numberOfLines={1} style={[styles.cell, styles.col]}>{exercise.exerciseType === 'TIMED' ? 'Timed' : 'Weight & reps'}</Text>
  </View>;
}

const styles = StyleSheet.create({
  controls: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  controlsCompact: { flexWrap: 'wrap' },
  search: { width: 460, height: 46, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: CoachColors.inputBorder, borderRadius: 9, backgroundColor: CoachColors.surface },
  searchCompact: { width: '100%' },
  searchIcon: { width: 18, height: 18 },
  searchInput: { flex: 1, height: '100%', color: CoachColors.textPrimary, fontSize: 13, outlineStyle: 'none' } as never,
  resultCount: { marginLeft: 'auto', color: CoachColors.textSecondary, fontFamily: 'monospace', fontSize: 9, fontWeight: '700' },
  table: { overflow: 'hidden' },
  tableWidth: { minWidth: 1100, flexGrow: 1 },
  tableBody: { minWidth: 1100, flexGrow: 1 },
  header: { width: '100%', height: 48, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: CoachColors.surfaceMuted },
  head: { color: CoachColors.textSecondary, fontFamily: 'monospace', fontSize: 9, fontWeight: '700' },
  name: { width: 320 },
  col: { minWidth: 165, flex: 1 },
  row: { width: '100%', minHeight: 76, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', gap: 16, borderTopWidth: 1, borderTopColor: CoachColors.border },
  exercise: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  thumb: { width: 48, height: 48, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', borderRadius: 7, backgroundColor: CoachColors.surfaceMuted, borderWidth: 1, borderColor: CoachColors.border },
  thumbnail: { width: '100%', height: '100%' },
  thumbFallback: { color: CoachColors.accentText, fontSize: 17, fontWeight: '900' },
  exerciseName: { flex: 1, color: CoachColors.textPrimary, fontSize: 13, lineHeight: 18, fontWeight: '700', textTransform: 'capitalize' },
  cell: { color: CoachColors.textSecondary, fontSize: 11, textTransform: 'capitalize' },
  state: { padding: 24, color: CoachColors.textSecondary, fontSize: 12 },
  error: { padding: 24, color: CoachColors.danger, fontSize: 12 },
});
