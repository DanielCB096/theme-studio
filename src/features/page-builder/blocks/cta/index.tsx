import { Button } from "@/components/ui/button";
import { TextAreaField, TextField } from "@/features/page-builder/builder/fields";
import type { BlockDefinition } from "@/features/page-builder/blocks/definition";
import {
  layoutGapClass,
  layoutItemsAlignClass,
  layoutTextAlignClass,
} from "@/features/page-builder/blocks/layout";
import { ctaDefaults, ctaSchema } from "@/features/page-builder/blocks/cta/schema";
import { cn } from "@/lib/utils";

export const ctaBlock: BlockDefinition<"cta"> = {
  type: "cta",
  label: "Llamada a la acción",
  description: "Bloque de cierre con botón.",
  schema: ctaSchema,
  defaultProps: ctaDefaults,
  layoutCapabilities: {
    width: true,
    align: true,
    direction: true,
    reverse: true,
    columns: false,
    gap: true,
  },
  Renderer: ({ props, layout }) => {
    const row = layout.direction === "row";

    return (
      <section className="border-b bg-surface px-density py-[calc(var(--space-unit)*10)]">
        <div
          className={cn(
            "mx-auto flex max-w-2xl flex-col",
            layoutGapClass[layout.gap],
            layoutTextAlignClass[layout.align],
            row
              ? "@md:flex-row @md:items-center @md:justify-between"
              : layoutItemsAlignClass[layout.align],
          )}
        >
          <div className={cn("space-y-1", row && layout.reverse && "@md:order-2")}>
            <h2 className="text-xl font-semibold leading-tight">{props.title}</h2>
            {props.description ? <p className="text-sm text-muted">{props.description}</p> : null}
          </div>
          <div className={cn(row ? "shrink-0" : "", row && layout.reverse && "@md:order-1")}>
            <Button asChild>
              <a href={props.buttonHref}>{props.buttonLabel}</a>
            </Button>
          </div>
        </div>
      </section>
    );
  },
  Inspector: ({ props, onChange }) => (
    <div className="space-y-density">
      <TextField
        label="Título"
        value={props.title}
        maxLength={90}
        onChange={(title) => onChange({ ...props, title })}
      />
      <TextAreaField
        label="Descripción"
        value={props.description}
        maxLength={200}
        onChange={(description) => onChange({ ...props, description })}
      />
      <TextField
        label="Etiqueta del botón"
        value={props.buttonLabel}
        maxLength={30}
        onChange={(buttonLabel) => onChange({ ...props, buttonLabel })}
      />
      <TextField
        label="Enlace del botón"
        value={props.buttonHref}
        onChange={(buttonHref) => onChange({ ...props, buttonHref })}
      />
    </div>
  ),
};
