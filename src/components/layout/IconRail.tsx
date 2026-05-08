import {
  Plus,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  Rows3,
  Rows4,
} from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";
import { KbdHint } from "@/components/ui/KbdHint";
import { useUiStore } from "@/store/ui";
import { cn } from "@/lib/cn";

interface Props {
  onNewSnippet: () => void;
  onSettings: () => void;
}


export function IconRail({ onNewSnippet, onSettings }: Props) {
  const {
    sidebarCollapsed,
    toggleSidebarCollapsed,
    listDensity,
    setListDensity,
  } = useUiStore();

  return (
    <aside
      role="toolbar"
      aria-label="Application actions"
      className={cn(
        "relative z-30 flex flex-col items-center shrink-0 h-full",
        "border-r border-[var(--color-border-subtle)]",
        "bg-[var(--color-bg-panel)]"
      )}
      style={{ width: 44 }}
    >
      {}
      <div className="flex items-center justify-center h-12 w-full border-b border-[var(--color-border-subtle)] shrink-0">
        <img
          src="/icons/icon.png"
          alt="Z-Code Snippets"
          width={28}
          height={28}
          draggable={false}
          className="rounded-[var(--radius-sm)] select-none"
          aria-hidden="true"
        />
      </div>

      {}
      <div className="flex flex-col items-center gap-1 pt-3">
        <RailButton
          label="New snippet"
          shortcut="Ctrl+N"
          accent
          onClick={onNewSnippet}
        >
          <Plus size={15} strokeWidth={2.4} />
        </RailButton>

        <RailButton
          label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          shortcut="Ctrl+B"
          onClick={toggleSidebarCollapsed}
        >
          {sidebarCollapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
        </RailButton>

        <RailButton
          label={listDensity === "comfortable" ? "Switch to compact" : "Switch to comfortable"}
          onClick={() =>
            setListDensity(listDensity === "comfortable" ? "compact" : "comfortable")
          }
        >
          {listDensity === "comfortable" ? <Rows3 size={15} /> : <Rows4 size={15} />}
        </RailButton>
      </div>

      {}
      <div className="mt-auto flex flex-col items-center gap-1 pb-3">
        <RailButton label="Settings" shortcut="Ctrl+," onClick={onSettings}>
          <Settings size={15} />
        </RailButton>
      </div>
    </aside>
  );
}

interface RailButtonProps {
  label: string;
  shortcut?: string;
  accent?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function RailButton({ label, shortcut, accent, onClick, children }: RailButtonProps) {
  return (
    <Tooltip
      side="right"
      content={
        <span className="inline-flex items-center gap-1.5">
          <span>{label}</span>
          {shortcut && <KbdHint keys={shortcut} />}
        </span>
      }
    >
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        className={cn(
          "relative w-8 h-8 rounded-[var(--radius-md)] flex items-center justify-center transition-colors focus-ring outline-none",
          accent
            ? "bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] shadow-[var(--shadow-accent)]"
            : "text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-elevated)]"
        )}
      >
        {children}
      </button>
    </Tooltip>
  );
}
