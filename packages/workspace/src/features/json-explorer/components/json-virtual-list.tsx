"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { getVirtualWindow } from "@json-explore/core/performance";
import { cn } from "@json-explore/ui/cn";

export interface JsonVirtualListProps<T> {
  items: readonly T[];
  itemHeight: number;
  overscan?: number;
  scrollToIndex?: number | null;
  scrollRequestId?: number;
  getItemKey: (item: T, index: number) => string;
  renderItem: (item: T, index: number) => ReactNode;
  className?: string;
  "aria-label"?: string;
}

export function JsonVirtualList<T>({
  items,
  itemHeight,
  overscan = 8,
  scrollToIndex = null,
  scrollRequestId,
  getItemKey,
  renderItem,
  className,
}: JsonVirtualListProps<T>) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);

  useEffect(() => {
    const viewport = viewportRef.current;
    const scroller = scrollerRef.current;
    if (!viewport || !scroller) {
      return;
    }

    const measure = () => {
      setHeight(scroller.clientHeight);
    };

    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    observer.observe(scroller);
    measure();

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (scrollToIndex == null || scrollToIndex < 0) {
      return;
    }

    const scroller = scrollerRef.current;
    if (!scroller) {
      return;
    }

    const rowTop = scrollToIndex * itemHeight;
    const viewTop = scroller.scrollTop;
    const viewBottom = viewTop + scroller.clientHeight;
    if (rowTop < viewTop || rowTop + itemHeight > viewBottom) {
      scroller.scrollTop = Math.max(0, rowTop - scroller.clientHeight / 3);
      setScrollTop(scroller.scrollTop);
    }
  }, [itemHeight, scrollRequestId, scrollToIndex]);

  const { start, end, totalHeight } = getVirtualWindow({
    itemCount: items.length,
    itemHeight,
    scrollTop,
    viewportHeight: height,
    overscan,
  });

  return (
    <div ref={viewportRef} className={cn("relative min-h-0 flex-1", className)}>
      <div
        ref={scrollerRef}
        className="absolute inset-0 overflow-y-auto overscroll-contain"
        onScroll={(event) => {
          setScrollTop(event.currentTarget.scrollTop);
        }}
      >
        <div className="relative w-full" style={{ height: totalHeight }}>
          {items.slice(start, end).map((item, offset) => {
            const index = start + offset;
            return (
              <div
                key={getItemKey(item, index)}
                className="absolute right-0 left-0"
                style={{
                  top: index * itemHeight,
                  height: itemHeight,
                }}
              >
                {renderItem(item, index)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
