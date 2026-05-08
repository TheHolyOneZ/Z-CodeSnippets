import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { Tooltip } from "./Tooltip";
import { KbdHint } from "./KbdHint";
import { cn } from "@/lib/cn";

type Variant = "ghost" | "accent" | "danger";
type Size = "sm" | "md" | "lg";

type BaseProps = Omit<HTMLMotionProps<"button">, "children" | "ref">;

interface Props extends BaseProps {
  icon: ReactNode;
  label: string;
  shortcut?: string;
  variant?: Variant;
  size?: Size;
  active?: boolean;
  tooltipSide?: "top" | "bottom" | "left" | "right";
  className?: string;
  type?: ButtonHTMLAttributes<HTMLButtonElement>["type"];
}

const SIZE: Record<Size, string> = {
  sm: "w-7  h-7  rounded-[var(--radius-sm)]",
  md: "w-8  h-8  rounded-[var(--radius-md)]",
  lg: "w-9  h-9  rounded-[var(--radius-md)]",
};


export const IconButton = forwardRef<HTMLButtonElement, Props>(function IconButton(
  {
    icon,
    label,
    shortcut,
    variant = "ghost",
    size = "md",
    active,
    tooltipSide = "right",
    className,
    type = "button",
    ...rest
  },
  ref
) {
  const tip = (
    <span className="inline-flex items-center gap-1.5">
      <span>{label}</span>
      {shortcut && <KbdHint keys={shortcut} />}
    </span>
  );

  return (
    <Tooltip content={tip} side={tooltipSide}>
      <motion.button
        ref={ref}
        type={type}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.92 }}
        transition={{ type: "spring", damping: 18, stiffness: 380 }}
        className={cn(
          "relative inline-flex items-center justify-center transition-colors focus-ring",
          "outline-none",
          SIZE[size],
          variant === "ghost" && cn(
            "text-[var(--color-text-muted)]",
            active
              ? "bg-[var(--color-accent-subtle)] text-[var(--color-accent)]"
              : "hover:bg-[var(--color-bg-elevated)] hover:text-[var(--color-text)]"
          ),
          variant === "accent" && "bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] shadow-[var(--shadow-accent)]",
          variant === "danger" && "text-[var(--color-text-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-subtle)]",
          className
        )}
        {...rest}
      >
        {icon}
      </motion.button>
    </Tooltip>
  );
});
