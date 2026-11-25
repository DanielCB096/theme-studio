import { Button } from "@/components/ui/button";
import { SelectField, TextField } from "@/features/page-builder/builder/fields";
import type { BlockDefinition } from "@/features/page-builder/blocks/definition";
import { heroDefaults, heroSchema } from "@/features/page-builder/blocks/hero/schema";
import { cn } from "@/lib/utils";

export const heroBlock: BlockDefinition<"hero"> = {
  type: "hero",
  label: "Hero",
  description: "Titular principal con subtítulo y llamada a la acción.",
  schema: heroSchema,
  defaultProps: heroDefaults,
  Renderer: ({ props }) => (
    <section className={cn("border-b bg-background px-density py-[calc(var(--space-unit)*12)]")}>
      <div
        className={cn(
          "mx-auto flex max-w-3xl flex-col gap-density",
          props.align === "center" ? "items-center text-center" : "items-start text-left",
        )}
      >
        {props.eyebrow ? (
          <span className="rounded-full border bg-surface px-3 py-1 text-xs font-medium text-muted">
            {props.eyebrow}
          </span>
        ) : null}
        <h1 className="text-2xl font-semibold leading-tight tracking-tight">{props.title}</h1>
        <p className="max-w-readable text-base text-muted">{props.subtitle}</p>
        <Button asChild size="lg">
          <a href={props.ctaHref}>{props.ctaLabel}</a>
        </Button>
      </div>
    </section>
  ),
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
        label="Alineación"
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
