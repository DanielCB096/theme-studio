import { TextAreaField, TextField } from "@/features/page-builder/builder/fields";
import type { BlockDefinition } from "@/features/page-builder/blocks/definition";
import { tableDefaults, tableSchema } from "@/features/page-builder/blocks/table/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const tableBlock: BlockDefinition<"table"> = {
  type: "table",
  label: "Tabla",
  description: "Comparativa estática de filas y columnas.",
  schema: tableSchema,
  defaultProps: tableDefaults,
  Renderer: ({ props }) => (
    <section className="border-b bg-surface px-density py-[calc(var(--space-unit)*10)]">
      <div className="mx-auto max-w-4xl space-y-density">
        <h2 className="text-xl font-semibold leading-tight">{props.title}</h2>
        <Table>
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
    </div>
  ),
};
