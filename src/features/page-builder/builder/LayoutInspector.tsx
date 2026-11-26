import { BLOCK_REGISTRY } from "@/features/page-builder/blocks/registry";
import { SelectField, ToggleField } from "@/features/page-builder/builder/fields";
import type { BlockLayout, BlockLayoutColumns, PageBlock } from "@/types/page";

const WIDTH_OPTIONS: Array<{ value: BlockLayout["width"]; label: string }> = [
  { value: "compact", label: "Compacto" },
  { value: "normal", label: "Normal" },
  { value: "wide", label: "Ancho" },
  { value: "full", label: "Completo (100 %)" },
];

const ALIGN_OPTIONS: Array<{ value: BlockLayout["align"]; label: string }> = [
  { value: "left", label: "Izquierda" },
  { value: "center", label: "Centro" },
  { value: "right", label: "Derecha" },
];

const DIRECTION_OPTIONS: Array<{ value: BlockLayout["direction"]; label: string }> = [
  { value: "row", label: "Fila" },
  { value: "column", label: "Columna" },
];

const GAP_OPTIONS: Array<{ value: BlockLayout["gap"]; label: string }> = [
  { value: "compact", label: "Compacto" },
  { value: "normal", label: "Normal" },
  { value: "spacious", label: "Amplio" },
];

const COLUMN_LABELS: Record<BlockLayoutColumns, string> = {
  1: "1 columna",
  2: "2 columnas",
  3: "3 columnas",
};

/**
 * Inspector común de Layout v1. Los campos visibles dependen de las
 * capacidades que el registro declara para cada tipo de bloque.
 */
export function LayoutInspector({
  block,
  onChange,
}: {
  block: PageBlock;
  onChange: (layout: BlockLayout) => void;
}) {
  const capabilities = BLOCK_REGISTRY[block.type].layoutCapabilities;
  const layout = block.layout;
  const columnValues: readonly BlockLayoutColumns[] =
    capabilities.columnsMax === 2 ? [1, 2] : [1, 2, 3];

  return (
    <section aria-labelledby="layout-title" className="space-y-density border-b pb-density">
      <h3 id="layout-title" className="text-xs font-semibold uppercase tracking-wide text-muted">
        Diseño del bloque
      </h3>

      {capabilities.width ? (
        <SelectField
          label="Ancho del bloque"
          value={layout.width}
          options={WIDTH_OPTIONS}
          onChange={(width) => onChange({ ...layout, width })}
        />
      ) : null}

      {capabilities.align ? (
        <SelectField
          label="Alineación del bloque"
          value={layout.align}
          options={ALIGN_OPTIONS}
          onChange={(align) => onChange({ ...layout, align })}
        />
      ) : null}

      {capabilities.direction ? (
        <SelectField
          label="Dirección del bloque"
          value={layout.direction}
          options={DIRECTION_OPTIONS}
          onChange={(direction) => onChange({ ...layout, direction })}
        />
      ) : null}

      {capabilities.reverse && layout.direction === "row" ? (
        <ToggleField
          label="Invertir orden"
          description="Intercambia los dos grupos principales cuando la dirección es fila."
          value={layout.reverse}
          onChange={(reverse) => onChange({ ...layout, reverse })}
        />
      ) : null}

      {capabilities.columns ? (
        <SelectField
          label="Columnas"
          value={layout.columns}
          options={columnValues.map((value) => ({
            value,
            label: COLUMN_LABELS[value],
          }))}
          onChange={(columns) => onChange({ ...layout, columns })}
        />
      ) : null}

      {capabilities.gap ? (
        <SelectField
          label="Espaciado interno"
          value={layout.gap}
          options={GAP_OPTIONS}
          onChange={(gap) => onChange({ ...layout, gap })}
        />
      ) : null}
    </section>
  );
}
