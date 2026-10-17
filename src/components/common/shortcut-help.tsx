"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { IconButton } from "@/components/ui/icon-button";
import { SHORTCUTS, TREE_SHORTCUTS } from "@/constants/shortcuts";
import { useKeyboardShortcut } from "@/hooks/use-keyboard-shortcut";
import { useApplePlatform } from "@/hooks/use-apple-platform";
import { formatShortcutLabel } from "@/lib/a11y/keyboard";

const GLOBAL_SHORTCUTS = [
  SHORTCUTS.search,
  SHORTCUTS.focusQuery,
  SHORTCUTS.statistics,
  SHORTCUTS.runQuery,
  SHORTCUTS.format,
  SHORTCUTS.minify,
  SHORTCUTS.help,
  SHORTCUTS.escape,
] as const;

export function ShortcutHelp() {
  const [open, setOpen] = useState(false);
  const apple = useApplePlatform();

  useKeyboardShortcut(SHORTCUTS.help, () => {
    setOpen(true);
  });
  useKeyboardShortcut(SHORTCUTS.helpQuestion, () => {
    setOpen(true);
  });

  return (
    <>
      <IconButton
        label={`Keyboard shortcuts (${formatShortcutLabel(SHORTCUTS.help, apple)})`}
        onClick={() => setOpen(true)}
      >
        <span aria-hidden="true" className="font-mono text-xs">
          ?
        </span>
      </IconButton>
      <Dialog
        open={open}
        title="Keyboard shortcuts"
        description="Application shortcuts stay out of the way of copy, paste, undo, and find."
        onClose={() => setOpen(false)}
      >
        <div className="space-y-4">
          <ShortcutTable
            heading="Workspace"
            rows={GLOBAL_SHORTCUTS.map((shortcut) => ({
              keys: formatShortcutLabel(shortcut, apple),
              description: shortcut.description,
            }))}
          />
          <ShortcutTable
            heading="JSON tree"
            rows={TREE_SHORTCUTS.map((item) => ({
              keys: item.keys,
              description: item.description,
            }))}
          />
        </div>
      </Dialog>
    </>
  );
}

function ShortcutTable({
  heading,
  rows,
}: {
  heading: string;
  rows: readonly { keys: string; description: string }[];
}) {
  return (
    <section>
      <h3 className="mb-2 text-xs font-semibold tracking-wide uppercase">
        {heading}
      </h3>
      <table className="w-full text-left text-sm">
        <caption className="sr-only">{heading} shortcuts</caption>
        <tbody>
          {rows.map((row) => (
            <tr
              key={`${heading}-${row.description}`}
              className="border-border border-t"
            >
              <th
                scope="row"
                className="text-foreground py-1.5 pr-3 font-medium"
              >
                {row.description}
              </th>
              <td className="text-muted py-1.5 font-mono text-xs whitespace-nowrap">
                {row.keys}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
