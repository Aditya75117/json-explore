"use client";

import { ThemeProvider } from "@/hooks/use-theme";
import { type ReactNode } from "react";

export function AppProviders({ children }: { children: ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}
