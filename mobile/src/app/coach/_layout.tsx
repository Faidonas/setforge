import { Slot, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { canAccessCoachDashboard } from '@/constants/coach-access';
import { CoachColors } from '@/constants/setforge-theme';
import { CoachShell } from '@/features/coach/coach-ui';
import { CoachThemeProvider } from '@/features/coach/coach-theme';
import { getUserProfile } from '@/services/user-api';

function ProtectedCoachLayout() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    let current = true;
    getUserProfile()
      .then((profile) => {
        if (!current) return;
        if (canAccessCoachDashboard(profile.accountType)) setAuthorized(true);
        else router.replace('/start-workout');
      })
      .catch(() => {
        if (current) router.replace('/start-workout');
      });

    return () => {
      current = false;
    };
  }, [router]);

  if (!authorized) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={CoachColors.accent} />
      </View>
    );
  }

  return <CoachShell><Slot /></CoachShell>;
}

export default function CoachLayout() {
  return <CoachThemeProvider><ProtectedCoachLayout /></CoachThemeProvider>;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CoachColors.canvas,
  },
});
