import { forwardRef, type ReactNode } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/cn";

type Variant = "accent" | "ghost" | "danger" | "outline";
type Size = "sm" | "md";

type BaseProps = Omit<HTMLMotionProps<"button">, "children">;

interface Props extends BaseProps {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  leading?: ReactNode;
  trailing?: ReactNode;
  loading?: boolean;
}

const SIZE: Record<Size, string> = {
  sm: "h-7 px-2.5 text-[12px] rounded-[var(--radius-sm)] gap-1.5",
  md: "h-9 px-3.5 text-[13px] rounded-[var(--radius-md)] gap-2",
};


export const PrimaryButton = forwardRef<HTMLButtonElement, Props>(function PrimaryButton(
  {
    children,
    variant = "accent",
    size = "md",
    leading,
    trailing,
    loading,
    disabled,
    className,
    ...rest
  },
  ref
) {
  return (
    <motion.button
      ref={ref}
      whileHover={!disabled && !loading ? { scale: 1.02, y: -0.5 } : undefined}
      whileTap={!disabled && !loading ? { scale: 0.97 } : undefined}
      transition={{ type: "spring", damping: 22, stiffness: 360 }}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center font-medium transition-colors focus-ring",
        "outline-none disabled:opacity-50 disabled:cursor-not-allowed select-none",
        SIZE[size],
        variant === "accent" && cn(
          "bg-[var(--color-accent)] text-white",
          "hover:bg-[var(--color-accent-hover)]",
          "shadow-[var(--shadow-accent)]"
        ),
        variant === "ghost" && cn(
          "text-[var(--color-text-muted)] bg-transparent",
          "hover:bg-[var(--color-bg-elevated)] hover:text-[var(--color-text)]"
        ),
        variant === "outline" && cn(
          "text-[var(--color-text)] bg-[var(--color-bg-elevated)]",
          "border border-[var(--color-border)]",
          "hover:border-[var(--color-accent-border)] hover:bg-[var(--color-bg-hover)]"
        ),
        variant === "danger" && cn(
          "text-[var(--color-danger)] bg-[var(--color-danger-subtle)]",
          "border border-[var(--color-danger-border)]",
          "hover:bg-[rgba(255,79,123,0.18)]"
        ),
        className
      )}
      {...rest}
    >
      {loading && (
        <span className="w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin shrink-0" />
      )}
      {!loading && leading}
      <span>{children}</span>
      {!loading && trailing}
    </motion.button>
  );
});
