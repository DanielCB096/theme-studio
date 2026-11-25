import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ListField, TextField } from "@/features/page-builder/builder/fields";
import type { BlockDefinition } from "@/features/page-builder/blocks/definition";
import { pricingDefaults, pricingSchema } from "@/features/page-builder/blocks/pricing/schema";

export const pricingBlock: BlockDefinition<"pricing"> = {
  type: "pricing",
  label: "Precios",
  description: "Hasta tres planes con ventajas y CTA.",
  schema: pricingSchema,
  defaultProps: pricingDefaults,
  Renderer: ({ props }) => (
    <section className="border-b bg-background px-density py-[calc(var(--space-unit)*10)]">
      <div className="mx-auto max-w-4xl space-y-density">
        <div className="space-y-1 text-center">
          <h2 className="text-xl font-semibold leading-tight">{props.title}</h2>
          {props.subtitle ? <p className="text-sm text-muted">{props.subtitle}</p> : null}
        </div>
        <div className="grid grid-cols-1 gap-density @md:grid-cols-3">
          {props.plans.map((plan, index) => (
            <Card key={`${plan.name}-${index}`} className="flex flex-col">
              <CardHeader>
                <CardTitle className="mr-auto">{plan.name}</CardTitle>
                {index === 1 ? <Badge variant="primary">Popular</Badge> : null}
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-density">
                <p>
                  <span className="text-2xl font-semibold">{plan.price}</span>
                  <span className="text-sm text-muted">{plan.period}</span>
                </p>
                <ul className="space-y-1 text-sm text-muted">
                  {plan.features.map((feature) => (
                    <li key={feature}>· {feature}</li>
                  ))}
                </ul>
                <Button asChild variant="outline" className="mt-auto w-full">
                  <a href={plan.ctaHref}>{plan.ctaLabel}</a>
                </Button>
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
        label="Planes"
        items={props.plans}
        max={3}
        create={() => ({
          name: "Nuevo plan",
          price: "9 €",
          period: "/mes",
          features: ["Una ventaja"],
          ctaLabel: "Elegir",
          ctaHref: "#contacto",
        })}
        itemLabel={(item) => item.name}
        onChange={(plans) => onChange({ ...props, plans })}
      >
        {(item, update) => (
          <>
            <TextField
              label="Nombre"
              value={item.name}
              maxLength={40}
              onChange={(name) => update({ ...item, name })}
            />
            <TextField
              label="Precio"
              value={item.price}
              maxLength={20}
              onChange={(price) => update({ ...item, price })}
            />
            <TextField
              label="Periodo"
              value={item.period}
              maxLength={30}
              onChange={(period) => update({ ...item, period })}
            />
            <TextField
              label="Etiqueta CTA"
              value={item.ctaLabel}
              maxLength={30}
              onChange={(ctaLabel) => update({ ...item, ctaLabel })}
            />
          </>
        )}
      </ListField>
      <p className="text-xs text-muted">Las ventajas de cada plan se editan en el Hito 2.</p>
    </div>
  ),
};
