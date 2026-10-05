import {
  type ReactElement,
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import {
  type GestureResponderEvent,
  Pressable,
  type StyleProp,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type ViewStyle,
} from 'react-native';
import DraggableFlatList, {
  ScaleDecorator,
  type RenderItemParams,
} from 'react-native-draggable-flatlist';
import type { FlatList } from 'react-native-gesture-handler';
import {
  runOnJS,
  type SharedValue,
  useFrameCallback,
} from 'react-native-reanimated';

import { SetForgeColors } from '@/constants/setforge-theme';

const COMPACT_ITEM_HEIGHT = 70;

type ReorderAnimatedValues = {
  activeCellSize: SharedValue<number>;
  activeIndexAnim: SharedValue<number>;
  containerSize: SharedValue<number>;
  hoverOffset: SharedValue<number>;
  isTouchActiveNative: SharedValue<boolean>;
  scrollOffset: SharedValue<number>;
  scrollViewSize: SharedValue<number>;
};

function ReorderAutoScroller({
  maximumScrollOffset,
  scrollToOffset,
  threshold,
  values,
}: {
  maximumScrollOffset: number;
  scrollToOffset: (offset: number) => void;
  threshold: number;
  values: ReorderAnimatedValues;
}) {
  const {
    activeCellSize,
    activeIndexAnim,
    containerSize,
    hoverOffset,
    isTouchActiveNative,
    scrollOffset,
    scrollViewSize,
  } = values;

  useFrameCallback((frameInfo) => {
    if (activeIndexAnim.value < 0 || !isTouchActiveNative.value) return;

    const offset = scrollOffset.value;
    const hoverTop = hoverOffset.value - offset;
    const distanceFromTop = Math.max(0, hoverTop);
    const distanceFromBottom = Math.max(
      0,
      containerSize.value - (hoverTop + activeCellSize.value),
    );
    const maximumOffset = Math.min(
      maximumScrollOffset,
      Math.max(0, scrollViewSize.value - containerSize.value),
    );
    const elapsedSeconds = Math.min(frameInfo.timeSincePreviousFrame ?? 16.67, 32) / 1000;

    let direction = 0;
    let proximity = 0;
    if (distanceFromTop < threshold && offset > 0) {
      direction = -1;
      proximity = 1 - distanceFromTop / threshold;
    } else if (distanceFromBottom < threshold && offset < maximumOffset) {
      direction = 1;
      proximity = 1 - distanceFromBottom / threshold;
    }

    if (direction === 0) return;

    const pixelsPerSecond = 35 + proximity * 85;
    const targetOffset = Math.min(
      maximumOffset,
      Math.max(0, offset + direction * pixelsPerSecond * elapsedSeconds),
    );
    runOnJS(scrollToOffset)(targetOffset);
  });

  return null;
}

function formatExerciseTitle(value: string) {
  return value.replace(/(^|[\s(/-])([a-z])/g, (_match, prefix: string, letter: string) =>
    `${prefix}${letter.toUpperCase()}`,
  );
}

type ExpandedItemParams<T> = {
  drag: (event?: GestureResponderEvent) => void;
  index: number;
  isActive: boolean;
  item: T;
};

type ReorderableExerciseListProps<T> = {
  contentContainerStyle?: StyleProp<ViewStyle>;
  data: T[];
  emptyComponent?: ReactElement | null;
  footerComponent?: ReactElement | null;
  getExerciseMeta: (item: T) => string;
  getExerciseName: (item: T) => string;
  headerComponent?: ReactElement | null;
  keyExtractor: (item: T) => string;
  onMove: (fromIndex: number, toIndex: number) => void;
  renderExpandedItem: (params: ExpandedItemParams<T>) => ReactNode;
};

export function ReorderableExerciseList<T>({
  contentContainerStyle,
  data,
  emptyComponent,
  footerComponent,
  getExerciseMeta,
  getExerciseName,
  headerComponent,
  keyExtractor,
  onMove,
  renderExpandedItem,
}: ReorderableExerciseListProps<T>) {
  const { height: windowHeight } = useWindowDimensions();
  const [isReordering, setIsReordering] = useState(false);
  const [isReorderContentReady, setIsReorderContentReady] = useState(false);
  const [listViewportHeight, setListViewportHeight] = useState(0);
  const [dragAnimatedValues, setDragAnimatedValues] = useState<ReorderAnimatedValues | null>(null);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [reorderTopSpacer, setReorderTopSpacer] = useState(0);
  const reorderTopSpacerRef = useRef(0);
  const listRef = useRef<FlatList<T>>(null);
  const itemRefs = useRef(new Map<string, View>());
  const expandedHeightsRef = useRef(new Map<string, number>());
  const lastTouchRef = useRef<{ itemKey: string; pageY: number } | null>(null);
  const scrollOffsetRef = useRef(0);
  const pendingDragRef = useRef<{
    drag: () => void;
    targetScrollOffset: number;
    targetY?: number;
  } | null>(null);
  const previousCountRef = useRef(data.length);
  const scrollToOffset = useCallback((offset: number) => {
    listRef.current?.scrollToOffset({ animated: false, offset });
  }, []);

  useEffect(() => {
    const previousCount = previousCountRef.current;
    previousCountRef.current = data.length;
    if (data.length > previousCount) {
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
    }
  }, [data.length]);

  useLayoutEffect(() => {
    if (!isReordering || !isReorderContentReady || !activeKey) return;

    let cancelled = false;
    const pendingDrag = pendingDragRef.current;
    if (!pendingDrag) return;

    listRef.current?.scrollToOffset({
      animated: false,
      offset: pendingDrag.targetScrollOffset,
    });

    const waitForScrollToSettle = (
      onSettled: () => void,
      attempt = 0,
      previousOffset?: number,
      stableFrames = 0,
    ): number => requestAnimationFrame(() => {
      if (cancelled) return;
      const currentOffset = scrollOffsetRef.current;
      const nextStableFrames = previousOffset !== undefined
        && Math.abs(previousOffset - currentOffset) <= 1
        ? stableFrames + 1
        : 0;

      if (nextStableFrames >= 2 || attempt >= 10) {
        onSettled();
        return;
      }

      waitForScrollToSettle(onSettled, attempt + 1, currentOffset, nextStableFrames);
    });

    const alignActiveItem = (attempt: number) => requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const itemView = itemRefs.current.get(activeKey);
        if (cancelled) return;
        if (!itemView) {
          if (attempt < 5) alignActiveItem(attempt + 1);
          else pendingDrag.drag();
          return;
        }

        itemView.measureInWindow((_x, y) => {
          if (cancelled) return;
          const correction = pendingDrag.targetY === undefined ? 0 : pendingDrag.targetY - y;
          if (Math.abs(correction) <= 2 || attempt >= 5) {
            pendingDrag.drag();
            return;
          }

          const currentSpacer = reorderTopSpacerRef.current;
          const correctedSpacer = Math.max(0, currentSpacer + correction);
          const spacerChange = correctedSpacer - currentSpacer;
          const correctedScrollOffset = Math.max(
            0,
            scrollOffsetRef.current + spacerChange - correction,
          );

          reorderTopSpacerRef.current = correctedSpacer;
          setReorderTopSpacer(correctedSpacer);
          listRef.current?.scrollToOffset({ animated: false, offset: correctedScrollOffset });
          waitForScrollToSettle(() => alignActiveItem(attempt + 1));
        });
      });
    });
    const measureFrame = waitForScrollToSettle(() => alignActiveItem(0));

    return () => {
      cancelled = true;
      cancelAnimationFrame(measureFrame);
    };
  }, [activeKey, isReorderContentReady, isReordering]);

  const renderItem = ({ item, getIndex, drag, isActive }: RenderItemParams<T>) => {
    const itemKey = keyExtractor(item);
    const index = getIndex() ?? data.findIndex((entry) => keyExtractor(entry) === itemKey);
    const prepareAndDrag = (event?: GestureResponderEvent) => {
      const eventPageY = event?.nativeEvent.pageY;
      const savedTouch = lastTouchRef.current;
      const fingerY = typeof eventPageY === 'number'
        ? eventPageY
        : savedTouch?.itemKey === itemKey
          ? savedTouch.pageY
          : undefined;
      const fingerAnchoredY = typeof fingerY === 'number'
        ? fingerY - COMPACT_ITEM_HEIGHT / 2
        : undefined;
      const collapsedHeightAbove = data.slice(0, index).reduce((total, entry) => {
        const expandedHeight = expandedHeightsRef.current.get(keyExtractor(entry));
        return total + Math.max(0, (expandedHeight ?? COMPACT_ITEM_HEIGHT) - COMPACT_ITEM_HEIGHT);
      }, 0);
      const currentScrollOffset = scrollOffsetRef.current;
      const targetScrollOffset = Math.max(0, currentScrollOffset - collapsedHeightAbove);
      const beginReordering = (targetY?: number) => {
        pendingDragRef.current = {
          drag,
          targetScrollOffset,
          targetY,
        };
        setActiveKey(itemKey);
        setIsReorderContentReady(false);
        reorderTopSpacerRef.current = 0;
        setReorderTopSpacer(0);
        setIsReordering(true);
      };
      const itemView = itemRefs.current.get(itemKey);
      if (fingerAnchoredY !== undefined) {
        beginReordering(fingerAnchoredY);
      } else if (itemView) {
        itemView.measureInWindow((_x, y) => beginReordering(y));
      } else {
        beginReordering();
      }
    };

    return (
      <View
        collapsable={false}
        onLayout={(event) => {
          if (!isReordering) {
            expandedHeightsRef.current.set(itemKey, event.nativeEvent.layout.height);
          }
        }}
        ref={(node) => {
          if (node) itemRefs.current.set(itemKey, node);
          else itemRefs.current.delete(itemKey);
        }}
        onTouchStart={(event) => {
          lastTouchRef.current = { itemKey, pageY: event.nativeEvent.pageY };
        }}
        style={isReordering && styles.compactItemContainer}>
        <ScaleDecorator activeScale={1.02}>
          {isReordering ? (
            <Pressable
              accessibilityLabel={`${getExerciseName(item)}. Hold and drag to change its position.`}
              accessibilityRole="button"
              delayLongPress={250}
              disabled={isActive}
              onLongPress={drag}
              style={[styles.compactRow, isActive && styles.activeRow]}>
              <View style={styles.orderBadge}>
                <Text style={styles.orderText}>{index + 1}</Text>
              </View>
              <View style={styles.compactCopy}>
                <Text numberOfLines={1} style={styles.exerciseName}>
                  {formatExerciseTitle(getExerciseName(item))}
                </Text>
                <Text numberOfLines={1} style={styles.exerciseMeta}>{getExerciseMeta(item)}</Text>
              </View>
              <Text style={styles.grip}>≡</Text>
            </Pressable>
          ) : (
            renderExpandedItem({ drag: prepareAndDrag, index, isActive, item })
          )}
        </ScaleDecorator>
      </View>
    );
  };

  const autoscrollThreshold = Math.min(
    120,
    Math.max(90, (listViewportHeight || windowHeight) * 0.16),
  );
  const maximumReorderScrollOffset = Math.max(0, (data.length - 1) * COMPACT_ITEM_HEIGHT);

  return (<>
    <DraggableFlatList
      autoscrollSpeed={0}
      autoscrollThreshold={autoscrollThreshold}
      contentContainerStyle={contentContainerStyle}
      data={data}
      dragItemOverflow={false}
      extraData={isReordering}
      keyExtractor={keyExtractor}
      keyboardShouldPersistTaps="handled"
      ListEmptyComponent={emptyComponent}
      ListFooterComponent={isReordering
        ? <View style={{ height: Math.max(12, listViewportHeight - COMPACT_ITEM_HEIGHT) }} />
        : footerComponent}
      ListHeaderComponent={<>
        {headerComponent}
        {isReordering && reorderTopSpacer > 0 && <View style={{ height: reorderTopSpacer }} />}
      </>}
      onContentSizeChange={() => {
        if (isReordering && !isReorderContentReady) setIsReorderContentReady(true);
      }}
      onContainerLayout={({ layout }) => {
        setListViewportHeight((currentHeight) =>
          Math.abs(currentHeight - layout.height) > 1 ? layout.height : currentHeight,
        );
      }}
      onDragEnd={({ from, to }) => {
        if (from !== to) onMove(from, to);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            pendingDragRef.current = null;
            lastTouchRef.current = null;
            setActiveKey(null);
            setIsReorderContentReady(false);
            reorderTopSpacerRef.current = 0;
            setReorderTopSpacer(0);
            setIsReordering(false);
          });
        });
      }}
      onAnimValInit={(values) => setDragAnimatedValues(values)}
      onScrollOffsetChange={(offset) => {
        scrollOffsetRef.current = offset;
      }}
      ref={listRef}
      renderItem={renderItem}
      scrollEventThrottle={16}
      showsVerticalScrollIndicator={false}
    />
    {dragAnimatedValues && (
      <ReorderAutoScroller
        maximumScrollOffset={maximumReorderScrollOffset}
        scrollToOffset={scrollToOffset}
        threshold={autoscrollThreshold}
        values={dragAnimatedValues}
      />
    )}
  </>);
}

const styles = StyleSheet.create({
  compactItemContainer: {
    height: COMPACT_ITEM_HEIGHT,
  },
  compactRow: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 12,
    marginVertical: 3,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: SetForgeColors.border,
    borderRadius: 9,
    backgroundColor: SetForgeColors.surface,
  },
  activeRow: {
    borderColor: SetForgeColors.accent,
    backgroundColor: SetForgeColors.accentTint,
    shadowColor: SetForgeColors.accent,
    shadowOpacity: 0.24,
    shadowRadius: 12,
    elevation: 10,
  },
  orderBadge: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 7,
    backgroundColor: SetForgeColors.surfaceMuted,
  },
  orderText: { color: SetForgeColors.accent, fontSize: 13, fontWeight: '900' },
  compactCopy: { flex: 1, minWidth: 0, gap: 2 },
  exerciseName: {
    color: SetForgeColors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
  },
  exerciseMeta: { color: SetForgeColors.textSecondary, fontSize: 10, textTransform: 'capitalize' },
  grip: { width: 32, color: SetForgeColors.accent, fontSize: 25, lineHeight: 25, fontWeight: '800', textAlign: 'center' },
});
