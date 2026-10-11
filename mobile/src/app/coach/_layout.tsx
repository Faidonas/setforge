import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { canAccessCoachDashboard } from '@/constants/coach-access';
import { SetForgeColors } from '@/constants/setforge-theme';
import { getUserProfile } from '@/services/user-api';

export default function CoachLayout() {
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
        <ActivityIndicator color={SetForgeColors.accent} />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#09090B' } }} />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SetForgeColors.canvas,
  },
});
