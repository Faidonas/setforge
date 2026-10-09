import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { SetForgeColors } from '@/constants/setforge-theme';
import { ActionButton, CoachShell, PageHeading, Panel, StatusBadge, coachStyles } from '@/features/coach/coach-ui';
import { useCoachResource } from '@/features/coach/use-coach-resource';
import { getWorkoutTemplates } from '@/services/workout-template-api';

export default function CoachTemplatesScreen() {
  const router = useRouter();
  const { data, error, loading } = useCoachResource(getWorkoutTemplates);
  return <CoachShell><View style={coachStyles.page}>
    <PageHeading title="Workout templates" subtitle="Reusable workouts saved to your SetForge account." actions={<ActionButton label="Create template" onPress={() => router.push('/coach/workout-builder' as Href)}/>} />
    <Text style={styles.summary}>{data?.length ?? 0} SAVED TEMPLATES</Text>
    {loading ? <Panel style={styles.state}><Text style={styles.muted}>Loading templates…</Text></Panel> : null}{error ? <Panel style={styles.error}><Text style={styles.errorText}>{error}</Text></Panel> : null}
    {!loading && !error && !data?.length ? <Panel style={styles.state}><Text style={styles.muted}>No templates yet. Create your first reusable workout.</Text></Panel> : null}
    <View style={styles.grid}>{data?.map(template => <Panel key={template.id} style={styles.card}><View style={styles.top}><StatusBadge>Saved</StatusBadge><Text style={styles.position}>#{template.position ?? 0}</Text></View><Text style={styles.title}>{template.name}</Text><Text style={styles.description}>{template.description || 'No description'}</Text><View style={styles.line}/><Text style={styles.meta}>{template.exercises.length} EXERCISES</Text><Text style={styles.meta}>UPDATED {new Intl.DateTimeFormat(undefined,{dateStyle:'medium'}).format(new Date(template.updatedAt))}</Text></Panel>)}</View>
  </View></CoachShell>;
}

const styles=StyleSheet.create({summary:{color:SetForgeColors.accent,fontFamily:'monospace',fontSize:11},grid:{flexDirection:'row',flexWrap:'wrap',gap:16},card:{width:'48.8%',padding:24,gap:12},top:{flexDirection:'row',justifyContent:'space-between'},position:{color:SetForgeColors.textSecondary,fontFamily:'monospace',fontSize:10},title:{color:SetForgeColors.textPrimary,fontSize:20,fontWeight:'800'},description:{minHeight:36,color:SetForgeColors.textSecondary,fontSize:12,lineHeight:18},line:{height:1,backgroundColor:SetForgeColors.border},meta:{color:SetForgeColors.textSecondary,fontFamily:'monospace',fontSize:9},state:{padding:24,alignItems:'center'},muted:{color:SetForgeColors.textSecondary,fontSize:12},error:{padding:24,borderColor:'#FF4C61'},errorText:{color:'#FF8A98',fontSize:12}});
