import { Image } from 'expo-image';
import { usePathname, useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import type { PropsWithChildren, ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { SetForgeColors } from '@/constants/setforge-theme';

const icons = {
  overview: require('@/assets/images/coach-web/layout-dashboard.svg'),
  clients: require('@/assets/images/coach-web/users.svg'),
  templates: require('@/assets/images/coach-web/layers.svg'),
  exercises: require('@/assets/images/coach-web/activity.svg'),
  settings: require('@/assets/images/coach-web/settings.svg'),
  search: require('@/assets/images/coach-web/search.svg'),
  bell: require('@/assets/images/coach-web/bell.svg'),
  chevronDown: require('@/assets/images/coach-web/chevron-down.svg'),
  help: require('@/assets/images/coach-web/circle-help.svg'),
};

type NavItem = { label: string; href: '/coach' | '/coach/clients' | '/coach/templates' | '/coach/exercises'; icon: keyof typeof icons; count?: string };
const navItems: NavItem[] = [
  { label: 'Overview', href: '/coach', icon: 'overview' },
  { label: 'Clients', href: '/coach/clients', icon: 'clients', count: '24' },
  { label: 'Templates', href: '/coach/templates', icon: 'templates' },
  { label: 'Exercises', href: '/coach/exercises', icon: 'exercises' },
];

export function CoachShell({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const router = useRouter();
  const crumbs = pathname.split('/').filter(Boolean).slice(1);
  const current = crumbs.length ? crumbs.map((part) => part.replace(/-/g, ' ')).join(' / ') : 'Command center';

  return (
    <View style={styles.shell}>
      <View style={styles.sidebar}>
        <View>
          <View style={styles.brand}><View style={styles.brandMark} /><Text style={styles.brandText}>SETFORGE</Text></View>
          <View style={styles.workspace}><Text style={styles.workspaceName}>Alex Morgan</Text><Text style={styles.eyebrow}>COACH WORKSPACE</Text></View>
          <View style={styles.nav}>
            {navItems.map((item) => {
              const selected = item.href === '/coach' ? pathname === '/coach' : pathname.startsWith(item.href);
              return (
                <Pressable key={item.href} accessibilityRole="link" onPress={() => router.push(item.href as Href)} style={({ pressed }) => [styles.navItem, selected && styles.navItemSelected, pressed && styles.pressed]}>
                  <Image source={icons[item.icon]} style={styles.navIcon} contentFit="contain" />
                  <Text style={[styles.navLabel, selected && styles.navLabelSelected]}>{item.label}</Text>
                  {item.count ? <Text style={styles.navCount}>{item.count}</Text> : null}
                </Pressable>
              );
            })}
            <View style={styles.navItem}><Image source={icons.settings} style={styles.navIcon} contentFit="contain" /><Text style={styles.navLabel}>Settings</Text></View>
          </View>
        </View>
        <View style={styles.sidebarFooter}>
          <View style={styles.divider} />
          <Text style={styles.eyebrow}>COACH PRO • 24 / 30 CLIENTS</Text>
          <View style={styles.helpRow}><Image source={icons.help} style={styles.smallIcon} contentFit="contain" /><Text style={styles.footerLink}>Help & resources</Text></View>
          <Text style={styles.eyebrow}>SETFORGE / v1.0</Text>
        </View>
      </View>
      <View style={styles.workspaceArea}>
        <View style={styles.topbar}>
          <View style={styles.breadcrumb}><Text style={styles.breadcrumbMuted}>Coach workspace</Text><Text style={styles.breadcrumbSep}>›</Text><Text numberOfLines={1} style={styles.breadcrumbCurrent}>{current}</Text></View>
          <View style={styles.topActions}>
            <View style={styles.search}><Image source={icons.search} style={styles.smallIcon} contentFit="contain" /><TextInput accessibilityLabel="Search workspace" placeholder="Search workspace…" placeholderTextColor={SetForgeColors.textSecondary} style={styles.searchInput} /></View>
            <View style={styles.bellWrap}><Image source={icons.bell} style={styles.smallIcon} contentFit="contain" /><View style={styles.unread} /></View>
            <View style={styles.avatar}><Text style={styles.avatarText}>AM</Text></View>
            <Text style={styles.coachName}>Alex Morgan</Text>
            <Image source={icons.chevronDown} style={styles.chevron} contentFit="contain" />
          </View>
        </View>
        <ScrollView contentContainerStyle={styles.scrollContent} style={styles.contentScroll}>{children}</ScrollView>
      </View>
    </View>
  );
}

export function PageHeading({ title, subtitle, actions }: { title: string; subtitle: string; actions?: ReactNode }) {
  return <View style={styles.pageHeading}><View style={styles.headingCopy}><Text style={styles.pageTitle}>{title}</Text><Text style={styles.pageSubtitle}>{subtitle}</Text></View>{actions ? <View style={styles.headingActions}>{actions}</View> : null}</View>;
}

export function ActionButton({ label, secondary = false, onPress }: { label: string; secondary?: boolean; onPress?: () => void }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.actionButton, secondary && styles.actionButtonSecondary, pressed && styles.pressed]}><Text style={[styles.actionText, secondary && styles.actionTextSecondary]}>{label.toUpperCase()}</Text></Pressable>;
}

export function Panel({ children, style }: PropsWithChildren<{ style?: object }>) {
  return <View style={[styles.panel, style]}>{children}</View>;
}

export function StatusBadge({ children, tone = 'accent' }: PropsWithChildren<{ tone?: 'accent' | 'warning' | 'danger' | 'muted' }>) {
  const toneStyle = tone === 'warning' ? styles.badgeWarning : tone === 'danger' ? styles.badgeDanger : tone === 'muted' ? styles.badgeMuted : styles.badgeAccent;
  const textStyle = tone === 'warning' ? styles.badgeWarningText : tone === 'danger' ? styles.badgeDangerText : tone === 'muted' ? styles.badgeMutedText : styles.badgeAccentText;
  return <View style={[styles.badge, toneStyle]}><Text style={[styles.badgeText, textStyle]}>{children}</Text></View>;
}

export const coachStyles = StyleSheet.create({
  page: { width: '100%', maxWidth: 1200, alignSelf: 'center', padding: 32, gap: 24 },
  row: { flexDirection: 'row', gap: 16 },
  sectionLabel: { color: SetForgeColors.textPrimary, fontSize: 11, fontWeight: '800', letterSpacing: .3, textTransform: 'uppercase' },
  sectionTitle: { color: SetForgeColors.textPrimary, fontSize: 17, lineHeight: 22, fontWeight: '800' },
  muted: { color: SetForgeColors.textSecondary, fontSize: 12, lineHeight: 18 },
  mono: { fontFamily: 'monospace' },
});

const styles = StyleSheet.create({
  shell: { flex: 1, minHeight: '100%', flexDirection: 'row', backgroundColor: SetForgeColors.canvas },
  sidebar: { width: 240, minHeight: '100%', paddingHorizontal: 16, paddingVertical: 24, justifyContent: 'space-between', borderRightWidth: 1, borderRightColor: SetForgeColors.border, backgroundColor: SetForgeColors.canvas },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 8 },
  brandMark: { width: 24, height: 24, borderRadius: 4, backgroundColor: SetForgeColors.accent },
  brandText: { color: SetForgeColors.textPrimary, fontSize: 23, fontWeight: '900', letterSpacing: -.8 },
  workspace: { marginTop: 32, padding: 16, gap: 4, borderWidth: 1, borderColor: SetForgeColors.border, borderRadius: 8, backgroundColor: SetForgeColors.surface },
  workspaceName: { color: SetForgeColors.textPrimary, fontSize: 14, fontWeight: '700' },
  eyebrow: { color: SetForgeColors.textSecondary, fontSize: 10, lineHeight: 15, fontFamily: 'monospace' },
  nav: { marginTop: 32, gap: 8 },
  navItem: { height: 48, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 8 },
  navItemSelected: { backgroundColor: SetForgeColors.accentTint },
  navIcon: { width: 18, height: 18 },
  navLabel: { color: SetForgeColors.textSecondary, fontSize: 14 },
  navLabelSelected: { color: SetForgeColors.accent, fontWeight: '700' },
  navCount: { color: SetForgeColors.textSecondary, fontSize: 11, fontFamily: 'monospace' },
  sidebarFooter: { gap: 16, padding: 8 },
  divider: { height: 1, backgroundColor: SetForgeColors.border },
  helpRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  footerLink: { color: SetForgeColors.textSecondary, fontSize: 12 },
  smallIcon: { width: 18, height: 18 },
  workspaceArea: { flex: 1, minWidth: 0 },
  topbar: { height: 80, paddingHorizontal: 32, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: SetForgeColors.border },
  breadcrumb: { minWidth: 180, flexDirection: 'row', alignItems: 'center', gap: 8 },
  breadcrumbMuted: { color: SetForgeColors.textSecondary, fontSize: 12 },
  breadcrumbSep: { color: SetForgeColors.textDisabled, fontSize: 16 },
  breadcrumbCurrent: { color: SetForgeColors.textPrimary, fontSize: 12, textTransform: 'capitalize' },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  search: { width: 280, height: 48, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: SetForgeColors.border, borderRadius: 8, backgroundColor: SetForgeColors.surface },
  searchInput: { flex: 1, color: SetForgeColors.textPrimary, fontSize: 14, outlineStyle: 'none' } as never,
  bellWrap: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  unread: { position: 'absolute', right: 3, top: 3, width: 5, height: 5, borderRadius: 3, backgroundColor: SetForgeColors.accent },
  avatar: { width: 32, height: 32, borderRadius: 999, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: SetForgeColors.border, backgroundColor: SetForgeColors.surface },
  avatarText: { color: SetForgeColors.textPrimary, fontSize: 11, fontFamily: 'monospace' },
  coachName: { color: SetForgeColors.textPrimary, fontSize: 12, fontWeight: '700' },
  chevron: { width: 14, height: 14 },
  contentScroll: { flex: 1 },
  scrollContent: { minWidth: 980 },
  pageHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headingCopy: { gap: 8 },
  pageTitle: { color: SetForgeColors.textPrimary, fontSize: 32, lineHeight: 40, fontWeight: '900', letterSpacing: -.8 },
  pageSubtitle: { color: SetForgeColors.textSecondary, fontSize: 13, lineHeight: 20 },
  headingActions: { flexDirection: 'row', gap: 8 },
  actionButton: { height: 48, minWidth: 176, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: SetForgeColors.accent },
  actionButtonSecondary: { minWidth: 152, borderWidth: 1, borderColor: SetForgeColors.accent, backgroundColor: 'transparent' },
  actionText: { color: SetForgeColors.canvas, fontSize: 12, fontWeight: '900' },
  actionTextSecondary: { color: SetForgeColors.accent },
  pressed: { opacity: .72 },
  panel: { borderWidth: 1, borderColor: SetForgeColors.border, borderRadius: 8, backgroundColor: SetForgeColors.surface },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  badgeAccent: { backgroundColor: SetForgeColors.accentTint },
  badgeWarning: { backgroundColor: 'rgba(255,187,51,.08)' },
  badgeDanger: { backgroundColor: 'rgba(255,76,97,.09)' },
  badgeMuted: { backgroundColor: 'rgba(255,255,255,.03)' },
  badgeText: { fontFamily: 'monospace', fontSize: 10, lineHeight: 13, fontWeight: '700', textTransform: 'uppercase' },
  badgeAccentText: { color: SetForgeColors.accent },
  badgeWarningText: { color: '#FFBB33' },
  badgeDangerText: { color: '#FF4C61' },
  badgeMutedText: { color: SetForgeColors.textSecondary },
});
