import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { IconRail } from "./IconRail";
import { SettingsDialog } from "./SettingsDialog";
import { Sidebar } from "@/components/library/Sidebar";
import type { SearchFieldHandle } from "@/components/library/SearchField";
import { Workspace } from "@/components/snippets/Workspace";
import { SnippetEditor } from "@/components/snippets/SnippetEditor";
import { useUiStore } from "@/store/ui";
import { useHotkeys } from "@/hooks/useHotkeys";
import { useSearchStore } from "@/store/search";
import { useCurrentSnippetList } from "@/hooks/useCurrentSnippetList";
import {
  useDeleteSnippet,
  useSnippet,
  useTogglePin,
} from "@/hooks/useSnippets";
import { api } from "@/lib/tauri";
import { confirm } from "@/lib/dialog";


function isTextInputTarget(el: Element | null): boolean {
  if (!el) return false;
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) return true;
  if ((el as HTMLElement).isContentEditable) return true;
  return false;
}


function isCodeEditorTarget(el: Element | null): boolean {
  if (!el) return false;
  return !!(el.closest(".monaco-editor") || el.closest(".cm-editor"));
}

export function AppShell() {
  const {
    selectedSnippetId,
    setSelectedSnippetId,
    setIsEditing,
    isEditing,
    sidebarCollapsed,
    setSidebarCollapsed,
    toggleSidebarCollapsed,
  } = useUiStore();
  const { setQuery } = useSearchStore();
  const { snippets } = useCurrentSnippetList();
  const { data: selectedSnippet } = useSnippet(selectedSnippetId);
  const togglePinMutation = useTogglePin();
  const deleteMutation = useDeleteSnippet();

  const [creatingNew, setCreatingNew] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const searchRef = useRef<SearchFieldHandle>(null);

  useEffect(() => {
    if (selectedSnippetId && creatingNew) setCreatingNew(false);
  }, [selectedSnippetId, creatingNew]);

  const newSnippet = () => {
    setCreatingNew(true);
    setSelectedSnippetId(null);
    setIsEditing(false);
  };


  const focusSearch = () => {
    if (sidebarCollapsed) setSidebarCollapsed(false);
    requestAnimationFrame(() => searchRef.current?.focus());
  };

  const stepSelection = (delta: 1 | -1) => {
    if (snippets.length === 0) return;
    const i = selectedSnippetId
      ? snippets.findIndex((s) => s.id === selectedSnippetId)
      : -1;
    const next = i < 0 ? (delta === 1 ? 0 : snippets.length - 1) : i + delta;
    if (next < 0 || next >= snippets.length) return;
    setSelectedSnippetId(snippets[next].id);
  };

  const copySelected = async () => {
    if (!selectedSnippet) return;
    await api.clipboard.copy(selectedSnippet.body, selectedSnippet.id);
    toast.success("Copied to clipboard");
  };

  const copySelectedRef = useRef(copySelected);
  copySelectedRef.current = copySelected;

  useEffect(() => {
    const onNew = () => newSnippet();
    const onNewCollection = () =>
      window.dispatchEvent(new CustomEvent("zcs:filterbar:open-collection-create"));
    const onCopy = () => copySelectedRef.current();
    window.addEventListener("zcs:new-snippet", onNew);
    window.addEventListener("zcs:new-collection", onNewCollection);
    window.addEventListener("zcs:copy-selected", onCopy);
    return () => {
      window.removeEventListener("zcs:new-snippet", onNew);
      window.removeEventListener("zcs:new-collection", onNewCollection);
      window.removeEventListener("zcs:copy-selected", onCopy);
    };
  }, []);

  const deleteSelected = async () => {
    if (!selectedSnippet) return;
    const ok = await confirm(
      `Delete "${selectedSnippet.title}"? This cannot be undone.`
    );
    if (!ok) return;
    await deleteMutation.mutateAsync(selectedSnippet.id);
    setSelectedSnippetId(null);
    toast.success("Snippet deleted");
  };

  useHotkeys({


    "ctrl+n": () => newSnippet(),
    "ctrl+,": () => setSettingsOpen(true),
    "ctrl+b": () => toggleSidebarCollapsed(),
    "alt+arrowup":   () => stepSelection(-1),
    "alt+arrowdown": () => stepSelection(1),
    "ctrl+s": () => {},


    "ctrl+f": (e) => {
      if (isCodeEditorTarget(e.target as Element | null)) return false;
      focusSearch();
    },


    "ctrl+p": () => {
      if (!selectedSnippetId) return false;
      togglePinMutation.mutate(selectedSnippetId);
    },


    "ctrl+d": () => {
      if (isEditing || creatingNew) return false;
      if (!selectedSnippetId) return false;
      deleteSelected();
    },


    "ctrl+e": () => {
      if (isEditing || creatingNew) return false;
      if (!selectedSnippetId) return false;
      setIsEditing(true);
    },


    enter: (e) => {
      const t = e.target as Element | null;
      if (isTextInputTarget(t)) return false;
      if (isCodeEditorTarget(t) && (isEditing || creatingNew)) return false;
      if (settingsOpen || isEditing || creatingNew) return false;
      if (!selectedSnippetId) return false;
      copySelected();
    },


    escape: (e) => {
      if (isCodeEditorTarget(e.target as Element | null)) return false;
      if (settingsOpen) { setSettingsOpen(false); return; }
      if (creatingNew)  { setCreatingNew(false); return; }
      if (isEditing)    { setIsEditing(false); return; }
      if (document.activeElement instanceof HTMLInputElement) {
        (document.activeElement as HTMLInputElement).blur();
        setQuery("");
      }
    },
  });

  return (
    <div className="relative flex h-full w-full overflow-hidden bg-[var(--color-bg-base)]">
      <IconRail
        onNewSnippet={newSnippet}
        onSettings={() => setSettingsOpen(true)}
      />

      <Sidebar searchRef={searchRef} />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0 relative">
        {creatingNew ? (
          <SnippetEditor onClose={() => setCreatingNew(false)} />
        ) : (
          <Workspace />
        )}
      </div>

      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
