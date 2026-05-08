import { useState, type KeyboardEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

interface Props {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function TagInput({ value, onChange, placeholder = "Add tag…", className }: Props) {
  const [input, setInput] = useState("");
  const [focused, setFocused] = useState(false);

  const add = () => {
    const tag = input.trim().toLowerCase().replace(/^#/, "");
    if (tag && !value.includes(tag)) {
      onChange([...value, tag]);
    }
    setInput("");
  };

  const remove = (tag: string) => onChange(value.filter((t) => t !== tag));

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add();
    }
    if (e.key === "Backspace" && !input && value.length > 0) {
      remove(value[value.length - 1]);
    }
  };

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-1.5 px-2 py-1.5 rounded-[var(--radius-sm)] min-h-[36px]",
        "bg-[var(--color-bg-input)] border transition-all",
        focused
          ? "border-[var(--color-accent)] shadow-[0_0_0_3px_var(--color-accent-soft)]"
          : "border-[var(--color-border)] hover:border-[var(--color-border-strong)]",
        className
      )}
    >
      <AnimatePresence initial={false}>
        {value.map((tag) => (
          <motion.span
            key={tag}
            layout
            initial={{ opacity: 0, scale: 0.8, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -4 }}
            transition={{ type: "spring", damping: 22, stiffness: 360 }}
            className={cn(
              "inline-flex items-center gap-1 px-2 h-5 rounded-[var(--radius-xs)] text-[11px] font-medium",
              "bg-[var(--color-accent-subtle)] text-[var(--color-accent)]"
            )}
          >
            <span className="opacity-70">#</span>
            <span>{tag}</span>
            <button
              type="button"
              onClick={() => remove(tag)}
              className="ml-0.5 p-0.5 rounded hover:bg-[var(--color-accent)] hover:text-white transition-colors"
              aria-label={`Remove ${tag}`}
            >
              <X size={10} />
            </button>
          </motion.span>
        ))}
      </AnimatePresence>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={onKey}
        onFocus={() => setFocused(true)}
        onBlur={() => { setFocused(false); add(); }}
        placeholder={value.length === 0 ? placeholder : ""}
        className={cn(
          "flex-1 min-w-[100px] bg-transparent outline-none text-[13px]",
          "text-[var(--color-text)] placeholder:text-[var(--color-text-subtle)]"
        )}
      />
    </div>
  );
}
