import { useLocalSearchParams } from 'expo-router';
import { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { SetForgeColors } from '@/constants/setforge-theme';
import { CoachShell, PageHeading, Panel, StatusBadge, coachStyles } from '@/features/coach/coach-ui';
import { useCoachResource } from '@/features/coach/use-coach-resource';
import { getCoachClient } from '@/services/coach-api';

function formatDate(value: string | null) { return value ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : 'Never'; }
function initials(name: string) { return name.split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase(); }

export default function ClientDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const clientId = Number(id);
  const loadClient = useCallback(() => {
    if (!Number.isInteger(clientId) || clientId <= 0) return Promise.reject(new Error('This client link is invalid.'));
    return getCoachClient(clientId);
  }, [clientId]);
  const { data, error, loading } = useCoachResource(loadClient);

  return <CoachShell><View style={coachStyles.page}>
    <PageHeading title={data?.displayName ?? 'Client details'} subtitle="Live performance and completed workout history." />
    {loading ? <Panel style={styles.state}><Text style={styles.muted}>Loading client…</Text></Panel> : null}
    {error ? <Panel style={styles.error}><Text style={styles.errorText}>{error}</Text></Panel> : null}
    {data ? <>
      <Panel style={styles.profile}><View style={styles.identity}><View style={styles.avatar}><Text style={styles.initials}>{initials(data.displayName)}</Text></View><View><Text style={styles.name}>{data.displayName}</Text><Text style={styles.muted}>{data.email}</Text><View style={styles.badge}><StatusBadge>{data.relationshipStatus}</StatusBadge></View></View></View><View style={styles.fact}><Text style={styles.label}>COACHING SINCE</Text><Text style={styles.value}>{formatDate(data.coachingSince)}</Text></View><View style={styles.fact}><Text style={styles.label}>LAST WORKOUT</Text><Text style={styles.value}>{formatDate(data.lastWorkoutAt)}</Text></View></Panel>
      <View style={styles.metrics}><Panel style={styles.metric}><Text style={styles.metricValue}>{data.completedWorkoutsLast28Days}</Text><Text style={styles.label}>WORKOUTS · LAST 28D</Text></Panel><Panel style={styles.metric}><Text style={styles.metricValue}>{Number(data.totalVolumeLast28Days).toLocaleString()} kg</Text><Text style={styles.label}>TRAINING VOLUME · LAST 28D</Text></Panel><Panel style={styles.metric}><Text style={styles.metricValue}>{data.recentWorkouts.length}</Text><Text style={styles.label}>RECENT SESSIONS SHOWN</Text></Panel></View>
      <Panel style={styles.history}><Text style={coachStyles.sectionTitle}>Recent workouts</Text>{data.recentWorkouts.length ? data.recentWorkouts.map(workout => <View key={workout.id} style={styles.workout}><View style={styles.workoutCopy}><Text style={styles.workoutName}>{workout.name}</Text><Text style={styles.muted}>{formatDate(workout.completedAt)}</Text></View><View style={styles.stat}><Text style={styles.statValue}>{workout.durationMinutes ?? 0}m</Text><Text style={styles.label}>DURATION</Text></View><View style={styles.stat}><Text style={styles.statValue}>{Number(workout.totalVolume).toLocaleString()} kg</Text><Text style={styles.label}>VOLUME</Text></View></View>) : <Text style={styles.empty}>This client has no completed workouts yet.</Text>}</Panel>
    </> : null}
  </View></CoachShell>;
}

const styles=StyleSheet.create({state:{padding:24,alignItems:'center'},error:{padding:24,borderColor:'#FF4C61'},errorText:{color:'#FF8A98',fontSize:12},profile:{padding:24,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},identity:{width:390,flexDirection:'row',alignItems:'center',gap:18},avatar:{width:56,height:56,borderRadius:28,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:SetForgeColors.border},initials:{color:SetForgeColors.textPrimary,fontFamily:'monospace',fontSize:18},name:{color:SetForgeColors.textPrimary,fontSize:18,fontWeight:'800'},muted:{marginTop:5,color:SetForgeColors.textSecondary,fontSize:10,lineHeight:16},badge:{marginTop:8},fact:{minWidth:190,gap:8},label:{color:SetForgeColors.textSecondary,fontFamily:'monospace',fontSize:9},value:{color:SetForgeColors.textPrimary,fontSize:12},metrics:{flexDirection:'row',gap:16},metric:{flex:1,padding:20},metricValue:{marginBottom:8,color:SetForgeColors.accent,fontFamily:'monospace',fontSize:24,fontWeight:'800'},history:{padding:24,gap:14},workout:{minHeight:72,paddingVertical:12,flexDirection:'row',alignItems:'center',gap:32,borderTopWidth:1,borderTopColor:SetForgeColors.border},workoutCopy:{flex:1},workoutName:{color:SetForgeColors.textPrimary,fontSize:13,fontWeight:'800'},stat:{minWidth:130,gap:5},statValue:{color:SetForgeColors.textPrimary,fontFamily:'monospace',fontSize:12},empty:{paddingVertical:24,color:SetForgeColors.textSecondary,fontSize:12}});
