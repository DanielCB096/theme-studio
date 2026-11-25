import { Image as ImageIcon } from "lucide-react";

import { SelectField, TextAreaField, TextField } from "@/features/page-builder/builder/fields";
import type { BlockDefinition } from "@/features/page-builder/blocks/definition";
import {
  textImageDefaults,
  textImageSchema,
} from "@/features/page-builder/blocks/textImage/schema";
import { cn } from "@/lib/utils";

export const textImageBlock: BlockDefinition<"textImage"> = {
  type: "textImage",
  label: "Texto e imagen",
  description: "Dos columnas con texto e imagen opcional.",
  schema: textImageSchema,
  defaultProps: textImageDefaults,
  Renderer: ({ props }) => (
    <section className="border-b bg-background px-density py-[calc(var(--space-unit)*10)]">
      <div className="mx-auto grid max-w-4xl grid-cols-1 items-center gap-density @md:grid-cols-2">
        <div className={cn("space-y-2", props.imagePosition === "left" ? "@md:order-2" : "")}>
          <h2 className="text-xl font-semibold leading-tight">{props.title}</h2>
          <p className="text-sm text-muted">{props.body}</p>
        </div>
        {props.imageUrl ? (
          <img
            src={props.imageUrl}
            alt={props.imageAlt}
            className="aspect-video w-full rounded-lg border object-cover"
            loading="lazy"
          />
        ) : (
          <div
            aria-hidden="true"
            className="grid aspect-video w-full place-items-center rounded-lg border bg-surface text-muted"
          >
            <ImageIcon aria-hidden="true" className="h-8 w-8" />
          </div>
        )}
      </div>
    </section>
  ),
  Inspector: ({ props, onChange }) => (
    <div className="space-y-density">
      <TextField
        label="Título"
        value={props.title}
        maxLength={90}
        onChange={(title) => onChange({ ...props, title })}
      />
      <TextAreaField
        label="Texto"
        value={props.body}
        rows={5}
        maxLength={500}
        onChange={(body) => onChange({ ...props, body })}
      />
      <TextField
        label="URL de imagen"
        value={props.imageUrl}
        placeholder="https://… o /ruta"
        onChange={(imageUrl) => onChange({ ...props, imageUrl })}
      />
      <TextField
        label="Texto alternativo"
        value={props.imageAlt}
        maxLength={120}
        onChange={(imageAlt) => onChange({ ...props, imageAlt })}
      />
      <SelectField
        label="Posición de la imagen"
        value={props.imagePosition}
        options={[
          { value: "right", label: "Derecha" },
          { value: "left", label: "Izquierda" },
        ]}
        onChange={(imagePosition) => onChange({ ...props, imagePosition })}
      />
    </div>
  ),
};
