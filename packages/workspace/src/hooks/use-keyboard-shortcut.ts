"use client";

import { useCallback, useEffect, useRef } from "react";
import type { ShortcutDefinition } from "@json-explore/workspace/constants/shortcuts";
import { isEditableTarget, matchesShortcut } from "@json-explore/workspace/lib/a11y/keyboard";

function allowsEditable(shortcut: ShortcutDefinition): boolean {
  if (shortcut.allowInEditable !== undefined) {
    return shortcut.allowInEditable;
  }
  return Boolean(shortcut.metaOrCtrl) || shortcut.key === "Escape";
}

/**
 * Register a keyboard shortcut. Prefer this over ad-hoc keydown listeners.
 * Browser chords such as copy/paste/undo are not registered here.
 */
export function useKeyboardShortcut(
  shortcut: ShortcutDefinition,
  handler: (event: KeyboardEvent) => void,
  enabled = true,
): void {
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  const onKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) {
        return;
      }

      if (!matchesShortcut(event, shortcut)) {
        return;
      }

      if (isEditableTarget(event.target) && !allowsEditable(shortcut)) {
        return;
      }

      event.preventDefault();
      handlerRef.current(event);
    },
    [enabled, shortcut],
  );

  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onKeyDown]);
}
