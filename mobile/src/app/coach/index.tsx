import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { ActionButton, CoachShell, Panel, StatusBadge, coachStyles } from '@/features/coach/coach-ui';
import { SetForgeColors } from '@/constants/setforge-theme';

const attention = [
  { name: 'Sarah Chen', issue: 'Missed two scheduled sessions', context: 'Last active 3 days ago', status: 'Follow up', tone: 'danger' as const },
  { name: 'Daniel Kim', issue: 'Program review is due', context: 'Next block starts this week', status: 'Review', tone: 'warning' as const },
  { name: 'Mia Rossi', issue: 'Hit a new squat PR: 92.5 kg', context: '+5 kg from previous best', status: 'Celebrate', tone: 'accent' as const },
];
const sessions = [
  ['08:00', 'Marcus Reed', 'Lower Strength · Week 4', 'Completed'],
  ['10:30', 'Sarah Chen', 'Check-in call · adherence', 'Overdue'],
  ['17:00', 'Daniel Kim', 'Upper Body A · hypertrophy', 'Upcoming'],
  ['18:30', 'Mia Rossi', 'Mobility / recovery review', 'Upcoming'],
];

export default function CoachDashboardScreen() {
  const router = useRouter();
  return (
    <CoachShell>
      <View style={coachStyles.page}>
        <View style={styles.hero}>
          <View><Text style={styles.title}>Coaching command center</Text><Text style={styles.date}>Tuesday, 07 October · Focus on the clients who need you most today.</Text></View>
          <ActionButton label="+ Assign workout" onPress={() => router.push('/coach/templates' as Href)} />
        </View>
        <View style={styles.attentionHeader}><Text style={coachStyles.sectionLabel}>Needs attention</Text><Text style={styles.urgent}>3 clients</Text></View>
        <View style={styles.attentionGrid}>{attention.map((item) => <Panel key={item.name} style={styles.attentionCard}><View style={styles.cardTop}><View style={styles.clientDot} /><Text style={styles.clientName}>{item.name}</Text><StatusBadge tone={item.tone}>{item.status}</StatusBadge></View><Text style={styles.issue}>{item.issue}</Text><Text style={styles.context}>{item.context}</Text></Panel>)}</View>
        <View style={styles.primaryGrid}>
          <Panel style={styles.schedule}>
            <View style={styles.panelHeading}><View><Text style={coachStyles.sectionTitle}>Today&apos;s coaching schedule</Text><Text style={styles.panelSub}>4 sessions and check-ins · Athens time</Text></View><StatusBadge>Open calendar</StatusBadge></View>
            {sessions.map(([time, name, workout, status]) => <View key={time} style={styles.session}><View style={styles.timeBox}><Text style={styles.time}>{time}</Text></View><View style={styles.sessionCopy}><Text style={styles.sessionName}>{name}</Text><Text style={styles.sessionWorkout}>{workout}</Text></View><StatusBadge tone={status === 'Overdue' ? 'danger' : 'accent'}>{status}</StatusBadge></View>)}
          </Panel>
          <Panel style={styles.pulse}>
            <View style={styles.panelHeading}><View><Text style={coachStyles.sectionTitle}>Client pulse</Text><Text style={styles.panelSub}>Health of your active roster</Text></View><Text style={styles.link}>VIEW ALL</Text></View>
            <View style={styles.pulseMetrics}><View style={styles.pulseMetric}><Text style={styles.pulseValue}>18</Text><Text style={styles.pulseLabel}>ON TRACK</Text></View><View style={styles.pulseMetric}><Text style={[styles.pulseValue, styles.warning]}>4</Text><Text style={styles.pulseLabel}>WATCH</Text></View><View style={styles.pulseMetric}><Text style={[styles.pulseValue, styles.danger]}>2</Text><Text style={styles.pulseLabel}>AT RISK</Text></View></View>
            <View style={styles.hairline} /><Text style={styles.pulseLabel}>COACHING THIS WEEK</Text><View style={styles.meterLabels}><Text style={styles.sessionWorkout}>Team average</Text><Text style={styles.accentMono}>84%</Text></View><View style={styles.meter}><View style={styles.meterFill} /></View><Text style={styles.positive}>+6% compared to last week</Text>
            <View style={styles.insight}><View style={styles.clientDot} /><Text style={styles.insightText}>Tuesday compliance is your strongest signal this cycle.</Text></View>
          </Panel>
        </View>
        <View style={styles.secondaryGrid}>
          <Panel style={styles.trend}><View style={styles.panelHeading}><View><Text style={coachStyles.sectionTitle}>Weekly adherence trend</Text><Text style={styles.panelSub}>Scheduled vs completed sessions</Text></View><StatusBadge>Last 7 days</StatusBadge></View><View style={styles.chart}>{[53,67,60,74,78,46,72].map((height,index) => <View key={index} style={styles.barColumn}><Text style={styles.barValue}>{height}%</Text><View style={styles.barTrack}><View style={[styles.barFill,index===6&&styles.barToday,{height}]} /></View><Text style={styles.day}>{['W','T','F','S','S','M','T'][index]}</Text></View>)}</View></Panel>
          <Panel style={styles.wins}><View style={styles.panelHeading}><Text style={coachStyles.sectionTitle}>Recent wins</Text><Text style={styles.link}>VIEW HISTORY</Text></View>{[['MR','Marcus Reed','Deadlift · 180 kg','+10 KG'],['MR','Mia Rossi','Squat · 92.5 kg','NEW PR'],['DK','Daniel Kim','4-week streak','100%']].map((win)=><View key={win[1]} style={styles.win}><View style={styles.winAvatar}><Text style={styles.avatarText}>{win[0]}</Text></View><View style={styles.sessionCopy}><Text style={styles.sessionName}>{win[1]}</Text><Text style={styles.sessionWorkout}>{win[2]}</Text></View><StatusBadge>{win[3]}</StatusBadge></View>)}</Panel>
        </View>
      </View>
    </CoachShell>
  );
}

const styles = StyleSheet.create({
  hero:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},title:{color:SetForgeColors.textPrimary,fontSize:32,lineHeight:40,fontWeight:'900',letterSpacing:-.8},date:{marginTop:6,color:SetForgeColors.textSecondary,fontSize:12},attentionHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},urgent:{color:'#FF4C61',fontFamily:'monospace',fontSize:10,textTransform:'uppercase'},attentionGrid:{flexDirection:'row',gap:16},attentionCard:{flex:1,padding:17,gap:8},cardTop:{flexDirection:'row',alignItems:'center',gap:10},clientDot:{width:8,height:8,borderRadius:4,backgroundColor:SetForgeColors.accent},clientName:{flex:1,color:SetForgeColors.textPrimary,fontSize:13,fontWeight:'700'},issue:{color:SetForgeColors.textPrimary,fontSize:12},context:{color:SetForgeColors.textSecondary,fontFamily:'monospace',fontSize:10},primaryGrid:{flexDirection:'row',gap:20},schedule:{flex:1,padding:21},pulse:{width:396,padding:21},panelHeading:{minHeight:40,flexDirection:'row',alignItems:'flex-start',justifyContent:'space-between'},panelSub:{marginTop:3,color:SetForgeColors.textSecondary,fontSize:10},session:{minHeight:72,flexDirection:'row',alignItems:'center',gap:12,borderTopWidth:1,borderTopColor:SetForgeColors.border},timeBox:{width:58,height:40,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:SetForgeColors.border,borderRadius:5},time:{color:SetForgeColors.textPrimary,fontFamily:'monospace',fontSize:10},sessionCopy:{flex:1,gap:3},sessionName:{color:SetForgeColors.textPrimary,fontSize:12,fontWeight:'700'},sessionWorkout:{color:SetForgeColors.textSecondary,fontSize:10},pulseMetrics:{marginTop:16,flexDirection:'row',gap:10},pulseMetric:{flex:1,height:64,padding:12,borderWidth:1,borderColor:SetForgeColors.border,borderRadius:6},pulseValue:{color:'#32D583',fontSize:20,fontWeight:'900'},pulseLabel:{color:SetForgeColors.textSecondary,fontFamily:'monospace',fontSize:9},warning:{color:'#FFBB33'},danger:{color:'#FF4C61'},hairline:{height:1,marginVertical:16,backgroundColor:SetForgeColors.border},meterLabels:{marginTop:12,flexDirection:'row',justifyContent:'space-between'},accentMono:{color:SetForgeColors.accent,fontFamily:'monospace',fontSize:11},meter:{height:8,marginTop:10,borderRadius:4,backgroundColor:SetForgeColors.border,overflow:'hidden'},meterFill:{width:'84%',height:'100%',backgroundColor:SetForgeColors.accent},positive:{marginTop:7,color:'#32D583',fontFamily:'monospace',fontSize:9},insight:{marginTop:22,padding:12,flexDirection:'row',gap:10,borderRadius:6,backgroundColor:'rgba(0,240,255,.06)'},insightText:{flex:1,color:SetForgeColors.textSecondary,fontSize:10,lineHeight:15},secondaryGrid:{flexDirection:'row',gap:20},trend:{flex:1,padding:19},wins:{width:396,padding:19},chart:{height:146,marginTop:12,flexDirection:'row',alignItems:'flex-end',justifyContent:'space-around'},barColumn:{height:142,width:52,alignItems:'center',justifyContent:'flex-end'},barValue:{color:SetForgeColors.textSecondary,fontFamily:'monospace',fontSize:9},barTrack:{width:28,height:96,marginTop:6,justifyContent:'flex-end',backgroundColor:'#242428'},barFill:{width:28,backgroundColor:'#53535B'},barToday:{backgroundColor:SetForgeColors.accent},day:{marginTop:6,color:SetForgeColors.textSecondary,fontFamily:'monospace',fontSize:9},link:{color:SetForgeColors.accent,fontFamily:'monospace',fontSize:10},win:{height:58,flexDirection:'row',alignItems:'center',gap:10},winAvatar:{width:34,height:34,borderRadius:17,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:SetForgeColors.border},avatarText:{color:SetForgeColors.textPrimary,fontFamily:'monospace',fontSize:9},
});
