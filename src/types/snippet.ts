export interface Snippet {
  id: string;
  title: string;
  body: string;
  language: string;
  description: string;
  pinned: boolean;
  collectionId: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  usedAt: string | null;
}

export interface Collection {
  id: string;
  name: string;
  color: string | null;
  createdAt: string;
}

export interface NewSnippet {
  title: string;
  body: string;
  language?: string;
  description?: string;
  collectionId?: string | null;
  tags?: string[];
}

export interface UpdateSnippet {
  id: string;
  title?: string;
  body?: string;
  language?: string;
  description?: string;
  collectionId?: string | null | undefined;
  tags?: string[];
}

export interface SnippetListFilter {
  collectionId?: string;
  tag?: string;
  pinnedOnly?: boolean;
}

export type SidebarView =
  | { type: "all" }
  | { type: "pinned" }
  | { type: "collection"; id: string }
  | { type: "tag"; tag: string };
