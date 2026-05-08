import { Fragment } from "react";
import { IS_MAC, shortcutParts } from "@/lib/platform";
import { cn } from "@/lib/cn";

interface Props {
  keys: string;
  className?: string;
}


export function KbdHint({ keys, className }: Props) {
  const parts = shortcutParts(keys);
  return (
    <span className={cn("inline-flex items-center", IS_MAC ? "gap-0.5" : "gap-0", className)}>
      {parts.map((p, i) => (
        <Fragment key={i}>
          {!IS_MAC && i > 0 && (
            <span className="mx-0.5 text-[10px] text-[var(--color-text-faint)] select-none">
              +
            </span>
          )}
          <kbd className="font-mono">{p}</kbd>
        </Fragment>
      ))}
    </span>
  );
}
