import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CoachColors } from '@/constants/setforge-theme';
import {
  ActionButton,
  Panel,
  StatusBadge,
  coachStyles,
  useCoachLayout,
} from '@/features/coach/coach-ui';
import { useCoachResource } from '@/features/coach/use-coach-resource';
import { CoachTypography } from '@/features/coach/coach-typography';
import { getCoachDashboard } from '@/services/coach-api';

function formatDate(value: string | null) {
  return value
    ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
    : 'No completed workout';
}

function initials(value: string) {
  return value.split(/\s+/).slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join('');
}

function DashboardLink({ label, onPress, outlined = false }: { label: string; onPress: () => void; outlined?: boolean }) {
  const [hovered, setHovered] = useState(false);
  return <Pressable
    accessibilityRole="button"
    onHoverIn={() => setHovered(true)}
    onHoverOut={() => setHovered(false)}
    onPress={onPress}
    style={({ pressed }) => [styles.textButton, outlined && styles.viewAll, hovered && styles.textButtonHovered, outlined && hovered && styles.viewAllHovered, pressed && styles.linkPressed]}>
    <Text style={[styles.textButtonLabel, outlined && styles.viewAllText]}>{label}</Text>
    <Text style={[styles.textButtonArrow, hovered && styles.textButtonArrowHovered]}>→</Text>
  </Pressable>;
}

export default function CoachDashboardScreen() {
  const router = useRouter();
  const { isCompact, isNarrow } = useCoachLayout();
  const { data, error, loading, reload } = useCoachResource(getCoachDashboard);
  const metrics = data ? [
    { value: data.activeClientCount, label: 'Active clients', detail: 'Current coaching roster', featured: true },
    { value: data.templateCount, label: 'Workout templates', detail: 'Ready to assign' },
    { value: data.completedWorkoutsLast28Days, label: 'Completed sessions', detail: 'Across the last 28 days' },
    { value: data.clientsNeedingAttention, label: 'Need attention', detail: 'No session in 7+ days', warning: data.clientsNeedingAttention > 0 },
  ] : [];

  return <View style={[coachStyles.page, isCompact && coachStyles.pageCompact]}>
    <Panel style={[styles.hero, isCompact && styles.heroCompact]}>
      <View pointerEvents="none" style={styles.heroGlow} />
      <View style={styles.heroCopy}>
        <View style={styles.eyebrowRow}><View style={styles.liveDot} /><Text style={styles.eyebrow}>COACHING OVERVIEW</Text></View>
        <Text style={[styles.title, isCompact && styles.titleCompact, isNarrow && styles.titleNarrow]}>{data ? `Welcome back, ${data.coachName.split(/\s+/)[0]}.` : 'Your coaching workspace.'}</Text>
        <Text style={styles.subtitle}>A clear view of your clients, programming, and latest training activity.</Text>
      </View>
      <View style={[styles.heroActions, isCompact && styles.heroActionsCompact, isNarrow && styles.heroActionsNarrow]}>
        {data?.admin ? <ActionButton label="Assign client" secondary onPress={() => router.push('/coach/clients/assign' as Href)} textStyle={styles.buttonText} /> : null}
        <ActionButton label="Workout builder" onPress={() => router.push('/coach/workout-builder' as Href)} textStyle={styles.buttonText} />
      </View>
    </Panel>

    {loading ? <Panel style={styles.state}><Text style={styles.muted}>Loading your workspace…</Text></Panel> : null}
    {error ? <Panel style={styles.error}><Text style={styles.errorText}>{error}</Text><ActionButton label="Try again" secondary onPress={() => void reload()} textStyle={styles.buttonText} /></Panel> : null}

    {data ? <>
      <View style={[styles.metrics, isCompact && styles.metricsCompact, isNarrow && styles.metricsNarrow]}>{metrics.map((metric) => <Panel key={metric.label} style={[styles.metric, isCompact && styles.metricCompact, isNarrow && styles.metricNarrow, metric.featured && styles.metricFeatured]}>
        <View style={styles.metricTop}><Text style={styles.metricLabel}>{metric.label}</Text><View style={[styles.metricMarker, metric.warning && styles.metricMarkerWarning]} /></View>
        <Text style={styles.metricValue}>{metric.value}</Text>
        <Text style={styles.metricDetail}>{metric.detail}</Text>
      </Panel>)}</View>

      <View style={styles.sectionHeading}>
        <View style={styles.sectionCopy}><Text style={styles.sectionEyebrow}>CLIENT PULSE</Text><Text style={styles.sectionTitle}>Needs attention</Text><Text style={styles.muted}>Clients who may benefit from a timely check-in.</Text></View>
        <View style={styles.countPill}><Text style={styles.countPillText}>{data.clientsNeedingAttention}</Text></View>
      </View>

      {data.attentionClients.length ? <View style={[styles.attentionGrid, isCompact && styles.attentionGridCompact]}>{data.attentionClients.slice(0, 3).map((client) => <Panel key={client.id} style={styles.attentionCard}>
        <View style={styles.cardTop}>
          <View style={styles.clientAvatar}><Text style={styles.clientAvatarText}>{initials(client.displayName)}</Text></View>
          <View style={styles.clientIdentity}><Text numberOfLines={1} style={styles.clientName}>{client.displayName}</Text><Text style={styles.clientMeta}>CLIENT PROFILE</Text></View>
          <StatusBadge textStyle={styles.badgeText} tone="warning">Follow up</StatusBadge>
        </View>
        <View style={styles.cardDivider} />
        <Text numberOfLines={1} style={styles.issue}>{client.lastWorkoutName ?? 'No completed workouts yet'}</Text>
        <Text style={styles.muted}>{formatDate(client.lastWorkoutAt)}</Text>
        <DashboardLink label="Open profile" onPress={() => router.push(`/coach/clients/${client.id}` as Href)} />
      </Panel>)}</View> : <Panel style={styles.clearState}>
        <View style={styles.clearIcon}><Text style={styles.clearIconText}>✓</Text></View>
        <View style={styles.clearCopy}><Text style={styles.clearTitle}>Your roster is on track</Text><Text style={styles.muted}>All active clients have trained in the last 7 days.</Text></View>
      </Panel>}

      <Panel style={[styles.activity, isCompact && styles.activityCompact]}>
        <View style={[styles.activityHeader, isCompact && styles.activityHeaderCompact]}>
          <View style={styles.sectionCopy}><Text style={styles.sectionEyebrow}>RECENT ACTIVITY</Text><Text style={styles.sectionTitle}>Client workouts</Text><Text style={styles.muted}>Latest completed sessions across your active roster.</Text></View>
          <DashboardLink label="View all clients" outlined onPress={() => router.push('/coach/clients' as Href)} />
        </View>
        <View style={styles.activityDivider} />
        {data.recentWorkouts.length ? data.recentWorkouts.map((workout) => <View key={workout.id} style={[styles.row, isCompact && styles.rowCompact]}>
          <View style={styles.timeBox}><Text style={styles.time}>{workout.durationMinutes ?? 0}</Text><Text style={styles.timeUnit}>MIN</Text></View>
          <View style={styles.rowCopy}><Text style={styles.clientName}>{workout.clientName}</Text><Text numberOfLines={1} style={styles.muted}>{workout.name} · {formatDate(workout.completedAt)}</Text></View>
          <View style={[styles.volumePill, isCompact && styles.volumePillCompact]}><Text style={styles.volume}>{Number(workout.totalVolume).toLocaleString()} KG</Text></View>
        </View>) : <Text style={styles.empty}>No completed client workouts yet.</Text>}
      </Panel>
    </> : null}
  </View>;
}

const styles = StyleSheet.create({
  hero: { position: 'relative', minHeight: 190, padding: 28, overflow: 'hidden', flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, borderColor: CoachColors.inputBorder },
  heroCompact: { minHeight: 0, padding: 22, alignItems: 'stretch', flexDirection: 'column' },
  heroGlow: { position: 'absolute', width: 260, height: 260, right: -100, top: -130, borderRadius: 999, backgroundColor: CoachColors.accentTint },
  heroCopy: { flex: 1, maxWidth: 650 },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 18 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: CoachColors.accentText },
  eyebrow: { color: CoachColors.accentText, fontSize: 9, letterSpacing: 1.2, ...CoachTypography.inter600 },
  title: { color: CoachColors.textPrimary, fontSize: 36, lineHeight: 42, letterSpacing: -0.72, ...CoachTypography.sora700 },
  titleCompact: { fontSize: 29, lineHeight: 35, letterSpacing: -0.58 },
  titleNarrow: { fontSize: 26, lineHeight: 31, letterSpacing: -0.52 },
  subtitle: { maxWidth: 520, marginTop: 10, color: CoachColors.textSecondary, fontSize: 13, lineHeight: 20, ...CoachTypography.inter400 },
  heroActions: { flexDirection: 'row', gap: 10, zIndex: 1 },
  heroActionsCompact: { flexWrap: 'wrap' },
  heroActionsNarrow: { flexDirection: 'column', alignItems: 'stretch' },
  metrics: { flexDirection: 'row', gap: 12 },
  metricsCompact: { flexWrap: 'wrap', gap: 10 },
  metricsNarrow: { flexDirection: 'column' },
  metric: { flex: 1, minHeight: 150, padding: 20, justifyContent: 'space-between' },
  metricCompact: { minWidth: '46%', flexBasis: '46%', minHeight: 138, padding: 16 },
  metricNarrow: { minWidth: '100%', flexBasis: 'auto', minHeight: 124 },
  metricFeatured: { borderColor: CoachColors.accentText },
  metricTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  metricMarker: { width: 6, height: 6, borderRadius: 3, backgroundColor: CoachColors.accentText },
  metricMarkerWarning: { backgroundColor: CoachColors.warning },
  metricValue: { color: CoachColors.textPrimary, fontSize: 34, lineHeight: 40, letterSpacing: -0.68, ...CoachTypography.sora700 },
  metricLabel: { color: CoachColors.textPrimary, fontSize: 12, ...CoachTypography.sora600 },
  metricDetail: { color: CoachColors.textSecondary, fontSize: 10, lineHeight: 15, ...CoachTypography.inter400 },
  sectionHeading: { marginTop: 8, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 },
  sectionCopy: { flex: 1, gap: 4 },
  sectionEyebrow: { marginBottom: 3, color: CoachColors.accentText, fontSize: 9, letterSpacing: 1, ...CoachTypography.inter600 },
  sectionTitle: { color: CoachColors.textPrimary, fontSize: 20, lineHeight: 26, letterSpacing: -0.4, ...CoachTypography.sora700 },
  countPill: { minWidth: 32, height: 32, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: CoachColors.accentTint },
  countPillText: { color: CoachColors.accentText, fontSize: 11, ...CoachTypography.inter600 },
  attentionGrid: { flexDirection: 'row', gap: 12 },
  attentionGridCompact: { flexDirection: 'column' },
  attentionCard: { flex: 1, padding: 18, gap: 10 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  clientAvatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: CoachColors.surfaceMuted, borderWidth: 1, borderColor: CoachColors.border },
  clientAvatarText: { color: CoachColors.textPrimary, fontSize: 10, ...CoachTypography.inter600 },
  clientIdentity: { flex: 1, minWidth: 0 },
  clientName: { color: CoachColors.textPrimary, fontSize: 13, letterSpacing: -0.26, ...CoachTypography.sora600 },
  clientMeta: { marginTop: 3, color: CoachColors.textDisabled, fontSize: 8, letterSpacing: .7, ...CoachTypography.inter500 },
  cardDivider: { height: 1, marginVertical: 2, backgroundColor: CoachColors.border },
  issue: { color: CoachColors.textPrimary, fontSize: 12, letterSpacing: -0.24, ...CoachTypography.sora600 },
  muted: { color: CoachColors.textSecondary, fontSize: 10, lineHeight: 16, ...CoachTypography.inter400 },
  textButton: { marginTop: 3, flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 8, cursor: 'pointer', transitionDuration: '150ms', transitionProperty: 'transform, background-color, border-color', transitionTimingFunction: 'ease-out' } as never,
  textButtonHovered: { transform: [{ translateX: 3 }] },
  textButtonLabel: { color: CoachColors.accentText, fontSize: 11, ...CoachTypography.inter600 },
  textButtonArrow: { color: CoachColors.accentText, fontSize: 14, transitionDuration: '150ms', transitionProperty: 'transform', ...CoachTypography.inter600 } as never,
  textButtonArrowHovered: { transform: [{ translateX: 2 }] },
  clearState: { padding: 20, flexDirection: 'row', alignItems: 'center', gap: 14 },
  clearIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: CoachColors.accentTint },
  clearIconText: { color: CoachColors.accentText, fontSize: 16, ...CoachTypography.inter600 },
  clearCopy: { flex: 1 },
  clearTitle: { marginBottom: 3, color: CoachColors.textPrimary, fontSize: 13, letterSpacing: -0.26, ...CoachTypography.sora600 },
  activity: { padding: 0, overflow: 'hidden' },
  activityCompact: { padding: 0 },
  activityHeader: { padding: 22, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 },
  activityHeaderCompact: { padding: 18, alignItems: 'flex-start', flexDirection: 'column' },
  activityDivider: { height: 1, backgroundColor: CoachColors.border },
  viewAll: { height: 34, marginTop: 0, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: CoachColors.border, borderRadius: 7 },
  viewAllHovered: { transform: [{ translateY: -1 }], borderColor: CoachColors.accentText, backgroundColor: CoachColors.accentTint },
  viewAllText: { color: CoachColors.textPrimary, fontSize: 10, ...CoachTypography.inter600 },
  row: { minHeight: 76, paddingHorizontal: 22, flexDirection: 'row', alignItems: 'center', gap: 14, borderBottomWidth: 1, borderBottomColor: CoachColors.border },
  rowCompact: { minHeight: 0, paddingHorizontal: 18, paddingVertical: 14, flexWrap: 'wrap' },
  timeBox: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: CoachColors.surfaceMuted },
  time: { color: CoachColors.textPrimary, fontSize: 12, letterSpacing: -0.24, ...CoachTypography.sora700 },
  timeUnit: { marginTop: 1, color: CoachColors.textDisabled, fontSize: 7, letterSpacing: .5, ...CoachTypography.inter500 },
  rowCopy: { flex: 1, minWidth: 180, gap: 3 },
  volumePill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, backgroundColor: CoachColors.accentTint },
  volumePillCompact: { marginLeft: 60 },
  volume: { color: CoachColors.accentText, fontSize: 9, letterSpacing: -0.18, ...CoachTypography.sora700 },
  state: { padding: 24, alignItems: 'center' },
  error: { padding: 20, gap: 16, alignItems: 'flex-start', borderColor: CoachColors.danger },
  errorText: { color: CoachColors.danger, fontSize: 12, ...CoachTypography.inter400 },
  empty: { padding: 24, color: CoachColors.textSecondary, fontSize: 12, ...CoachTypography.inter400 },
  buttonText: { ...CoachTypography.inter600 },
  badgeText: { ...CoachTypography.inter600 },
  linkPressed: { opacity: .68, transform: [{ translateX: 0 }, { translateY: 0 }] },
});
