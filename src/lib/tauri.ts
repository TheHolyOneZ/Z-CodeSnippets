import { invoke } from "@tauri-apps/api/core";
import type {
  Collection,
  NewSnippet,
  Snippet,
  SnippetListFilter,
  UpdateSnippet,
} from "@/types/snippet";

export const api = {
  snippets: {
    list: (filter?: SnippetListFilter) =>
      invoke<Snippet[]>("snippet_list", { filter }),
    get: (id: string) => invoke<Snippet>("snippet_get", { id }),
    create: (input: NewSnippet) => invoke<Snippet>("snippet_create", { input }),
    update: (input: UpdateSnippet) => invoke<Snippet>("snippet_update", { input }),
    delete: (id: string) => invoke<void>("snippet_delete", { id }),
    togglePin: (id: string) => invoke<Snippet>("snippet_toggle_pin", { id }),
    touchUsed: (id: string) => invoke<void>("snippet_touch_used", { id }),
    duplicate: (id: string) => invoke<Snippet>("snippet_duplicate", { id }),
  },
  collections: {
    list: () => invoke<Collection[]>("collection_list"),
    create: (name: string, color?: string) =>
      invoke<Collection>("collection_create", { input: { name, color } }),
    rename: (id: string, name: string) =>
      invoke<Collection>("collection_rename", { id, name }),
    delete: (id: string) => invoke<void>("collection_delete", { id }),
  },
  tags: {
    listAll: () => invoke<string[]>("tag_list_all"),
  },
  search: (q: string, limit?: number) =>
    invoke<Snippet[]>("search_snippets", { q, limit }),
  clipboard: {
    copy: async (text: string, snippetId?: string) => {


      try {
        await invoke<void>("clipboard_copy", { text, snippetId });
        return;
      } catch (err) {


        if (
          typeof navigator !== "undefined" &&
          navigator.clipboard?.writeText
        ) {
          await navigator.clipboard.writeText(text);
          return;
        }
        throw err;
      }
    },
  },
  files: {
    readAsText: (path: string) => invoke<string>("read_file_as_text", { path }),
    exportSnippets: (path: string) => invoke<void>("export_snippets", { path }),
    importSnippets: (path: string) => invoke<number>("import_snippets", { path }),
  },
};
