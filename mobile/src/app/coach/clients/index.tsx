import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { SetForgeColors } from '@/constants/setforge-theme';
import { CoachShell, PageHeading, Panel, StatusBadge, coachStyles } from '@/features/coach/coach-ui';
import { useCoachResource } from '@/features/coach/use-coach-resource';
import { getCoachClients } from '@/services/coach-api';

function initials(name: string) { return name.split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase(); }
function when(value: string | null) { return value ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value)) : 'Never'; }

export default function ClientsScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const { data, error, loading } = useCoachResource(getCoachClients);
  const clients = useMemo(() => (data ?? []).filter(client => `${client.displayName} ${client.email}`.toLowerCase().includes(query.trim().toLowerCase())), [data, query]);
  return <CoachShell><View style={coachStyles.page}>
    <PageHeading title="Clients" subtitle="Live active-client performance from SetForge." />
    <View style={styles.summary}><Text style={styles.summaryAccent}>{data?.length ?? 0} ACTIVE CLIENTS</Text><Text style={styles.summaryItem}>{data?.reduce((sum, client) => sum + client.completedWorkoutsLast28Days, 0) ?? 0} WORKOUTS · LAST 28D</Text></View>
    <TextInput accessibilityLabel="Search clients" onChangeText={setQuery} placeholder="Search clients by name or email…" placeholderTextColor={SetForgeColors.textSecondary} style={styles.search} value={query}/>
    <Panel style={styles.tablePanel}><ScrollView horizontal contentContainerStyle={styles.tableWidth} showsHorizontalScrollIndicator={false}><View>
      <View style={styles.tableHeader}><Text style={[styles.head,styles.clientCol]}>CLIENT</Text><Text style={[styles.head,styles.sinceCol]}>COACHING SINCE</Text><Text style={[styles.head,styles.workoutsCol]}>WORKOUTS · 28D</Text><Text style={[styles.head,styles.lastCol]}>LAST WORKOUT</Text><Text style={[styles.head,styles.statusCol]}>STATUS</Text></View>
      {loading ? <Text style={styles.state}>Loading clients…</Text> : null}{error ? <Text style={styles.error}>{error}</Text> : null}
      {!loading && !error && !clients.length ? <Text style={styles.state}>No active clients match this view.</Text> : null}
      {clients.map(client => <Pressable key={client.id} onPress={() => router.push(`/coach/clients/${client.id}` as Href)} style={({pressed}) => [styles.row, pressed && styles.pressed]}><View style={[styles.identity,styles.clientCol]}><View style={styles.avatar}><Text style={styles.initials}>{initials(client.displayName)}</Text></View><View><Text style={styles.name}>{client.displayName}</Text><Text style={styles.email}>{client.email}</Text></View></View><Text style={[styles.cell,styles.sinceCol]}>{when(client.coachingSince)}</Text><Text style={[styles.workouts,styles.workoutsCol]}>{client.completedWorkoutsLast28Days}</Text><View style={styles.lastCol}><Text style={styles.name}>{client.lastWorkoutName ?? 'No completed workouts'}</Text><Text style={styles.email}>{when(client.lastWorkoutAt)}</Text></View><View style={styles.statusCol}><StatusBadge>{client.relationshipStatus}</StatusBadge></View></Pressable>)}
    </View></ScrollView></Panel>
  </View></CoachShell>;
}

const styles=StyleSheet.create({summary:{flexDirection:'row',gap:32},summaryAccent:{color:SetForgeColors.accent,fontFamily:'monospace',fontSize:12},summaryItem:{color:SetForgeColors.textSecondary,fontFamily:'monospace',fontSize:12},search:{width:420,height:48,paddingHorizontal:16,color:SetForgeColors.textPrimary,borderWidth:1,borderColor:SetForgeColors.border,borderRadius:8,backgroundColor:SetForgeColors.surface,outlineStyle:'none'} as never,tablePanel:{overflow:'hidden'},tableWidth:{minWidth:1100},tableHeader:{height:48,paddingHorizontal:16,flexDirection:'row',alignItems:'center',gap:16},head:{color:SetForgeColors.textSecondary,fontFamily:'monospace',fontSize:10},row:{height:70,paddingHorizontal:16,flexDirection:'row',alignItems:'center',gap:16,borderTopWidth:1,borderTopColor:SetForgeColors.border},pressed:{backgroundColor:'rgba(0,240,255,.04)'},identity:{flexDirection:'row',alignItems:'center',gap:12},clientCol:{width:280},sinceCol:{width:170},workoutsCol:{width:140},lastCol:{width:250},statusCol:{width:100},avatar:{width:34,height:34,borderRadius:17,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:SetForgeColors.border},initials:{color:SetForgeColors.textPrimary,fontFamily:'monospace',fontSize:10},name:{color:SetForgeColors.textPrimary,fontSize:12,fontWeight:'700'},email:{marginTop:3,color:SetForgeColors.textSecondary,fontSize:10},cell:{color:SetForgeColors.textSecondary,fontSize:11},workouts:{color:SetForgeColors.accent,fontFamily:'monospace',fontSize:14},state:{padding:24,color:SetForgeColors.textSecondary,fontSize:12},error:{padding:24,color:'#FF8A98',fontSize:12}});
