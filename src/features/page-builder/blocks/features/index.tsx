import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ListField, TextField } from "@/features/page-builder/builder/fields";
import type { BlockDefinition } from "@/features/page-builder/blocks/definition";
import {
  layoutColumnsClass,
  layoutGapClass,
  layoutTextAlignClass,
} from "@/features/page-builder/blocks/layout";
import { featuresDefaults, featuresSchema } from "@/features/page-builder/blocks/features/schema";
import { cn } from "@/lib/utils";

export const featuresBlock: BlockDefinition<"features"> = {
  type: "features",
  label: "Ventajas",
  description: "Rejilla de ventajas con título y descripción.",
  schema: featuresSchema,
  defaultProps: featuresDefaults,
  layoutCapabilities: {
    width: true,
    align: true,
    direction: false,
    reverse: false,
    columns: true,
    columnsMax: 3,
    gap: true,
  },
  Renderer: ({ props, layout }) => (
    <section className="border-b bg-background px-density py-[calc(var(--space-unit)*10)]">
      <div className={cn("mx-auto flex max-w-4xl flex-col", layoutGapClass[layout.gap])}>
        <div className={cn("space-y-1", layoutTextAlignClass[layout.align])}>
          <h2 className="text-xl font-semibold leading-tight">{props.title}</h2>
          {props.subtitle ? <p className="text-sm text-muted">{props.subtitle}</p> : null}
        </div>
        <div className={cn("grid", layoutColumnsClass[layout.columns], layoutGapClass[layout.gap])}>
          {props.items.map((item) => (
            <Card key={item.title}>
              <CardHeader>
                <CardTitle>{item.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  ),
  Inspector: ({ props, onChange }) => (
    <div className="space-y-density">
      <TextField
        label="Título"
        value={props.title}
        maxLength={80}
        onChange={(title) => onChange({ ...props, title })}
      />
      <TextField
        label="Subtítulo"
        value={props.subtitle}
        maxLength={160}
        onChange={(subtitle) => onChange({ ...props, subtitle })}
      />
      <ListField
        label="Ventajas"
        items={props.items}
        max={6}
        create={() => ({ title: "Nueva ventaja", description: "Descripción breve." })}
        itemLabel={(item, index) => item.title || `Ventaja ${index + 1}`}
        onChange={(items) => onChange({ ...props, items })}
      >
        {(item, update) => (
          <>
            <TextField
              label="Título"
              value={item.title}
              maxLength={50}
              onChange={(title) => update({ ...item, title })}
            />
            <TextField
              label="Descripción"
              value={item.description}
              maxLength={140}
              onChange={(description) => update({ ...item, description })}
            />
          </>
        )}
      </ListField>
    </div>
  ),
};
