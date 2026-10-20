import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { CoachColors } from '@/constants/setforge-theme';
import { ActionButton, Panel, StatusBadge, coachStyles, useCoachLayout } from '@/features/coach/coach-ui';
import { useCoachResource } from '@/features/coach/use-coach-resource';
import { getCoachDashboard } from '@/services/coach-api';

function formatDate(value: string | null) {
  return value ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : 'No completed workout';
}

export default function CoachDashboardScreen() {
  const router = useRouter();
  const { isCompact } = useCoachLayout();
  const { data, error, loading, reload } = useCoachResource(getCoachDashboard);

  return <View style={[coachStyles.page, isCompact && coachStyles.pageCompact]}>
    <View style={[styles.hero, isCompact && styles.heroCompact]}><View style={styles.heroCopy}><Text style={[styles.title, isCompact && styles.titleCompact]}>Coaching command center</Text><Text style={styles.subtitle}>{data ? `Welcome back, ${data.coachName}. Live coaching data from SetForge.` : 'Your live coaching workspace.'}</Text></View><View style={[styles.heroActions, isCompact && styles.heroActionsCompact]}>{data?.admin ? <><ActionButton label="Assign client" secondary onPress={() => router.push('/coach/clients/assign' as Href)} /><ActionButton label="Create coach" secondary onPress={() => router.push('/coach/coaches/new' as Href)} /></> : null}<ActionButton label="Create template" onPress={() => router.push('/coach/workout-builder' as Href)} /></View></View>
    {loading ? <Panel style={styles.state}><Text style={styles.muted}>Loading coach data…</Text></Panel> : null}
    {error ? <Panel style={styles.error}><Text style={styles.errorText}>{error}</Text><ActionButton label="Try again" secondary onPress={() => void reload()} /></Panel> : null}
    {data ? <>
      <View style={[styles.metrics, isCompact && styles.metricsCompact]}>{[[data.activeClientCount, 'ACTIVE CLIENTS'], [data.templateCount, 'WORKOUT TEMPLATES'], [data.completedWorkoutsLast28Days, 'WORKOUTS · LAST 28D'], [data.clientsNeedingAttention, 'NEED ATTENTION']].map(([value, label]) => <Panel key={label} style={[styles.metric, isCompact && styles.metricCompact]}><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></Panel>)}</View>
      <View style={styles.sectionHeading}><Text style={coachStyles.sectionLabel}>Needs attention</Text><Text style={styles.counter}>{data.clientsNeedingAttention} CLIENTS</Text></View>
      {data.attentionClients.length ? <View style={[styles.attentionGrid, isCompact && styles.attentionGridCompact]}>{data.attentionClients.slice(0, 3).map(client => <Panel key={client.id} style={styles.attentionCard}><View style={styles.cardTop}><View style={styles.dot}/><Text style={styles.clientName}>{client.displayName}</Text><StatusBadge tone="warning">Follow up</StatusBadge></View><Text style={styles.issue}>{client.lastWorkoutName ?? 'No completed workouts yet'}</Text><Text style={styles.muted}>{formatDate(client.lastWorkoutAt)}</Text><ActionButton label="Open client" secondary onPress={() => router.push(`/coach/clients/${client.id}` as Href)} /></Panel>)}</View> : <Panel style={styles.state}><Text style={styles.success}>All active clients have trained in the last 7 days.</Text></Panel>}
      <Panel style={[styles.activity, isCompact && styles.activityCompact]}><View style={styles.sectionHeading}><View style={styles.sectionCopy}><Text style={coachStyles.sectionTitle}>Recent client workouts</Text><Text style={styles.muted}>Latest completed sessions across your active roster</Text></View><Text onPress={() => router.push('/coach/clients' as Href)} style={styles.link}>VIEW CLIENTS →</Text></View>
        {data.recentWorkouts.length ? data.recentWorkouts.map(workout => <View key={workout.id} style={[styles.row, isCompact && styles.rowCompact]}><View style={styles.timeBox}><Text style={styles.time}>{workout.durationMinutes ?? 0}m</Text></View><View style={styles.rowCopy}><Text style={styles.clientName}>{workout.clientName}</Text><Text style={styles.muted}>{workout.name} · {formatDate(workout.completedAt)}</Text></View><Text style={[styles.volume, isCompact && styles.volumeCompact]}>{Number(workout.totalVolume).toLocaleString()} KG</Text></View>) : <Text style={styles.empty}>No completed client workouts yet.</Text>}
      </Panel>
    </> : null}
  </View>;
}

const styles = StyleSheet.create({
  hero:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:20},heroCompact:{alignItems:'stretch',flexDirection:'column'},heroCopy:{flex:1},heroActions:{flexDirection:'row',gap:10},heroActionsCompact:{flexWrap:'wrap'},title:{color:CoachColors.textPrimary,fontSize:32,lineHeight:40,fontWeight:'900',letterSpacing:-.8},titleCompact:{fontSize:27,lineHeight:33},subtitle:{marginTop:6,color:CoachColors.textSecondary,fontSize:12,lineHeight:18},metrics:{flexDirection:'row',gap:16},metricsCompact:{flexWrap:'wrap',gap:10},metric:{flex:1,padding:20},metricCompact:{minWidth:'46%',flexBasis:'46%',padding:16},metricValue:{color:CoachColors.textPrimary,fontFamily:'monospace',fontSize:28,fontWeight:'800'},metricLabel:{marginTop:7,color:CoachColors.textSecondary,fontFamily:'monospace',fontSize:9},sectionHeading:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12},sectionCopy:{flex:1},counter:{color:CoachColors.textSecondary,fontFamily:'monospace',fontSize:10},attentionGrid:{flexDirection:'row',gap:16},attentionGridCompact:{flexDirection:'column'},attentionCard:{flex:1,padding:18,gap:12},cardTop:{flexDirection:'row',alignItems:'center',gap:10},dot:{width:8,height:8,borderRadius:4,backgroundColor:CoachColors.warning},clientName:{flex:1,color:CoachColors.textPrimary,fontSize:13,fontWeight:'700'},issue:{color:CoachColors.textPrimary,fontSize:12},muted:{color:CoachColors.textSecondary,fontSize:10,lineHeight:16},activity:{padding:22},activityCompact:{padding:16},row:{minHeight:70,flexDirection:'row',alignItems:'center',gap:12,borderTopWidth:1,borderTopColor:CoachColors.border},rowCompact:{flexWrap:'wrap',paddingVertical:12},timeBox:{width:52,height:38,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:CoachColors.border,borderRadius:5},time:{color:CoachColors.textPrimary,fontFamily:'monospace',fontSize:10},rowCopy:{flex:1,minWidth:180},volume:{color:CoachColors.accentText,fontFamily:'monospace',fontSize:10},volumeCompact:{width:'100%',marginLeft:64},link:{color:CoachColors.accentText,fontFamily:'monospace',fontSize:10},state:{padding:24,alignItems:'center'},error:{padding:20,gap:16,alignItems:'flex-start',borderColor:CoachColors.danger},errorText:{color:CoachColors.danger,fontSize:12},success:{color:CoachColors.accentText,fontSize:12},empty:{paddingVertical:24,color:CoachColors.textSecondary,fontSize:12},
});
