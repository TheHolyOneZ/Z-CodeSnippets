import { Suspense, useState } from "react";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { CodeMirrorView } from "./CodeMirrorView";
import { EditorSwitcher } from "./EditorSwitcher";
import { TagInput } from "@/components/tags/TagInput";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { IconButton } from "@/components/ui/IconButton";
import { useUiStore } from "@/store/ui";
import {
  useCreateSnippet,
  useUpdateSnippet,
  useCollections,
} from "@/hooks/useSnippets";
import { LANGUAGES } from "@/lib/languages";
import { cn } from "@/lib/cn";
import type { Snippet } from "@/types/snippet";

import { MonacoViewLazy as MonacoView } from "./MonacoViewLazy";

const LANGUAGE_OPTIONS = LANGUAGES.map((l) => ({ value: l.id, label: l.label }));

interface Props {
  snippet?: Snippet;
  onClose: () => void;
}

export function SnippetEditor({ snippet, onClose }: Props) {
  const { editorMode, defaultLanguage } = useUiStore();
  const { data: collections = [] } = useCollections();
  const createMutation = useCreateSnippet();
  const updateMutation = useUpdateSnippet();

  const [title, setTitle] = useState(snippet?.title ?? "");
  const [body, setBody] = useState(snippet?.body ?? "");
  const [language, setLanguage] = useState(snippet?.language ?? defaultLanguage);
  const [tags, setTags] = useState<string[]>(snippet?.tags ?? []);
  const [collectionId, setCollectionId] = useState<string | null>(snippet?.collectionId ?? null);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [bodyError, setBodyError] = useState<string | null>(null);

  const isEdit = !!snippet;
  const isPending = createMutation.isPending || updateMutation.isPending;

  const collectionOptions = [
    { value: "", label: "No collection" },
    ...collections.map((c) => ({ value: c.id, label: c.name })),
  ];

  const save = async () => {
    let valid = true;
    if (!title.trim()) {
      setTitleError("Give it a title");
      valid = false;
    }
    if (!body.trim()) {
      setBodyError("Body cannot be empty");
      valid = false;
    }
    if (!valid) return;

    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: snippet!.id, title, body, language, tags, collectionId });
        toast.success("Snippet updated");
      } else {
        await createMutation.mutateAsync({ title, body, language, tags, collectionId });
        toast.success("Snippet created");
      }
      onClose();
    } catch {
      toast.error("Failed to save snippet");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
      className="flex flex-col h-full"
    >
      {}
      <header className="flex items-center gap-2 px-4 h-12 border-b border-[var(--color-border-subtle)] shrink-0 bg-[var(--color-bg-panel)]">
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-text-faint)] mr-1">
          {isEdit ? "Edit" : "New"}
        </span>
        <div className="flex-1 relative">
          <input
            autoFocus
            value={title}
            onChange={(e) => { setTitle(e.target.value); if (titleError) setTitleError(null); }}
            placeholder="Snippet title…"
            className={cn(
              "w-full bg-transparent outline-none text-[14px] font-semibold",
              "text-[var(--color-text)] placeholder:text-[var(--color-text-subtle)]"
            )}
            onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
          />
          {titleError && (
            <motion.span
              initial={{ opacity: 0, y: -2 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute -bottom-3.5 left-0 text-[10px] text-[var(--color-danger)]"
            >
              {titleError}
            </motion.span>
          )}
        </div>
        <EditorSwitcher />
        <PrimaryButton
          size="sm"
          variant="accent"
          loading={isPending}
          leading={<Check size={13} />}
          onClick={save}
        >
          {isEdit ? "Update" : "Create"}
        </PrimaryButton>
        <IconButton
          icon={<X size={14} />}
          label="Cancel"
          shortcut="Esc"
          size="sm"
          tooltipSide="bottom"
          onClick={onClose}
        />
      </header>

      {}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[var(--color-border-subtle)] shrink-0 flex-wrap bg-[var(--color-bg-panel)]/60">
        <CustomSelect
          value={language}
          onChange={setLanguage}
          options={LANGUAGE_OPTIONS}
          compact
          className="min-w-[140px]"
        />
        <CustomSelect
          value={collectionId ?? ""}
          onChange={(v) => setCollectionId(v || null)}
          options={collectionOptions}
          compact
          className="min-w-[150px]"
        />
        <div className="flex-1 min-w-[200px]">
          <TagInput value={tags} onChange={setTags} />
        </div>
      </div>

      {}
      <div className={cn(
        "flex-1 overflow-hidden relative transition-shadow",
        bodyError && "ring-1 ring-inset ring-[var(--color-danger-border)]"
      )}>
        {editorMode === "codemirror" ? (
          <CodeMirrorView value={body} onChange={(v) => { setBody(v); if (bodyError) setBodyError(null); }} language={language} />
        ) : (
          <Suspense
            fallback={
              <div className="h-full flex items-center justify-center text-[var(--color-text-subtle)] text-[12px]">
                Loading Monaco…
              </div>
            }
          >
            <MonacoView value={body} onChange={(v) => { setBody(v); if (bodyError) setBodyError(null); }} language={language} />
          </Suspense>
        )}
        {bodyError && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-[var(--radius-sm)] bg-[var(--color-danger)] text-white text-[11px] font-medium shadow-[var(--shadow-float)]"
          >
            {bodyError}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
