import { Button } from "@/components/ui/button";
import { ListField, TextField } from "@/features/page-builder/builder/fields";
import type { BlockDefinition } from "@/features/page-builder/blocks/definition";
import { navbarSchema, navbarDefaults } from "@/features/page-builder/blocks/navbar/schema";

export const navbarBlock: BlockDefinition<"navbar"> = {
  type: "navbar",
  label: "Navegación",
  description: "Barra superior con marca, enlaces y botón.",
  schema: navbarSchema,
  defaultProps: navbarDefaults,
  Renderer: ({ props }) => (
    <header className="border-b bg-surface px-density py-3">
      <div className="flex flex-wrap items-center gap-density">
        <span className="mr-auto text-base font-semibold tracking-tight">{props.brand}</span>
        <nav
          aria-label="Navegación principal"
          className="flex flex-wrap items-center gap-3 text-sm"
        >
          {props.links.map((link) => (
            <a
              key={`${link.label}-${link.href}`}
              href={link.href}
              className="rounded-sm text-muted underline-offset-4 hover:text-fg hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {link.label}
            </a>
          ))}
        </nav>
        <Button asChild size="sm">
          <a href={props.ctaHref}>{props.ctaLabel}</a>
        </Button>
      </div>
    </header>
  ),
  Inspector: ({ props, onChange }) => (
    <div className="space-y-density">
      <TextField
        label="Marca"
        value={props.brand}
        maxLength={40}
        onChange={(brand) => onChange({ ...props, brand })}
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
      <ListField
        label="Enlaces"
        items={props.links}
        max={5}
        create={() => ({ label: "Nuevo enlace", href: "#" })}
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
