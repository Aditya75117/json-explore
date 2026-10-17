import type { ShortcutDefinition } from "@json-explore/workspace/constants/shortcuts";

export function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tag = target.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target.isContentEditable
  );
}

export function matchesShortcut(
  event: KeyboardEvent,
  shortcut: ShortcutDefinition,
): boolean {
  const keyMatches =
    event.key.toLowerCase() === shortcut.key.toLowerCase() ||
    event.key === shortcut.key;

  if (!keyMatches) {
    return false;
  }

  const metaOrCtrlPressed = event.metaKey || event.ctrlKey;
  if (Boolean(shortcut.metaOrCtrl) !== metaOrCtrlPressed) {
    return false;
  }

  if (Boolean(shortcut.shift) !== event.shiftKey) {
    return false;
  }

  if (Boolean(shortcut.alt) !== event.altKey) {
    return false;
  }

  return true;
}

export function isApplePlatform(
  userAgent = typeof navigator === "undefined" ? "" : navigator.userAgent,
): boolean {
  return /Mac|iPhone|iPad|iPod/i.test(userAgent);
}

export function formatShortcutLabel(
  shortcut: ShortcutDefinition,
  apple = false,
): string {
  const parts: string[] = [];
  if (shortcut.metaOrCtrl) {
    parts.push(apple ? "⌘" : "Ctrl");
  }
  if (shortcut.alt) {
    parts.push(apple ? "⌥" : "Alt");
  }
  if (shortcut.shift) {
    parts.push(apple ? "⇧" : "Shift");
  }

  const key =
    shortcut.key === "Escape"
      ? "Esc"
      : shortcut.key === "Enter"
        ? "Enter"
        : shortcut.key === "?"
          ? "?"
          : shortcut.key.length === 1
            ? shortcut.key.toUpperCase()
            : shortcut.key;

  parts.push(key);
  return apple ? parts.join("") : parts.join("+");
}

export function treeItemDomId(nodeId: string): string {
  return `tree-node-${encodeURIComponent(nodeId)}`;
}

export { getFocusableElements } from "@json-explore/ui/a11y";
