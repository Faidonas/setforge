import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { NonCredentialTextInput } from '@/components/non-credential-text-input';

import { CoachColors } from '@/constants/setforge-theme';
import { PageHeading, Panel, StatusBadge, coachStyles, useCoachLayout } from '@/features/coach/coach-ui';
import { useCoachResource } from '@/features/coach/use-coach-resource';
import { getExercises } from '@/services/exercise-api';

export default function CoachExercisesScreen() {
  const { isCompact } = useCoachLayout();
  const [query, setQuery] = useState('');
  const { data, error, loading } = useCoachResource(getExercises);
  const exercises = useMemo(() => (data ?? []).filter(exercise => `${exercise.name} ${exercise.primaryMuscle} ${exercise.equipment}`.toLowerCase().includes(query.trim().toLowerCase())), [data, query]);
  return <View style={[coachStyles.page, isCompact && coachStyles.pageCompact]}>
    <PageHeading title="Exercise library" subtitle="The live exercise catalogue used by workout templates." />
    <NonCredentialTextInput accessibilityLabel="Search exercises" onChangeText={setQuery} placeholder="Search exercises, muscles, or equipment…" placeholderTextColor={CoachColors.textSecondary} style={[styles.search, isCompact && styles.searchCompact]} value={query}/>
    <Panel style={styles.table}><ScrollView horizontal contentContainerStyle={styles.tableWidth} showsHorizontalScrollIndicator={false}><View><View style={styles.header}><Text style={[styles.head,styles.name]}>EXERCISE</Text><Text style={[styles.head,styles.col]}>PRIMARY MUSCLE</Text><Text style={[styles.head,styles.col]}>EQUIPMENT</Text><Text style={[styles.head,styles.col]}>TRACKING</Text><Text style={styles.head}>STATUS</Text></View>
      {loading ? <Text style={styles.state}>Loading exercises…</Text> : null}{error ? <Text style={styles.error}>{error}</Text> : null}{!loading && !error && !exercises.length ? <Text style={styles.state}>No exercises match your search.</Text> : null}
      {exercises.map(exercise => <View key={exercise.id} style={styles.row}><View style={[styles.name,styles.exercise]}><View style={styles.thumb}/><Text style={styles.exerciseName}>{exercise.name}</Text></View><Text style={[styles.cell,styles.col]}>{exercise.primaryMuscle}</Text><Text style={[styles.cell,styles.col]}>{exercise.equipment}</Text><Text style={[styles.cell,styles.col]}>{exercise.exerciseType === 'TIMED' ? 'Timed' : 'Weight & reps'}</Text><StatusBadge>Visible</StatusBadge></View>)}
    </View></ScrollView></Panel>
  </View>;
}

const styles=StyleSheet.create({search:{width:440,height:48,paddingHorizontal:16,color:CoachColors.textPrimary,borderWidth:1,borderColor:CoachColors.inputBorder,borderRadius:8,backgroundColor:CoachColors.surface,outlineStyle:'none'} as never,searchCompact:{width:'100%'},table:{overflow:'hidden'},tableWidth:{minWidth:1100},header:{height:48,paddingHorizontal:16,flexDirection:'row',alignItems:'center',gap:16,backgroundColor:CoachColors.surfaceMuted},head:{color:CoachColors.textSecondary,fontFamily:'monospace',fontSize:10},name:{width:310},col:{width:190},row:{minHeight:72,paddingHorizontal:16,flexDirection:'row',alignItems:'center',gap:16,borderTopWidth:1,borderTopColor:CoachColors.border},exercise:{flexDirection:'row',alignItems:'center',gap:12},thumb:{width:42,height:42,borderRadius:6,backgroundColor:CoachColors.surfaceMuted,borderWidth:1,borderColor:CoachColors.border},exerciseName:{color:CoachColors.textPrimary,fontSize:13,fontWeight:'700'},cell:{color:CoachColors.textSecondary,fontSize:12},state:{padding:24,color:CoachColors.textSecondary,fontSize:12},error:{padding:24,color:CoachColors.danger,fontSize:12}});
