import { useId, useState, type FormEvent } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TextAreaField, TextField } from "@/features/page-builder/builder/fields";
import type { BlockDefinition } from "@/features/page-builder/blocks/definition";
import { formDefaults, formSchema } from "@/features/page-builder/blocks/form/schema";

export const formBlock: BlockDefinition<"form"> = {
  type: "form",
  label: "Formulario",
  description: "Contacto de demostración (sin backend en el Hito 1).",
  schema: formSchema,
  defaultProps: formDefaults,
  Renderer: ({ props }) => {
    const id = useId();
    const [sent, setSent] = useState(false);

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setSent(true);
    };

    return (
      <section
        id="contacto"
        className="border-b bg-surface px-density py-[calc(var(--space-unit)*10)]"
      >
        <div className="mx-auto max-w-xl space-y-density">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold leading-tight">{props.title}</h2>
            {props.description ? <p className="text-sm text-muted">{props.description}</p> : null}
          </div>
          <form className="space-y-density" onSubmit={handleSubmit} aria-label={props.title}>
            {props.fields.map((field, index) => (
              <div key={`${field.label}-${index}`} className="space-y-1.5">
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
