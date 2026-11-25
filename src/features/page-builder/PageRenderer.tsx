import { Pencil } from "lucide-react";

import { renderBlockContent } from "@/features/page-builder/blocks/registry";
import { blocksInOrder } from "@/features/page-builder/pageOps";
import { ThemeScope } from "@/features/preview/ThemeScope";
import { cn } from "@/lib/utils";
import type { PageDocument } from "@/types/page";

interface PageRendererProps {
  page: PageDocument;
  selectedId?: string | null;
  onSelect?: (blockId: string) => void;
}

/**
 * Único renderer de páginas. Lo usan el builder, la vista previa y `/p/:slug`;
 * la única diferencia es que el builder pasa `onSelect`.
 */
export function PageRenderer({ page, selectedId = null, onSelect }: PageRendererProps) {
  const blocks = blocksInOrder(page);

  return (
    <ThemeScope theme={page.theme} className="min-h-full">
      <div className="flex min-h-full flex-col bg-background text-fg @container">
        {blocks.length === 0 ? (
          <div className="grid min-h-64 place-items-center p-density text-sm text-muted">
            Esta página no tiene bloques todavía.
          </div>
        ) : (
          blocks.map((block, index) => {
            const selected = selectedId === block.id;
            return (
              <div
                key={block.id}
                data-block-id={block.id}
                className={cn(
                  "relative",
                  selected && "outline outline-2 -outline-offset-2 outline-primary",
                )}
              >
                {onSelect ? (
                  <button
                    type="button"
                    onClick={() => onSelect(block.id)}
                    className={cn(
                      "absolute right-2 top-2 z-10 flex items-center gap-1 rounded-md border bg-surface px-2 py-1 text-[10px] font-medium text-muted shadow-panel",
                      "hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                      selected && "text-primary",
                    )}
                    aria-label={`Seleccionar bloque ${index + 1}: ${block.type}`}
                    aria-pressed={selected}
                  >
                    <Pencil aria-hidden="true" className="h-3 w-3" />
                    {block.type}
                  </button>
                ) : null}
                {renderBlockContent(block)}
              </div>
            );
          })
        )}
      </div>
    </ThemeScope>
  );
}
