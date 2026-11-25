import { ListField, TextField } from "@/features/page-builder/builder/fields";
import type { BlockDefinition } from "@/features/page-builder/blocks/definition";
import { footerDefaults, footerSchema } from "@/features/page-builder/blocks/footer/schema";

export const footerBlock: BlockDefinition<"footer"> = {
  type: "footer",
  label: "Pie de página",
  description: "Texto legal y enlaces secundarios.",
  schema: footerSchema,
  defaultProps: footerDefaults,
  Renderer: ({ props }) => (
    <footer className="bg-surface px-density py-[calc(var(--space-unit)*5)]">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 text-sm text-muted">
        <p>{props.text}</p>
        <nav aria-label="Enlaces del pie" className="flex flex-wrap gap-3">
          {props.links.map((link) => (
            <a
              key={`${link.label}-${link.href}`}
              href={link.href}
              className="rounded-sm underline-offset-4 hover:text-fg hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {link.label}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  ),
  Inspector: ({ props, onChange }) => (
    <div className="space-y-density">
      <TextField
        label="Texto"
        value={props.text}
        maxLength={200}
        onChange={(text) => onChange({ ...props, text })}
      />
      <ListField
        label="Enlaces"
        items={props.links}
        max={4}
        create={() => ({ label: "Nuevo enlace", href: "/" })}
        itemLabel={(item) => item.label}
        onChange={(links) => onChange({ ...props, links })}
      >
        {(item, update) => (
          <>
            <TextField
              label="Etiqueta"
              value={item.label}
              maxLength={60}
              onChange={(label) => update({ ...item, label })}
            />
            <TextField
              label="Destino"
              value={item.href}
              onChange={(href) => update({ ...item, href })}
            />
          </>
        )}
      </ListField>
    </div>
  ),
};
