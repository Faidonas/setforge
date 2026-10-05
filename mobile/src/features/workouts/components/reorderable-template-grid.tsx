/* eslint-disable react-hooks/immutability -- Reanimated shared values are mutable UI-thread state. */
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { type LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

const COLUMN_COUNT = 2;
const CARD_HEIGHT = 184;
const GAP = 12;

type ReorderableTemplateGridProps<T> = {
  data: T[];
  keyExtractor: (item: T) => string;
  onReorder: (orderedItems: T[]) => void;
  renderItem: (item: T) => ReactNode;
};

type GridItemProps<T> = {
  cellWidth: number;
  index: number;
  item: T;
  itemCount: number;
  itemKey: string;
  onDrop: (itemKey: string, destination: number) => void;
  positions: SharedValue<Record<string, number>>;
  renderItem: (item: T) => ReactNode;
};

function positionMap<T>(data: T[], keyExtractor: (item: T) => string) {
  return Object.fromEntries(data.map((item, index) => [keyExtractor(item), index]));
}

function ReorderableGridItem<T>({
  cellWidth,
  index,
  item,
  itemCount,
  itemKey,
  onDrop,
  positions,
  renderItem,
}: GridItemProps<T>) {
  const active = useSharedValue(false);
  const startPosition = useSharedValue(index);
  const translationX = useSharedValue(0);
  const translationY = useSharedValue(0);

  const gesture = useMemo(
    () => Gesture.Pan()
      .activateAfterLongPress(280)
      .onStart(() => {
        startPosition.value = positions.value[itemKey] ?? index;
        translationX.value = 0;
        translationY.value = 0;
        active.value = true;
      })
      .onUpdate((event) => {
        translationX.value = event.translationX;
        translationY.value = event.translationY;

        const start = startPosition.value;
        const startColumn = start % COLUMN_COUNT;
        const startRow = Math.floor(start / COLUMN_COUNT);
        const centerX = startColumn * (cellWidth + GAP) + event.translationX + cellWidth / 2;
        const centerY = startRow * (CARD_HEIGHT + GAP) + event.translationY + CARD_HEIGHT / 2;
        const column = Math.max(
          0,
          Math.min(COLUMN_COUNT - 1, Math.floor(centerX / (cellWidth + GAP))),
        );
        const row = Math.max(0, Math.floor(centerY / (CARD_HEIGHT + GAP)));
        const destination = Math.max(0, Math.min(itemCount - 1, row * COLUMN_COUNT + column));
        const current = positions.value[itemKey] ?? start;

        if (destination === current) return;

        const nextPositions = { ...positions.value };
        Object.keys(nextPositions).forEach((key) => {
          if (key === itemKey) return;
          const position = nextPositions[key];
          if (destination > current && position > current && position <= destination) {
            nextPositions[key] = position - 1;
          } else if (destination < current && position >= destination && position < current) {
            nextPositions[key] = position + 1;
          }
        });
        nextPositions[itemKey] = destination;
        positions.value = nextPositions;
      })
      .onFinalize(() => {
        const destination = positions.value[itemKey] ?? startPosition.value;
        active.value = false;
        translationX.value = 0;
        translationY.value = 0;
        runOnJS(onDrop)(itemKey, destination);
      }),
    [active, cellWidth, index, itemCount, itemKey, onDrop, positions, startPosition, translationX, translationY],
  );

  const animatedStyle = useAnimatedStyle(() => {
    const position = positions.value[itemKey] ?? index;
    const column = position % COLUMN_COUNT;
    const row = Math.floor(position / COLUMN_COUNT);
    const targetX = column * (cellWidth + GAP);
    const targetY = row * (CARD_HEIGHT + GAP);

    if (active.value) {
      const originColumn = startPosition.value % COLUMN_COUNT;
      const originRow = Math.floor(startPosition.value / COLUMN_COUNT);
      return {
        zIndex: 20,
        transform: [
          { translateX: originColumn * (cellWidth + GAP) + translationX.value },
          { translateY: originRow * (CARD_HEIGHT + GAP) + translationY.value },
          { scale: 1.025 },
        ],
      };
    }

    return {
      zIndex: 1,
      transform: [
        { translateX: withSpring(targetX, { damping: 22, stiffness: 240 }) },
        { translateY: withSpring(targetY, { damping: 22, stiffness: 240 }) },
        { scale: withSpring(1) },
      ],
    };
  }, [cellWidth, index, itemKey]);

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.item, { width: cellWidth }, animatedStyle]}>
        {renderItem(item)}
      </Animated.View>
    </GestureDetector>
  );
}

export function ReorderableTemplateGrid<T>({
  data,
  keyExtractor,
  onReorder,
  renderItem,
}: ReorderableTemplateGridProps<T>) {
  const [width, setWidth] = useState(0);
  const positions = useSharedValue<Record<string, number>>(positionMap(data, keyExtractor));
  const orderKey = data.map(keyExtractor).join(':');

  useEffect(() => {
    positions.value = positionMap(data, keyExtractor);
  }, [data, keyExtractor, orderKey, positions]);

  const onLayout = (event: LayoutChangeEvent) => {
    setWidth(event.nativeEvent.layout.width);
  };
  const cellWidth = Math.max(0, (width - GAP) / COLUMN_COUNT);
  const rowCount = Math.ceil(data.length / COLUMN_COUNT);
  const height = rowCount === 0 ? 0 : rowCount * CARD_HEIGHT + (rowCount - 1) * GAP;

  const handleDrop = useCallback((itemKey: string, destination: number) => {
    const from = data.findIndex((item) => keyExtractor(item) === itemKey);
    if (from < 0 || from === destination) return;
    const reordered = [...data];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(destination, 0, moved);
    onReorder(reordered);
  }, [data, keyExtractor, onReorder]);

  return (
    <View onLayout={onLayout} style={[styles.grid, { height }]}>
      {width > 0 && data.map((item, index) => {
        const itemKey = keyExtractor(item);
        return (
          <ReorderableGridItem
            cellWidth={cellWidth}
            index={index}
            item={item}
            itemCount={data.length}
            itemKey={itemKey}
            key={itemKey}
            onDrop={handleDrop}
            positions={positions}
            renderItem={renderItem}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    position: 'relative',
    width: '100%',
  },
  item: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: CARD_HEIGHT,
  },
});
