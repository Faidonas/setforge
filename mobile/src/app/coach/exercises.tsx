import { Image } from 'expo-image';
import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { SetForgeColors } from '@/constants/setforge-theme';
import { ActionButton, CoachShell, PageHeading, Panel, StatusBadge, coachStyles } from '@/features/coach/coach-ui';

const searchIcon=require('@/assets/images/coach-web/search.svg');
const exercises=[['Bench Press','Chest','Barbell','Compound'],['Back Squat','Quadriceps','Barbell','Compound'],['Romanian Deadlift','Hamstrings','Barbell','Compound'],['Lat Pulldown','Back','Cable','Compound'],['Lateral Raise','Shoulders','Dumbbell','Isolation'],['Cable Row','Back','Cable','Compound']];

export default function CoachExercisesScreen(){
  const router=useRouter();
  return <CoachShell><View style={coachStyles.page}>
    <PageHeading title="Exercise library" subtitle="Manage the movements used across your coaching programs." actions={<ActionButton label="Add exercise" onPress={()=>router.push('/coach/exercise-editor' as Href)}/>}/>
    <View style={styles.filters}><View style={styles.search}><Image source={searchIcon} style={styles.icon}/><TextInput accessibilityLabel="Search exercises" placeholder="Search exercises…" placeholderTextColor={SetForgeColors.textSecondary} style={styles.input}/></View>{['All muscles ⌄','All equipment ⌄','All types ⌄'].map(x=><View key={x} style={styles.chip}><Text style={styles.chipText}>{x}</Text></View>)}</View>
    <Panel style={styles.table}><View style={styles.header}><Text style={[styles.head,styles.name]}>EXERCISE</Text><Text style={[styles.head,styles.col]}>PRIMARY MUSCLE</Text><Text style={[styles.head,styles.col]}>EQUIPMENT</Text><Text style={[styles.head,styles.col]}>TYPE</Text><Text style={styles.head}>STATUS</Text></View>{exercises.map(x=><View key={x[0]} style={styles.row}><View style={[styles.name,styles.exercise]}><View style={styles.thumb}/><Text onPress={()=>router.push('/coach/exercise-editor' as Href)} style={styles.exerciseName}>{x[0]}</Text></View><Text style={[styles.cell,styles.col]}>{x[1]}</Text><Text style={[styles.cell,styles.col]}>{x[2]}</Text><Text style={[styles.cell,styles.col]}>{x[3]}</Text><StatusBadge>Active</StatusBadge></View>)}</Panel>
  </View></CoachShell>;
}

const styles=StyleSheet.create({filters:{flexDirection:'row',alignItems:'center',gap:16},search:{width:360,height:48,paddingHorizontal:16,flexDirection:'row',alignItems:'center',gap:12,borderWidth:1,borderColor:SetForgeColors.border,borderRadius:8,backgroundColor:SetForgeColors.surface},icon:{width:18,height:18},input:{flex:1,color:SetForgeColors.textPrimary,outlineStyle:'none'} as never,chip:{paddingHorizontal:16,paddingVertical:8,borderWidth:1,borderColor:SetForgeColors.border,borderRadius:999,backgroundColor:SetForgeColors.surface},chipText:{color:SetForgeColors.textSecondary,fontSize:12},table:{overflow:'hidden'},header:{height:48,paddingHorizontal:16,flexDirection:'row',alignItems:'center',gap:16},head:{color:SetForgeColors.textSecondary,fontFamily:'monospace',fontSize:10},name:{width:310},col:{width:190},row:{height:72,paddingHorizontal:16,flexDirection:'row',alignItems:'center',gap:16,borderTopWidth:1,borderTopColor:SetForgeColors.border},exercise:{flexDirection:'row',alignItems:'center',gap:12},thumb:{width:42,height:42,borderRadius:6,backgroundColor:SetForgeColors.surfaceMuted,borderWidth:1,borderColor:SetForgeColors.border},exerciseName:{color:SetForgeColors.textPrimary,fontSize:13,fontWeight:'700'},cell:{color:SetForgeColors.textSecondary,fontSize:12}});
