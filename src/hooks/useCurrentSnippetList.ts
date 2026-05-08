import { useMemo } from "react";
import { useUiStore } from "@/store/ui";
import { useSearchStore } from "@/store/search";
import { useDebouncedValue } from "./useDebouncedValue";
import { useSnippets } from "./useSnippets";
import { rankSnippets } from "@/lib/fuzzy";
import type { Snippet, SnippetListFilter, SidebarView } from "@/types/snippet";

export interface CurrentSnippetList {
  snippets: Snippet[];
  isLoading: boolean;
  isTagSearch: boolean;
  tagQuery: string;
  ftsQuery: string;
  debouncedQuery: string;
  sidebarView: SidebarView;
}


export function useCurrentSnippetList(): CurrentSnippetList {
  const { sidebarView } = useUiStore();
  const { query } = useSearchStore();
  const debounced = useDebouncedValue(query, 90);

  const isTagSearch = debounced.startsWith("#") && debounced.length > 1;
  const tagQuery = isTagSearch ? debounced.slice(1).trim().toLowerCase() : "";
  const ftsQuery = !isTagSearch ? debounced.trim() : "";

  const backendFilter: SnippetListFilter = {};
  if (sidebarView.type === "collection") backendFilter.collectionId = sidebarView.id;
  if (sidebarView.type === "pinned")     backendFilter.pinnedOnly    = true;
  if (sidebarView.type === "tag" && !isTagSearch) backendFilter.tag = sidebarView.tag;

  const { data: listData = [], isLoading } = useSnippets(backendFilter);

  const snippets = useMemo(() => {
    let items = listData;

    if (isTagSearch && tagQuery) {
      items = items.filter((s) =>
        s.tags.some((t) => t.toLowerCase().includes(tagQuery))
      );
    }

    if (ftsQuery) {
      const ranked = rankSnippets(ftsQuery, items);
      items = ranked.map((r) => r.item);
    }

    return items;
  }, [listData, ftsQuery, isTagSearch, tagQuery]);

  return {
    snippets,
    isLoading,
    isTagSearch,
    tagQuery,
    ftsQuery,
    debouncedQuery: debounced,
    sidebarView,
  };
}
