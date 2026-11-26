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
import { usePageRuntime } from "@/features/page-builder/pageRuntime";
import { submitPageForm } from "@/features/page-builder/submissions";
import { cn } from "@/lib/utils";

/** Clave estable y legible para el CSV; evita duplicados entre etiquetas. */
function fieldKey(label: string, index: number, used: Set<string>): string {
  const base = (label.trim() || `Campo ${index + 1}`).slice(0, 60);
  let key = base;
  let suffix = 2;
  while (used.has(key)) {
    const suffixText = ` (${suffix})`;
    key = `${base.slice(0, 60 - suffixText.length)}${suffixText}`;
    suffix += 1;
  }
  used.add(key);
  return key;
}

export const formBlock: BlockDefinition<"form"> = {
  type: "form",
  label: "Formulario",
  description: "Contacto; en páginas publicadas guarda respuestas en Supabase.",
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
    const runtime = usePageRuntime();
    const isPublic = runtime.mode === "public";
    const livePageId = isPublic ? runtime.pageId : null;
    const [values, setValues] = useState<Record<string, string>>({});
    const [honeypot, setHoneypot] = useState("");
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const row = layout.direction === "row";
    const twoColumns = layout.columns >= 2;

    const usedKeys = new Set<string>();
    const fields = props.fields.map((field, index) => ({
      ...field,
      key: fieldKey(field.label, index, usedKeys),
    }));

    const updateValue = (key: string, value: string) => {
      setValues((current) => ({ ...current, [key]: value }));
      setSent(false);
      setError(null);
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setError(null);

      if (!isPublic) {
        setSent(true);
        return;
      }

      if (!livePageId) {
        setError("No se pudo identificar la página. Recarga e inténtalo de nuevo.");
        return;
      }

      // Un bot que rellena el campo oculto recibe el mismo mensaje, sin enviar nada.
      if (honeypot.trim()) {
        setSent(true);
        setValues({});
        return;
      }

      setSending(true);
      setSent(false);

      const payload = Object.fromEntries(
        fields.map((field) => [field.key, values[field.key] ?? ""]),
      );

      void submitPageForm(livePageId, payload)
        .then(() => {
          setSent(true);
          setValues({});
        })
        .catch((cause: unknown) => {
          setError(
            cause instanceof Error
              ? cause.message
              : "No se pudo enviar el formulario. Inténtalo de nuevo.",
          );
        })
        .finally(() => setSending(false));
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
              aria-hidden="true"
              className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden"
            >
              <Label htmlFor={`${id}-website`}>No rellenar</Label>
              <input
                id={`${id}-website`}
                name="website"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={honeypot}
                onChange={(event) => setHoneypot(event.target.value)}
              />
            </div>
            <div
              className={cn(
                "grid",
                twoColumns ? "grid-cols-1 @sm:grid-cols-2" : "grid-cols-1",
                layoutGapClass[layout.gap],
              )}
            >
              {fields.map((field, index) => (
                <div
                  key={field.key}
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
                      maxLength={2000}
                      name={field.key}
                      value={values[field.key] ?? ""}
                      onChange={(event) => updateValue(field.key, event.target.value)}
                    />
                  ) : (
                    <Input
                      id={`${id}-${index}`}
                      type={field.type}
                      required={field.required}
                      maxLength={2000}
                      name={field.key}
                      autoComplete={field.type === "email" ? "email" : "off"}
                      value={values[field.key] ?? ""}
                      onChange={(event) => updateValue(field.key, event.target.value)}
                    />
                  )}
                </div>
              ))}
            </div>
            <Button type="submit" disabled={sending} aria-busy={sending}>
              {sending ? "Enviando…" : props.submitLabel}
            </Button>
            {!isPublic ? (
              <p className="text-xs text-muted">Demostración: el envío no guarda datos todavía.</p>
            ) : null}
            {error ? (
              <Alert variant="danger">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
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
