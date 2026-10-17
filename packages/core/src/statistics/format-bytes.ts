const UNITS = ["B", "KB", "MB", "GB"] as const;

/**
 * Human-readable byte size for statistics. Uses 1024-based units.
 */
export function formatByteSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return "0 B";
  }

  if (bytes < 1024) {
    return `${String(Math.round(bytes))} B`;
  }

  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < UNITS.length - 1) {
    value /= 1024;
    unit += 1;
  }

  const rounded = value >= 10 ? value.toFixed(1) : value.toFixed(2);
  return `${rounded.replace(/\.0+$/, "").replace(/(\.\d)0$/, "$1")} ${UNITS[unit]}`;
}
