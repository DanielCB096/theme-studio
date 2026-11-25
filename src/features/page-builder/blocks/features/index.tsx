import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ListField, TextField } from "@/features/page-builder/builder/fields";
import type { BlockDefinition } from "@/features/page-builder/blocks/definition";
import { featuresDefaults, featuresSchema } from "@/features/page-builder/blocks/features/schema";

export const featuresBlock: BlockDefinition<"features"> = {
  type: "features",
  label: "Ventajas",
  description: "Rejilla de ventajas con título y descripción.",
  schema: featuresSchema,
  defaultProps: featuresDefaults,
  Renderer: ({ props }) => (
    <section className="border-b bg-background px-density py-[calc(var(--space-unit)*10)]">
      <div className="mx-auto max-w-4xl space-y-density">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold leading-tight">{props.title}</h2>
          {props.subtitle ? <p className="text-sm text-muted">{props.subtitle}</p> : null}
        </div>
        <div className="grid grid-cols-1 gap-density @md:grid-cols-3">
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
