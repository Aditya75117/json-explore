"use client";

import { useSyncExternalStore } from "react";
import { isApplePlatform } from "@json-explore/workspace/lib/a11y/keyboard";

function subscribe(): () => void {
  return () => undefined;
}

function getClientSnapshot(): boolean {
  return isApplePlatform();
}

function getServerSnapshot(): boolean {
  return false;
}

/** Platform for shortcut labels — server snapshot is stable to avoid hydration mismatch. */
export function useApplePlatform(): boolean {
  return useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
}
