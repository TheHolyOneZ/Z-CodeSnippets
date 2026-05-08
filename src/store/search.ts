import { create } from "zustand";

interface SearchState {
  query: string;
  setQuery: (q: string) => void;
  clear: () => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  query: "",
  setQuery: (q) => set((s) => s.query === q ? s : { query: q }),
  clear: () => set((s) => s.query === "" ? s : { query: "" }),
}));
