import { Button } from "@/components/ui/button";
import {
  ListField,
  SelectField,
  TextField,
  ToggleField,
} from "@/features/page-builder/builder/fields";
import type { BlockDefinition } from "@/features/page-builder/blocks/definition";
import { layoutGapClass } from "@/features/page-builder/blocks/layout";
import { LogoUpload } from "@/features/page-builder/blocks/navbar/LogoUpload";
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
  layoutCapabilities: {
    width: true,
    align: false,
    direction: false,
    reverse: false,
    columns: false,
    gap: true,
  },
  Renderer: ({ props, layout }) => {
    const vertical = props.placement === "left" || props.placement === "right";
    const showLogo = props.logoUrl.length > 0;
    const showBrand = props.showBrandText || !showLogo;

    return (
      <header
        data-nav-placement={props.placement}
        className={cn(
          "bg-surface text-fg",
          layoutGapClass[layout.gap],
          vertical
            ? "flex flex-wrap items-center p-[calc(var(--space-unit)*5)] @2xl:h-[var(--page-height,100dvh)] @2xl:w-56 @2xl:flex-col @2xl:items-stretch @2xl:border-b-0"
            : "flex flex-wrap items-center px-[calc(var(--space-unit)*6)] py-[calc(var(--space-unit)*4)]",
          props.placement === "top" && "border-b",
          props.placement === "bottom" && "border-t",
          props.placement === "left" && "@2xl:border-r",
          props.placement === "right" && "@2xl:border-l",
        )}
      >
        <span
          className={cn(
            "flex items-center gap-3 text-base font-semibold tracking-tight",
            vertical ? "@2xl:mr-0" : "mr-auto",
          )}
        >
          {showLogo ? (
            <img
              src={props.logoUrl}
              alt={props.logoAlt}
              className="h-[calc(var(--space-unit)*7)] w-auto max-w-[140px] object-contain"
            />
          ) : null}
          {showBrand ? <span>{props.brand}</span> : null}
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
              className={cn(
                "rounded-sm px-[calc(var(--space-unit)*1.5)] py-[calc(var(--space-unit)*1.5)] text-muted underline-offset-4",
                "hover:bg-background hover:text-fg hover:underline",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                vertical &&
                  "@2xl:px-[calc(var(--space-unit)*2)] @2xl:py-[calc(var(--space-unit)*2)]",
              )}
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
        label="URL del logo"
        value={props.logoUrl}
        placeholder="https://… o /ruta"
        onChange={(logoUrl) => onChange({ ...props, logoUrl })}
      />
      <TextField
        label="Texto alternativo del logo"
        value={props.logoAlt}
        maxLength={120}
        onChange={(logoAlt) => onChange({ ...props, logoAlt })}
      />
      <LogoUpload
        currentAlt={props.logoAlt}
        brand={props.brand}
        onUploaded={(logoUrl, logoAlt) => onChange({ ...props, logoUrl, logoAlt })}
      />
      <ToggleField
        label="Mostrar nombre de marca"
        description="Si hay logo, acompaña a la imagen; sin logo, siempre se muestra el nombre."
        value={props.showBrandText}
        onChange={(showBrandText) => onChange({ ...props, showBrandText })}
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
