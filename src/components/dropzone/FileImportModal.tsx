import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  X, CheckSquare, Square, FileCode2, AlertTriangle, Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { api } from "@/lib/tauri";
import { useCreateSnippet, useCollections } from "@/hooks/useSnippets";
import { detectLanguage, LANGUAGES } from "@/lib/languages";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { TagInput } from "@/components/tags/TagInput";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { cn } from "@/lib/cn";

interface FileEntry {
  path: string;
  filename: string;
  title: string;
  language: string;
  content: string | null;
  error: string | null;
  include: boolean;
  loading: boolean;
}

interface Props {
  paths: string[];
  onClose: () => void;
}

function basename(path: string): string {
  return path.split(/[/\\]/).pop() ?? path;
}

function stripExtension(name: string): string {
  const idx = name.lastIndexOf(".");
  return idx > 0 ? name.slice(0, idx) : name;
}

export function FileImportModal({ paths, onClose }: Props) {
  const [files, setFiles] = useState<FileEntry[]>(() =>
    paths.map((p) => {
      const filename = basename(p);
      return {
        path: p,
        filename,
        title: stripExtension(filename),
        language: detectLanguage(filename),
        content: null,
        error: null,
        include: true,
        loading: true,
      };
    })
  );
  const [sharedTags, setSharedTags] = useState<string[]>([]);
  const [collectionId, setCollectionId] = useState<string>("");
  const [importing, setImporting] = useState(false);

  const createSnippet = useCreateSnippet();
  const { data: collections = [] } = useCollections();

  useEffect(() => {
    paths.forEach((path, idx) => {
      api.files
        .readAsText(path)
        .then((content) => {
          setFiles((prev) =>
            prev.map((f, i) =>
              i === idx
                ? {
                    ...f,
                    content,
                    loading: false,
                    language: detectLanguage(f.filename, content),
                  }
                : f
            )
          );
        })
        .catch((err) => {
          setFiles((prev) =>
            prev.map((f, i) =>
              i === idx
                ? { ...f, error: String(err), loading: false, include: false }
                : f
            )
          );
        });
    });
  }, [paths]);

  const updateFile = (idx: number, patch: Partial<FileEntry>) => {
    setFiles((prev) => prev.map((f, i) => (i === idx ? { ...f, ...patch } : f)));
  };

  const importFiles = async (selected: FileEntry[]) => {
    const toImport = selected.filter((f) => f.content);
    if (toImport.length === 0) return;
    setImporting(true);
    await Promise.all(
      toImport.map((f) =>
        createSnippet.mutateAsync({
          title: f.title || f.filename,
          body: f.content!,
          language: f.language,
          description: "",
          collectionId: collectionId || undefined,
          tags: sharedTags,
        })
      )
    );
    setImporting(false);
    toast.success(`Imported ${toImport.length} snippet${toImport.length !== 1 ? "s" : ""}`);
    onClose();
  };

  const importSelected = () =>
    importFiles(files.filter((f) => f.include && !f.error && f.content));

  const importAllQuick = () => {
    const valid = files
      .filter((f) => !f.error && f.content)
      .map((f) => ({ ...f, title: f.title || stripExtension(f.filename), include: true }));
    importFiles(valid);
  };

  const selectedCount = files.filter((f) => f.include && !f.error && f.content).length;

  const collectionOptions = [
    { value: "", label: "No collection" },
    ...collections.map((c) => ({ value: c.id, label: c.name })),
  ];

  const langOptions = LANGUAGES.map((l) => ({ value: l.id, label: l.label }));

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.16 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-6"
      >
        <div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ type: "spring", damping: 24, stiffness: 320 }}
          className={cn(
            "relative z-10 w-[680px] max-h-[82vh] flex flex-col",
            "rounded-[var(--radius-lg)] overflow-hidden",
            "bg-[var(--color-bg-panel)]",
            "shadow-[var(--shadow-modal)]"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {}
          <div className="flex items-center justify-between px-5 h-14 border-b border-[var(--color-border-subtle)] shrink-0">
            <div>
              <h2 className="text-[14px] font-semibold text-[var(--color-text)]">
                Import {paths.length} file{paths.length !== 1 ? "s" : ""}
              </h2>
              <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                Pick which to add and tweak details before importing
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.12, rotate: 90 }}
              whileTap={{ scale: 0.85 }}
              onClick={onClose}
              className="w-7 h-7 rounded-[var(--radius-sm)] flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-elevated)] transition-colors"
            >
              <X size={15} />
            </motion.button>
          </div>

          {}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
            <AnimatePresence initial={false}>
              {files.map((f, idx) => (
                <motion.div
                  key={f.path}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(idx * 0.025, 0.18), type: "spring", damping: 24, stiffness: 360 }}
                  className={cn(
                    "rounded-[var(--radius-md)] border transition-colors p-3",
                    f.error
                      ? "border-[var(--color-danger-border)] bg-[var(--color-danger-subtle)]"
                      : f.include
                      ? "border-[var(--color-accent-border)] bg-[var(--color-bg-elevated)]"
                      : "border-[var(--color-border)] bg-[var(--color-bg-base)] opacity-60"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <motion.button
                      whileHover={{ scale: 1.12 }}
                      whileTap={{ scale: 0.88 }}
                      onClick={() => !f.error && updateFile(idx, { include: !f.include })}
                      disabled={!!f.error}
                      className="mt-0.5 shrink-0 text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {f.include && !f.error ? (
                        <CheckSquare size={16} style={{ color: "var(--color-accent)" }} />
                      ) : (
                        <Square size={16} />
                      )}
                    </motion.button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        {f.loading ? (
                          <Loader2 size={13} className="animate-spin text-[var(--color-text-subtle)] shrink-0" />
                        ) : f.error ? (
                          <AlertTriangle size={13} className="text-[var(--color-danger)] shrink-0" />
                        ) : (
                          <FileCode2 size={13} className="text-[var(--color-text-subtle)] shrink-0" />
                        )}
                        <span className="text-[11px] text-[var(--color-text-subtle)] truncate font-mono">
                          {f.filename}
                        </span>
                      </div>

                      {f.error ? (
                        <p className="text-[11px] text-[var(--color-danger)]">
                          {f.error}
                        </p>
                      ) : (
                        <>
                          <div className="flex items-center gap-2 mb-2">
                            <input
                              value={f.title}
                              onChange={(e) => updateFile(idx, { title: e.target.value })}
                              placeholder="Snippet title…"
                              className={cn(
                                "flex-1 bg-[var(--color-bg-input)] rounded-[var(--radius-sm)]",
                                "border border-[var(--color-border)] px-2.5 h-7 text-[12px]",
                                "text-[var(--color-text)] outline-none transition-all",
                                "focus:border-[var(--color-accent)] focus:shadow-[0_0_0_3px_var(--color-accent-soft)]"
                              )}
                            />
                            <CustomSelect
                              value={f.language}
                              onChange={(v) => updateFile(idx, { language: v })}
                              options={langOptions}
                              compact
                              className="w-[140px]"
                            />
                          </div>
                          {f.content && (
                            <pre className={cn(
                              "text-[10px] leading-relaxed text-[var(--color-text-muted)] font-mono",
                              "bg-[var(--color-bg-base)] rounded-[var(--radius-xs)] px-2.5 py-1.5",
                              "overflow-hidden line-clamp-2 border border-[var(--color-border-subtle)]"
                            )}>
                              {f.content.slice(0, 220)}
                              {f.content.length > 220 && "…"}
                            </pre>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {}
          <div className="px-4 py-3 border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-base)] shrink-0 flex flex-col gap-2.5">
            <Row label="Tags">
              <TagInput value={sharedTags} onChange={setSharedTags} className="flex-1" />
            </Row>
            <Row label="Collection">
              <CustomSelect
                value={collectionId}
                onChange={setCollectionId}
                options={collectionOptions}
                compact
                className="w-[180px]"
              />
            </Row>
          </div>

          {}
          <div className="flex items-center justify-between px-4 h-14 border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-panel)] shrink-0">
            <button
              onClick={importAllQuick}
              disabled={importing}
              className="text-[12px] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors disabled:opacity-50 underline-offset-4 hover:underline"
            >
              Import all without details
            </button>
            <div className="flex items-center gap-2">
              <PrimaryButton size="sm" variant="ghost" onClick={onClose}>
                Cancel
              </PrimaryButton>
              <PrimaryButton
                size="sm"
                variant="accent"
                onClick={importSelected}
                disabled={importing || selectedCount === 0}
                loading={importing}
              >
                Import {selectedCount} snippet{selectedCount !== 1 ? "s" : ""}
              </PrimaryButton>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-faint)] shrink-0 w-20">
        {label}
      </span>
      <div className="flex-1 flex items-center min-w-0">{children}</div>
    </div>
  );
}
