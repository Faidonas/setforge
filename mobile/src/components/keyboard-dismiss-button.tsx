import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import {
  Keyboard,
  type KeyboardEvent,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import { SetForgeColors } from '@/constants/setforge-theme';

export function KeyboardDismissButton() {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const handleShow = (event: KeyboardEvent) => {
      if (Platform.OS === 'ios') Keyboard.scheduleLayoutAnimation(event);
      setKeyboardHeight(event.endCoordinates.height);
    };
    const handleHide = (event: KeyboardEvent) => {
      if (Platform.OS === 'ios') Keyboard.scheduleLayoutAnimation(event);
      setKeyboardHeight(0);
    };
    const showSubscription = Keyboard.addListener(showEvent, handleShow);
    const hideSubscription = Keyboard.addListener(hideEvent, handleHide);

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  if (keyboardHeight === 0) return null;

  return (
    <View pointerEvents="box-none" style={styles.overlay}>
      <Pressable
        accessibilityLabel="Hide keyboard"
        accessibilityRole="button"
        hitSlop={8}
        onPress={Keyboard.dismiss}
        style={[
          styles.button,
          Platform.OS === 'ios' ? { bottom: keyboardHeight + 10 } : styles.androidButton,
        ]}>
        <SymbolView
          name={{ ios: 'keyboard.chevron.compact.down', android: 'keyboard_arrow_down', web: 'keyboard_arrow_down' }}
          size={18}
          tintColor={SetForgeColors.textPrimary}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 1000,
  },
  button: {
    position: 'absolute',
    right: 12,
    width: 44,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: SetForgeColors.border,
    borderRadius: 9,
    backgroundColor: SetForgeColors.surfaceMuted,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  androidButton: { bottom: 8 },
});
