import {
  cloneElement,
  isValidElement,
  useEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
  type Ref,
} from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/cn";

type Side = "top" | "bottom" | "left" | "right";

interface Props {
  content: ReactNode;
  side?: Side;
  delay?: number;
  children: ReactElement;
  className?: string;
}

interface TriggerProps {
  ref?: Ref<HTMLElement>;
  onMouseEnter?: (e: React.MouseEvent) => void;
  onMouseLeave?: (e: React.MouseEvent) => void;
  onFocus?: (e: React.FocusEvent) => void;
  onBlur?: (e: React.FocusEvent) => void;
}


export function Tooltip({ content, side = "right", delay = 320, children, className }: Props) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLElement | null>(null);
  const timerRef = useRef<number | null>(null);

  const show = () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      const el = triggerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x =
        side === "left"  ? rect.left
      : side === "right" ? rect.right
      : rect.left + rect.width / 2;
      const y =
        side === "top"    ? rect.top
      : side === "bottom" ? rect.bottom
      : rect.top + rect.height / 2;
      setPos({ x, y });
      setOpen(true);
    }, delay);
  };

  const hide = () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    setOpen(false);
  };

  useEffect(() => () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
  }, []);

  if (!isValidElement(children)) return null;
  const child = children as ReactElement<TriggerProps>;
  const childProps: TriggerProps = child.props ?? {};

  const merged: TriggerProps = {
    ref: (node: HTMLElement | null) => {
      triggerRef.current = node;
      const orig = (child as unknown as { ref?: unknown }).ref;
      if (typeof orig === "function") (orig as (n: HTMLElement | null) => void)(node);
      else if (orig && typeof orig === "object")
        (orig as { current: HTMLElement | null }).current = node;
    },
    onMouseEnter: (e) => { childProps.onMouseEnter?.(e); show(); },
    onMouseLeave: (e) => { childProps.onMouseLeave?.(e); hide(); },
    onFocus:      (e) => { childProps.onFocus?.(e);     show(); },
    onBlur:       (e) => { childProps.onBlur?.(e);      hide(); },
  };

  const offset = 10;
  const transform =
    side === "right"  ? `translate(${offset}px, -50%)`
  : side === "left"   ? `translate(calc(-100% - ${offset}px), -50%)`
  : side === "top"    ? `translate(-50%, calc(-100% - ${offset}px))`
  :                     `translate(-50%, ${offset}px)`;

  const initial =
    side === "right"  ? { opacity: 0, x: -4, scale: 0.96 }
  : side === "left"   ? { opacity: 0, x:  4, scale: 0.96 }
  : side === "top"    ? { opacity: 0, y:  4, scale: 0.96 }
  :                     { opacity: 0, y: -4, scale: 0.96 };

  return (
    <>
      {cloneElement(child, merged)}
      {createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              key="tt"
              initial={initial}
              animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
              exit={initial}
              transition={{ type: "spring", damping: 26, stiffness: 380, mass: 0.6 }}
              style={{
                position: "fixed",
                left: pos.x,
                top: pos.y,
                transform,
                zIndex: 10000,
                pointerEvents: "none",
              }}
              className={cn(
                "px-2 py-1 rounded-[var(--radius-sm)] text-[11px] font-medium whitespace-nowrap",
                "bg-[var(--color-bg-elevated)] text-[var(--color-text)]",
                "shadow-[var(--shadow-float)]",
                className
              )}
            >
              {content}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
