import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { SetForgeColors } from '@/constants/setforge-theme';
import { ActionButton, CoachShell, PageHeading, Panel, StatusBadge, coachStyles } from '@/features/coach/coach-ui';
import { useCoachResource } from '@/features/coach/use-coach-resource';
import { getExercises } from '@/services/exercise-api';
import { createWorkoutTemplate } from '@/services/workout-template-api';

export default function WorkoutBuilderScreen() {
  const router = useRouter();
  const { data: exercises, error: exerciseError, loading } = useCoachResource(getExercises);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const selected = useMemo(() => (exercises ?? []).filter(exercise => selectedIds.includes(exercise.id)), [exercises, selectedIds]);

  function toggleExercise(exerciseId: number) {
    setSelectedIds(current => current.includes(exerciseId) ? current.filter(id => id !== exerciseId) : [...current, exerciseId]);
  }

  async function saveTemplate() {
    if (!name.trim()) { setSaveError('Enter a template name.'); return; }
    if (!selected.length) { setSaveError('Select at least one exercise.'); return; }
    setSaving(true);
    setSaveError(null);
    try {
      await createWorkoutTemplate({
        name: name.trim(),
        description: description.trim() || undefined,
        exercises: selected.map(exercise => ({
          exerciseId: exercise.id,
          sets: Array.from({ length: 3 }, () => exercise.exerciseType === 'TIMED'
            ? { setType: 'NORMAL' as const, targetTimeSeconds: 60, restSeconds: 60 }
            : { setType: 'NORMAL' as const, targetReps: 8, restSeconds: 90 }),
        })),
      });
      router.replace('/coach/templates' as Href);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Could not save this template.');
    } finally {
      setSaving(false);
    }
  }

  return <CoachShell><View style={coachStyles.page}>
    <PageHeading title="Workout builder" subtitle="Create a reusable template in your SetForge account." actions={<><ActionButton label="Cancel" secondary onPress={() => router.back()}/><ActionButton label={saving ? 'Saving…' : 'Save template'} onPress={() => void saveTemplate()}/></>} />
    {saveError || exerciseError ? <Panel style={styles.error}><Text style={styles.errorText}>{saveError ?? exerciseError}</Text></Panel> : null}
    <View style={styles.columns}><Panel style={styles.form}><Text style={styles.label}>TEMPLATE NAME</Text><TextInput onChangeText={setName} placeholder="e.g. Upper Body A" placeholderTextColor={SetForgeColors.textDisabled} style={styles.input} value={name}/><Text style={styles.label}>DESCRIPTION</Text><TextInput multiline onChangeText={setDescription} placeholder="Training focus and coaching context…" placeholderTextColor={SetForgeColors.textDisabled} style={styles.textarea} value={description}/><View style={styles.line}/><View style={styles.header}><Text style={coachStyles.sectionTitle}>Selected exercises</Text><StatusBadge>{selected.length}</StatusBadge></View>{selected.length ? selected.map((exercise, index) => <View key={exercise.id} style={styles.selectedRow}><View><Text style={styles.order}>EXERCISE {index + 1}</Text><Text style={styles.exerciseName}>{exercise.name}</Text><Text style={styles.muted}>3 sets · {exercise.exerciseType === 'TIMED' ? '60 seconds' : '8 reps'}</Text></View><Text onPress={() => toggleExercise(exercise.id)} style={styles.remove}>REMOVE</Text></View>) : <Text style={styles.empty}>Choose exercises from the library.</Text>}</Panel>
      <Panel style={styles.library}><Text style={coachStyles.sectionTitle}>Exercise library</Text><Text style={styles.muted}>{loading ? 'Loading exercises…' : 'Click an exercise to add or remove it.'}</Text>{exercises?.map(exercise => { const active = selectedIds.includes(exercise.id); return <Pressable key={exercise.id} onPress={() => toggleExercise(exercise.id)} style={({pressed}) => [styles.libraryRow, active && styles.libraryRowActive, pressed && styles.pressed]}><View><Text style={styles.exerciseName}>{exercise.name}</Text><Text style={styles.muted}>{exercise.primaryMuscle} · {exercise.equipment}</Text></View><Text style={styles.add}>{active ? '✓' : '+'}</Text></Pressable>; })}</Panel>
    </View>
  </View></CoachShell>;
}

const styles=StyleSheet.create({columns:{flexDirection:'row',gap:24,alignItems:'flex-start'},form:{flex:1,padding:24,gap:12},library:{width:370,padding:20,gap:12},label:{color:SetForgeColors.textSecondary,fontFamily:'monospace',fontSize:9},input:{height:48,paddingHorizontal:14,color:SetForgeColors.textPrimary,fontSize:13,borderWidth:1,borderColor:SetForgeColors.border,borderRadius:7,backgroundColor:SetForgeColors.canvas,outlineStyle:'none'} as never,textarea:{minHeight:96,padding:14,color:SetForgeColors.textPrimary,fontSize:13,textAlignVertical:'top',borderWidth:1,borderColor:SetForgeColors.border,borderRadius:7,backgroundColor:SetForgeColors.canvas,outlineStyle:'none'} as never,line:{height:1,marginVertical:8,backgroundColor:SetForgeColors.border},header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},selectedRow:{minHeight:76,paddingVertical:12,flexDirection:'row',alignItems:'center',justifyContent:'space-between',borderTopWidth:1,borderTopColor:SetForgeColors.border},order:{color:SetForgeColors.accent,fontFamily:'monospace',fontSize:9},exerciseName:{color:SetForgeColors.textPrimary,fontSize:13,fontWeight:'800'},muted:{marginTop:4,color:SetForgeColors.textSecondary,fontSize:10,lineHeight:15},remove:{color:'#FF8A98',fontFamily:'monospace',fontSize:9},empty:{paddingVertical:24,color:SetForgeColors.textSecondary,fontSize:12},libraryRow:{minHeight:58,padding:12,flexDirection:'row',alignItems:'center',justifyContent:'space-between',borderWidth:1,borderColor:SetForgeColors.border,borderRadius:7},libraryRowActive:{borderColor:SetForgeColors.accent,backgroundColor:SetForgeColors.accentTint},pressed:{opacity:.72},add:{color:SetForgeColors.accent,fontSize:20},error:{padding:18,borderColor:'#FF4C61'},errorText:{color:'#FF8A98',fontSize:12}});
