import { Button } from "@/components/ui/button";
import { SelectField, TextField } from "@/features/page-builder/builder/fields";
import type { BlockDefinition } from "@/features/page-builder/blocks/definition";
import {
  layoutGapClass,
  layoutItemsAlignClass,
  layoutTextAlignClass,
} from "@/features/page-builder/blocks/layout";
import { heroDefaults, heroSchema } from "@/features/page-builder/blocks/hero/schema";
import { cn } from "@/lib/utils";

export const heroBlock: BlockDefinition<"hero"> = {
  type: "hero",
  label: "Hero",
  description: "Titular principal con subtítulo y llamada a la acción.",
  schema: heroSchema,
  defaultProps: heroDefaults,
  layoutCapabilities: {
    width: true,
    align: true,
    direction: true,
    reverse: false,
    columns: false,
    gap: true,
  },
  Renderer: ({ props, layout }) => {
    const row = layout.direction === "row";
    // Compatibilidad: `props.align` se conserva como respaldo de páginas antiguas.
    const align = layout.align === "left" && props.align === "center" ? "center" : layout.align;

    return (
      <section className={cn("border-b bg-background px-density py-[calc(var(--space-unit)*12)]")}>
        <div
          className={cn(
            "mx-auto flex max-w-3xl flex-col",
            layoutGapClass[layout.gap],
            layoutTextAlignClass[align],
            row
              ? "@md:flex-row @md:items-center @md:justify-between"
              : layoutItemsAlignClass[align],
          )}
        >
          <div className="space-y-2 @md:min-w-0">
            {props.eyebrow ? (
              <span className="inline-block rounded-full border bg-surface px-3 py-1 text-xs font-medium text-muted">
                {props.eyebrow}
              </span>
            ) : null}
            <h1 className="text-2xl font-semibold leading-tight tracking-tight">{props.title}</h1>
            <p className="max-w-readable text-base text-muted">{props.subtitle}</p>
          </div>
          <div className={cn(row ? "shrink-0" : "")}>
            <Button asChild size="lg">
              <a href={props.ctaHref}>{props.ctaLabel}</a>
            </Button>
          </div>
        </div>
      </section>
    );
  },
  Inspector: ({ props, onChange }) => (
    <div className="space-y-density">
      <TextField
        label="Antetítulo"
        value={props.eyebrow}
        maxLength={60}
        onChange={(eyebrow) => onChange({ ...props, eyebrow })}
      />
      <TextField
        label="Título"
        value={props.title}
        maxLength={90}
        onChange={(title) => onChange({ ...props, title })}
      />
      <TextField
        label="Subtítulo"
        value={props.subtitle}
        maxLength={240}
        onChange={(subtitle) => onChange({ ...props, subtitle })}
      />
      <TextField
        label="Etiqueta CTA"
        value={props.ctaLabel}
        maxLength={30}
        onChange={(ctaLabel) => onChange({ ...props, ctaLabel })}
      />
      <TextField
        label="Enlace CTA"
        value={props.ctaHref}
        onChange={(ctaHref) => onChange({ ...props, ctaHref })}
      />
      <SelectField
        label="Alineación del texto"
        value={props.align}
        options={[
          { value: "left", label: "Izquierda" },
          { value: "center", label: "Centrada" },
        ]}
        onChange={(align) => onChange({ ...props, align })}
      />
    </div>
  ),
};
