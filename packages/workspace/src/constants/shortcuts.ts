export interface ShortcutDefinition {
  id: string;
  description: string;
  /** KeyboardEvent.key values (case-insensitive for letters). */
  key: string;
  metaOrCtrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  /**
   * When false, the shortcut is ignored while typing in an input.
   * Defaults to true for meta/ctrl chords, false otherwise.
   */
  allowInEditable?: boolean;
}

/**
 * Registry of application shortcuts. Wiring happens via `useKeyboardShortcut`.
 * Do not put raw JSON into URLs — shortcuts only drive UI actions.
 */
export const SHORTCUTS = {
  search: {
    id: "search",
    description: "Focus search",
    key: "k",
    metaOrCtrl: true,
  },
  focusQuery: {
    id: "focus-query",
    description: "Focus query",
    key: "p",
    metaOrCtrl: true,
    shift: true,
  },
  statistics: {
    id: "statistics",
    description: "Open statistics",
    key: "i",
    metaOrCtrl: true,
    shift: true,
  },
  runQuery: {
    id: "run-query",
    description: "Run query",
    key: "Enter",
    metaOrCtrl: true,
  },
  format: {
    id: "format",
    description: "Format JSON",
    key: "f",
    metaOrCtrl: true,
    shift: true,
  },
  minify: {
    id: "minify",
    description: "Minify JSON",
    key: "m",
    metaOrCtrl: true,
    shift: true,
  },
  help: {
    id: "help",
    description: "Keyboard shortcuts",
    key: "/",
    metaOrCtrl: true,
  },
  helpQuestion: {
    id: "help-question",
    description: "Keyboard shortcuts",
    key: "?",
    allowInEditable: false,
  },
  escape: {
    id: "escape",
    description: "Close or clear",
    key: "Escape",
    allowInEditable: true,
  },
} as const satisfies Record<string, ShortcutDefinition>;

export const TREE_SHORTCUTS = [
  { keys: "↑ / ↓", description: "Move between visible nodes" },
  { keys: "→", description: "Expand node" },
  { keys: "←", description: "Collapse node" },
  { keys: "Enter / Space", description: "Toggle or select node" },
] as const;
