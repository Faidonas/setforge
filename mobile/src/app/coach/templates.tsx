import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { SetForgeColors } from '@/constants/setforge-theme';
import { ActionButton, CoachShell, PageHeading, Panel, StatusBadge, coachStyles } from '@/features/coach/coach-ui';

const templates = [
  ['Strength Foundation', '8 weeks · 4 days / week', '12 clients', 'Build strength'],
  ['Hypertrophy Block', '6 weeks · 5 days / week', '7 clients', 'Build muscle'],
  ['Fit for Life', 'Ongoing · 3 days / week', '5 clients', 'General fitness'],
  ['Return to Training', '4 weeks · 3 days / week', '2 clients', 'Reconditioning'],
];

export default function CoachTemplatesScreen() {
  const router = useRouter();
  return <CoachShell><View style={coachStyles.page}>
    <PageHeading title="Workout templates" subtitle="Build reusable training systems and assign them to clients." actions={<ActionButton label="Create template" onPress={() => router.push('/coach/workout-builder' as Href)} />} />
    <View style={styles.summary}><Text style={styles.active}>12 ACTIVE TEMPLATES</Text><Text style={styles.muted}>4 DRAFTS</Text><Text style={styles.muted}>26 CLIENT ASSIGNMENTS</Text></View>
    <View style={styles.grid}>{templates.map((template,index)=><Panel key={template[0]} style={styles.card}><View style={styles.top}><StatusBadge tone={index===3?'muted':'accent'}>{index===3?'Draft':'Active'}</StatusBadge><Text style={styles.more}>•••</Text></View><Text style={styles.title}>{template[0]}</Text><Text style={styles.meta}>{template[1]}</Text><View style={styles.divider}/><Text style={styles.goal}>{template[3]}</Text><Text style={styles.clients}>{template[2]}</Text><ActionButton label="Open template" secondary onPress={() => router.push('/coach/workout-builder' as Href)} /></Panel>)}</View>
  </View></CoachShell>;
}

const styles=StyleSheet.create({summary:{flexDirection:'row',gap:32},active:{color:SetForgeColors.accent,fontFamily:'monospace',fontSize:11},muted:{color:SetForgeColors.textSecondary,fontFamily:'monospace',fontSize:11},grid:{flexDirection:'row',flexWrap:'wrap',gap:16},card:{width:'48.8%',padding:24,gap:12},top:{flexDirection:'row',justifyContent:'space-between'},more:{color:SetForgeColors.textSecondary},title:{color:SetForgeColors.textPrimary,fontSize:20,fontWeight:'800'},meta:{color:SetForgeColors.textSecondary,fontSize:12},divider:{height:1,backgroundColor:SetForgeColors.border},goal:{color:SetForgeColors.textPrimary,fontSize:12},clients:{color:SetForgeColors.textSecondary,fontFamily:'monospace',fontSize:10}});
