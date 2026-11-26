import type { ReactNode } from "react";

import { layoutWidthClass } from "@/features/page-builder/blocks/layout";
import { renderBlockContent } from "@/features/page-builder/blocks/registry";
import { blocksInOrder } from "@/features/page-builder/pageOps";
import { PageRuntimeProvider, type PageRuntime } from "@/features/page-builder/pageRuntime";
import { ThemeScope } from "@/features/preview/ThemeScope";
import { cn } from "@/lib/utils";
import type { PageBlock, PageDocument } from "@/types/page";

interface PageRendererProps {
  page: PageDocument;
  selectedId?: string | null;
  onSelect?: (blockId: string) => void;
  /** Modo de inspección: tiñe cada bloque con un color distinto. */
  debug?: boolean;
  /** Builder (por defecto) o página pública con id real para enviar formularios. */
  runtime?: PageRuntime;
}

const DEFAULT_RUNTIME: PageRuntime = { mode: "builder", pageId: null, dataset: null };

interface BlockShellProps {
  block: PageBlock;
  position: number;
  selected: boolean;
  onSelect?: (blockId: string) => void;
  debug?: boolean;
  children: ReactNode;
  className?: string;
}

function BlockShell({
  block,
  position,
  selected,
  onSelect,
  debug,
  children,
  className,
}: BlockShellProps) {
  const hue = (position * 47) % 360;

  return (
    <div
      data-block-id={block.id}
      className={cn(
        "relative",
        layoutWidthClass[block.layout.width],
        selected && "outline outline-2 -outline-offset-2 outline-primary",
        className,
      )}
    >
      {onSelect ? (
        <button
          type="button"
          onClick={() => onSelect(block.id)}
          className={cn(
            "absolute inset-0 z-10 cursor-pointer bg-transparent",
            "transition-shadow hover:ring-1 hover:ring-inset hover:ring-primary",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary",
          )}
          aria-label={`Seleccionar bloque ${position}: ${block.type}`}
          aria-pressed={selected}
        />
      ) : null}
      {debug ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-20"
          style={{
            backgroundColor: `hsla(${hue}, 90%, 50%, 0.10)`,
            boxShadow: `inset 0 0 0 3px hsl(${hue}, 90%, 45%)`,
          }}
        />
      ) : null}
      {children}
    </div>
  );
}

/**
 * Único renderer de páginas. La navbar puede ser barra superior/inferior o
 * columna lateral; en ese caso el resto del contenido ocupa la columna
 * principal. En móvil, la lateral se comporta como barra superior.
 */
export function PageRenderer({
  page,
  selectedId = null,
  onSelect,
  debug = false,
  runtime = DEFAULT_RUNTIME,
}: PageRendererProps) {
  const blocks = blocksInOrder(page);
  const navbar = blocks.find((block) => block.type === "navbar");
  const withoutNavbar = blocks.filter((block) => block !== navbar);
  const footer = withoutNavbar.find((block) => block.type === "footer");
  const middle = withoutNavbar.filter((block) => block !== footer);

  const shell = (block: PageBlock, className?: string) => (
    <BlockShell
      key={block.id}
      block={block}
      position={page.rootIds.indexOf(block.id) + 1}
      selected={selectedId === block.id}
      onSelect={onSelect}
      debug={debug}
      className={className}
    >
      {renderBlockContent(block)}
    </BlockShell>
  );

  const sidebar =
    navbar && (navbar.props.placement === "left" || navbar.props.placement === "right");

  return (
    <PageRuntimeProvider runtime={runtime}>
      <ThemeScope theme={page.theme} className="min-h-full">
        <div className="flex min-h-full flex-col bg-background text-fg @container">
          {blocks.length === 0 ? (
            <div className="grid min-h-64 place-items-center p-density text-sm text-muted">
              Esta página no tiene bloques todavía.
            </div>
          ) : sidebar && navbar ? (
            <div className="flex min-h-full flex-col @2xl:flex-row">
              <div
                className={cn(
                  "flex shrink-0 flex-col",
                  navbar.props.placement === "right"
                    ? "order-first @2xl:order-last"
                    : "order-first",
                )}
              >
                {shell(navbar, "@2xl:sticky @2xl:top-0")}
              </div>
              <div className="min-w-0 flex-1">
                {middle.map((block) => shell(block))}
                {footer ? shell(footer) : null}
              </div>
            </div>
          ) : (
            <>
              {navbar && navbar.props.placement === "top" ? shell(navbar) : null}
              {middle.map((block) => shell(block))}
              {navbar && navbar.props.placement === "bottom" ? shell(navbar) : null}
              {footer ? shell(footer) : null}
            </>
          )}
        </div>
      </ThemeScope>
    </PageRuntimeProvider>
  );
}
