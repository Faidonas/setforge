import { Slot, usePathname } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { SetForgeColors } from '@/constants/setforge-theme';
import { WorkoutBottomNav } from '@/features/navigation/components/workout-bottom-nav';

export default function MainLayout() {
  const pathname = usePathname();
  const activeItem = pathname === '/exercises' ? 'Exercises' : 'Start';

  return (
    <View style={styles.background}>
      <View style={styles.shell}>
        <View style={styles.content}>
          <Slot />
        </View>
        <WorkoutBottomNav activeItem={activeItem} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: SetForgeColors.canvas,
  },
  shell: {
    flex: 1,
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    backgroundColor: SetForgeColors.canvas,
  },
  content: {
    flex: 1,
  },
});
