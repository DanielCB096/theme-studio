import { create } from "zustand";

import {
  addBlock,
  moveBlock,
  removeBlock,
  renameDocument,
  updateBlockProps,
} from "@/features/page-builder/pageOps";
import type { PageBlock, PageDocument } from "@/types/page";

interface BuilderState {
  page: PageDocument | null;
  selectedId: string | null;
  savedId: string | null;
  savedSlug: string | null;
  dirty: boolean;
  load: (page: PageDocument, saved?: { id: string; slug: string }) => void;
  select: (blockId: string | null) => void;
  add: (block: PageBlock) => void;
  remove: (blockId: string) => void;
  move: (blockId: string, direction: -1 | 1) => void;
  updateProps: (blockId: string, props: PageBlock["props"]) => void;
  rename: (name: string) => void;
  markSaved: (saved: { id: string; slug: string }) => void;
  clear: () => void;
}

export const usePageBuilderStore = create<BuilderState>((set, get) => ({
  page: null,
  selectedId: null,
  savedId: null,
  savedSlug: null,
  dirty: false,

  load: (page, saved) =>
    set({
      page,
      selectedId: page.rootIds[0] ?? null,
      savedId: saved?.id ?? null,
      savedSlug: saved?.slug ?? null,
      dirty: false,
    }),

  select: (blockId) => set({ selectedId: blockId }),

  add: (block) => {
    const { page } = get();
    if (!page) return;
    set({ page: addBlock(page, block), selectedId: block.id, dirty: true });
  },

  remove: (blockId) => {
    const { page, selectedId } = get();
    if (!page) return;
    set({
      page: removeBlock(page, blockId),
      selectedId: selectedId === blockId ? null : selectedId,
      dirty: true,
    });
  },

  move: (blockId, direction) => {
    const { page } = get();
    if (!page) return;
    set({ page: moveBlock(page, blockId, direction), dirty: true });
  },

  updateProps: (blockId, props) => {
    const { page } = get();
    if (!page) return;
    set({ page: updateBlockProps(page, blockId, props), dirty: true });
  },

  rename: (name) => {
    const { page } = get();
    if (!page) return;
    set({ page: renameDocument(page, name), dirty: true });
  },

  markSaved: (saved) => set({ savedId: saved.id, savedSlug: saved.slug, dirty: false }),

  clear: () => set({ page: null, selectedId: null, savedId: null, savedSlug: null, dirty: false }),
}));
