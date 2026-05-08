import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Copy,
  CopyPlus,
  Edit2,
  FileCode2,
  FolderInput,
  Hash,
  Inbox,
  Pin,
  PinOff,
  Plus,
  Search as SearchIcon,
  Tag,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useUiStore } from "@/store/ui";
import { useCurrentSnippetList } from "@/hooks/useCurrentSnippetList";
import {
  useAllTags,
  useCollections,
  useDeleteSnippet,
  useDuplicateSnippet,
  useTogglePin,
  useUpdateSnippet,
} from "@/hooks/useSnippets";
import { useContextMenu, type CtxItem } from "@/components/ui/ContextMenu";
import { KbdHint } from "@/components/ui/KbdHint";
import { confirm } from "@/lib/dialog";
import { api } from "@/lib/tauri";
import { HighlightMatch } from "@/lib/highlight";
import { getLanguage } from "@/lib/languages";
import { cn } from "@/lib/cn";
import type { Snippet } from "@/types/snippet";

interface Props {
  iconOnly?: boolean;
}

export function SnippetList({ iconOnly = false }: Props) {
  const { selectedSnippetId, setSelectedSnippetId, listDensity, setIsEditing } =
    useUiStore();
  const {
    snippets,
    isLoading,
    isTagSearch,
    tagQuery,
    ftsQuery,
    debouncedQuery,
    sidebarView,
  } = useCurrentSnippetList();

  const ctxMenu = useContextMenu();
  const { data: collections = [] } = useCollections();
  const { data: allTags = [] } = useAllTags();
  const updateMutation = useUpdateSnippet();
  const togglePinMutation = useTogglePin();
  const duplicateMutation = useDuplicateSnippet();
  const deleteMutation = useDeleteSnippet();


  type CtxTarget = { kind: "card"; id: string } | { kind: "bg" };
  const [ctxTarget, setCtxTarget] = useState<CtxTarget | null>(null);

  useEffect(() => {
    if (!ctxMenu.isOpen) setCtxTarget(null);
  }, [ctxMenu.isOpen]);

  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollerRef.current) scrollerRef.current.scrollTop = 0;
  }, [sidebarView, debouncedQuery]);

  const buildCardMenu = (s: Snippet): CtxItem[] => {
    const moveItems: CtxItem[] = [
      {
        kind: "checkbox",
        label: "No collection",
        checked: s.collectionId === null,
        onSelect: async () => {
          if (s.collectionId === null) return;
          await updateMutation.mutateAsync({ id: s.id, collectionId: null });
          toast.success("Removed from collection");
        },
      },
      ...(collections.length > 0 ? [{ kind: "separator" } as CtxItem] : []),
      ...collections.map<CtxItem>((c) => ({
        kind: "checkbox",
        label: c.name,
        checked: s.collectionId === c.id,
        onSelect: async () => {
          if (s.collectionId === c.id) return;
          await updateMutation.mutateAsync({ id: s.id, collectionId: c.id });
          toast.success(`Moved to "${c.name}"`);
        },
      })),
    ];

    const tagItems: CtxItem[] = [
      ...allTags.map<CtxItem>((t) => ({
        kind: "checkbox",
        label: t,
        checked: s.tags.includes(t),
        onSelect: async () => {
          const next = s.tags.includes(t)
            ? s.tags.filter((x) => x !== t)
            : [...s.tags, t];
          await updateMutation.mutateAsync({ id: s.id, tags: next });
        },
      })),
      ...(allTags.length > 0 ? [{ kind: "separator" } as CtxItem] : []),
      {
        kind: "item",
        label: "New tag…",
        icon: <Plus size={11} />,
        onSelect: async () => {
          const raw = window.prompt("New tag name");
          const name = raw?.trim().replace(/^#/, "");
          if (!name) return;
          if (s.tags.includes(name)) return;
          await updateMutation.mutateAsync({ id: s.id, tags: [...s.tags, name] });
          toast.success(`Tagged #${name}`);
        },
      },
    ];

    return [
      {
        kind: "item",
        label: "Copy code",
        icon: <Copy size={11} />,
        shortcut: "Enter",
        onSelect: async () => {
          await api.clipboard.copy(s.body, s.id);
          toast.success("Copied to clipboard");
        },
      },
      {
        kind: "item",
        label: "Edit",
        icon: <Edit2 size={11} />,
        shortcut: "Ctrl+E",
        onSelect: () => {
          setSelectedSnippetId(s.id);
          setIsEditing(true);
        },
      },
      {
        kind: "item",
        label: "Duplicate",
        icon: <CopyPlus size={11} />,
        onSelect: async () => {
          const dup = await duplicateMutation.mutateAsync(s.id);
          setSelectedSnippetId(dup.id);
          toast.success("Snippet duplicated");
        },
      },
      {
        kind: "item",
        label: s.pinned ? "Unpin" : "Pin",
        icon: s.pinned ? <PinOff size={11} /> : <Pin size={11} />,
        shortcut: "Ctrl+P",
        onSelect: () => togglePinMutation.mutate(s.id),
      },
      { kind: "separator" },
      { kind: "submenu", label: "Move to", icon: <FolderInput size={11} />, items: moveItems },
      { kind: "submenu", label: "Tags", icon: <Tag size={11} />, items: tagItems },
      { kind: "separator" },
      {
        kind: "item",
        label: "Delete",
        icon: <Trash2 size={11} />,
        shortcut: "Ctrl+D",
        danger: true,
        onSelect: async () => {
          const ok = await confirm(
            `Delete "${s.title}"? This cannot be undone.`
          );
          if (!ok) return;
          await deleteMutation.mutateAsync(s.id);
          if (selectedSnippetId === s.id) setSelectedSnippetId(null);
          toast.success("Snippet deleted");
        },
      },
    ];
  };

  const buildBackgroundMenu = (): CtxItem[] => [
    {
      kind: "item",
      label: "New snippet",
      icon: <Plus size={11} />,
      shortcut: "Ctrl+N",
      onSelect: () => window.dispatchEvent(new CustomEvent("zcs:new-snippet")),
    },
    {
      kind: "item",
      label: "New collection…",
      icon: <Inbox size={11} />,
      onSelect: () => window.dispatchEvent(new CustomEvent("zcs:new-collection")),
    },
  ];


  const activeSnippet =
    ctxTarget?.kind === "card"
      ? snippets.find((s) => s.id === ctxTarget.id) ?? null
      : null;
  const ctxItems: CtxItem[] =
    ctxTarget?.kind === "card" && activeSnippet
      ? buildCardMenu(activeSnippet)
      : ctxTarget?.kind === "bg"
      ? buildBackgroundMenu()
      : [];

  return (
    <div
      ref={scrollerRef}
      onContextMenu={(e) => {
        setCtxTarget({ kind: "bg" });
        ctxMenu.openAt(e);
      }}
      className={cn(
        "flex-1 min-h-0 overflow-y-auto",
        iconOnly ? "px-0.5 py-1" : "px-1.5 py-1.5"
      )}
    >
      {isLoading ? (
        <SkeletonList iconOnly={iconOnly} />
      ) : snippets.length === 0 ? (
        <EmptyState
          isTagSearch={isTagSearch}
          tagName={tagQuery}
          ftsQuery={ftsQuery}
          sidebarView={sidebarView.type}
          iconOnly={iconOnly}
        />
      ) : (
        snippets.map((s, i) => (
          <SnippetCard
            key={s.id}
            snippet={s}
            index={i}
            density={listDensity}
            selected={s.id === selectedSnippetId}
            queryText={ftsQuery}
            tagHighlight={isTagSearch ? tagQuery : ""}
            iconOnly={iconOnly}
            onClick={() => setSelectedSnippetId(s.id)}
            onContextMenu={(e) => {
              e.stopPropagation();
              setCtxTarget({ kind: "card", id: s.id });
              ctxMenu.openAt(e);
            }}
          />
        ))
      )}
      {ctxMenu.render(ctxItems)}
    </div>
  );
}


interface CardProps {
  snippet: Snippet;
  index: number;
  selected: boolean;
  density: "comfortable" | "compact";
  queryText: string;
  tagHighlight: string;
  iconOnly: boolean;
  onClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}

function SnippetCard({
  snippet,
  selected,
  onClick,
  onContextMenu,
  density,
  queryText,
  tagHighlight,
  iconOnly,
}: CardProps) {
  const lang = getLanguage(snippet.language);
  const compact = density === "compact";

  if (iconOnly) {
    return (
      <button
        type="button"
        onClick={onClick}
        onContextMenu={onContextMenu}
        title={`${snippet.title} · ${lang.label}`}
        aria-label={snippet.title}
        className={cn(
          "relative flex items-center justify-center w-9 h-9 mx-auto mb-1",
          "rounded-[var(--radius-sm)] focus-ring outline-none transition-colors",
          selected
            ? "bg-[var(--color-accent-subtle)]"
            : "hover:bg-[var(--color-bg-elevated)]"
        )}
      >
        <LanguageMark lang={lang} size="sm" />
        {snippet.pinned && (
          <span
            className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[var(--color-accent)]"
            aria-hidden="true"
          />
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      onContextMenu={onContextMenu}
      className={cn(
        "relative w-full text-left rounded-[var(--radius-sm)] mb-0.5",
        "transition-colors group focus-ring outline-none",
        compact ? "px-2 py-1.5" : "px-2 py-2",
        selected
          ? "bg-[var(--color-accent-subtle)]"
          : "hover:bg-[var(--color-bg-elevated)]"
      )}
    >
      {selected && (
        <motion.span
          layoutId="library-active"
          transition={{ duration: 0.12, ease: [0.32, 0.72, 0, 1] }}
          className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-[var(--color-accent)]"
        />
      )}

      <div className="flex items-start gap-2">
        <LanguageMark lang={lang} size="md" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                "block text-[12.5px] font-semibold leading-tight line-clamp-1 flex-1 min-w-0",
                selected
                  ? "text-[var(--color-text)]"
                  : "text-[var(--color-text-muted)] group-hover:text-[var(--color-text)]"
              )}
            >
              {queryText ? (
                <HighlightMatch text={snippet.title} query={queryText} />
              ) : (
                snippet.title
              )}
            </span>
            {snippet.pinned && (
              <Pin
                size={10}
                className="text-[var(--color-accent)] shrink-0"
                style={{ fill: "currentColor" }}
              />
            )}
          </div>
          {!compact && snippet.tags.length > 0 && (
            <div className="flex items-center gap-1 mt-1 flex-wrap">
              {snippet.tags.slice(0, 3).map((t) => {
                const hit =
                  tagHighlight && t.toLowerCase().includes(tagHighlight);
                return (
                  <span
                    key={t}
                    className={cn(
                      "text-[10px] leading-none font-medium",
                      hit
                        ? "text-[var(--color-accent)]"
                        : "text-[var(--color-text-faint)]"
                    )}
                  >
                    #{t}
                  </span>
                );
              })}
              {snippet.tags.length > 3 && (
                <span className="text-[10px] text-[var(--color-text-faint)]">
                  +{snippet.tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}


function LanguageMark({
  lang,
  size,
}: {
  lang: { color: string; bgColor: string; label: string };
  size: "sm" | "md" | "lg";
}) {
  const dim =
    size === "sm" ? "w-5 h-5" : size === "md" ? "w-7 h-7" : "w-9 h-9";
  const icon = size === "sm" ? 11 : size === "md" ? 13 : 16;
  return (
    <span
      aria-label={lang.label}
      className={cn(
        "shrink-0 inline-flex items-center justify-center rounded-[var(--radius-sm)]",
        dim
      )}
      style={{
        backgroundColor: lang.bgColor,
        boxShadow: `inset 0 0 0 1px ${lang.color}33`,
      }}
    >
      <FileCode2 size={icon} style={{ color: lang.color }} strokeWidth={1.8} />
    </span>
  );
}


function SkeletonList({ iconOnly }: { iconOnly: boolean }) {
  if (iconOnly) {
    return (
      <div className="flex flex-col items-center gap-1">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.04 }}
            className="w-9 h-9 skeleton"
            style={{ opacity: 1 - i * 0.08 }}
          />
        ))}
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-1.5 px-1">
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.05 }}
          className="h-12 skeleton"
          style={{ opacity: 1 - i * 0.1 }}
        />
      ))}
    </div>
  );
}


function EmptyState({
  isTagSearch,
  tagName,
  ftsQuery,
  sidebarView,
  iconOnly,
}: {
  isTagSearch: boolean;
  tagName: string;
  ftsQuery: string;
  sidebarView: string;
  iconOnly: boolean;
}) {
  if (iconOnly) {
    return (
      <div className="flex flex-col items-center justify-center pt-6 text-[var(--color-text-faint)]">
        <FileCode2 size={18} strokeWidth={1.5} />
      </div>
    );
  }

  const icon = isTagSearch ? <Hash size={28} strokeWidth={1.4} />
            : ftsQuery     ? <SearchIcon size={28} strokeWidth={1.4} />
            : sidebarView === "pinned" ? <Pin size={28} strokeWidth={1.4} />
            :                <FileCode2 size={28} strokeWidth={1.4} />;

  const title = isTagSearch && tagName
    ? `No tags match "${tagName}"`
    : ftsQuery
    ? `No matches for "${ftsQuery}"`
    : sidebarView === "pinned"
    ? "Nothing pinned yet"
    : "No snippets yet";

  const hint: React.ReactNode = isTagSearch
    ? "Try a shorter or different fragment"
    : ftsQuery
    ? "Try fewer words or check spelling"
    : sidebarView === "pinned"
    ? "Pin a snippet to see it here"
    : (
      <>
        Press <KbdHint keys="Ctrl+N" /> to create your first snippet
      </>
    );

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24 }}
      className="flex flex-col items-center justify-center h-full gap-3 text-[var(--color-text-subtle)] px-6 py-12"
    >
      <motion.div
        initial={{ scale: 0.6, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", damping: 18, stiffness: 280 }}
        className={cn(
          "w-14 h-14 rounded-[var(--radius-lg)] flex items-center justify-center",
          "bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)]",
          "text-[var(--color-text-faint)]"
        )}
      >
        {icon}
      </motion.div>
      <p className="text-[12px] text-center text-[var(--color-text-muted)] font-medium">
        {title}
      </p>
      <p className="text-[11px] text-center text-[var(--color-text-faint)] inline-flex items-center justify-center gap-1.5 flex-wrap">
        {hint}
      </p>
    </motion.div>
  );
}
