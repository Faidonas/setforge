import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { SetForgeColors } from '@/constants/setforge-theme';
import { ActionButton, CoachShell, Panel, StatusBadge, coachStyles } from '@/features/coach/coach-ui';
import { useCoachResource } from '@/features/coach/use-coach-resource';
import { getCoachDashboard } from '@/services/coach-api';

function formatDate(value: string | null) {
  return value ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : 'No completed workout';
}

export default function CoachDashboardScreen() {
  const router = useRouter();
  const { data, error, loading, reload } = useCoachResource(getCoachDashboard);

  return <CoachShell><View style={coachStyles.page}>
    <View style={styles.hero}><View><Text style={styles.title}>Coaching command center</Text><Text style={styles.subtitle}>{data ? `Welcome back, ${data.coachName}. Live coaching data from SetForge.` : 'Your live coaching workspace.'}</Text></View><ActionButton label="Create template" onPress={() => router.push('/coach/workout-builder' as Href)} /></View>
    {loading ? <Panel style={styles.state}><Text style={styles.muted}>Loading coach data…</Text></Panel> : null}
    {error ? <Panel style={styles.error}><Text style={styles.errorText}>{error}</Text><ActionButton label="Try again" secondary onPress={() => void reload()} /></Panel> : null}
    {data ? <>
      <View style={styles.metrics}>{[[data.activeClientCount, 'ACTIVE CLIENTS'], [data.templateCount, 'WORKOUT TEMPLATES'], [data.completedWorkoutsLast28Days, 'WORKOUTS · LAST 28D'], [data.clientsNeedingAttention, 'NEED ATTENTION']].map(([value, label]) => <Panel key={label} style={styles.metric}><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></Panel>)}</View>
      <View style={styles.sectionHeading}><Text style={coachStyles.sectionLabel}>Needs attention</Text><Text style={styles.counter}>{data.clientsNeedingAttention} CLIENTS</Text></View>
      {data.attentionClients.length ? <View style={styles.attentionGrid}>{data.attentionClients.slice(0, 3).map(client => <Panel key={client.id} style={styles.attentionCard}><View style={styles.cardTop}><View style={styles.dot}/><Text style={styles.clientName}>{client.displayName}</Text><StatusBadge tone="warning">Follow up</StatusBadge></View><Text style={styles.issue}>{client.lastWorkoutName ?? 'No completed workouts yet'}</Text><Text style={styles.muted}>{formatDate(client.lastWorkoutAt)}</Text><ActionButton label="Open client" secondary onPress={() => router.push(`/coach/clients/${client.id}` as Href)} /></Panel>)}</View> : <Panel style={styles.state}><Text style={styles.success}>All active clients have trained in the last 7 days.</Text></Panel>}
      <Panel style={styles.activity}><View style={styles.sectionHeading}><View><Text style={coachStyles.sectionTitle}>Recent client workouts</Text><Text style={styles.muted}>Latest completed sessions across your active roster</Text></View><Text onPress={() => router.push('/coach/clients' as Href)} style={styles.link}>VIEW CLIENTS →</Text></View>
        {data.recentWorkouts.length ? data.recentWorkouts.map(workout => <View key={workout.id} style={styles.row}><View style={styles.timeBox}><Text style={styles.time}>{workout.durationMinutes ?? 0}m</Text></View><View style={styles.rowCopy}><Text style={styles.clientName}>{workout.clientName}</Text><Text style={styles.muted}>{workout.name} · {formatDate(workout.completedAt)}</Text></View><Text style={styles.volume}>{Number(workout.totalVolume).toLocaleString()} KG</Text></View>) : <Text style={styles.empty}>No completed client workouts yet.</Text>}
      </Panel>
    </> : null}
  </View></CoachShell>;
}

const styles = StyleSheet.create({
  hero:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},title:{color:SetForgeColors.textPrimary,fontSize:32,lineHeight:40,fontWeight:'900',letterSpacing:-.8},subtitle:{marginTop:6,color:SetForgeColors.textSecondary,fontSize:12},metrics:{flexDirection:'row',gap:16},metric:{flex:1,padding:20},metricValue:{color:SetForgeColors.accent,fontFamily:'monospace',fontSize:28,fontWeight:'800'},metricLabel:{marginTop:7,color:SetForgeColors.textSecondary,fontFamily:'monospace',fontSize:9},sectionHeading:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},counter:{color:SetForgeColors.textSecondary,fontFamily:'monospace',fontSize:10},attentionGrid:{flexDirection:'row',gap:16},attentionCard:{flex:1,padding:18,gap:12},cardTop:{flexDirection:'row',alignItems:'center',gap:10},dot:{width:8,height:8,borderRadius:4,backgroundColor:'#FFBB33'},clientName:{flex:1,color:SetForgeColors.textPrimary,fontSize:13,fontWeight:'700'},issue:{color:SetForgeColors.textPrimary,fontSize:12},muted:{color:SetForgeColors.textSecondary,fontSize:10,lineHeight:16},activity:{padding:22},row:{minHeight:70,flexDirection:'row',alignItems:'center',gap:12,borderTopWidth:1,borderTopColor:SetForgeColors.border},timeBox:{width:52,height:38,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:SetForgeColors.border,borderRadius:5},time:{color:SetForgeColors.textPrimary,fontFamily:'monospace',fontSize:10},rowCopy:{flex:1},volume:{color:SetForgeColors.accent,fontFamily:'monospace',fontSize:10},link:{color:SetForgeColors.accent,fontFamily:'monospace',fontSize:10},state:{padding:24,alignItems:'center'},error:{padding:20,gap:16,alignItems:'flex-start',borderColor:'#FF4C61'},errorText:{color:'#FF8A98',fontSize:12},success:{color:'#32D583',fontSize:12},empty:{paddingVertical:24,color:SetForgeColors.textSecondary,fontSize:12},
});
