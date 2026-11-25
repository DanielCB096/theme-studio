import { Button } from "@/components/ui/button";
import { ListField, SelectField, TextField } from "@/features/page-builder/builder/fields";
import type { BlockDefinition } from "@/features/page-builder/blocks/definition";
import { navbarDefaults, navbarSchema } from "@/features/page-builder/blocks/navbar/schema";
import { cn } from "@/lib/utils";

const PLACEMENT_LABELS = {
  top: "Arriba (horizontal)",
  bottom: "Abajo (horizontal)",
  left: "Izquierda (vertical)",
  right: "Derecha (vertical)",
} as const;

export const navbarBlock: BlockDefinition<"navbar"> = {
  type: "navbar",
  label: "Navegación",
  description: "Barra horizontal o columna lateral, en cualquiera de los cuatro lados.",
  schema: navbarSchema,
  defaultProps: navbarDefaults,
  Renderer: ({ props }) => {
    const vertical = props.placement === "left" || props.placement === "right";

    return (
      <header
        data-nav-placement={props.placement}
        className={cn(
          "bg-surface text-fg",
          vertical
            ? "flex flex-wrap items-center gap-density border-b p-density @2xl:sticky @2xl:top-0 @2xl:h-[var(--page-height,100dvh)] @2xl:w-56 @2xl:flex-col @2xl:items-stretch @2xl:border-b-0"
            : "px-density py-3",
          props.placement === "top" && "border-b",
          props.placement === "bottom" && "border-t",
          props.placement === "left" && "@2xl:border-r",
          props.placement === "right" && "@2xl:border-l",
        )}
      >
        <span
          className={cn(
            "text-base font-semibold tracking-tight",
            vertical ? "@2xl:mr-0" : "mr-auto",
          )}
        >
          {props.brand}
        </span>

        <nav
          aria-label="Navegación principal"
          className={cn(
            "flex gap-3 text-sm",
            vertical
              ? "flex-wrap items-center @2xl:flex-col @2xl:items-stretch"
              : "flex-wrap items-center",
          )}
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

        <div className={cn(vertical ? "ml-auto @2xl:ml-0 @2xl:w-full" : "")}>
          <Button asChild size="sm" className={vertical ? "@2xl:w-full" : ""}>
            <a href={props.ctaHref}>{props.ctaLabel}</a>
          </Button>
        </div>
      </header>
    );
  },
  Inspector: ({ props, onChange }) => (
    <div className="space-y-density">
      <TextField
        label="Marca"
        value={props.brand}
        maxLength={40}
        onChange={(brand) => onChange({ ...props, brand })}
      />
      <SelectField
        label="Ubicación"
        value={props.placement}
        options={[
          { value: "top", label: PLACEMENT_LABELS.top },
          { value: "bottom", label: PLACEMENT_LABELS.bottom },
          { value: "left", label: PLACEMENT_LABELS.left },
          { value: "right", label: PLACEMENT_LABELS.right },
        ]}
        onChange={(placement) => onChange({ ...props, placement })}
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
