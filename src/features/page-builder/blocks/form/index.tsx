import { useId, useState, type FormEvent } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TextAreaField, TextField } from "@/features/page-builder/builder/fields";
import type { BlockDefinition } from "@/features/page-builder/blocks/definition";
import { layoutGapClass } from "@/features/page-builder/blocks/layout";
import { formDefaults, formSchema } from "@/features/page-builder/blocks/form/schema";
import { cn } from "@/lib/utils";

export const formBlock: BlockDefinition<"form"> = {
  type: "form",
  label: "Formulario",
  description: "Contacto de demostración (sin backend en el Hito 1).",
  schema: formSchema,
  defaultProps: formDefaults,
  layoutCapabilities: {
    width: true,
    align: false,
    direction: true,
    reverse: true,
    columns: true,
    columnsMax: 2,
    gap: true,
  },
  Renderer: ({ props, layout }) => {
    const id = useId();
    const [sent, setSent] = useState(false);
    const row = layout.direction === "row";
    const twoColumns = layout.columns >= 2;

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setSent(true);
    };

    return (
      <section
        id="contacto"
        className="border-b bg-surface px-density py-[calc(var(--space-unit)*10)]"
      >
        <div
          className={cn(
            "mx-auto flex flex-col",
            layoutGapClass[layout.gap],
            row ? "max-w-4xl @md:flex-row @md:items-start" : "max-w-xl",
          )}
        >
          <div className={cn("space-y-1", row && "flex-1", row && layout.reverse && "@md:order-2")}>
            <h2 className="text-xl font-semibold leading-tight">{props.title}</h2>
            {props.description ? <p className="text-sm text-muted">{props.description}</p> : null}
          </div>
          <form
            className={cn(
              "flex flex-col",
              layoutGapClass[layout.gap],
              row && "flex-1",
              row && layout.reverse && "@md:order-1",
            )}
            onSubmit={handleSubmit}
            aria-label={props.title}
          >
            <div
              className={cn(
                "grid",
                twoColumns ? "grid-cols-1 @sm:grid-cols-2" : "grid-cols-1",
                layoutGapClass[layout.gap],
              )}
            >
              {props.fields.map((field, index) => (
                <div
                  key={`${field.label}-${index}`}
                  className={cn(
                    "space-y-1.5",
                    twoColumns && field.type === "textarea" && "@sm:col-span-2",
                  )}
                >
                  <Label htmlFor={`${id}-${index}`}>{field.label}</Label>
                  {field.type === "textarea" ? (
                    <Textarea
                      id={`${id}-${index}`}
                      required={field.required}
                      rows={3}
                      name={`field-${index}`}
                    />
                  ) : (
                    <Input
                      id={`${id}-${index}`}
                      type={field.type}
                      required={field.required}
                      name={`field-${index}`}
                    />
                  )}
                </div>
              ))}
            </div>
            <Button type="submit">{props.submitLabel}</Button>
            <p className="text-xs text-muted">Demostración: el envío no guarda datos todavía.</p>
            {sent ? (
              <Alert variant="success">
                <AlertDescription>{props.successMessage}</AlertDescription>
              </Alert>
            ) : null}
          </form>
        </div>
      </section>
    );
  },
  Inspector: ({ props, onChange }) => (
    <div className="space-y-density">
      <TextField
        label="Título"
        value={props.title}
        maxLength={80}
        onChange={(title) => onChange({ ...props, title })}
      />
      <TextAreaField
        label="Descripción"
        value={props.description}
        maxLength={180}
        onChange={(description) => onChange({ ...props, description })}
      />
      <TextField
        label="Etiqueta del botón"
        value={props.submitLabel}
        maxLength={30}
        onChange={(submitLabel) => onChange({ ...props, submitLabel })}
      />
      <TextAreaField
        label="Mensaje de éxito"
        value={props.successMessage}
        maxLength={140}
        onChange={(successMessage) => onChange({ ...props, successMessage })}
      />
      <p className="text-xs text-muted">Los campos del formulario se editan en el Hito 2.</p>
    </div>
  ),
};
