import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { usePerformanceMonitoring } from '@/utils/performance-monitoring';

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  getItemKey?: (item: T, index: number) => string | number;
  onScroll?: (scrollTop: number) => void;
  className?: string;
  estimatedItemHeight?: number;
  dynamicItemHeight?: boolean;
}

interface VirtualItem<T> {
  item: T;
  index: number;
  key: string | number;
  height: number;
  offsetTop: number;
}

export function VirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 5,
  getItemKey = (item, index) => index,
  onScroll,
  className = '',
  estimatedItemHeight = itemHeight,
  dynamicItemHeight = false,
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const [itemHeights, setItemHeights] = useState<Map<number, number>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollElementRef = useRef<HTMLDivElement>(null);
  
  const { getComponentMetrics } = usePerformanceMonitoring('VirtualList');

  // Calculate visible range
  const visibleRange = useMemo(() => {
    const start = Math.floor(scrollTop / estimatedItemHeight);
    const visibleCount = Math.ceil(containerHeight / estimatedItemHeight);
    const end = start + visibleCount;
    
    return {
      start: Math.max(0, start - overscan),
      end: Math.min(items.length, end + overscan),
    };
  }, [scrollTop, containerHeight, estimatedItemHeight, overscan, items.length]);

  // Calculate item positions
  const itemsWithPositions = useMemo(() => {
    const result: VirtualItem<T>[] = [];
    let currentOffset = 0;

    for (let i = 0; i < items.length; i++) {
      const height = dynamicItemHeight 
        ? itemHeights.get(i) || estimatedItemHeight
        : itemHeight;
      
      result.push({
        item: items[i],
        index: i,
        key: getItemKey(items[i], i),
        height,
        offsetTop: currentOffset,
      });
      
      currentOffset += height;
    }

    return result;
  }, [items, itemHeight, estimatedItemHeight, itemHeights, dynamicItemHeight, getItemKey]);

  // Get visible items
  const visibleItems = useMemo(() => {
    return itemsWithPositions.slice(visibleRange.start, visibleRange.end);
  }, [itemsWithPositions, visibleRange]);

  // Handle scroll events
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop;
    setScrollTop(newScrollTop);
    onScroll?.(newScrollTop);
  }, [onScroll]);

  // Measure item heights for dynamic sizing
  const measureItemHeight = useCallback((index: number, element: HTMLElement) => {
    if (!dynamicItemHeight) return;
    
    const height = element.getBoundingClientRect().height;
    const currentHeight = itemHeights.get(index);
    
    if (currentHeight !== height) {
      setItemHeights(prev => {
        const newMap = new Map(prev);
        newMap.set(index, height);
        return newMap;
      });
    }
  }, [dynamicItemHeight, itemHeights]);

  // Total height of all items
  const totalHeight = useMemo(() => {
    return itemsWithPositions.reduce((total, item) => total + item.height, 0);
  }, [itemsWithPositions]);

  // Performance metrics
  useEffect(() => {
    const metrics = getComponentMetrics();
    if (metrics) {
      console.log(`VirtualList rendered ${visibleItems.length} of ${items.length} items`);
    }
  }, [visibleItems.length, items.length, getComponentMetrics]);

  return (
    <div
      ref={containerRef}
      className={`virtual-list-container ${className} performance-optimized accessibility-enhanced`}
      style={{ height: containerHeight, overflow: 'auto' }}
      onScroll={handleScroll}
      role="grid"
      aria-label="Virtual list"
      aria-rowcount={items.length}
    >
      <div
        ref={scrollElementRef}
        className="virtual-list-spacer"
        style={{ height: totalHeight, position: 'relative' }}
      >
        {visibleItems.map(({ item, index, key, height, offsetTop }) => (
          <VirtualListItem
            key={key}
            index={index}
            height={height}
            offsetTop={offsetTop}
            onMeasure={measureItemHeight}
          >
            {renderItem(item, index)}
          </VirtualListItem>
        ))}
      </div>
    </div>
  );
}

interface VirtualListItemProps {
  index: number;
  height: number;
  offsetTop: number;
  onMeasure: (index: number, element: HTMLElement) => void;
  children: React.ReactNode;
}

function VirtualListItem({ 
  index, 
  height, 
  offsetTop, 
  onMeasure, 
  children 
}: VirtualListItemProps) {
  const itemRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (itemRef.current) {
      onMeasure(index, itemRef.current);
    }
  }, [index, onMeasure]);

  return (
    <div
      ref={itemRef}
      className="virtual-list-item hover-enhanced micro-interaction focus-enhanced keyboard-enhanced"
      style={{
        position: 'absolute',
        top: offsetTop,
        left: 0,
        right: 0,
        height,
        willChange: 'transform',
      }}
      role="row"
      aria-rowindex={index + 1}
      tabIndex={0}
      onKeyDown={(e) => {
        // Handle keyboard navigation
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault();
          const nextIndex = e.key === 'ArrowDown' ? index + 1 : index - 1;
          const nextElement = document.querySelector(`[aria-rowindex="${nextIndex + 1}"]`) as HTMLElement;
          if (nextElement) {
            nextElement.focus();
          }
        }
      }}
    >
      {children}
    </div>
  );
}

// Hook for virtual scrolling
export function useVirtualScroll<T>({
  items,
  itemHeight,
  containerHeight,
  overscan = 5,
}: {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const visibleRange = useMemo(() => {
    const start = Math.floor(scrollTop / itemHeight);
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const end = start + visibleCount;
    
    return {
      start: Math.max(0, start - overscan),
      end: Math.min(items.length, end + overscan),
    };
  }, [scrollTop, containerHeight, itemHeight, overscan, items.length]);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end);
  }, [items, visibleRange]);

  const totalHeight = items.length * itemHeight;

  const scrollProps = {
    ref: containerRef,
    style: { height: containerHeight, overflow: 'auto' },
    onScroll: (e: React.UIEvent<HTMLDivElement>) => {
      setScrollTop(e.currentTarget.scrollTop);
    },
  };

  const spacerProps = {
    style: { height: totalHeight, position: 'relative' as const },
  };

  return {
    visibleItems,
    visibleRange,
    totalHeight,
    scrollTop,
    scrollProps,
    spacerProps,
  };
}

// Advanced virtual list with variable item heights
export function VariableSizeVirtualList<T>({
  items,
  getItemHeight,
  containerHeight,
  renderItem,
  overscan = 5,
  getItemKey = (item, index) => index,
  estimatedItemHeight = 50,
}: {
  items: T[];
  getItemHeight: (index: number) => number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  getItemKey?: (item: T, index: number) => string | number;
  estimatedItemHeight?: number;
}) {
  const [scrollTop, setScrollTop] = useState(0);
  const [measuredHeights, setMeasuredHeights] = useState<Map<number, number>>(new Map());
  
  // Calculate item positions and total height
  const { itemPositions, totalHeight } = useMemo(() => {
    const positions: Array<{ index: number; offsetTop: number; height: number }> = [];
    let currentOffset = 0;

    for (let i = 0; i < items.length; i++) {
      const height = measuredHeights.get(i) || getItemHeight(i) || estimatedItemHeight;
      positions.push({
        index: i,
        offsetTop: currentOffset,
        height,
      });
      currentOffset += height;
    }

    return {
      itemPositions: positions,
      totalHeight: currentOffset,
    };
  }, [items, getItemHeight, measuredHeights, estimatedItemHeight]);

  // Find visible range
  const visibleRange = useMemo(() => {
    let start = 0;
    let end = items.length;

    // Binary search for start index
    let left = 0;
    let right = items.length - 1;
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const offsetTop = itemPositions[mid]?.offsetTop || 0;
      
      if (offsetTop < scrollTop) {
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }
    start = Math.max(0, left - overscan);

    // Find end index
    const visibleBottom = scrollTop + containerHeight;
    left = start;
    right = items.length - 1;
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const item = itemPositions[mid];
      
      if (item && item.offsetTop + item.height <= visibleBottom) {
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }
    end = Math.min(items.length, left + overscan);

    return { start, end };
  }, [scrollTop, containerHeight, itemPositions, overscan, items.length]);

  // Get visible items
  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end).map((item, index) => {
      const actualIndex = visibleRange.start + index;
      const position = itemPositions[actualIndex];
      
      return {
        item,
        index: actualIndex,
        key: getItemKey(item, actualIndex),
        offsetTop: position?.offsetTop || 0,
        height: position?.height || estimatedItemHeight,
      };
    });
  }, [items, visibleRange, itemPositions, getItemKey, estimatedItemHeight]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return (
    <div
      className="virtual-list-container performance-optimized accessibility-enhanced"
      style={{ height: containerHeight, overflow: 'auto' }}
      onScroll={handleScroll}
      role="grid"
      aria-label="Variable size virtual list"
      aria-rowcount={items.length}
    >
      <div
        className="virtual-list-spacer"
        style={{ height: totalHeight, position: 'relative' }}
      >
        {visibleItems.map(({ item, index, key, offsetTop, height }) => (
          <div
            key={key}
            className="virtual-list-item hover-enhanced micro-interaction focus-enhanced keyboard-enhanced"
            style={{
              position: 'absolute',
              top: offsetTop,
              left: 0,
              right: 0,
              height,
            }}
            role="row"
            aria-rowindex={index + 1}
            tabIndex={0}
            onKeyDown={(e) => {
              // Handle keyboard navigation
              if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault();
                const nextIndex = e.key === 'ArrowDown' ? index + 1 : index - 1;
                const nextElement = document.querySelector(`[aria-rowindex="${nextIndex + 1}"]`) as HTMLElement;
                if (nextElement) {
                  nextElement.focus();
                }
              }
            }}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  );
}

export default VirtualList;