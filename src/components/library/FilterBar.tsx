import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import {
  ChevronDown,
  Edit2,
  Hash,
  Inbox,
  Layers,
  Pin,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { confirm } from "@/lib/dialog";
import { useUiStore } from "@/store/ui";
import {
  useAllTags,
  useCollections,
  useCreateCollection,
  useDeleteCollection,
  useRenameCollection,
} from "@/hooks/useSnippets";
import { useContextMenu, type CtxItem } from "@/components/ui/ContextMenu";
import type { SidebarView } from "@/types/snippet";
import { cn } from "@/lib/cn";


export function FilterBar() {
  const { sidebarView, setSidebarView } = useUiStore();
  const { data: collections = [] } = useCollections();
  const { data: tags = [] } = useAllTags();

  const isAll = sidebarView.type === "all";
  const isPinned = sidebarView.type === "pinned";
  const isCollection = sidebarView.type === "collection";
  const isTag = sidebarView.type === "tag";

  const activeCollection =
    isCollection ? collections.find((c) => c.id === sidebarView.id) : undefined;

  const setView = (v: SidebarView) => setSidebarView(v);

  return (
    <div className="flex flex-col gap-1.5">
      {}
      <LayoutGroup id="filter-bar">
        <div
          role="tablist"
          aria-label="Snippet filters"
          className="flex flex-wrap items-center gap-1"
        >
          <FilterPill
            active={isAll}
            icon={<Layers size={11} />}
            label="All"
            onClick={() => setView({ type: "all" })}
          />
          <FilterPill
            active={isPinned}
            icon={<Pin size={11} style={isPinned ? { fill: "currentColor" } : undefined} />}
            label="Pinned"
            onClick={() => setView({ type: "pinned" })}
          />

          <CollectionPicker
            collections={collections}
            activeCollectionId={isCollection ? sidebarView.id : null}
            onSelect={(id) => setView({ type: "collection", id })}
          />

          <TagPicker
            tags={tags}
            activeTag={isTag ? sidebarView.tag : null}
            onSelect={(tag) => setView({ type: "tag", tag })}
          />
        </div>
      </LayoutGroup>

      {}
      <AnimatePresence initial={false}>
        {(isCollection || isTag) && (
          <motion.div
            key="active-chips"
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: "auto", marginTop: 4 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
            className="flex items-center gap-1.5 flex-wrap overflow-hidden"
          >
            {isCollection && activeCollection && (
              <ActiveChip
                icon={<Inbox size={10} />}
                label={activeCollection.name}
                onClear={() => setView({ type: "all" })}
              />
            )}
            {isTag && (
              <ActiveChip
                icon={<Hash size={10} />}
                label={sidebarView.tag}
                onClear={() => setView({ type: "all" })}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


interface PillProps {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  asChip?: boolean;
}

function FilterPill({ active, icon, label, onClick, asChip }: PillProps) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "relative inline-flex items-center gap-1.5 px-2.5 h-7 shrink-0",
        "rounded-[var(--radius-sm)] text-[11.5px] font-semibold",
        "focus-ring outline-none transition-colors",
        active
          ? "text-[var(--color-accent)]"
          : asChip
          ? "text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-elevated)]"
          : "text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-elevated)]"
      )}
    >
      {active && (
        <motion.span
          layoutId="filter-active"
          transition={{ duration: 0.14, ease: [0.32, 0.72, 0, 1] }}
          className={cn(
            "absolute inset-0 rounded-[var(--radius-sm)]",
            "bg-[var(--color-accent-subtle)]",
            "border border-[var(--color-accent-border)]"
          )}
        />
      )}
      <span className="relative inline-flex items-center gap-1.5">
        {icon}
        <span>{label}</span>
      </span>
    </button>
  );
}


function ActiveChip({
  icon,
  label,
  onClear,
}: {
  icon: React.ReactNode;
  label: string;
  onClear: () => void;
}) {
  return (
    <motion.span
      layout
      initial={{ opacity: 0, scale: 0.92, x: -4 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.92, x: -4 }}
      transition={{ type: "spring", damping: 22, stiffness: 360 }}
      className={cn(
        "inline-flex items-center gap-1 pl-2 pr-1 h-5 rounded-[var(--radius-xs)]",
        "bg-[var(--color-accent-subtle)] text-[var(--color-accent)]",
        "border border-[var(--color-accent-border)]",
        "text-[10.5px] font-semibold"
      )}
    >
      {icon}
      <span className="truncate max-w-[120px]">{label}</span>
      <button
        type="button"
        onClick={onClear}
        aria-label={`Clear ${label} filter`}
        className="ml-0.5 w-3.5 h-3.5 rounded-full inline-flex items-center justify-center hover:bg-[var(--color-accent)] hover:text-white transition-colors"
      >
        <X size={9} />
      </button>
    </motion.span>
  );
}


function CollectionPicker({
  collections,
  activeCollectionId,
  onSelect,
}: {
  collections: { id: string; name: string }[];
  activeCollectionId: string | null;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  const createCollection = useCreateCollection();
  const deleteCollection = useDeleteCollection();
  const renameCollection = useRenameCollection();
  const ctxMenu = useContextMenu();
  const [ctxCollectionId, setCtxCollectionId] = useState<string | null>(null);
  useEffect(() => { if (!ctxMenu.isOpen) setCtxCollectionId(null); }, [ctxMenu.isOpen]);

  const active = !!activeCollectionId;
  const activeName = collections.find((c) => c.id === activeCollectionId)?.name;

  const openMenu = () => {
    if (triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 6, left: r.left });
    }
    setOpen((o) => !o);
  };


  useEffect(() => {
    const onOpenCreate = () => {
      if (triggerRef.current) {
        const r = triggerRef.current.getBoundingClientRect();
        setPos({ top: r.bottom + 6, left: r.left });
      }
      setOpen(true);
      setCreating(true);
    };
    window.addEventListener("zcs:filterbar:open-collection-create", onOpenCreate);
    return () =>
      window.removeEventListener("zcs:filterbar:open-collection-create", onOpenCreate);
  }, []);

  const renameOne = async (id: string, currentName: string) => {
    const raw = window.prompt("Rename collection", currentName);
    const next = raw?.trim();
    if (!next || next === currentName) return;
    await renameCollection.mutateAsync({ id, name: next });
    toast.success("Collection renamed");
  };


  const ctxCollection = collections.find((c) => c.id === ctxCollectionId) ?? null;
  const ctxItems = ctxCollection
    ? buildCollectionItemMenu(ctxCollection.id, ctxCollection.name)
    : [];

  function buildCollectionItemMenu(id: string, name: string): CtxItem[] {
    return [
    {
      kind: "item",
      label: "Rename…",
      icon: <Edit2 size={11} />,
      onSelect: () => renameOne(id, name),
    },
    { kind: "separator" },
    {
      kind: "item",
      label: "Delete",
      icon: <Trash2 size={11} />,
      danger: true,
      onSelect: async () => {
        const ok = await confirm(
          `Delete collection "${name}"? Snippets will be unassigned.`
        );
        if (!ok) return;
        await deleteCollection.mutateAsync(id);
        if (activeCollectionId === id) onSelect("");
        toast.success("Collection deleted");
      },
    },
    ];
  }

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (
        !triggerRef.current?.contains(e.target as Node) &&
        !popRef.current?.contains(e.target as Node)
      ) {
        setOpen(false);
        setCreating(false);
        setNewName("");
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setCreating(false);
        setNewName("");
      }
    };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const create = async () => {
    const name = newName.trim();
    if (!name) return;
    const c = await createCollection.mutateAsync({ name });
    setNewName("");
    setCreating(false);
    setOpen(false);
    onSelect(c.id);
    toast.success(`Collection "${name}" created`);
  };

  const removeOne = async (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const ok = await confirm(`Delete collection "${name}"? Snippets will be unassigned.`);
    if (!ok) return;
    await deleteCollection.mutateAsync(id);
    if (activeCollectionId === id) onSelect("");
    toast.success("Collection deleted");
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={openMenu}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          "relative inline-flex items-center gap-1.5 px-2.5 h-7 shrink-0",
          "rounded-[var(--radius-sm)] text-[11.5px] font-semibold",
          "focus-ring outline-none transition-colors",
          active
            ? "text-[var(--color-accent)] bg-[var(--color-accent-subtle)] border border-[var(--color-accent-border)]"
            : open
            ? "text-[var(--color-text)] bg-[var(--color-bg-elevated)]"
            : "text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-elevated)]"
        )}
      >
        <Inbox size={11} />
        <span className="truncate max-w-[110px]">
          {active && activeName ? activeName : "Collection"}
        </span>
        <ChevronDown
          size={10}
          className={cn("transition-transform shrink-0", open && "rotate-180")}
        />
      </button>

      {open &&
        createPortal(
          <AnimatePresence>
            <motion.div
              ref={popRef}
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              transition={{ duration: 0.16, ease: [0.32, 0.72, 0, 1] }}
              style={{
                position: "fixed",
                top: pos.top,
                left: pos.left,
                zIndex: 9999,
                width: 260,
                transformOrigin: "top left",
              }}
              className={cn(
                "rounded-[var(--radius-md)] py-1.5",
                "bg-[var(--color-bg-elevated)] border border-[var(--color-border)]",
                "shadow-[var(--shadow-float)]"
              )}
            >
              <PopHeader>Collections</PopHeader>

              {collections.length === 0 && !creating && (
                <p className="px-3 py-2 text-[11px] text-[var(--color-text-subtle)]">
                  None yet
                </p>
              )}

              <div className="max-h-[240px] overflow-y-auto">
                {collections.map((c) => (
                  <div key={c.id} className="group relative">
                    <button
                      type="button"
                      onClick={() => {
                        onSelect(c.id);
                        setOpen(false);
                      }}
                      onContextMenu={(e) => {
                        setCtxCollectionId(c.id);
                        ctxMenu.openAt(e);
                      }}
                      className={cn(
                        "w-full flex items-center gap-2 px-3 h-8 text-[12px] text-left transition-colors",
                        c.id === activeCollectionId
                          ? "bg-[var(--color-accent-subtle)] text-[var(--color-accent)]"
                          : "text-[var(--color-text)] hover:bg-[var(--color-bg-hover)]"
                      )}
                    >
                      <Inbox size={11} className="shrink-0 opacity-70" />
                      <span className="flex-1 truncate">{c.name}</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => removeOne(c.id, c.name, e)}
                      aria-label={`Delete ${c.name}`}
                      className={cn(
                        "absolute right-1.5 top-1/2 -translate-y-1/2 w-5 h-5",
                        "rounded-[var(--radius-xs)] flex items-center justify-center",
                        "text-[var(--color-text-subtle)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-subtle)]",
                        "opacity-0 group-hover:opacity-100 transition-opacity"
                      )}
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="hairline my-1" />

              {creating ? (
                <div className="px-2 pb-2">
                  <input
                    autoFocus
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") create();
                      if (e.key === "Escape") {
                        setCreating(false);
                        setNewName("");
                      }
                    }}
                    placeholder="Collection name…"
                    className={cn(
                      "w-full bg-[var(--color-bg-input)] border border-[var(--color-border)]",
                      "rounded-[var(--radius-sm)] px-2.5 h-7 text-[12px] text-[var(--color-text)]",
                      "outline-none transition-all",
                      "focus:border-[var(--color-accent)] focus:shadow-[0_0_0_3px_var(--color-accent-soft)]"
                    )}
                  />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setCreating(true)}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 h-8 text-[12px] text-left",
                    "text-[var(--color-text-muted)] hover:text-[var(--color-accent)] hover:bg-[var(--color-bg-hover)] transition-colors"
                  )}
                >
                  <Plus size={11} />
                  <span>New collection</span>
                </button>
              )}
            </motion.div>
          </AnimatePresence>,
          document.body
        )}
      {ctxMenu.render(ctxItems)}
    </>
  );
}


function TagPicker({
  tags,
  activeTag,
  onSelect,
}: {
  tags: string[];
  activeTag: string | null;
  onSelect: (tag: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  const active = !!activeTag;

  const openMenu = () => {
    if (triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 6, left: r.left });
    }
    setOpen((o) => !o);
  };

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (
        !triggerRef.current?.contains(e.target as Node) &&
        !popRef.current?.contains(e.target as Node)
      ) {
        setOpen(false);
        setFilter("");
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setFilter("");
      }
    };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const filtered = filter
    ? tags.filter((t) => t.toLowerCase().includes(filter.toLowerCase()))
    : tags;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={openMenu}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          "relative inline-flex items-center gap-1.5 px-2.5 h-7 shrink-0",
          "rounded-[var(--radius-sm)] text-[11.5px] font-semibold",
          "focus-ring outline-none transition-colors",
          active
            ? "text-[var(--color-accent)] bg-[var(--color-accent-subtle)] border border-[var(--color-accent-border)]"
            : open
            ? "text-[var(--color-text)] bg-[var(--color-bg-elevated)]"
            : "text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-elevated)]"
        )}
      >
        <Hash size={11} />
        <span className="truncate max-w-[110px]">
          {active && activeTag ? activeTag : "Tag"}
        </span>
        <ChevronDown
          size={10}
          className={cn("transition-transform shrink-0", open && "rotate-180")}
        />
      </button>

      {open &&
        createPortal(
          <AnimatePresence>
            <motion.div
              ref={popRef}
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              transition={{ duration: 0.16, ease: [0.32, 0.72, 0, 1] }}
              style={{
                position: "fixed",
                top: pos.top,
                left: pos.left,
                zIndex: 9999,
                width: 240,
                transformOrigin: "top left",
              }}
              className={cn(
                "rounded-[var(--radius-md)] py-1.5",
                "bg-[var(--color-bg-elevated)] border border-[var(--color-border)]",
                "shadow-[var(--shadow-float)]"
              )}
            >
              <PopHeader>Tags</PopHeader>
              {tags.length > 8 && (
                <div className="px-2 pb-1.5">
                  <input
                    autoFocus
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    placeholder="Filter tags…"
                    className={cn(
                      "w-full bg-[var(--color-bg-input)] border border-[var(--color-border)]",
                      "rounded-[var(--radius-sm)] px-2.5 h-7 text-[11.5px] text-[var(--color-text)]",
                      "outline-none transition-all",
                      "focus:border-[var(--color-accent)] focus:shadow-[0_0_0_3px_var(--color-accent-soft)]"
                    )}
                  />
                </div>
              )}
              <div className="max-h-[260px] overflow-y-auto">
                {filtered.length === 0 ? (
                  <p className="px-3 py-2 text-[11px] text-[var(--color-text-subtle)]">
                    {tags.length === 0 ? "No tags yet" : "No matches"}
                  </p>
                ) : (
                  filtered.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        onSelect(tag);
                        setOpen(false);
                        setFilter("");
                      }}
                      className={cn(
                        "w-full flex items-center gap-2 px-3 h-8 text-[12px] text-left transition-colors",
                        tag === activeTag
                          ? "bg-[var(--color-accent-subtle)] text-[var(--color-accent)]"
                          : "text-[var(--color-text)] hover:bg-[var(--color-bg-hover)]"
                      )}
                    >
                      <Hash size={11} className="shrink-0 opacity-70" />
                      <span className="truncate">{tag}</span>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}

function PopHeader({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-3 pt-1 pb-1.5 text-[9.5px] font-bold uppercase tracking-[0.16em] text-[var(--color-text-faint)]">
      {children}
    </p>
  );
}
