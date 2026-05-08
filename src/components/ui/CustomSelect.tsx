import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronDown, Check } from "lucide-react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/cn";

export interface SelectOption {
  value: string;
  label: string;
  hint?: string;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  compact?: boolean;
  maxHeight?: number;
}

export function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "Select…",
  className,
  compact = false,
  maxHeight = 280,
}: Props) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0, above: false });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === value);

  const openDropdown = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const above = spaceBelow < maxHeight + 8 && rect.top > maxHeight + 8;
      setPos({
        top: above ? rect.top - 6 : rect.bottom + 6,
        left: rect.left,
        width: Math.max(rect.width, 200),
        above,
      });
    }
    setOpen((o) => !o);
  };

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (
        !triggerRef.current?.contains(e.target as Node) &&
        !dropRef.current?.contains(e.target as Node)
      ) {
        close();
      }
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  const select = (val: string) => {
    onChange(val);
    setOpen(false);
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={openDropdown}
        className={cn(
          "inline-flex items-center justify-between gap-2 transition-all focus-ring outline-none",
          "bg-[var(--color-bg-input)] text-[var(--color-text)]",
          "border border-[var(--color-border)] rounded-[var(--radius-sm)]",
          "hover:border-[var(--color-border-strong)]",
          open && "border-[var(--color-accent)] shadow-[0_0_0_3px_var(--color-accent-soft)]",
          compact ? "px-2 h-7 text-[12px] min-w-[110px]" : "px-3 h-9 text-[13px] min-w-[150px]",
          className
        )}
      >
        <span className="truncate text-left">
          {selectedOption?.label ?? <span className="text-[var(--color-text-subtle)]">{placeholder}</span>}
        </span>
        <ChevronDown
          size={compact ? 12 : 14}
          className={cn(
            "shrink-0 text-[var(--color-text-muted)] transition-transform duration-200",
            open && "rotate-180 text-[var(--color-accent)]"
          )}
        />
      </button>

      {createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              ref={dropRef}
              initial={{ opacity: 0, y: pos.above ? 6 : -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: pos.above ? 6 : -6, scale: 0.97 }}
              transition={{ duration: 0.16, ease: [0.32, 0.72, 0, 1] }}
              style={{
                position: "fixed",
                top: pos.above ? undefined : pos.top,
                bottom: pos.above ? window.innerHeight - pos.top : undefined,
                left: pos.left,
                minWidth: pos.width,
                zIndex: 9999,
                maxHeight,
                transformOrigin: pos.above ? "bottom left" : "top left",
              }}
              className={cn(
                "overflow-y-auto py-1 rounded-[var(--radius-md)]",
                "bg-[var(--color-bg-elevated)] border border-[var(--color-border)]",
                "shadow-[var(--shadow-float)]"
              )}
            >
              {options.map((o, i) => (
                <motion.button
                  key={o.value}
                  type="button"
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.012, duration: 0.12 }}
                  onClick={() => select(o.value)}
                  className={cn(
                    "flex items-center justify-between w-full px-3 py-2 text-[13px] text-left",
                    "transition-colors gap-3",
                    o.value === value
                      ? "bg-[var(--color-accent-subtle)] text-[var(--color-accent)]"
                      : "text-[var(--color-text)] hover:bg-[var(--color-bg-hover)]"
                  )}
                >
                  <span className="flex flex-col min-w-0">
                    <span className="truncate">{o.label}</span>
                    {o.hint && (
                      <span className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                        {o.hint}
                      </span>
                    )}
                  </span>
                  {o.value === value && (
                    <motion.span
                      initial={{ scale: 0, rotate: -90 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", damping: 18, stiffness: 380 }}
                    >
                      <Check size={13} className="shrink-0 text-[var(--color-accent)]" />
                    </motion.span>
                  )}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
