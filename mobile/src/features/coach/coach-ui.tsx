import { Image } from 'expo-image';
import { usePathname, useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import type { PropsWithChildren, ReactNode } from 'react';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { NonCredentialTextInput } from '@/components/non-credential-text-input';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CoachColors } from '@/constants/setforge-theme';
import { useAuth } from '@/features/auth/auth-context';
import { type CoachThemeMode, useCoachTheme } from '@/features/coach/coach-theme';

const icons = {
  overview: require('@/assets/images/coach-web-light/layout-dashboard.svg'),
  clients: require('@/assets/images/coach-web-light/users.svg'),
  templates: require('@/assets/images/coach-web-light/layers.svg'),
  exercises: require('@/assets/images/coach-web-light/activity.svg'),
  training: require('@/assets/images/figma/plus.svg'),
  settings: require('@/assets/images/coach-web-light/settings.svg'),
  search: require('@/assets/images/coach-web-light/search.svg'),
  bell: require('@/assets/images/coach-web-light/bell.svg'),
  help: require('@/assets/images/coach-web-light/circle-help.svg'),
  chevronDown: require('@/assets/images/coach-web-light/chevron-down.svg'),
};

type NavItem = { label: string; href: '/coach' | '/coach/clients' | '/coach/templates' | '/coach/exercises' | '/coach/settings'; icon: keyof typeof icons };
const navItems: NavItem[] = [
  { label: 'Overview', href: '/coach', icon: 'overview' },
  { label: 'Clients', href: '/coach/clients', icon: 'clients' },
  { label: 'Templates', href: '/coach/templates', icon: 'templates' },
  { label: 'Exercises', href: '/coach/exercises', icon: 'exercises' },
  { label: 'Settings', href: '/coach/settings', icon: 'settings' },
];

const themeOptions: { label: string; mode: CoachThemeMode }[] = [
  { label: 'Dark', mode: 'dark' },
  { label: 'Light', mode: 'light' },
];

const COACH_SIDEBAR_BREAKPOINT = 900;
const COACH_COMPACT_BREAKPOINT = 700;

export function useCoachLayout() {
  const { width } = useWindowDimensions();
  return {
    width,
    isCompact: width < COACH_COMPACT_BREAKPOINT,
    isSidebarCollapsed: width < COACH_SIDEBAR_BREAKPOINT,
  };
}

export function CoachShell({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();
  const { mode, setMode } = useCoachTheme();
  const { isCompact, isSidebarCollapsed } = useCoachLayout();
  const safeAreaInsets = useSafeAreaInsets();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const crumbs = pathname.split('/').filter(Boolean).slice(1);
  const current = crumbs.length ? crumbs.map((part) => part.replace(/-/g, ' ')).join(' / ') : 'Command center';
  const email = auth.user?.email ?? 'SetForge account';
  const displayName = resolveDisplayName(auth.user?.user_metadata?.full_name, email);
  const initials = getInitials(displayName);

  async function signOut() {
    if (isSigningOut) return;
    setIsSigningOut(true);
    setSignOutError(null);
    try {
      await auth.signOut();
      setAccountMenuOpen(false);
    } catch (error) {
      setSignOutError(error instanceof Error ? error.message : 'Could not sign out.');
      setIsSigningOut(false);
    }
  }

  function navigateFromMenu(href: '/coach/settings' | '/home') {
    setAccountMenuOpen(false);
    router.navigate(href as Href);
  }

  function renderNavigation(horizontal = false) {
    const items = navItems.map((item) => {
      const selected = item.href === '/coach' ? pathname === '/coach' : pathname.startsWith(item.href);
      return (
        <Pressable
          key={item.href}
          accessibilityRole="tab"
          accessibilityState={{ selected }}
          onPress={() => {
            if (!selected) router.navigate(item.href as Href);
          }}
          style={({ pressed }) => [
            styles.navItem,
            horizontal && styles.navItemHorizontal,
            selected && styles.navItemSelected,
            horizontal && selected && styles.navItemHorizontalSelected,
            pressed && styles.pressed,
          ]}>
          {horizontal && selected ? <View style={styles.navActiveIndicator} /> : null}
          <Image
            source={icons[item.icon]}
            style={styles.navIcon}
            contentFit="contain"
            tintColor={selected ? CoachColors.accentText : CoachColors.textSecondary}
          />
          <Text
            numberOfLines={1}
            style={[
              styles.navLabel,
              horizontal && styles.navLabelHorizontal,
              selected && styles.navLabelSelected,
            ]}>
            {item.label}
          </Text>
        </Pressable>
      );
    });

    if (horizontal) return items;
    return <>{items}</>;
  }

  return (
    <View style={[styles.shell, isSidebarCollapsed && styles.shellCompact]}>
      {!isSidebarCollapsed ? <View style={styles.sidebar}>
        <View>
          <View style={styles.brand}><View style={styles.brandMark} /><Text style={styles.brandText}>SETFORGE</Text></View>
          <View style={styles.workspace}><Text style={styles.workspaceName}>Coach workspace</Text><Text style={styles.eyebrow}>SETFORGE TRAINER</Text></View>
          <View style={styles.nav}>{renderNavigation()}</View>
        </View>
        <View style={styles.sidebarFooter}>
          <View style={styles.divider} />
          <Text style={styles.eyebrow}>LIVE BACKEND DATA</Text>
          <View style={styles.helpRow}><Image source={icons.help} style={styles.smallIcon} contentFit="contain" tintColor={CoachColors.textSecondary} /><Text style={styles.footerLink}>Help & resources</Text></View>
          <Text style={styles.eyebrow}>SETFORGE / v1.0</Text>
        </View>
      </View> : null}
      <View style={styles.workspaceArea}>
        <View
          style={[
            styles.topbar,
            isSidebarCollapsed && styles.topbarCompact,
            isSidebarCollapsed && { height: 58 + safeAreaInsets.top, paddingTop: safeAreaInsets.top },
          ]}>
          {isSidebarCollapsed ? <View style={styles.mobileBrand}><View style={styles.brandMark} /><Text style={styles.mobileBrandText}>SETFORGE</Text></View> : null}
          {isSidebarCollapsed
            ? !isCompact && <Text numberOfLines={1} style={styles.mobileCurrent}>{current}</Text>
            : <View style={styles.breadcrumb}><Text style={styles.breadcrumbMuted}>Coach workspace</Text><Text style={styles.breadcrumbSep}>›</Text><Text numberOfLines={1} style={styles.breadcrumbCurrent}>{current}</Text></View>}
          <View style={styles.topActions}>
            {!isSidebarCollapsed ? <View style={styles.search}><Image source={icons.search} style={styles.smallIcon} contentFit="contain" tintColor={CoachColors.textSecondary} /><NonCredentialTextInput accessibilityLabel="Search workspace" placeholder="Search workspace…" placeholderTextColor={CoachColors.textSecondary} style={styles.searchInput} /></View> : null}
            {!isSidebarCollapsed ? <View style={styles.bellWrap}><Image source={icons.bell} style={styles.smallIcon} contentFit="contain" tintColor={CoachColors.textSecondary} /><View style={styles.unread} /></View> : null}
            <Pressable
              accessibilityLabel="Open account menu"
              accessibilityRole="button"
              accessibilityState={{ expanded: accountMenuOpen }}
              onPress={() => setAccountMenuOpen((open) => !open)}
              style={({ pressed }) => [styles.accountTrigger, pressed && styles.pressed]}>
              <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>
              {!isCompact ? <Text numberOfLines={1} style={styles.coachName}>{displayName}</Text> : null}
              <Image source={icons.chevronDown} style={styles.chevronIcon} contentFit="contain" tintColor={CoachColors.textSecondary} />
            </Pressable>
          </View>
        </View>
        {accountMenuOpen ? (
          <View style={styles.accountMenuLayer}>
            <Pressable accessibilityLabel="Close account menu" onPress={() => setAccountMenuOpen(false)} style={StyleSheet.absoluteFill} />
            <View style={[
              styles.accountMenu,
              isCompact && styles.accountMenuCompact,
              isSidebarCollapsed && { top: 58 + safeAreaInsets.top },
            ]}>
              <View style={styles.menuIdentity}>
                <View style={styles.menuAvatar}><Text style={styles.menuAvatarText}>{initials}</Text></View>
                <View style={styles.menuIdentityCopy}>
                  <Text numberOfLines={1} style={styles.menuName}>{displayName}</Text>
                  <Text numberOfLines={1} style={styles.menuEmail}>{email}</Text>
                </View>
              </View>
              <View style={styles.menuDivider} />
              <AccountMenuItem
                icon={icons.settings}
                label="Settings"
                onPress={() => navigateFromMenu('/coach/settings')}
              />
              <AccountMenuItem
                icon={icons.training}
                label="Switch to training"
                onPress={() => navigateFromMenu('/home')}
              />
              <View style={styles.menuDivider} />
              <Text style={styles.menuSectionLabel}>THEME</Text>
              <View accessibilityRole="radiogroup" style={styles.themeOptions}>
                {themeOptions.map((option) => {
                  const selected = mode === option.mode;
                  return (
                    <Pressable
                      accessibilityRole="radio"
                      accessibilityState={{ checked: selected }}
                      key={option.mode}
                      onPress={() => setMode(option.mode)}
                      style={({ pressed }) => [styles.themeOption, pressed && styles.menuItemPressed]}>
                      <View style={[styles.themeDot, selected && styles.themeDotSelected]} />
                      <Text style={[styles.themeLabel, selected && styles.themeLabelSelected]}>{option.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
              <View style={styles.menuDivider} />
              {signOutError ? <Text style={styles.signOutError}>{signOutError}</Text> : null}
              <Pressable
                accessibilityRole="button"
                disabled={isSigningOut}
                onPress={() => void signOut()}
                style={({ pressed }) => [styles.signOutMenuItem, (pressed || isSigningOut) && styles.menuItemPressed]}>
                <Text style={styles.signOutMenuLabel}>{isSigningOut ? 'Signing out…' : 'Sign out'}</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
        <ScrollView contentContainerStyle={[styles.scrollContent, isSidebarCollapsed && styles.scrollContentCompact]} style={styles.contentScroll}>{children}</ScrollView>
        {isSidebarCollapsed ? (
          <View style={[styles.mobileNavigation, { height: 58 + safeAreaInsets.bottom, paddingBottom: safeAreaInsets.bottom }]}>
            <View style={styles.mobileNavigationContent}>{renderNavigation(true)}</View>
          </View>
        ) : null}
      </View>
    </View>
  );
}

function AccountMenuItem({ icon, label, onPress }: { icon: number; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}>
      <Image source={icon} style={styles.menuItemIcon} contentFit="contain" tintColor={CoachColors.textSecondary} />
      <Text style={styles.menuItemLabel}>{label}</Text>
    </Pressable>
  );
}

function resolveDisplayName(value: unknown, email: string) {
  return typeof value === 'string' && value.trim() ? value.trim() : email.split('@')[0];
}

function getInitials(displayName: string) {
  return displayName.split(/\s+/).slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join('') || 'SF';
}

export function PageHeading({ title, subtitle, actions }: { title: string; subtitle: string; actions?: ReactNode }) {
  const { isCompact } = useCoachLayout();
  return <View style={[styles.pageHeading, isCompact && styles.pageHeadingCompact]}><View style={styles.headingCopy}><Text style={[styles.pageTitle, isCompact && styles.pageTitleCompact]}>{title}</Text><Text style={styles.pageSubtitle}>{subtitle}</Text></View>{actions ? <View style={[styles.headingActions, isCompact && styles.headingActionsCompact]}>{actions}</View> : null}</View>;
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
  pageCompact: { padding: 16, gap: 18 },
  row: { flexDirection: 'row', gap: 16 },
  sectionLabel: { color: CoachColors.textPrimary, fontSize: 11, fontWeight: '800', letterSpacing: .3, textTransform: 'uppercase' },
  sectionTitle: { color: CoachColors.textPrimary, fontSize: 17, lineHeight: 22, fontWeight: '800' },
  muted: { color: CoachColors.textSecondary, fontSize: 12, lineHeight: 18 },
  mono: { fontFamily: 'monospace' },
});

const styles = StyleSheet.create({
  shell: { flex: 1, minHeight: '100%', flexDirection: 'row', backgroundColor: CoachColors.canvas },
  shellCompact: { flexDirection: 'column' },
  sidebar: { width: 240, minHeight: '100%', paddingHorizontal: 16, paddingVertical: 24, justifyContent: 'space-between', borderRightWidth: 1, borderRightColor: CoachColors.border, backgroundColor: CoachColors.surface },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 8 },
  brandMark: { width: 24, height: 24, borderRadius: 4, backgroundColor: CoachColors.accent },
  brandText: { color: CoachColors.textPrimary, fontSize: 23, fontWeight: '900', letterSpacing: -.8 },
  mobileBrand: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  mobileBrandText: { color: CoachColors.textPrimary, fontSize: 16, fontWeight: '900', letterSpacing: -.5 },
  mobileCurrent: { flex: 1, marginHorizontal: 12, color: CoachColors.textSecondary, fontSize: 10, textAlign: 'center', textTransform: 'capitalize' },
  workspace: { marginTop: 32, padding: 16, gap: 4, borderWidth: 1, borderColor: CoachColors.border, borderRadius: 8, backgroundColor: CoachColors.surface },
  workspaceName: { color: CoachColors.textPrimary, fontSize: 14, fontWeight: '700' },
  eyebrow: { color: CoachColors.textSecondary, fontSize: 10, lineHeight: 15, fontFamily: 'monospace' },
  nav: { marginTop: 32, gap: 8 },
  navItem: { height: 48, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 8 },
  navItemHorizontal: { position: 'relative', flex: 1, height: 58, paddingHorizontal: 2, paddingVertical: 7, flexDirection: 'column', justifyContent: 'center', gap: 3, borderRadius: 0 },
  navItemHorizontalSelected: { backgroundColor: 'transparent' },
  navActiveIndicator: { position: 'absolute', top: 0, width: 28, height: 3, borderRadius: 2, backgroundColor: CoachColors.accent },
  navItemSelected: { backgroundColor: CoachColors.accentTint },
  navIcon: { width: 18, height: 18 },
  navLabel: { color: CoachColors.textSecondary, fontSize: 14 },
  navLabelHorizontal: { maxWidth: '100%', fontSize: 9, lineHeight: 11, textAlign: 'center' },
  navLabelSelected: { color: CoachColors.accentText, fontWeight: '700' },
  sidebarFooter: { gap: 16, padding: 8 },
  divider: { height: 1, backgroundColor: CoachColors.border },
  helpRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  footerLink: { color: CoachColors.textSecondary, fontSize: 12 },
  smallIcon: { width: 18, height: 18 },
  workspaceArea: { flex: 1, minWidth: 0, minHeight: 0 },
  topbar: { height: 80, paddingHorizontal: 32, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: CoachColors.border, backgroundColor: CoachColors.surface },
  topbarCompact: { height: 58, paddingHorizontal: 16 },
  breadcrumb: { minWidth: 180, flexDirection: 'row', alignItems: 'center', gap: 8 },
  breadcrumbMuted: { color: CoachColors.textSecondary, fontSize: 12 },
  breadcrumbSep: { color: CoachColors.textDisabled, fontSize: 16 },
  breadcrumbCurrent: { color: CoachColors.textPrimary, fontSize: 12, textTransform: 'capitalize' },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  search: { width: 280, height: 48, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: CoachColors.inputBorder, borderRadius: 8, backgroundColor: CoachColors.surface },
  searchInput: { flex: 1, color: CoachColors.textPrimary, fontSize: 14, outlineStyle: 'none' } as never,
  bellWrap: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  unread: { position: 'absolute', right: 3, top: 3, width: 5, height: 5, borderRadius: 3, backgroundColor: CoachColors.accent },
  accountTrigger: { minWidth: 44, height: 42, paddingHorizontal: 5, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8, borderRadius: 7 },
  avatar: { width: 34, height: 34, borderRadius: 999, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: CoachColors.border, backgroundColor: CoachColors.surfaceMuted },
  avatarText: { color: CoachColors.textPrimary, fontSize: 11, fontFamily: 'monospace' },
  coachName: { maxWidth: 130, color: CoachColors.textPrimary, fontSize: 12, fontWeight: '700' },
  chevronIcon: { width: 14, height: 14 },
  accountMenuLayer: { position: 'absolute', zIndex: 100, top: 0, right: 0, bottom: 0, left: 0 },
  accountMenu: { position: 'absolute', top: 68, right: 24, width: 292, paddingVertical: 8, borderWidth: 1, borderColor: CoachColors.border, borderRadius: 10, backgroundColor: CoachColors.surface, shadowColor: '#000000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 24, elevation: 18 },
  accountMenuCompact: { right: 10, width: 280 },
  menuIdentity: { minHeight: 62, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 11 },
  menuAvatar: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18, borderWidth: 1, borderColor: CoachColors.border, backgroundColor: CoachColors.surfaceMuted },
  menuAvatarText: { color: CoachColors.textPrimary, fontFamily: 'monospace', fontSize: 11, fontWeight: '700' },
  menuIdentityCopy: { flex: 1, minWidth: 0 },
  menuName: { color: CoachColors.textPrimary, fontSize: 12, fontWeight: '800' },
  menuEmail: { marginTop: 3, color: CoachColors.textSecondary, fontSize: 10 },
  menuDivider: { height: 1, marginVertical: 6, backgroundColor: CoachColors.border },
  menuItem: { minHeight: 42, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', gap: 11 },
  menuItemPressed: { backgroundColor: CoachColors.surfaceMuted, opacity: 0.82 },
  menuItemIcon: { width: 17, height: 17 },
  menuItemLabel: { color: CoachColors.textPrimary, fontSize: 12 },
  menuSectionLabel: { paddingHorizontal: 15, paddingTop: 5, paddingBottom: 4, color: CoachColors.textSecondary, fontFamily: 'monospace', fontSize: 9, fontWeight: '700' },
  themeOptions: { paddingBottom: 3 },
  themeOption: { minHeight: 36, paddingHorizontal: 17, flexDirection: 'row', alignItems: 'center', gap: 12 },
  themeDot: { width: 8, height: 8, marginHorizontal: 4, borderRadius: 4, borderWidth: 1, borderColor: CoachColors.textDisabled },
  themeDotSelected: { borderColor: CoachColors.accentText, backgroundColor: CoachColors.accentText },
  themeLabel: { color: CoachColors.textSecondary, fontSize: 12 },
  themeLabelSelected: { color: CoachColors.textPrimary, fontWeight: '700' },
  signOutError: { paddingHorizontal: 15, paddingVertical: 5, color: CoachColors.danger, fontSize: 10 },
  signOutMenuItem: { minHeight: 42, paddingHorizontal: 15, justifyContent: 'center' },
  signOutMenuLabel: { color: CoachColors.danger, fontSize: 12, fontWeight: '700' },
  mobileNavigation: { height: 58, borderTopWidth: 1, borderTopColor: CoachColors.border, backgroundColor: CoachColors.surface },
  mobileNavigationContent: { flex: 1, flexDirection: 'row', alignItems: 'stretch' },
  contentScroll: { flex: 1 },
  scrollContent: { minWidth: 980 },
  scrollContentCompact: { minWidth: 0 },
  pageHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pageHeadingCompact: { alignItems: 'stretch', flexDirection: 'column', gap: 16 },
  headingCopy: { gap: 8 },
  pageTitle: { color: CoachColors.textPrimary, fontSize: 32, lineHeight: 40, fontWeight: '900', letterSpacing: -.8 },
  pageTitleCompact: { fontSize: 26, lineHeight: 32 },
  pageSubtitle: { color: CoachColors.textSecondary, fontSize: 13, lineHeight: 20 },
  headingActions: { flexDirection: 'row', gap: 8 },
  headingActionsCompact: { flexWrap: 'wrap' },
  actionButton: { height: 48, minWidth: 176, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: CoachColors.accent },
  actionButtonSecondary: { minWidth: 152, borderWidth: 1, borderColor: CoachColors.accentText, backgroundColor: 'transparent' },
  actionText: { color: CoachColors.buttonText, fontSize: 12, fontWeight: '900' },
  actionTextSecondary: { color: CoachColors.accentText },
  pressed: { opacity: .72 },
  panel: { borderWidth: 1, borderColor: CoachColors.border, borderRadius: 8, backgroundColor: CoachColors.surface },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  badgeAccent: { backgroundColor: CoachColors.accentTint },
  badgeWarning: { backgroundColor: 'rgba(146,64,14,.08)' },
  badgeDanger: { backgroundColor: 'rgba(185,28,28,.08)' },
  badgeMuted: { backgroundColor: CoachColors.surfaceMuted },
  badgeText: { fontFamily: 'monospace', fontSize: 10, lineHeight: 13, fontWeight: '700', textTransform: 'uppercase' },
  badgeAccentText: { color: CoachColors.accentText },
  badgeWarningText: { color: CoachColors.warning },
  badgeDangerText: { color: CoachColors.danger },
  badgeMutedText: { color: CoachColors.textSecondary },
});
