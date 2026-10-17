export interface VirtualWindowOptions {
  itemCount: number;
  itemHeight: number;
  scrollTop: number;
  viewportHeight: number;
  overscan?: number;
}

export interface VirtualWindow {
  start: number;
  end: number;
  totalHeight: number;
}

/**
 * Fixed-height list window. Used by explorer / search / query lists so
 * only the visible slice is mounted.
 */
export function getVirtualWindow(options: VirtualWindowOptions): VirtualWindow {
  const overscan = options.overscan ?? 8;
  const itemCount = Math.max(0, options.itemCount);
  const itemHeight = Math.max(1, options.itemHeight);
  const totalHeight = itemCount * itemHeight;

  if (itemCount === 0) {
    return { start: 0, end: 0, totalHeight: 0 };
  }

  if (options.viewportHeight <= 0) {
    const fallbackStart = Math.max(
      0,
      Math.floor(options.scrollTop / itemHeight) - overscan,
    );
    return {
      start: fallbackStart,
      end: Math.min(itemCount, fallbackStart + overscan * 4),
      totalHeight,
    };
  }

  const start = Math.max(
    0,
    Math.floor(options.scrollTop / itemHeight) - overscan,
  );
  const windowSize =
    Math.ceil(options.viewportHeight / itemHeight) + overscan * 2;
  const end = Math.min(itemCount, start + windowSize);

  return { start, end, totalHeight };
}
