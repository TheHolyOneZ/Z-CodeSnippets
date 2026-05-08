import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { formatShortcut } from "@/lib/platform";
import { cn } from "@/lib/cn";


export type CtxItem =
  | {
      kind: "item";
      label: string;
      icon?: ReactNode;
      shortcut?: string;
      onSelect: () => void;
      danger?: boolean;
      disabled?: boolean;
    }
  | { kind: "separator" }
  | { kind: "label"; text: string }
  | {
      kind: "submenu";
      label: string;
      icon?: ReactNode;
      items: CtxItem[];
      disabled?: boolean;
    }
  | {
      kind: "checkbox";
      label: string;
      icon?: ReactNode;
      checked: boolean;
      onSelect: () => void;
      disabled?: boolean;
    };


interface MenuPos {
  x: number;
  y: number;
}


export function useContextMenu() {
  const [pos, setPos] = useState<MenuPos | null>(null);

  const openAt = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPos({ x: e.clientX, y: e.clientY });
  }, []);

  const close = useCallback(() => setPos(null), []);

  const render = (items: CtxItem[]) => {
    if (!pos || items.length === 0) return null;
    return (
      <AnimatePresence>
        <ContextMenuRoot
          key="ctx-root"
          items={items}
          x={pos.x}
          y={pos.y}
          onClose={close}
        />
      </AnimatePresence>
    );
  };

  return { openAt, close, render, isOpen: !!pos };
}


function ContextMenuRoot({
  items,
  x,
  y,
  onClose,
}: {
  items: CtxItem[];
  x: number;
  y: number;
  onClose: () => void;
}) {
  return createPortal(
    <div
      role="presentation"
      onContextMenu={(e) => {
        e.preventDefault();
        onClose();
      }}
      className="fixed inset-0"
      style={{ zIndex: 10500 }}
    >
      <MenuPanel items={items} anchorX={x} anchorY={y} onClose={onClose} root />
    </div>,
    document.body
  );
}


interface PanelProps {
  items: CtxItem[];
  anchorX: number;
  anchorY: number;

  root?: boolean;
  parentRect?: DOMRect;
  onClose: () => void;

  onPanelEnter?: () => void;

  onPanelLeave?: () => void;
}

function MenuPanel({
  items,
  anchorX,
  anchorY,
  root,
  parentRect,
  onClose,
  onPanelEnter,
  onPanelLeave,
}: PanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);


  const [submenu, setSubmenu] = useState<{
    index: number;
    rect: DOMRect;
  } | null>(null);
  const activeSubItems =
    submenu !== null && items[submenu.index]?.kind === "submenu"
      ? (items[submenu.index] as Extract<CtxItem, { kind: "submenu" }>).items
      : null;
  const [activeIndex, setActiveIndex] = useState(-1);
  const closeTimer = useRef<number | null>(null);


  useLayoutEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const margin = 6;

    let left: number;
    let top: number;

    if (root) {
      left = anchorX;
      top = anchorY;
      if (left + w + margin > vw) left = Math.max(margin, vw - w - margin);
      if (top + h + margin > vh) top = Math.max(margin, vh - h - margin);
    } else if (parentRect) {

      left = parentRect.right - 2;
      top = parentRect.top;
      if (left + w + margin > vw) left = parentRect.left - w + 2;
      if (top + h + margin > vh) top = Math.max(margin, vh - h - margin);
      if (left < margin) left = margin;
    } else {
      left = anchorX;
      top = anchorY;
    }

    setPos({ top, left });
  }, [anchorX, anchorY, root, parentRect, items]);


  useEffect(() => {
    if (!root) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as Element | null;
      if (!target) return;
      if (target.closest("[data-ctx-menu]")) return;
      onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [root, onClose]);

  const cancelClose = () => {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };


  const scheduleSubClose = () => {
    cancelClose();
    closeTimer.current = window.setTimeout(() => setSubmenu(null), 200);
  };

  return (
    <motion.div
      ref={panelRef}
      data-ctx-menu
      role="menu"
      onMouseEnter={() => {
        cancelClose();
        onPanelEnter?.();
      }}
      onMouseLeave={() => {


        if (root) {
          setActiveIndex(-1);
        } else {
          onPanelLeave?.();
        }
      }}
      initial={{ opacity: 0, scale: 0.96, y: -2 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: -2 }}
      transition={{ duration: 0.1, ease: [0.32, 0.72, 0, 1] }}
      style={{
        position: "fixed",
        top: pos?.top ?? -9999,
        left: pos?.left ?? -9999,
        visibility: pos ? "visible" : "hidden",
        minWidth: 200,
        maxWidth: 280,
        transformOrigin: "top left",
      }}
      className={cn(
        "rounded-[var(--radius-md)] py-1",
        "bg-[var(--color-bg-elevated)] border border-[var(--color-border)]",
        "shadow-[var(--shadow-float)] select-none"
      )}
    >
      {items.map((it, i) => {
        if (it.kind === "separator") {
          return <div key={i} className="my-1 hairline" />;
        }
        if (it.kind === "label") {
          return (
            <p
              key={i}
              className="px-3 pt-1 pb-0.5 text-[9.5px] font-bold uppercase tracking-[0.16em] text-[var(--color-text-faint)]"
            >
              {it.text}
            </p>
          );
        }
        if (it.kind === "submenu") {
          const isOpen = submenu?.index === i;
          return (
            <button
              key={i}
              type="button"
              role="menuitem"
              disabled={it.disabled}
              onMouseEnter={(e) => {
                cancelClose();
                if (it.disabled) return;
                setActiveIndex(i);
                const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                setSubmenu({ index: i, rect });
              }}
              onMouseLeave={scheduleSubClose}
              onFocus={(e) => {
                if (it.disabled) return;
                const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                setSubmenu({ index: i, rect });
              }}
              className={cn(
                "w-full flex items-center gap-2 px-2.5 h-7 text-[12px] text-left transition-colors",
                "outline-none",
                it.disabled
                  ? "text-[var(--color-text-faint)] cursor-not-allowed"
                  : isOpen || activeIndex === i
                  ? "bg-[var(--color-bg-hover)] text-[var(--color-text)]"
                  : "text-[var(--color-text)] hover:bg-[var(--color-bg-hover)]"
              )}
            >
              <span className="w-3.5 inline-flex justify-center text-[var(--color-text-subtle)] shrink-0">
                {it.icon}
              </span>
              <span className="flex-1 truncate">{it.label}</span>
              <ChevronRight size={11} className="text-[var(--color-text-subtle)] shrink-0" />
            </button>
          );
        }
        if (it.kind === "checkbox") {
          return (
            <button
              key={i}
              type="button"
              role="menuitemcheckbox"
              aria-checked={it.checked}
              disabled={it.disabled}
              onClick={() => {
                if (it.disabled) return;
                it.onSelect();
              }}
              className={cn(
                "w-full flex items-center gap-2 px-2.5 h-7 text-[12px] text-left transition-colors outline-none",
                it.disabled
                  ? "text-[var(--color-text-faint)] cursor-not-allowed"
                  : "text-[var(--color-text)] hover:bg-[var(--color-bg-hover)]"
              )}
            >
              <span
                className={cn(
                  "w-3.5 h-3.5 rounded-[3px] shrink-0 inline-flex items-center justify-center text-[10px] font-bold",
                  it.checked
                    ? "bg-[var(--color-accent)] text-white"
                    : "border border-[var(--color-border-strong)]"
                )}
              >
                {it.checked ? "✓" : ""}
              </span>
              <span className="flex-1 truncate">{it.label}</span>
            </button>
          );
        }

        return (
          <button
            key={i}
            type="button"
            role="menuitem"
            disabled={it.disabled}
            onMouseEnter={() => {
              cancelClose();
              setActiveIndex(i);
              setSubmenu(null);
            }}
            onClick={() => {
              if (it.disabled) return;
              it.onSelect();
              onClose();
            }}
            className={cn(
              "w-full flex items-center gap-2 px-2.5 h-7 text-[12px] text-left transition-colors outline-none",
              it.disabled
                ? "text-[var(--color-text-faint)] cursor-not-allowed"
                : it.danger
                ? "text-[var(--color-danger)] hover:bg-[var(--color-danger-subtle)]"
                : activeIndex === i
                ? "bg-[var(--color-bg-hover)] text-[var(--color-text)]"
                : "text-[var(--color-text)] hover:bg-[var(--color-bg-hover)]"
            )}
          >
            <span
              className={cn(
                "w-3.5 inline-flex justify-center shrink-0",
                it.danger ? "text-[var(--color-danger)]" : "text-[var(--color-text-subtle)]"
              )}
            >
              {it.icon}
            </span>
            <span className="flex-1 truncate">{it.label}</span>
            {it.shortcut && (
              <span className="text-[10.5px] font-mono tabular-nums text-[var(--color-text-faint)] shrink-0">
                {formatShortcut(it.shortcut)}
              </span>
            )}
          </button>
        );
      })}

      {submenu && activeSubItems && (
        <MenuPanel
          items={activeSubItems}
          anchorX={0}
          anchorY={0}
          parentRect={submenu.rect}
          onClose={onClose}
          onPanelEnter={cancelClose}
          onPanelLeave={scheduleSubClose}
        />
      )}
    </motion.div>
  );
}
