import { Hash, Search, X } from "lucide-react";
import { useRef, useState, forwardRef, useImperativeHandle } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchStore } from "@/store/search";
import { KbdHint } from "@/components/ui/KbdHint";
import { cn } from "@/lib/cn";

export interface SearchFieldHandle {
  focus: () => void;
}

interface Props {
  className?: string;
}


export const SearchField = forwardRef<SearchFieldHandle, Props>(function SearchField(
  { className },
  ref
) {
  const { query, setQuery, clear } = useSearchStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
  }));

  const isTagMode = query.startsWith("#") && query.length > 1;
  const hasQuery = query.length > 0;

  return (
    <div
      className={cn(
        "group relative flex items-center gap-2 px-3 h-9 rounded-[var(--radius-md)]",
        "bg-[var(--color-bg-input)] border transition-colors duration-150",
        focused
          ? "border-[var(--color-accent)] shadow-[0_0_0_3px_var(--color-accent-soft)]"
          : isTagMode
          ? "border-[var(--color-accent-border)]"
          : "border-[var(--color-border)] hover:border-[var(--color-border-strong)]",
        className
      )}
      onClick={() => inputRef.current?.focus()}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isTagMode ? (
          <motion.span
            key="hash"
            initial={{ opacity: 0, rotate: -90, scale: 0.6 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 90, scale: 0.6 }}
            transition={{ duration: 0.16 }}
            className="shrink-0 flex"
          >
            <Hash size={14} className="text-[var(--color-accent)]" />
          </motion.span>
        ) : (
          <motion.span
            key="search"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.16 }}
            className="shrink-0 flex"
          >
            <Search
              size={14}
              className={cn(
                "transition-colors",
                focused ? "text-[var(--color-accent)]" : "text-[var(--color-text-subtle)]"
              )}
            />
          </motion.span>
        )}
      </AnimatePresence>

      <input
        ref={inputRef}
        id="global-search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={isTagMode ? "Tag name…" : "Search snippets, # for tags"}
        className={cn(
          "flex-1 min-w-0 bg-transparent outline-none text-[13px]",
          "text-[var(--color-text)] placeholder:text-[var(--color-text-subtle)]",
          "selection:bg-[var(--color-accent-subtle)]"
        )}
      />

      {isTagMode && (
        <motion.span
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0"
          style={{
            color: "var(--color-accent)",
            backgroundColor: "var(--color-accent-subtle)",
          }}
        >
          Tag
        </motion.span>
      )}

      {hasQuery ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            clear();
            inputRef.current?.focus();
          }}
          className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[var(--color-text-subtle)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-elevated)] transition-colors"
          aria-label="Clear search"
        >
          <X size={12} />
        </button>
      ) : (
        <span className="hidden sm:inline-flex shrink-0">
          <KbdHint keys="Ctrl+F" />
        </span>
      )}
    </div>
  );
});
