import { ListField, TextField } from "@/features/page-builder/builder/fields";
import type { BlockDefinition } from "@/features/page-builder/blocks/definition";
import {
  layoutGapClass,
  layoutItemsAlignClass,
  layoutTextAlignClass,
} from "@/features/page-builder/blocks/layout";
import { footerDefaults, footerSchema } from "@/features/page-builder/blocks/footer/schema";
import { cn } from "@/lib/utils";

export const footerBlock: BlockDefinition<"footer"> = {
  type: "footer",
  label: "Pie de página",
  description: "Texto legal y enlaces secundarios.",
  schema: footerSchema,
  defaultProps: footerDefaults,
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
      <footer className="bg-surface px-density py-[calc(var(--space-unit)*5)]">
        <div
          className={cn(
            "mx-auto flex max-w-4xl flex-col text-sm text-muted",
            layoutGapClass[layout.gap],
            layoutTextAlignClass[layout.align],
            row
              ? "@md:flex-row @md:items-center @md:justify-between"
              : layoutItemsAlignClass[layout.align],
          )}
        >
          <p className={cn(row && layout.reverse && "@md:order-2")}>{props.text}</p>
          <nav
            aria-label="Enlaces del pie"
            className={cn("flex flex-wrap gap-3", row && layout.reverse && "@md:order-1")}
          >
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
    );
  },
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
