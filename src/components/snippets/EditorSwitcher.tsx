import { motion } from "framer-motion";
import { Code2 } from "lucide-react";
import { useUiStore, type EditorMode } from "@/store/ui";
import { cn } from "@/lib/cn";

const MODES: { id: EditorMode; label: string; tip: string }[] = [
  { id: "codemirror", label: "CM6",    tip: "Lightweight CodeMirror 6" },
  { id: "monaco",     label: "Monaco", tip: "Full-featured Monaco editor" },
];

export function EditorSwitcher() {
  const { editorMode, setEditorMode } = useUiStore();

  return (
    <div
      role="tablist"
      aria-label="Editor mode"
      className={cn(
        "relative flex items-center gap-0.5 p-0.5 rounded-[var(--radius-sm)]",
        "bg-[var(--color-bg-input)] border border-[var(--color-border-subtle)]"
      )}
    >
      <span className="pl-1.5 pr-0.5 flex items-center text-[var(--color-text-subtle)]">
        <Code2 size={12} />
      </span>
      {MODES.map((m) => {
        const active = editorMode === m.id;
        return (
          <button
            key={m.id}
            role="tab"
            aria-selected={active}
            title={m.tip}
            onClick={() => setEditorMode(m.id)}
            className={cn(
              "relative px-2 h-5 text-[11px] font-semibold transition-colors rounded-[3px] focus-ring outline-none",
              active ? "text-white" : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            )}
          >
            {active && (
              <motion.span
                layoutId="editor-mode-pill"
                transition={{ type: "spring", damping: 26, stiffness: 380 }}
                className="absolute inset-0 rounded-[3px] bg-[var(--color-accent)]"
              />
            )}
            <span className="relative z-10">{m.label}</span>
          </button>
        );
      })}
    </div>
  );
}
