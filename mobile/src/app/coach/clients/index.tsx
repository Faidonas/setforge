import type { Href } from 'expo-router';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { NonCredentialTextInput } from '@/components/non-credential-text-input';

import { CoachColors } from '@/constants/setforge-theme';
import { HoverPressable, PageHeading, Panel, StatusBadge, coachStyles, useCoachLayout } from '@/features/coach/coach-ui';
import { useCoachResource } from '@/features/coach/use-coach-resource';
import { CoachTypography } from '@/features/coach/coach-typography';
import { getCoachClients } from '@/services/coach-api';

const searchIcon = require('@/assets/images/coach-web-light/search.svg');

function initials(name: string) { return name.split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase(); }
function when(value: string | null) { return value ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value)) : 'Never'; }

export default function ClientsScreen() {
  const router = useRouter();
  const { isCompact } = useCoachLayout();
  const [query, setQuery] = useState('');
  const { data, error, loading } = useCoachResource(getCoachClients);
  const clients = useMemo(() => (data ?? []).filter(client => `${client.displayName} ${client.email}`.toLowerCase().includes(query.trim().toLowerCase())), [data, query]);
  return <View style={[coachStyles.page, isCompact && coachStyles.pageCompact]}>
    <PageHeading title="Clients" subtitle="Live active-client performance from Spotter." />
    <View style={[styles.summary, isCompact && styles.summaryCompact]}><Text style={styles.summaryAccent}>{data?.length ?? 0} ACTIVE CLIENTS</Text><Text style={styles.summaryItem}>{data?.reduce((sum, client) => sum + client.completedWorkoutsLast28Days, 0) ?? 0} WORKOUTS · LAST 28D</Text></View>
    <View style={[styles.search, isCompact && styles.searchCompact]}><Image contentFit="contain" source={searchIcon} style={styles.searchIcon} tintColor={CoachColors.textSecondary}/><NonCredentialTextInput accessibilityLabel="Search clients" autoCapitalize="none" autoCorrect={false} onChangeText={setQuery} placeholder="Search clients by name or email…" placeholderTextColor={CoachColors.textSecondary} returnKeyType="search" style={styles.searchInput} value={query}/></View>
    <Panel style={styles.tablePanel}><ScrollView horizontal contentContainerStyle={styles.tableWidth} showsHorizontalScrollIndicator={false}><View style={styles.tableBody}>
      <View style={styles.tableHeader}><Text style={[styles.head,styles.clientCol]}>CLIENT</Text><Text style={[styles.head,styles.sinceCol]}>COACHING SINCE</Text><Text style={[styles.head,styles.workoutsCol]}>WORKOUTS · 28D</Text><Text style={[styles.head,styles.lastCol]}>LAST WORKOUT</Text><Text style={[styles.head,styles.statusCol]}>STATUS</Text></View>
      {loading ? <Text style={styles.state}>Loading clients…</Text> : null}{error ? <Text style={styles.error}>{error}</Text> : null}
      {!loading && !error && !clients.length ? <Text style={styles.state}>No active clients match this view.</Text> : null}
      {clients.map(client => <HoverPressable hoverStyle={styles.rowHovered} key={client.id} onPress={() => router.push(`/coach/clients/${client.id}` as Href)} pressedStyle={styles.pressed} style={styles.row}><View style={[styles.identity,styles.clientCol]}><View style={styles.avatar}><Text style={styles.initials}>{initials(client.displayName)}</Text></View><View><Text style={styles.name}>{client.displayName}</Text><Text style={styles.email}>{client.email}</Text></View></View><Text style={[styles.cell,styles.sinceCol]}>{when(client.coachingSince)}</Text><Text style={[styles.workouts,styles.workoutsCol]}>{client.completedWorkoutsLast28Days}</Text><View style={styles.lastCol}><Text style={styles.name}>{client.lastWorkoutName ?? 'No completed workouts'}</Text><Text style={styles.email}>{when(client.lastWorkoutAt)}</Text></View><View style={styles.statusCol}><StatusBadge>{client.relationshipStatus}</StatusBadge></View></HoverPressable>)}
    </View></ScrollView></Panel>
  </View>;
}

const styles=StyleSheet.create({summary:{flexDirection:'row',gap:32},summaryCompact:{flexWrap:'wrap',gap:10},summaryAccent:{color:CoachColors.accentText,fontSize:12,...CoachTypography.inter600},summaryItem:{color:CoachColors.textSecondary,fontSize:12,...CoachTypography.inter500},search:{width:420,height:46,paddingHorizontal:14,flexDirection:'row',alignItems:'center',gap:10,borderWidth:1,borderColor:CoachColors.inputBorder,borderRadius:9,backgroundColor:CoachColors.surface},searchCompact:{width:'100%'},searchIcon:{width:18,height:18},searchInput:{flex:1,height:'100%',color:CoachColors.textPrimary,fontSize:13,outlineStyle:'none',...CoachTypography.inter400} as never,tablePanel:{overflow:'hidden'},tableWidth:{minWidth:1100,flexGrow:1},tableBody:{minWidth:1100,flexGrow:1},tableHeader:{width:'100%',height:48,paddingHorizontal:16,flexDirection:'row',alignItems:'center',gap:16,backgroundColor:CoachColors.surfaceMuted},head:{color:CoachColors.textSecondary,fontSize:10,...CoachTypography.inter600},row:{width:'100%',height:70,paddingHorizontal:16,flexDirection:'row',alignItems:'center',gap:16,borderTopWidth:1,borderTopColor:CoachColors.border},rowHovered:{paddingLeft:20,backgroundColor:CoachColors.accentTint},pressed:{backgroundColor:CoachColors.accentTint,opacity:.7},identity:{flexDirection:'row',alignItems:'center',gap:12},clientCol:{width:280},sinceCol:{width:170},workoutsCol:{width:140},lastCol:{flex:1,minWidth:250},statusCol:{width:110},avatar:{width:34,height:34,borderRadius:17,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:CoachColors.border},initials:{color:CoachColors.textPrimary,fontSize:10,...CoachTypography.inter600},name:{color:CoachColors.textPrimary,fontSize:12,...CoachTypography.sora600},email:{marginTop:3,color:CoachColors.textSecondary,fontSize:10,...CoachTypography.inter400},cell:{color:CoachColors.textSecondary,fontSize:11,...CoachTypography.inter400},workouts:{color:CoachColors.accentText,fontSize:14,...CoachTypography.sora700},state:{padding:24,color:CoachColors.textSecondary,fontSize:12,...CoachTypography.inter400},error:{padding:24,color:CoachColors.danger,fontSize:12,...CoachTypography.inter400}});
