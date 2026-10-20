import { useLocalSearchParams } from 'expo-router';
import { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { CoachColors } from '@/constants/setforge-theme';
import { PageHeading, Panel, StatusBadge, coachStyles, useCoachLayout } from '@/features/coach/coach-ui';
import { useCoachResource } from '@/features/coach/use-coach-resource';
import { getCoachClient } from '@/services/coach-api';

function formatDate(value: string | null) { return value ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : 'Never'; }
function initials(name: string) { return name.split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase(); }

export default function ClientDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isCompact } = useCoachLayout();
  const clientId = Number(id);
  const loadClient = useCallback(() => {
    if (!Number.isInteger(clientId) || clientId <= 0) return Promise.reject(new Error('This client link is invalid.'));
    return getCoachClient(clientId);
  }, [clientId]);
  const { data, error, loading } = useCoachResource(loadClient);

  return <View style={[coachStyles.page, isCompact && coachStyles.pageCompact]}>
    <PageHeading title={data?.displayName ?? 'Client details'} subtitle="Live performance and completed workout history." />
    {loading ? <Panel style={styles.state}><Text style={styles.muted}>Loading client…</Text></Panel> : null}
    {error ? <Panel style={styles.error}><Text style={styles.errorText}>{error}</Text></Panel> : null}
    {data ? <>
      <Panel style={[styles.profile, isCompact && styles.profileCompact]}><View style={[styles.identity, isCompact && styles.identityCompact]}><View style={styles.avatar}><Text style={styles.initials}>{initials(data.displayName)}</Text></View><View style={styles.identityCopy}><Text style={styles.name}>{data.displayName}</Text><Text style={styles.muted}>{data.email}</Text><View style={styles.badge}><StatusBadge>{data.relationshipStatus}</StatusBadge></View></View></View><View style={[styles.fact, isCompact && styles.factCompact]}><Text style={styles.label}>COACHING SINCE</Text><Text style={styles.value}>{formatDate(data.coachingSince)}</Text></View><View style={[styles.fact, isCompact && styles.factCompact]}><Text style={styles.label}>LAST WORKOUT</Text><Text style={styles.value}>{formatDate(data.lastWorkoutAt)}</Text></View></Panel>
      <View style={[styles.metrics, isCompact && styles.metricsCompact]}><Panel style={styles.metric}><Text style={styles.metricValue}>{data.completedWorkoutsLast28Days}</Text><Text style={styles.label}>WORKOUTS · LAST 28D</Text></Panel><Panel style={styles.metric}><Text style={styles.metricValue}>{Number(data.totalVolumeLast28Days).toLocaleString()} kg</Text><Text style={styles.label}>TRAINING VOLUME · LAST 28D</Text></Panel><Panel style={styles.metric}><Text style={styles.metricValue}>{data.recentWorkouts.length}</Text><Text style={styles.label}>RECENT SESSIONS SHOWN</Text></Panel></View>
      <Panel style={[styles.history, isCompact && styles.historyCompact]}><Text style={coachStyles.sectionTitle}>Recent workouts</Text>{data.recentWorkouts.length ? data.recentWorkouts.map(workout => <View key={workout.id} style={[styles.workout, isCompact && styles.workoutCompact]}><View style={styles.workoutCopy}><Text style={styles.workoutName}>{workout.name}</Text><Text style={styles.muted}>{formatDate(workout.completedAt)}</Text></View><View style={[styles.stat, isCompact && styles.statCompact]}><Text style={styles.statValue}>{workout.durationMinutes ?? 0}m</Text><Text style={styles.label}>DURATION</Text></View><View style={[styles.stat, isCompact && styles.statCompact]}><Text style={styles.statValue}>{Number(workout.totalVolume).toLocaleString()} kg</Text><Text style={styles.label}>VOLUME</Text></View></View>) : <Text style={styles.empty}>This client has no completed workouts yet.</Text>}</Panel>
    </> : null}
  </View>;
}

const styles=StyleSheet.create({state:{padding:24,alignItems:'center'},error:{padding:24,borderColor:CoachColors.danger},errorText:{color:CoachColors.danger,fontSize:12},profile:{padding:24,flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:20},profileCompact:{alignItems:'stretch',flexDirection:'column',padding:18},identity:{width:390,flexDirection:'row',alignItems:'center',gap:18},identityCompact:{width:'100%'},identityCopy:{flex:1,minWidth:0},avatar:{width:56,height:56,borderRadius:28,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:CoachColors.border},initials:{color:CoachColors.textPrimary,fontFamily:'monospace',fontSize:18},name:{color:CoachColors.textPrimary,fontSize:18,fontWeight:'800'},muted:{marginTop:5,color:CoachColors.textSecondary,fontSize:10,lineHeight:16},badge:{marginTop:8},fact:{minWidth:190,gap:8},factCompact:{minWidth:0,paddingTop:14,borderTopWidth:1,borderTopColor:CoachColors.border},label:{color:CoachColors.textSecondary,fontFamily:'monospace',fontSize:9},value:{color:CoachColors.textPrimary,fontSize:12},metrics:{flexDirection:'row',gap:16},metricsCompact:{flexDirection:'column',gap:10},metric:{flex:1,padding:20},metricValue:{marginBottom:8,color:CoachColors.textPrimary,fontFamily:'monospace',fontSize:24,fontWeight:'800'},history:{padding:24,gap:14},historyCompact:{padding:18},workout:{minHeight:72,paddingVertical:12,flexDirection:'row',alignItems:'center',gap:32,borderTopWidth:1,borderTopColor:CoachColors.border},workoutCompact:{alignItems:'flex-start',flexWrap:'wrap',gap:14},workoutCopy:{flex:1,minWidth:180},workoutName:{color:CoachColors.textPrimary,fontSize:13,fontWeight:'800'},stat:{minWidth:130,gap:5},statCompact:{minWidth:100},statValue:{color:CoachColors.textPrimary,fontFamily:'monospace',fontSize:12},empty:{paddingVertical:24,color:CoachColors.textSecondary,fontSize:12}});
