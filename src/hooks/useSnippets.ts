import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/tauri";
import type { NewSnippet, SnippetListFilter, UpdateSnippet } from "@/types/snippet";

export const SNIPPETS_KEY = "snippets";
export const COLLECTIONS_KEY = "collections";
export const TAGS_KEY = "tags";

export function useSnippets(filter?: SnippetListFilter) {
  return useQuery({
    queryKey: [SNIPPETS_KEY, filter],
    queryFn: () => api.snippets.list(filter),
  });
}

export function useSnippet(id: string | null) {
  return useQuery({
    queryKey: [SNIPPETS_KEY, id],
    queryFn: () => api.snippets.get(id!),
    enabled: !!id,
  });
}

export function useSearchSnippets(query: string) {
  return useQuery({
    queryKey: ["search", query],
    queryFn: () => api.search(query),
    enabled: query.trim().length > 0,
  });
}

export function useCreateSnippet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NewSnippet) => api.snippets.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: [SNIPPETS_KEY] }),
  });
}

export function useUpdateSnippet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateSnippet) => api.snippets.update(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: [SNIPPETS_KEY] }),
  });
}

export function useDeleteSnippet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.snippets.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [SNIPPETS_KEY] }),
  });
}

export function useTogglePin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.snippets.togglePin(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [SNIPPETS_KEY] }),
  });
}

export function useCollections() {
  return useQuery({
    queryKey: [COLLECTIONS_KEY],
    queryFn: () => api.collections.list(),
  });
}

export function useCreateCollection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, color }: { name: string; color?: string }) =>
      api.collections.create(name, color),
    onSuccess: () => qc.invalidateQueries({ queryKey: [COLLECTIONS_KEY] }),
  });
}

export function useDeleteCollection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.collections.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [COLLECTIONS_KEY] });
      qc.invalidateQueries({ queryKey: [SNIPPETS_KEY] });
    },
  });
}

export function useRenameCollection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      api.collections.rename(id, name),
    onSuccess: () => qc.invalidateQueries({ queryKey: [COLLECTIONS_KEY] }),
  });
}

export function useAllTags() {
  return useQuery({
    queryKey: [TAGS_KEY],
    queryFn: () => api.tags.listAll(),
  });
}

export function useDuplicateSnippet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.snippets.duplicate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [SNIPPETS_KEY] }),
  });
}

export function useExportSnippets() {
  return useMutation({
    mutationFn: (path: string) => api.files.exportSnippets(path),
  });
}

export function useImportSnippets() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (path: string) => api.files.importSnippets(path),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [SNIPPETS_KEY] });
      qc.invalidateQueries({ queryKey: [TAGS_KEY] });
    },
  });
}
