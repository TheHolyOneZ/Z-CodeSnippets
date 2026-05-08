import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useUiStore, SIDEBAR_MIN_WIDTH, SIDEBAR_MAX_WIDTH } from "@/store/ui";
import { useCurrentSnippetList } from "@/hooks/useCurrentSnippetList";
import { SearchField, type SearchFieldHandle } from "./SearchField";
import { FilterBar } from "./FilterBar";
import { SnippetList } from "./SnippetList";
import { cn } from "@/lib/cn";

const COLLAPSED_WIDTH = 56;

interface Props {
  searchRef: React.Ref<SearchFieldHandle>;
}

export function Sidebar({ searchRef }: Props) {
  const { sidebarWidth, setSidebarWidth, sidebarCollapsed } = useUiStore();
  const { snippets } = useCurrentSnippetList();
  const count = snippets.length;

  const [dragging, setDragging] = useState(false);
  const dragStartX = useRef(0);
  const dragStartW = useRef(0);

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent) => {
      const delta = e.clientX - dragStartX.current;
      setSidebarWidth(dragStartW.current + delta);
    };
    const onUp = () => setDragging(false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [dragging, setSidebarWidth]);

  const startDrag = (e: React.MouseEvent) => {
    if (sidebarCollapsed) return;
    dragStartX.current = e.clientX;
    dragStartW.current = sidebarWidth;
    setDragging(true);
  };

  const width = sidebarCollapsed
    ? COLLAPSED_WIDTH
    : Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, sidebarWidth));

  return (
    <motion.aside
      role="complementary"
      aria-label="Snippet library"
      animate={{ width }}
      transition={{ type: "spring", damping: 30, stiffness: 320, mass: 0.8 }}
      className={cn(
        "relative z-20 flex flex-col h-full shrink-0 overflow-hidden",
        "border-r border-[var(--color-border-subtle)]",
        "bg-[var(--color-bg-panel)]"
      )}
      style={{ width }}
    >
      {sidebarCollapsed ? (
        <SnippetList iconOnly />
      ) : (
        <ExpandedColumn searchRef={searchRef} count={count} />
      )}

      {!sidebarCollapsed && (
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize sidebar"
          onMouseDown={startDrag}
          className={cn("sidebar-resizer", dragging && "dragging")}
        />
      )}
    </motion.aside>
  );
}

function ExpandedColumn({
  searchRef,
  count,
}: {
  searchRef: React.Ref<SearchFieldHandle>;
  count: number;
}) {
  return (
    <>
      <div
        className={cn(
          "sticky top-0 z-10 shrink-0",
          "px-3 pt-3 pb-2 flex flex-col gap-2",
          "bg-[var(--color-bg-panel)]",
          "border-b border-[var(--color-border-subtle)]"
        )}
      >
        <SearchField ref={searchRef} />
        <FilterBar />
      </div>

      <SnippetList />

      <div
        className={cn(
          "shrink-0 px-3 h-7 flex items-center justify-between",
          "border-t border-[var(--color-border-subtle)]",
          "bg-[var(--color-bg-base)]/60"
        )}
      >
        <span className="text-[10.5px] font-mono text-[var(--color-text-faint)]">
          {count} {count === 1 ? "result" : "results"}
        </span>
      </div>
    </>
  );
}
