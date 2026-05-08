import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

interface Props {
  tag: string;
  onClick?: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  active?: boolean;
  size?: "xs" | "sm";
  className?: string;
}

export function TagBadge({ tag, onClick, onContextMenu, active, size = "sm", className }: Props) {
  const Component = onClick ? motion.button : motion.span;
  const interactive = !!onClick;

  return (
    <Component
      onClick={onClick}
      onContextMenu={onContextMenu}
      whileHover={interactive ? { scale: 1.04, y: -1 } : undefined}
      whileTap={interactive ? { scale: 0.95 } : undefined}
      transition={{ type: "spring", damping: 22, stiffness: 380 }}
      className={cn(
        "inline-flex items-center font-medium transition-colors select-none",
        size === "xs" ? "px-1.5 h-4 text-[10px] rounded-[3px]" : "px-2 h-5 text-[11px] rounded-[var(--radius-xs)]",
        active
          ? "bg-[var(--color-accent-subtle)] text-[var(--color-accent)] border border-[var(--color-accent-border)]"
          : "bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)] border border-transparent",
        interactive && !active && "cursor-pointer hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text)] hover:border-[var(--color-border)]",
        className
      )}
    >
      <span className="opacity-60 mr-0.5">#</span>
      {tag}
    </Component>
  );
}
