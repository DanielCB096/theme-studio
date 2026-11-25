import { MAX_BLOCKS_PER_PAGE, type PageBlock, type PageDocument } from "@/types/page";

export function blocksInOrder(page: PageDocument): PageBlock[] {
  return page.rootIds
    .map((id) => page.blocks[id])
    .filter((block): block is PageBlock => block !== undefined);
}

export function addBlock(page: PageDocument, block: PageBlock): PageDocument {
  if (page.rootIds.length >= MAX_BLOCKS_PER_PAGE || page.blocks[block.id]) return page;
  return {
    ...page,
    rootIds: [...page.rootIds, block.id],
    blocks: { ...page.blocks, [block.id]: block },
  };
}

export function removeBlock(page: PageDocument, blockId: string): PageDocument {
  if (!page.blocks[blockId]) return page;
  const { [blockId]: _removed, ...rest } = page.blocks;
  return {
    ...page,
    rootIds: page.rootIds.filter((id) => id !== blockId),
    blocks: rest,
  };
}

export function moveBlock(page: PageDocument, blockId: string, direction: -1 | 1): PageDocument {
  const index = page.rootIds.indexOf(blockId);
  if (index === -1) return page;
  const target = index + direction;
  if (target < 0 || target >= page.rootIds.length) return page;
  const rootIds = [...page.rootIds];
  const current = rootIds[index];
  const swapped = rootIds[target];
  if (current === undefined || swapped === undefined) return page;
  rootIds[index] = swapped;
  rootIds[target] = current;
  return { ...page, rootIds };
}

export function updateBlockProps(
  page: PageDocument,
  blockId: string,
  props: PageBlock["props"],
): PageDocument {
  const block = page.blocks[blockId];
  if (!block) return page;
  return {
    ...page,
    blocks: { ...page.blocks, [blockId]: { ...block, props } as PageBlock },
  };
}

export function renameDocument(page: PageDocument, name: string): PageDocument {
  const trimmed = name.trim().slice(0, 80);
  return trimmed.length > 0 ? { ...page, name: trimmed } : page;
}
