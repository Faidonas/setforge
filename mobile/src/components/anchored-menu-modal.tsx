import { type ReactNode, useEffect, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';

export type MenuAnchor = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export function AnchoredMenuModal({
  visible,
  anchor,
  onClose,
  children,
  width = 250,
  estimatedHeight = 280,
  placement = 'anchor',
  horizontalAlign = 'end',
  anchorContentInset = 0,
}: {
  visible: boolean;
  anchor: MenuAnchor | null;
  onClose: () => void;
  children: ReactNode;
  width?: number;
  estimatedHeight?: number;
  placement?: 'anchor' | 'center';
  horizontalAlign?: 'center' | 'end' | 'start-if-fits';
  anchorContentInset?: number;
}) {
  const [progress] = useState(() => new Animated.Value(0));
  const window = useWindowDimensions();
  const gap = 7;
  const margin = 12;
  const resolvedAnchor = anchor ?? { x: window.width - margin, y: margin, width: 0, height: 0 };
  const anchorCenterX = resolvedAnchor.x + resolvedAnchor.width / 2;
  const anchorCenterY = resolvedAnchor.y + resolvedAnchor.height / 2;
  const openAbove =
    resolvedAnchor.y + resolvedAnchor.height + gap + estimatedHeight > window.height - margin;
  const endAlignedLeft = resolvedAnchor.x + resolvedAnchor.width - width;
  const startAlignedLeft = anchorCenterX - anchorContentInset;
  const preferredLeft = horizontalAlign === 'center'
    ? anchorCenterX - width / 2
    : horizontalAlign === 'start-if-fits' && startAlignedLeft + width <= window.width - margin
      ? startAlignedLeft
      : endAlignedLeft;
  const anchoredLeft = Math.min(
    Math.max(margin, preferredLeft),
    window.width - width - margin,
  );
  const anchoredTop = openAbove
    ? Math.max(margin, resolvedAnchor.y - estimatedHeight - gap)
    : resolvedAnchor.y + resolvedAnchor.height + gap;
  const left = placement === 'center' ? (window.width - width) / 2 : anchoredLeft;
  const top = placement === 'center' ? (window.height - estimatedHeight) / 2 : anchoredTop;
  const originX = placement === 'center' ? width / 2 : anchorCenterX - left;
  const originY = placement === 'center' ? estimatedHeight / 2 : anchorCenterY - top;

  useEffect(() => {
    if (!visible) return;
    progress.stopAnimation();
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: 100,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [progress, visible, resolvedAnchor.x, resolvedAnchor.y]);

  return (
    <Modal animationType="none" onRequestClose={onClose} statusBarTranslucent transparent visible={visible}>
      <View style={styles.screen}>
        <Pressable accessibilityLabel="Close options" onPress={onClose} style={styles.backdrop} />
        <Animated.View
          renderToHardwareTextureAndroid
          shouldRasterizeIOS
          style={[
            styles.popupPosition,
            {
              left,
              top,
              width,
              opacity: progress,
              transform: [{ scale: progress }],
              transformOrigin: [originX, originY, 0],
            },
          ]}>
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  popupPosition: { position: 'absolute' },
});
