import type { SVGProps } from "react";
import { cn } from "@json-explore/ui/cn";

export type ChevronDirection = "up" | "down" | "left" | "right";

export interface ChevronIconProps extends SVGProps<SVGSVGElement> {
  direction?: ChevronDirection;
}

const ROTATION: Record<ChevronDirection, string> = {
  down: "rotate-0",
  right: "-rotate-90",
  up: "rotate-180",
  left: "rotate-90",
};

export function ChevronIcon({
  direction = "down",
  className,
  ...props
}: ChevronIconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={cn(
        "h-3.5 w-3.5 shrink-0 transition-transform duration-150",
        ROTATION[direction],
        className,
      )}
      {...props}
    >
      <path d="M4 6l4 4 4-4" />
    </svg>
  );
}
