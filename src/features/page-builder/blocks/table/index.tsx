import { Link } from "react-router-dom";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SelectField, TextAreaField, TextField } from "@/features/page-builder/builder/fields";
import type { BlockDefinition } from "@/features/page-builder/blocks/definition";
import { layoutGapClass } from "@/features/page-builder/blocks/layout";
import { tableDefaults, tableSchema } from "@/features/page-builder/blocks/table/schema";
import { usePageRuntime } from "@/features/page-builder/pageRuntime";
import { cn } from "@/lib/utils";

function dataLink(pageId: string | null) {
  if (!pageId) return null;

  return (
    <Link
      to={`/pages/${pageId}/datos`}
      className="rounded-sm text-primary underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      Editar datos de la página
    </Link>
  );
}

export const tableBlock: BlockDefinition<"table"> = {
  type: "table",
  label: "Tabla",
  description: "Comparativa estática o conectada a los datos de la página.",
  schema: tableSchema,
  defaultProps: tableDefaults,
  layoutCapabilities: {
    width: true,
    align: false,
    direction: false,
    reverse: false,
    columns: false,
    gap: true,
  },
  Renderer: ({ props, layout }) => {
    const runtime = usePageRuntime();
    const isPublic = runtime.mode === "public";
    const dataset = props.source === "page" ? (runtime.dataset ?? null) : null;

    if (props.source === "page") {
      const columns = dataset?.columns ?? [];
      const rows = dataset?.rows ?? [];

      if (columns.length === 0) {
        if (isPublic) return null;
        return (
          <section className="border-b bg-surface px-density py-[calc(var(--space-unit)*10)]">
            <div className={cn("mx-auto flex max-w-4xl flex-col", layoutGapClass[layout.gap])}>
              <h2 className="text-xl font-semibold leading-tight">{props.title}</h2>
              <Alert variant="info">
                <AlertDescription>
                  Esta tabla se alimenta de los datos de la página.{" "}
                  {runtime.pageId ? (
                    <>{dataLink(runtime.pageId)} para añadir columnas y filas.</>
                  ) : (
                    "Guarda la página para conectar datos."
                  )}
                </AlertDescription>
              </Alert>
            </div>
          </section>
        );
      }

      if (rows.length === 0) {
        if (isPublic) return null;
        return (
          <section className="border-b bg-surface px-density py-[calc(var(--space-unit)*10)]">
            <div className={cn("mx-auto flex max-w-4xl flex-col", layoutGapClass[layout.gap])}>
              <h2 className="text-xl font-semibold leading-tight">{props.title}</h2>
              <Table>
                <caption className="sr-only">{props.title}</caption>
                <TableHeader>
                  <TableRow>
                    {columns.map((column) => (
                      <TableHead key={column.id}>{column.label}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={columns.length} className="text-sm text-muted">
                      Sin filas todavía.{" "}
                      {runtime.pageId
                        ? dataLink(runtime.pageId)
                        : "Guarda la página para conectar datos."}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </section>
        );
      }

      return (
        <section className="border-b bg-surface px-density py-[calc(var(--space-unit)*10)]">
          <div className={cn("mx-auto flex max-w-4xl flex-col", layoutGapClass[layout.gap])}>
            <h2 className="text-xl font-semibold leading-tight">{props.title}</h2>
            <Table>
              <caption className="sr-only">{props.title}</caption>
              <TableHeader>
                <TableRow>
                  {columns.map((column) => (
                    <TableHead key={column.id}>{column.label}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row, index) => (
                  <TableRow key={`row-${index}`}>
                    {columns.map((column) => (
                      <TableCell key={column.id}>{row[column.id] ?? ""}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      );
    }

    return (
      <section className="border-b bg-surface px-density py-[calc(var(--space-unit)*10)]">
        <div className={cn("mx-auto flex max-w-4xl flex-col", layoutGapClass[layout.gap])}>
          <h2 className="text-xl font-semibold leading-tight">{props.title}</h2>
          <Table>
            <caption className="sr-only">{props.title}</caption>
            <TableHeader>
              <TableRow>
                {props.columns.map((column) => (
                  <TableHead key={column}>{column}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {props.rows.map((row, index) => (
                <TableRow key={`row-${index}`}>
                  {row.map((cell, cellIndex) => (
                    <TableCell key={`cell-${cellIndex}`}>{cell}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
    );
  },
  Inspector: ({ props, onChange }) => {
    const runtime = usePageRuntime();

    return (
      <div className="space-y-density">
        <TextField
          label="Título"
          value={props.title}
          maxLength={80}
          onChange={(title) => onChange({ ...props, title })}
        />
        <SelectField
          label="Origen de datos"
          value={props.source}
          options={[
            { value: "static", label: "Estática" },
            { value: "page", label: "Datos de la página" },
          ]}
          onChange={(source) => onChange({ ...props, source })}
        />

        {props.source === "page" ? (
          <div className="space-y-1.5 text-sm text-muted">
            <p>
              La tabla usa las columnas y filas del dataset de la página. Los datos solo se editan
              en el editor de datos.
            </p>
            {runtime.pageId ? (
              dataLink(runtime.pageId)
            ) : (
              <p>Guarda la página para conectar datos.</p>
            )}
          </div>
        ) : (
          <>
            <TextField
              label="Columnas (separadas por comas)"
              value={props.columns.join(", ")}
              maxLength={240}
              onChange={(value) =>
                onChange({
                  ...props,
                  columns: value
                    .split(",")
                    .map((column) => column.trim())
                    .filter(Boolean),
                })
              }
            />
            <TextAreaField
              label="Filas (una por línea, celdas con |)"
              value={props.rows.map((row) => row.join(" | ")).join("\n")}
              rows={6}
              maxLength={2000}
              onChange={(value) =>
                onChange({
                  ...props,
                  rows: value
                    .split("\n")
                    .map((row) =>
                      row
                        .split("|")
                        .map((cell) => cell.trim())
                        .filter(Boolean),
                    )
                    .filter((row) => row.length > 0),
                })
              }
            />
          </>
        )}
      </div>
    );
  },
};
