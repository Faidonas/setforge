import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { SetForgeColors } from '@/constants/setforge-theme';
import { WorkoutBottomNav } from '@/features/navigation/components/workout-bottom-nav';
import { ActiveWorkoutBar } from '@/features/workouts/active-workout/active-workout-bar';

export default function MainLayout() {
  return (
    <View style={styles.background}>
      <View style={styles.shell}>
        <Tabs
          backBehavior="history"
          detachInactiveScreens={false}
          initialRouteName="start-workout"
          screenOptions={{
            animation: 'fade',
            freezeOnBlur: false,
            headerShown: false,
            lazy: false,
            sceneStyle: styles.content,
          }}
          tabBar={({ state }) => {
            const routeName = state.routes[state.index]?.name;
            const activeItem = routeName === 'exercises'
              ? 'Exercises'
              : routeName === 'history'
                ? 'History'
                : routeName === 'profile'
                  ? 'Profile'
                : 'Start';

            return (
              <>
                <ActiveWorkoutBar />
                <WorkoutBottomNav activeItem={activeItem} />
              </>
            );
          }}>
          <Tabs.Screen name="history" />
          <Tabs.Screen name="start-workout" />
          <Tabs.Screen name="exercises" />
          <Tabs.Screen name="profile" />
        </Tabs>
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
