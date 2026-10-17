import type { HTMLAttributes } from "react";
import { cn } from "@json-explore/ui/cn";

const TEAL_MARK_SRC = "/brand/mark-teal.png";
const LIGHT_MARK_SRC = "/brand/mark-light.png";

export function BrandMark({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      aria-hidden="true"
      className={cn("inline-flex h-8 shrink-0", className)}
      {...props}
    >
      <img
        src={TEAL_MARK_SRC}
        alt=""
        width={512}
        height={440}
        draggable={false}
        className="brand-mark__on-light h-full w-auto"
      />
      <img
        src={LIGHT_MARK_SRC}
        alt=""
        width={512}
        height={440}
        draggable={false}
        className="brand-mark__on-dark h-full w-auto"
      />
    </span>
  );
}
