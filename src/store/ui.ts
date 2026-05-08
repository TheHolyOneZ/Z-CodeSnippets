import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SidebarView } from "@/types/snippet";

export type EditorMode = "codemirror" | "monaco";
export type Theme = "dark" | "light" | "system";
export type ListDensity = "comfortable" | "compact";
export type SortOrder = "last_used" | "created" | "alphabetical";
export type TabSize = 2 | 4;

export interface AccentPreset {
  id: string;
  label: string;
  color:  string;
  hover:  string;
  press:  string;
  subtle: string;
  soft:   string;
  border: string;
  glow:   string;
}

export const ACCENT_PRESETS: AccentPreset[] = [
  {
    id: "violet", label: "Violet",
    color: "#8b5cf6", hover: "#a78bfa", press: "#7c4dff",
    subtle: "rgba(139,92,246,0.14)", soft: "rgba(139,92,246,0.06)",
    border: "rgba(139,92,246,0.4)",  glow: "rgba(139,92,246,0.32)",
  },
  {
    id: "blue", label: "Blue",
    color: "#3b82f6", hover: "#60a5fa", press: "#2563eb",
    subtle: "rgba(59,130,246,0.14)", soft: "rgba(59,130,246,0.06)",
    border: "rgba(59,130,246,0.4)",  glow: "rgba(59,130,246,0.32)",
  },
  {
    id: "cyan", label: "Cyan",
    color: "#06b6d4", hover: "#22d3ee", press: "#0891b2",
    subtle: "rgba(6,182,212,0.14)", soft: "rgba(6,182,212,0.06)",
    border: "rgba(6,182,212,0.4)",  glow: "rgba(6,182,212,0.32)",
  },
  {
    id: "emerald", label: "Emerald",
    color: "#10b981", hover: "#34d399", press: "#059669",
    subtle: "rgba(16,185,129,0.14)", soft: "rgba(16,185,129,0.06)",
    border: "rgba(16,185,129,0.4)",  glow: "rgba(16,185,129,0.32)",
  },
  {
    id: "rose", label: "Rose",
    color: "#f43f5e", hover: "#fb7185", press: "#e11d48",
    subtle: "rgba(244,63,94,0.14)", soft: "rgba(244,63,94,0.06)",
    border: "rgba(244,63,94,0.4)",  glow: "rgba(244,63,94,0.32)",
  },
  {
    id: "amber", label: "Amber",
    color: "#f59e0b", hover: "#fbbf24", press: "#d97706",
    subtle: "rgba(245,158,11,0.14)", soft: "rgba(245,158,11,0.06)",
    border: "rgba(245,158,11,0.4)",  glow: "rgba(245,158,11,0.32)",
  },
];

interface UiState {

  selectedSnippetId: string | null;
  sidebarView: SidebarView;
  isEditing: boolean;
  sidebarWidth: number;
  sidebarCollapsed: boolean;


  editorMode: EditorMode;
  defaultLanguage: string;
  wordWrap: boolean;
  fontSize: number;
  tabSize: TabSize;
  showLineNumbers: boolean;


  theme: Theme;
  accentPresetId: string;
  listDensity: ListDensity;


  sortOrder: SortOrder;


  setSelectedSnippetId: (id: string | null) => void;
  setSidebarView: (view: SidebarView) => void;
  setEditorMode: (mode: EditorMode) => void;
  setIsEditing: (editing: boolean) => void;
  setSidebarWidth: (w: number) => void;
  setSidebarCollapsed: (v: boolean) => void;
  toggleSidebarCollapsed: () => void;
  setTheme: (t: Theme) => void;
  setDefaultLanguage: (lang: string) => void;
  setAccentPresetId: (id: string) => void;
  setWordWrap: (v: boolean) => void;
  setFontSize: (v: number) => void;
  setTabSize: (v: TabSize) => void;
  setShowLineNumbers: (v: boolean) => void;
  setListDensity: (v: ListDensity) => void;
  setSortOrder: (v: SortOrder) => void;
}

export const SIDEBAR_MIN_WIDTH = 260;
export const SIDEBAR_MAX_WIDTH = 480;
export const SIDEBAR_DEFAULT_WIDTH = 320;

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      selectedSnippetId: null,
      sidebarView: { type: "all" },
      editorMode: "codemirror",
      isEditing: false,
      sidebarWidth: SIDEBAR_DEFAULT_WIDTH,
      sidebarCollapsed: false,
      theme: "dark",
      defaultLanguage: "plaintext",
      accentPresetId: "violet",
      wordWrap: true,
      fontSize: 13,
      tabSize: 2,
      showLineNumbers: true,
      listDensity: "comfortable",
      sortOrder: "last_used",

      setSelectedSnippetId: (id) => set({ selectedSnippetId: id, isEditing: false }),
      setSidebarView: (view) => set({ sidebarView: view, selectedSnippetId: null }),
      setEditorMode: (mode) => set({ editorMode: mode }),
      setIsEditing: (editing) => set({ isEditing: editing }),
      setSidebarWidth: (w) =>
        set({ sidebarWidth: Math.max(SIDEBAR_MIN_WIDTH, Math.min(SIDEBAR_MAX_WIDTH, w)) }),
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
      toggleSidebarCollapsed: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setTheme: (t) => set({ theme: t }),
      setDefaultLanguage: (lang) => set({ defaultLanguage: lang }),
      setAccentPresetId: (id) => set({ accentPresetId: id }),
      setWordWrap: (v) => set({ wordWrap: v }),
      setFontSize: (v) => set({ fontSize: v }),
      setTabSize: (v) => set({ tabSize: v }),
      setShowLineNumbers: (v) => set({ showLineNumbers: v }),
      setListDensity: (v) => set({ listDensity: v }),
      setSortOrder: (v) => set({ sortOrder: v }),
    }),
    { name: "zcode-ui" }
  )
);
