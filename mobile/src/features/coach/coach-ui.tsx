import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter';
import { Sora_600SemiBold, Sora_700Bold } from '@expo-google-fonts/sora';
import { useFonts } from 'expo-font';
import { Image } from 'expo-image';
import { usePathname, useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import type { PropsWithChildren, ReactNode } from 'react';
import { useState } from 'react';
import {
  Pressable,
  type PressableProps,
  ScrollView,
  type StyleProp,
  StyleSheet,
  Text,
  type TextStyle,
  useWindowDimensions,
  View,
  type ViewStyle,
} from 'react-native';

import { NonCredentialTextInput } from '@/components/non-credential-text-input';
import { SpotterLogo } from '@/components/spotter-logo';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CoachColors } from '@/constants/setforge-theme';
import { useAuth } from '@/features/auth/auth-context';
import { type CoachThemeMode, useCoachTheme } from '@/features/coach/coach-theme';
import { CoachTypography } from '@/features/coach/coach-typography';

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

type CoachNavHref = '/coach' | '/coach/clients' | '/coach/templates' | '/coach/workout-builder' | '/coach/exercises' | '/coach/settings';
type NavItem = { label: string; shortLabel?: string; href: CoachNavHref; icon: keyof typeof icons };
const navItems: NavItem[] = [
  { label: 'Overview', href: '/coach', icon: 'overview' },
  { label: 'Clients', href: '/coach/clients', icon: 'clients' },
  { label: 'Templates', href: '/coach/templates', icon: 'templates' },
  { label: 'Workout builder', shortLabel: 'Builder', href: '/coach/workout-builder', icon: 'training' },
  { label: 'Exercises', href: '/coach/exercises', icon: 'exercises' },
  { label: 'Settings', href: '/coach/settings', icon: 'settings' },
];

const themeOptions: { label: string; mode: CoachThemeMode }[] = [
  { label: 'Dark', mode: 'dark' },
  { label: 'Light', mode: 'light' },
];

const COACH_SIDEBAR_WIDTH = 252;
const COACH_SIDEBAR_BREAKPOINT = 1120;
const COACH_COMPACT_BREAKPOINT = 820;
const COACH_NARROW_BREAKPOINT = 520;

export function useCoachLayout() {
  const { width } = useWindowDimensions();
  const isSidebarCollapsed = width < COACH_SIDEBAR_BREAKPOINT;
  const contentWidth = Math.max(0, width - (isSidebarCollapsed ? 0 : COACH_SIDEBAR_WIDTH));

  return {
    width,
    contentWidth,
    isCompact: contentWidth < COACH_COMPACT_BREAKPOINT,
    isNarrow: contentWidth < COACH_NARROW_BREAKPOINT,
    isSidebarCollapsed,
  };
}

type HoverPressableProps = Omit<PressableProps, 'children' | 'style'> & {
  children: ReactNode;
  hoverStyle?: StyleProp<ViewStyle>;
  pressedStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
};

export function HoverPressable({
  children,
  disabled,
  hoverStyle,
  onHoverIn,
  onHoverOut,
  pressedStyle,
  style,
  ...props
}: HoverPressableProps) {
  const [hovered, setHovered] = useState(false);
  return <Pressable
    {...props}
    disabled={disabled}
    onHoverIn={(event) => {
      if (!disabled) setHovered(true);
      onHoverIn?.(event);
    }}
    onHoverOut={(event) => {
      setHovered(false);
      onHoverOut?.(event);
    }}
    style={({ pressed }) => [
      styles.interactive,
      style,
      hovered && (hoverStyle ?? styles.interactiveHovered),
      pressed && (pressedStyle ?? styles.interactivePressed),
      disabled && styles.interactiveDisabled,
    ]}>
    {children}
  </Pressable>;
}

export function CoachShell({ children }: PropsWithChildren) {
  useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Sora_600SemiBold,
    Sora_700Bold,
  });
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
  const email = auth.user?.email ?? 'Spotter account';
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
        <HoverPressable
          key={item.href}
          accessibilityRole="tab"
          accessibilityState={{ selected }}
          onPress={() => {
            if (!selected) router.navigate(item.href as Href);
          }}
          hoverStyle={styles.navItemHovered}
          pressedStyle={styles.interactivePressed}
          style={[
            styles.navItem,
            horizontal && styles.navItemHorizontal,
            selected && styles.navItemSelected,
            horizontal && selected && styles.navItemHorizontalSelected,
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
            {horizontal ? item.shortLabel ?? item.label : item.label}
          </Text>
        </HoverPressable>
      );
    });

    if (horizontal) return items;
    return <>{items}</>;
  }

  return (
    <View style={[styles.shell, isSidebarCollapsed && styles.shellCompact]}>
      {!isSidebarCollapsed ? <View style={styles.sidebar}>
        <View>
          <View style={styles.brand}><SpotterLogo appearance={mode} width={196} /></View>
          <View style={styles.workspace}><Text style={styles.workspaceName}>Coach workspace</Text><Text style={styles.eyebrow}>SPOTTER TRAINER</Text></View>
          <View style={styles.nav}>{renderNavigation()}</View>
        </View>
        <View style={styles.sidebarFooter}>
          <View style={styles.divider} />
          <Text style={styles.eyebrow}>LIVE BACKEND DATA</Text>
          <View style={styles.helpRow}><Image source={icons.help} style={styles.smallIcon} contentFit="contain" tintColor={CoachColors.textSecondary} /><Text style={styles.footerLink}>Help & resources</Text></View>
          <Text style={styles.eyebrow}>SPOTTER / v1.0</Text>
        </View>
      </View> : null}
      <View style={styles.workspaceArea}>
        <View
          style={[
            styles.topbar,
            isSidebarCollapsed && styles.topbarCompact,
            isSidebarCollapsed && { height: 58 + safeAreaInsets.top, paddingTop: safeAreaInsets.top },
          ]}>
          {isSidebarCollapsed ? <View style={styles.mobileBrand}><SpotterLogo appearance={mode} width={144} /></View> : null}
          {isSidebarCollapsed
            ? !isCompact && <Text numberOfLines={1} style={styles.mobileCurrent}>{current}</Text>
            : <View style={styles.breadcrumb}><Text style={styles.breadcrumbMuted}>Coach workspace</Text><Text style={styles.breadcrumbSep}>›</Text><Text numberOfLines={1} style={styles.breadcrumbCurrent}>{current}</Text></View>}
          <View style={styles.topActions}>
            {!isSidebarCollapsed ? <View style={styles.search}><Image source={icons.search} style={styles.smallIcon} contentFit="contain" tintColor={CoachColors.textSecondary} /><NonCredentialTextInput accessibilityLabel="Search workspace" placeholder="Search workspace…" placeholderTextColor={CoachColors.textSecondary} style={styles.searchInput} /></View> : null}
            {!isSidebarCollapsed ? <View style={styles.bellWrap}><Image source={icons.bell} style={styles.smallIcon} contentFit="contain" tintColor={CoachColors.textSecondary} /><View style={styles.unread} /></View> : null}
            <HoverPressable
              accessibilityLabel="Open account menu"
              accessibilityRole="button"
              accessibilityState={{ expanded: accountMenuOpen }}
              hoverStyle={styles.accountTriggerHovered}
              onPress={() => setAccountMenuOpen((open) => !open)}
              style={styles.accountTrigger}>
              <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>
              {!isCompact ? <Text numberOfLines={1} style={styles.coachName}>{displayName}</Text> : null}
              <Image source={icons.chevronDown} style={styles.chevronIcon} contentFit="contain" tintColor={CoachColors.textSecondary} />
            </HoverPressable>
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
                    <HoverPressable
                      accessibilityRole="radio"
                      accessibilityState={{ checked: selected }}
                      hoverStyle={styles.themeOptionHovered}
                      key={option.mode}
                      onPress={() => setMode(option.mode)}
                      pressedStyle={styles.menuItemPressed}
                      style={styles.themeOption}>
                      <View style={[styles.themeDot, selected && styles.themeDotSelected]} />
                      <Text style={[styles.themeLabel, selected && styles.themeLabelSelected]}>{option.label}</Text>
                    </HoverPressable>
                  );
                })}
              </View>
              <View style={styles.menuDivider} />
              {signOutError ? <Text style={styles.signOutError}>{signOutError}</Text> : null}
              <HoverPressable
                accessibilityRole="button"
                disabled={isSigningOut}
                hoverStyle={styles.signOutMenuItemHovered}
                onPress={() => void signOut()}
                pressedStyle={styles.menuItemPressed}
                style={styles.signOutMenuItem}>
                <Text style={styles.signOutMenuLabel}>{isSigningOut ? 'Signing out…' : 'Sign out'}</Text>
              </HoverPressable>
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
    <HoverPressable accessibilityRole="button" hoverStyle={styles.menuItemHovered} onPress={onPress} pressedStyle={styles.menuItemPressed} style={styles.menuItem}>
      <Image source={icon} style={styles.menuItemIcon} contentFit="contain" tintColor={CoachColors.textSecondary} />
      <Text style={styles.menuItemLabel}>{label}</Text>
    </HoverPressable>
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

export function ActionButton({ label, secondary = false, onPress, textStyle }: { label: string; secondary?: boolean; onPress?: () => void; textStyle?: StyleProp<TextStyle> }) {
  const [hovered, setHovered] = useState(false);
  return <Pressable accessibilityRole="button" onHoverIn={() => setHovered(true)} onHoverOut={() => setHovered(false)} onPress={onPress} style={({ pressed }) => [styles.actionButton, secondary && styles.actionButtonSecondary, hovered && styles.actionButtonHovered, hovered && secondary && styles.actionButtonSecondaryHovered, pressed && styles.actionButtonPressed]}><Text style={[styles.actionText, secondary && styles.actionTextSecondary, textStyle]}>{label.toUpperCase()}</Text></Pressable>;
}

export function Panel({ children, style }: PropsWithChildren<{ style?: object }>) {
  return <View style={[styles.panel, style]}>{children}</View>;
}

export function StatusBadge({ children, tone = 'accent', textStyle: customTextStyle }: PropsWithChildren<{ tone?: 'accent' | 'warning' | 'danger' | 'muted'; textStyle?: StyleProp<TextStyle> }>) {
  const toneStyle = tone === 'warning' ? styles.badgeWarning : tone === 'danger' ? styles.badgeDanger : tone === 'muted' ? styles.badgeMuted : styles.badgeAccent;
  const textStyle = tone === 'warning' ? styles.badgeWarningText : tone === 'danger' ? styles.badgeDangerText : tone === 'muted' ? styles.badgeMutedText : styles.badgeAccentText;
  return <View style={[styles.badge, toneStyle]}><Text style={[styles.badgeText, textStyle, customTextStyle]}>{children}</Text></View>;
}

export const coachStyles = StyleSheet.create({
  page: { width: '100%', maxWidth: 1440, alignSelf: 'center', padding: 32, gap: 26 },
  pageCompact: { padding: 16, gap: 18 },
  row: { flexDirection: 'row', gap: 16 },
  sectionLabel: { color: CoachColors.textPrimary, fontSize: 11, letterSpacing: .3, textTransform: 'uppercase', ...CoachTypography.inter600 },
  sectionTitle: { color: CoachColors.textPrimary, fontSize: 17, lineHeight: 22, letterSpacing: -0.34, ...CoachTypography.sora600 },
  muted: { color: CoachColors.textSecondary, fontSize: 12, lineHeight: 18, ...CoachTypography.inter400 },
  mono: { ...CoachTypography.inter500 },
});

const styles = StyleSheet.create({
  interactive: { cursor: 'pointer', transitionDuration: '150ms', transitionProperty: 'transform, background-color, border-color, box-shadow, opacity', transitionTimingFunction: 'ease-out' } as never,
  interactiveHovered: { backgroundColor: CoachColors.surfaceMuted },
  interactivePressed: { opacity: .68, transform: [{ translateX: 0 }, { translateY: 0 }] },
  interactiveDisabled: { cursor: 'default' } as never,
  shell: { flex: 1, minHeight: '100%', flexDirection: 'row', backgroundColor: CoachColors.canvas },
  shellCompact: { flexDirection: 'column' },
  sidebar: { width: COACH_SIDEBAR_WIDTH, minHeight: '100%', paddingHorizontal: 18, paddingVertical: 26, justifyContent: 'space-between', borderRightWidth: 1, borderRightColor: CoachColors.border, backgroundColor: CoachColors.surface },
  brand: { padding: 8 },
  mobileBrand: { flexShrink: 0 },
  mobileCurrent: { flex: 1, marginHorizontal: 12, color: CoachColors.textSecondary, fontSize: 10, textAlign: 'center', textTransform: 'capitalize', ...CoachTypography.inter500 },
  workspace: { marginTop: 32, padding: 16, gap: 4, borderWidth: 1, borderColor: CoachColors.border, borderRadius: 10, backgroundColor: CoachColors.surfaceMuted },
  workspaceName: { color: CoachColors.textPrimary, fontSize: 14, letterSpacing: -.28, ...CoachTypography.sora600 },
  eyebrow: { color: CoachColors.textSecondary, fontSize: 10, lineHeight: 15, ...CoachTypography.inter500 },
  nav: { marginTop: 32, gap: 8 },
  navItem: { height: 46, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 9 },
  navItemHorizontal: { position: 'relative', flex: 1, height: 58, paddingHorizontal: 2, paddingVertical: 7, flexDirection: 'column', justifyContent: 'center', gap: 3, borderRadius: 0 },
  navItemHorizontalSelected: { backgroundColor: 'transparent' },
  navActiveIndicator: { position: 'absolute', top: 0, width: 28, height: 3, borderRadius: 2, backgroundColor: CoachColors.accent },
  navItemSelected: { backgroundColor: CoachColors.accentTint },
  navItemHovered: { backgroundColor: CoachColors.accentTint, transform: [{ translateX: 3 }] },
  navIcon: { width: 18, height: 18 },
  navLabel: { color: CoachColors.textSecondary, fontSize: 14, ...CoachTypography.inter400 },
  navLabelHorizontal: { maxWidth: '100%', fontSize: 9, lineHeight: 11, textAlign: 'center' },
  navLabelSelected: { color: CoachColors.accentText, ...CoachTypography.inter600 },
  sidebarFooter: { gap: 16, padding: 8 },
  divider: { height: 1, backgroundColor: CoachColors.border },
  helpRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  footerLink: { color: CoachColors.textSecondary, fontSize: 12, ...CoachTypography.inter400 },
  smallIcon: { width: 18, height: 18 },
  workspaceArea: { flex: 1, minWidth: 0, minHeight: 0 },
  topbar: { height: 76, paddingHorizontal: 36, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: CoachColors.border, backgroundColor: CoachColors.surface },
  topbarCompact: { height: 58, paddingHorizontal: 16 },
  breadcrumb: { minWidth: 180, flexDirection: 'row', alignItems: 'center', gap: 8 },
  breadcrumbMuted: { color: CoachColors.textSecondary, fontSize: 12, ...CoachTypography.inter400 },
  breadcrumbSep: { color: CoachColors.textDisabled, fontSize: 16, ...CoachTypography.inter400 },
  breadcrumbCurrent: { color: CoachColors.textPrimary, fontSize: 12, textTransform: 'capitalize', ...CoachTypography.inter500 },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  search: { width: 280, height: 42, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: CoachColors.border, borderRadius: 9, backgroundColor: CoachColors.surfaceMuted },
  searchInput: { flex: 1, color: CoachColors.textPrimary, fontSize: 14, outlineStyle: 'none', ...CoachTypography.inter400 } as never,
  bellWrap: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  unread: { position: 'absolute', right: 3, top: 3, width: 5, height: 5, borderRadius: 3, backgroundColor: CoachColors.accent },
  accountTrigger: { minWidth: 44, height: 42, paddingHorizontal: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 9, borderRadius: 9 },
  accountTriggerHovered: { backgroundColor: CoachColors.surfaceMuted, transform: [{ translateY: -1 }] },
  avatar: { width: 34, height: 34, borderRadius: 999, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: CoachColors.border, backgroundColor: CoachColors.surfaceMuted },
  avatarText: { color: CoachColors.textPrimary, fontSize: 11, ...CoachTypography.inter600 },
  coachName: { maxWidth: 130, color: CoachColors.textPrimary, fontSize: 12, ...CoachTypography.inter600 },
  chevronIcon: { width: 14, height: 14 },
  accountMenuLayer: { position: 'absolute', zIndex: 100, top: 0, right: 0, bottom: 0, left: 0 },
  accountMenu: { position: 'absolute', top: 68, right: 24, width: 292, paddingVertical: 8, borderWidth: 1, borderColor: CoachColors.border, borderRadius: 12, backgroundColor: CoachColors.surface, boxShadow: '0 14px 34px rgba(0, 0, 0, 0.22)' },
  accountMenuCompact: { right: 10, left: 10, width: 'auto' },
  menuIdentity: { minHeight: 62, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 11 },
  menuAvatar: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18, borderWidth: 1, borderColor: CoachColors.border, backgroundColor: CoachColors.surfaceMuted },
  menuAvatarText: { color: CoachColors.textPrimary, fontSize: 11, ...CoachTypography.inter600 },
  menuIdentityCopy: { flex: 1, minWidth: 0 },
  menuName: { color: CoachColors.textPrimary, fontSize: 12, ...CoachTypography.inter600 },
  menuEmail: { marginTop: 3, color: CoachColors.textSecondary, fontSize: 10, ...CoachTypography.inter400 },
  menuDivider: { height: 1, marginVertical: 6, backgroundColor: CoachColors.border },
  menuItem: { minHeight: 42, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', gap: 11 },
  menuItemPressed: { backgroundColor: CoachColors.surfaceMuted, opacity: 0.82 },
  menuItemHovered: { paddingLeft: 18, backgroundColor: CoachColors.accentTint },
  menuItemIcon: { width: 17, height: 17 },
  menuItemLabel: { color: CoachColors.textPrimary, fontSize: 12, ...CoachTypography.inter400 },
  menuSectionLabel: { paddingHorizontal: 15, paddingTop: 5, paddingBottom: 4, color: CoachColors.textSecondary, fontSize: 9, ...CoachTypography.inter600 },
  themeOptions: { paddingBottom: 3 },
  themeOption: { minHeight: 36, paddingHorizontal: 17, flexDirection: 'row', alignItems: 'center', gap: 12 },
  themeOptionHovered: { backgroundColor: CoachColors.surfaceMuted },
  themeDot: { width: 8, height: 8, marginHorizontal: 4, borderRadius: 4, borderWidth: 1, borderColor: CoachColors.textDisabled },
  themeDotSelected: { borderColor: CoachColors.accentText, backgroundColor: CoachColors.accentText },
  themeLabel: { color: CoachColors.textSecondary, fontSize: 12, ...CoachTypography.inter400 },
  themeLabelSelected: { color: CoachColors.textPrimary, ...CoachTypography.inter600 },
  signOutError: { paddingHorizontal: 15, paddingVertical: 5, color: CoachColors.danger, fontSize: 10, ...CoachTypography.inter400 },
  signOutMenuItem: { minHeight: 42, paddingHorizontal: 15, justifyContent: 'center' },
  signOutMenuItemHovered: { paddingLeft: 18, backgroundColor: 'rgba(185, 28, 28, 0.08)' },
  signOutMenuLabel: { color: CoachColors.danger, fontSize: 12, ...CoachTypography.inter600 },
  mobileNavigation: { height: 58, borderTopWidth: 1, borderTopColor: CoachColors.border, backgroundColor: CoachColors.surface },
  mobileNavigationContent: { flex: 1, flexDirection: 'row', alignItems: 'stretch' },
  contentScroll: { flex: 1, minWidth: 0 },
  scrollContent: { width: '100%', minWidth: 0, flexGrow: 1, alignItems: 'stretch' },
  scrollContentCompact: { minWidth: 0 },
  pageHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pageHeadingCompact: { alignItems: 'stretch', flexDirection: 'column', gap: 16 },
  headingCopy: { flex: 1, minWidth: 0, gap: 8 },
  pageTitle: { color: CoachColors.textPrimary, fontSize: 32, lineHeight: 40, letterSpacing: -.64, ...CoachTypography.sora700 },
  pageTitleCompact: { fontSize: 26, lineHeight: 32, letterSpacing: -.52 },
  pageSubtitle: { color: CoachColors.textSecondary, fontSize: 13, lineHeight: 20, ...CoachTypography.inter400 },
  headingActions: { flexDirection: 'row', gap: 8 },
  headingActionsCompact: { flexWrap: 'wrap' },
  actionButton: { height: 44, minWidth: 160, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center', borderRadius: 9, backgroundColor: CoachColors.accent, cursor: 'pointer', transitionDuration: '160ms', transitionProperty: 'transform, box-shadow, background-color, border-color', transitionTimingFunction: 'ease-out' } as never,
  actionButtonSecondary: { minWidth: 138, borderWidth: 1, borderColor: CoachColors.inputBorder, backgroundColor: CoachColors.surface },
  actionButtonHovered: { transform: [{ translateY: -2 }], boxShadow: '0 9px 22px rgba(0, 185, 198, 0.18)' },
  actionButtonSecondaryHovered: { borderColor: CoachColors.accentText, backgroundColor: CoachColors.accentTint, boxShadow: '0 8px 18px rgba(0, 0, 0, 0.08)' },
  actionButtonPressed: { opacity: .78, transform: [{ translateY: 0 }], boxShadow: 'none' },
  actionText: { color: CoachColors.buttonText, fontSize: 11, letterSpacing: .3, ...CoachTypography.inter600 },
  actionTextSecondary: { color: CoachColors.accentText },
  pressed: { opacity: .72 },
  panel: { borderWidth: 1, borderColor: CoachColors.border, borderRadius: 12, backgroundColor: CoachColors.surface, boxShadow: '0 4px 14px rgba(0, 0, 0, 0.04)' },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  badgeAccent: { backgroundColor: CoachColors.accentTint },
  badgeWarning: { backgroundColor: 'rgba(146,64,14,.08)' },
  badgeDanger: { backgroundColor: 'rgba(185,28,28,.08)' },
  badgeMuted: { backgroundColor: CoachColors.surfaceMuted },
  badgeText: { fontSize: 10, lineHeight: 13, textTransform: 'uppercase', ...CoachTypography.inter600 },
  badgeAccentText: { color: CoachColors.accentText },
  badgeWarningText: { color: CoachColors.warning },
  badgeDangerText: { color: CoachColors.danger },
  badgeMutedText: { color: CoachColors.textSecondary },
});
