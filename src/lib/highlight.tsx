import type { ReactNode } from "react";


export function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const q = query.replace(/^#/, "").trim().toLowerCase();
  if (!q) return <>{text}</>;
  const parts: ReactNode[] = [];
  const lower = text.toLowerCase();
  let last = 0;
  let i = 0;
  while (i < lower.length) {
    const idx = lower.indexOf(q, i);
    if (idx === -1) break;
    if (idx > last) parts.push(<span key={last}>{text.slice(last, idx)}</span>);
    parts.push(
      <span
        key={`m-${idx}`}
        className="text-[var(--color-accent)] font-semibold bg-[var(--color-accent-soft)] rounded-sm"
      >
        {text.slice(idx, idx + q.length)}
      </span>
    );
    last = idx + q.length;
    i = last;
  }
  if (last < text.length) parts.push(<span key={last}>{text.slice(last)}</span>);
  return <>{parts}</>;
}
