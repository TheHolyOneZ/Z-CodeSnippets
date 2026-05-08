import { Suspense, useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  CopyPlus,
  Edit2,
  FileCode2,
  Filter,
  Pin,
  PinOff,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { CodeMirrorView } from "./CodeMirrorView";
import { EditorSwitcher } from "./EditorSwitcher";
import { SnippetEditor } from "./SnippetEditor";
import { TagBadge } from "@/components/tags/TagBadge";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { IconButton } from "@/components/ui/IconButton";
import { KbdHint } from "@/components/ui/KbdHint";
import { Tooltip } from "@/components/ui/Tooltip";
import { useContextMenu } from "@/components/ui/ContextMenu";
import { useUiStore } from "@/store/ui";
import { useSearchStore } from "@/store/search";
import {
  useSnippet,
  useDeleteSnippet,
  useTogglePin,
  useDuplicateSnippet,
  useUpdateSnippet,
} from "@/hooks/useSnippets";
import { useCurrentSnippetList } from "@/hooks/useCurrentSnippetList";
import { api } from "@/lib/tauri";
import { confirm } from "@/lib/dialog";
import { getLanguage } from "@/lib/languages";
import { cn } from "@/lib/cn";

import { MonacoViewLazy as MonacoView } from "./MonacoViewLazy";

export function Workspace() {
  const {
    selectedSnippetId,
    setSelectedSnippetId,
    setSidebarView,
    editorMode,
    isEditing,
    setIsEditing,
  } = useUiStore();
  const { setQuery } = useSearchStore();
  const { snippets } = useCurrentSnippetList();
  const { data: snippet, isLoading } = useSnippet(selectedSnippetId);
  const deleteMutation = useDeleteSnippet();
  const togglePinMutation = useTogglePin();
  const duplicateMutation = useDuplicateSnippet();
  const updateMutation = useUpdateSnippet();
  const ctxMenu = useContextMenu();

  const [ctxTag, setCtxTag] = useState<string | null>(null);
  useEffect(() => { if (!ctxMenu.isOpen) setCtxTag(null); }, [ctxMenu.isOpen]);

  const idx = selectedSnippetId
    ? snippets.findIndex((s) => s.id === selectedSnippetId)
    : -1;
  const total = snippets.length;
  const hasPrev = idx > 0;
  const hasNext = idx >= 0 && idx < total - 1;
  const goPrev = () => hasPrev && setSelectedSnippetId(snippets[idx - 1].id);
  const goNext = () => hasNext && setSelectedSnippetId(snippets[idx + 1].id);

  const copy = async () => {
    if (!snippet) return;
    await api.clipboard.copy(snippet.body, snippet.id);
    toast.success("Copied to clipboard");
  };

  const removeSnippet = async () => {
    if (!snippet) return;
    const ok = await confirm(`Delete "${snippet.title}"? This cannot be undone.`);
    if (!ok) return;
    await deleteMutation.mutateAsync(snippet.id);
    setSelectedSnippetId(null);
    toast.success("Snippet deleted");
  };

  const togglePin = async () => {
    if (!snippet) return;
    await togglePinMutation.mutateAsync(snippet.id);
  };

  const duplicate = async () => {
    if (!snippet) return;
    const dup = await duplicateMutation.mutateAsync(snippet.id);
    setSelectedSnippetId(dup.id);
    toast.success("Snippet duplicated");
  };

  if (!selectedSnippetId) return <EmptyWorkspace />;
  if (isLoading || !snippet) return <LoadingWorkspace />;
  if (isEditing) {
    return <SnippetEditor snippet={snippet} onClose={() => setIsEditing(false)} />;
  }

  const lang = getLanguage(snippet.language);

  return (
    <section className="flex flex-col h-full">
      {}
      <header
        className={cn(
          "flex items-center gap-3 px-5 py-3 shrink-0",
          "border-b border-[var(--color-border-subtle)]",
          "bg-[var(--color-bg-panel)]"
        )}
      >
        <div
          className="w-9 h-9 rounded-[var(--radius-md)] flex items-center justify-center shrink-0"
          style={{
            backgroundColor: lang.bgColor,
            boxShadow: `inset 0 0 0 1px ${lang.color}40`,
          }}
          aria-label={lang.label}
          title={lang.label}
        >
          <FileCode2 size={17} strokeWidth={1.7} style={{ color: lang.color }} />
        </div>

        <div className="flex-1 min-w-0">
          <h1 className="text-[14px] font-semibold text-[var(--color-text)] leading-tight line-clamp-1">
            {snippet.title}
          </h1>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            {snippet.tags.map((tag) => (
              <TagBadge
                key={tag}
                tag={tag}
                size="xs"
                onClick={() => setQuery(`#${tag}`)}
                onContextMenu={(e) => {
                  setCtxTag(tag);
                  ctxMenu.openAt(e);
                }}
              />
            ))}
            {snippet.pinned && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[var(--color-accent)]">
                <Pin size={9} style={{ fill: "currentColor" }} />
                Pinned
              </span>
            )}
          </div>
        </div>

        {}
        {total > 1 && (
          <div className="flex items-center gap-0.5 shrink-0 mr-1">
            <Tooltip
              side="bottom"
              content={
                <span className="inline-flex items-center gap-1.5">
                  Previous <KbdHint keys="Alt+ArrowUp" />
                </span>
              }
            >
              <NavBtn disabled={!hasPrev} onClick={goPrev} aria-label="Previous snippet">
                <ChevronLeft size={14} />
              </NavBtn>
            </Tooltip>
            <span className="text-[10.5px] font-mono text-[var(--color-text-faint)] tabular-nums px-1 select-none">
              {idx + 1} <span className="opacity-50">/</span> {total}
            </span>
            <Tooltip
              side="bottom"
              content={
                <span className="inline-flex items-center gap-1.5">
                  Next <KbdHint keys="Alt+ArrowDown" />
                </span>
              }
            >
              <NavBtn disabled={!hasNext} onClick={goNext} aria-label="Next snippet">
                <ChevronRight size={14} />
              </NavBtn>
            </Tooltip>
          </div>
        )}

        <EditorSwitcher />
      </header>

      {}
      <div className="flex-1 overflow-hidden relative">
        {editorMode === "codemirror" ? (
          <CodeMirrorView value={snippet.body} language={snippet.language} readOnly />
        ) : (
          <Suspense fallback={<EditorLoading />}>
            <MonacoView value={snippet.body} language={snippet.language} readOnly />
          </Suspense>
        )}
      </div>

      {}
      <footer
        className={cn(
          "flex items-center gap-1 px-4 py-2.5 shrink-0",
          "border-t border-[var(--color-border-subtle)]",
          "bg-[var(--color-bg-panel)]"
        )}
      >
        <PrimaryButton
          size="sm"
          variant="accent"
          leading={<Copy size={13} />}
          trailing={<KbdHint keys="Enter" className="opacity-80" />}
          onClick={copy}
        >
          Copy snippet
        </PrimaryButton>

        <div className="w-px h-5 bg-[var(--color-border-subtle)] mx-1.5" />

        <PrimaryButton
          size="sm"
          variant="ghost"
          leading={<Edit2 size={13} />}
          onClick={() => setIsEditing(true)}
          trailing={<KbdHint keys="Ctrl+E" />}
        >
          Edit
        </PrimaryButton>

        <PrimaryButton
          size="sm"
          variant="ghost"
          leading={<CopyPlus size={13} />}
          onClick={duplicate}
        >
          Duplicate
        </PrimaryButton>

        <PrimaryButton
          size="sm"
          variant="ghost"
          leading={snippet.pinned ? <PinOff size={13} /> : <Pin size={13} />}
          onClick={togglePin}
          trailing={<KbdHint keys="Ctrl+P" />}
        >
          {snippet.pinned ? "Unpin" : "Pin"}
        </PrimaryButton>

        <div className="flex-1" />

        <IconButton
          icon={<Trash2 size={14} />}
          label="Delete snippet"
          shortcut="Ctrl+D"
          variant="danger"
          size="sm"
          tooltipSide="top"
          onClick={removeSnippet}
        />
      </footer>
      {ctxMenu.render((() => {
        if (!ctxTag) return [];
        return [
          {
            kind: "item" as const,
            label: `Filter by #${ctxTag}`,
            icon: <Filter size={11} />,
            onSelect: () => setSidebarView({ type: "tag", tag: ctxTag }),
          },
          {
            kind: "item" as const,
            label: "Search this tag",
            onSelect: () => setQuery(`#${ctxTag}`),
          },
          { kind: "separator" as const },
          {
            kind: "item" as const,
            label: "Remove from snippet",
            icon: <X size={11} />,
            danger: true,
            onSelect: async () => {
              await updateMutation.mutateAsync({
                id: snippet.id,
                tags: snippet.tags.filter((t) => t !== ctxTag),
              });
              toast.success(`Removed #${ctxTag}`);
            },
          },
        ];
      })())}
    </section>
  );
}

function NavBtn({
  disabled,
  onClick,
  children,
  ...rest
}: {
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
} & React.AriaAttributes) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      {...rest}
      className={cn(
        "w-6 h-6 rounded-[var(--radius-xs)] flex items-center justify-center transition-colors focus-ring outline-none",
        disabled
          ? "text-[var(--color-text-faint)] cursor-not-allowed"
          : "text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-elevated)]"
      )}
    >
      {children}
    </button>
  );
}

function EditorLoading() {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-3 text-[var(--color-text-subtle)]">
      <div className="w-8 h-8 rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-accent)] animate-spin" />
      <span className="text-[12px]">Loading Monaco…</span>
    </div>
  );
}

function LoadingWorkspace() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-5 py-3 border-b border-[var(--color-border-subtle)]">
        <div className="h-9 w-9 skeleton" />
        <div className="flex-1 flex flex-col gap-1.5">
          <div className="h-4 w-2/3 skeleton" />
          <div className="h-3 w-1/3 skeleton" />
        </div>
      </div>
      <div className="flex-1 m-5 skeleton" />
    </div>
  );
}

function EmptyWorkspace() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 select-none px-6 text-center">
      <FileCode2 size={28} strokeWidth={1.4} className="text-[var(--color-text-subtle)]" />
      <div>
        <p className="text-[13px] font-medium text-[var(--color-text-muted)]">
          No snippet selected
        </p>
        <p className="text-[11.5px] text-[var(--color-text-faint)] mt-1">
          Pick one from the library, or press{" "}
          <span className="inline-block align-middle"><KbdHint keys="Ctrl+N" /></span>{" "}
          to start a new one.
        </p>
      </div>
    </div>
  );
}
