import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { Image } from 'expo-image';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { SetForgeColors } from '@/constants/setforge-theme';
import { coachClients } from '@/features/coach/coach-data';
import { ActionButton, CoachShell, PageHeading, Panel, StatusBadge, coachStyles } from '@/features/coach/coach-ui';

const searchIcon = require('@/assets/images/coach-web/search.svg');
const moreIcon = require('@/assets/images/coach-web/more-horizontal.svg');

export default function ClientsScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const clients = useMemo(() => coachClients.filter((client) => `${client.name} ${client.email}`.toLowerCase().includes(query.toLowerCase())), [query]);
  return (
    <CoachShell>
      <View style={coachStyles.page}>
        <PageHeading title="Clients" subtitle="Manage programs, monitor adherence, and keep every client moving forward." actions={<><ActionButton label="Export CSV" secondary /><ActionButton label="Invite client" /></>} />
        <View style={styles.summary}><Text style={styles.summaryAccent}>24 ACTIVE CLIENTS</Text><Text style={styles.summaryItem}>3 NEED ATTENTION</Text><Text style={styles.summaryItem}>2 PAUSED</Text><Text style={styles.summaryItem}>89% AVG. ADHERENCE</Text></View>
        <View style={styles.filters}><View style={styles.clientSearch}><Image source={searchIcon} style={styles.icon} contentFit="contain" /><TextInput accessibilityLabel="Search clients" onChangeText={setQuery} placeholder="Search clients by name or email…" placeholderTextColor={SetForgeColors.textSecondary} style={styles.input} value={query} /></View>{['All goals ⌄','All statuses ⌄','All programs ⌄'].map(label=><View key={label} style={styles.chip}><Text style={styles.chipText}>{label}</Text></View>)}</View>
        <Panel style={styles.tablePanel}>
          <ScrollView horizontal contentContainerStyle={styles.tableWidth} showsHorizontalScrollIndicator={false}>
            <View>
              <View style={styles.tableHeader}><Text style={[styles.headerText,styles.clientCol]}>CLIENT ↕</Text><Text style={[styles.headerText,styles.goalCol]}>GOAL</Text><Text style={[styles.headerText,styles.programCol]}>ASSIGNED PROGRAM</Text><Text style={[styles.headerText,styles.adherenceCol]}>ADHERENCE ↓</Text><Text style={[styles.headerText,styles.lastCol]}>LAST WORKOUT</Text><Text style={[styles.headerText,styles.statusCol]}>STATUS</Text><View style={styles.moreCol} /></View>
              {clients.map((client) => <Pressable key={client.id} onPress={() => router.push(`/coach/clients/${client.id}` as Href)} style={({pressed})=>[styles.clientRow,pressed&&styles.pressed]}>
                <View style={[styles.clientIdentity,styles.clientCol]}><View style={styles.avatar}><Text style={styles.initials}>{client.initials}</Text></View><View><Text style={styles.clientName}>{client.name}</Text><Text style={styles.email}>{client.email}</Text></View></View>
                <Text style={[styles.cellMuted,styles.goalCol]}>{client.goal}</Text><Text style={[styles.cell,styles.programCol]}>{client.program}</Text><Text style={[styles.adherence,styles.adherenceCol]}>{client.adherence}</Text><Text style={[styles.last,styles.lastCol]}>{client.lastWorkout}</Text><View style={styles.statusCol}><StatusBadge tone={client.status==='At risk'?'warning':client.status==='Paused'?'muted':'accent'}>{client.status}</StatusBadge></View><View style={styles.moreCol}><Image source={moreIcon} style={styles.icon} contentFit="contain" /></View>
              </Pressable>)}
            </View>
          </ScrollView>
          <View style={styles.pagination}><Text style={styles.paginationText}>SHOWING 1–{clients.length} OF 26 CLIENTS • ADHERENCE: LAST 28 DAYS</Text><View style={styles.pages}><Text style={styles.pageMuted}>← Previous</Text><StatusBadge>1</StatusBadge><Text style={styles.pageMuted}>2</Text><Text style={styles.pageMuted}>3</Text><Text style={styles.next}>Next →</Text></View></View>
        </Panel>
      </View>
    </CoachShell>
  );
}

const styles=StyleSheet.create({summary:{flexDirection:'row',gap:32},summaryAccent:{color:SetForgeColors.accent,fontFamily:'monospace',fontSize:12},summaryItem:{color:SetForgeColors.textSecondary,fontFamily:'monospace',fontSize:12},filters:{height:48,flexDirection:'row',alignItems:'center',gap:16},clientSearch:{width:360,height:48,paddingHorizontal:16,flexDirection:'row',alignItems:'center',gap:12,borderWidth:1,borderColor:SetForgeColors.border,borderRadius:8,backgroundColor:SetForgeColors.surface},icon:{width:18,height:18},input:{flex:1,color:SetForgeColors.textPrimary,fontSize:14,outlineStyle:'none'} as never,chip:{paddingHorizontal:16,paddingVertical:8,borderWidth:1,borderColor:SetForgeColors.border,borderRadius:999,backgroundColor:SetForgeColors.surface},chipText:{color:SetForgeColors.textSecondary,fontSize:12},tablePanel:{overflow:'hidden'},tableWidth:{minWidth:1134},tableHeader:{height:48,paddingHorizontal:16,flexDirection:'row',alignItems:'center',gap:16},headerText:{color:SetForgeColors.textSecondary,fontFamily:'monospace',fontSize:10},clientRow:{height:64,paddingHorizontal:16,flexDirection:'row',alignItems:'center',gap:16,borderTopWidth:1,borderTopColor:SetForgeColors.border},pressed:{backgroundColor:'rgba(0,240,255,.04)'},clientIdentity:{flexDirection:'row',alignItems:'center',gap:12},clientCol:{width:240},goalCol:{width:136},programCol:{width:192},adherenceCol:{width:104},lastCol:{width:144},statusCol:{width:88},moreCol:{width:18},avatar:{width:32,height:32,borderRadius:16,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:SetForgeColors.border},initials:{color:SetForgeColors.textPrimary,fontFamily:'monospace',fontSize:11},clientName:{color:SetForgeColors.textPrimary,fontSize:13,fontWeight:'700'},email:{color:SetForgeColors.textSecondary,fontSize:10},cell:{color:SetForgeColors.textPrimary,fontSize:12},cellMuted:{color:SetForgeColors.textSecondary,fontSize:12},adherence:{color:SetForgeColors.accent,fontFamily:'monospace',fontSize:13},last:{color:SetForgeColors.textSecondary,fontFamily:'monospace',fontSize:10},pagination:{height:64,padding:16,flexDirection:'row',alignItems:'center',justifyContent:'space-between',borderTopWidth:1,borderTopColor:SetForgeColors.border},paginationText:{color:SetForgeColors.textSecondary,fontFamily:'monospace',fontSize:11},pages:{flexDirection:'row',alignItems:'center',gap:16},pageMuted:{color:SetForgeColors.textSecondary,fontSize:12},next:{color:SetForgeColors.accent,fontSize:12}});
