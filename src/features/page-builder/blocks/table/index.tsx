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
import {
  CheckboxField,
  SelectField,
  TextAreaField,
  TextField,
} from "@/features/page-builder/builder/fields";
import type { BlockDefinition } from "@/features/page-builder/blocks/definition";
import { layoutGapClass } from "@/features/page-builder/blocks/layout";
import { tableDefaults, tableSchema } from "@/features/page-builder/blocks/table/schema";
import { TableView } from "@/features/page-builder/blocks/table/TableView";
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
    const usesDataset = props.source === "page";
    const dataset = usesDataset ? (runtime.dataset ?? null) : null;

    const columns = usesDataset
      ? (dataset?.columns ?? []).map((column) => column.label)
      : [...props.columns];
    const rows = usesDataset
      ? (dataset?.rows ?? []).map((row) =>
          (dataset?.columns ?? []).map((column) => row[column.id] ?? ""),
        )
      : props.rows.map((row) => props.columns.map((_, cellIndex) => row[cellIndex] ?? ""));

    if (usesDataset && columns.length === 0) {
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

    if (usesDataset && rows.length === 0) {
      if (isPublic) return null;
      return (
        <section className="border-b bg-surface px-density py-[calc(var(--space-unit)*10)]">
          <div className={cn("mx-auto flex max-w-4xl flex-col", layoutGapClass[layout.gap])}>
            <h2 className="text-xl font-semibold leading-tight">{props.title}</h2>
            <Table>
              <caption className="sr-only">{props.title}</caption>
              <TableHeader>
                <TableRow>
                  {columns.map((column, index) => (
                    <TableHead key={`head-${index}`}>{column}</TableHead>
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
      <TableView
        title={props.title}
        columns={columns}
        rows={rows}
        searchable={props.searchable}
        pageSize={props.pageSize}
        gap={layout.gap}
      />
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

        <CheckboxField
          label="Buscador"
          checked={props.searchable}
          description="Filtra por cualquier celda, sin distinguir mayúsculas ni acentos."
          onChange={(searchable) => onChange({ ...props, searchable })}
        />
        <SelectField
          label="Filas por página"
          value={props.pageSize}
          options={[
            { value: 0, label: "Todas" },
            { value: 5, label: "5" },
            { value: 10, label: "10" },
            { value: 20, label: "20" },
          ]}
          onChange={(pageSize) => onChange({ ...props, pageSize })}
        />
        <p className="text-xs text-muted">
          El buscador y la paginación se usan en la página publicada. En el lienzo del builder la
          capa de selección cubre estos controles.
        </p>
      </div>
    );
  },
};
