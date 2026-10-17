/**
 * Trigger a browser file download and revoke the object URL.
 * Never logs file contents.
 */
export function downloadTextFile(
  content: string,
  filename: string,
  mimeType = "application/json",
): boolean {
  if (typeof document === "undefined" || typeof URL === "undefined") {
    return false;
  }

  try {
    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
    const href = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = href;
    link.download = filename;
    link.rel = "noopener";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(href);
    return true;
  } catch {
    return false;
  }
}
