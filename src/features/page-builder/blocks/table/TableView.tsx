import { useEffect, useId, useMemo, useState } from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { layoutGapClass } from "@/features/page-builder/blocks/layout";
import { cn } from "@/lib/utils";
import type { BlockLayoutGap, TablePageSize } from "@/types/page";

/** Comparación sin mayúsculas ni acentos, en español. */
function normalizeSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es");
}

interface TableViewProps {
  title: string;
  columns: string[];
  rows: string[][];
  searchable: boolean;
  pageSize: TablePageSize;
  gap: BlockLayoutGap;
}

/**
 * Tabla de solo lectura con buscador y paginación en cliente. Se usa igual en
 * el lienzo del builder y en la página publicada; en el builder la capa de
 * selección del bloque cubre los controles, que están pensados para publicar.
 */
export function TableView({ title, columns, rows, searchable, pageSize, gap }: TableViewProps) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const searchId = useId();

  useEffect(() => {
    setPage(1);
  }, [pageSize]);

  const filteredRows = useMemo(() => {
    if (!searchable) return rows;
    const term = normalizeSearch(query.trim());
    if (!term) return rows;
    return rows.filter((row) => row.some((cell) => normalizeSearch(cell).includes(term)));
  }, [rows, searchable, query]);

  const totalPages = pageSize > 0 ? Math.max(1, Math.ceil(filteredRows.length / pageSize)) : 1;
  const currentPage = Math.min(page, totalPages);
  const visibleRows =
    pageSize > 0
      ? filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize)
      : filteredRows;

  const hasQuery = query.trim().length > 0;
  const resultLabel =
    filteredRows.length === 1 ? "1 resultado" : `${filteredRows.length} resultados`;

  return (
    <section className="border-b bg-surface px-density py-[calc(var(--space-unit)*10)]">
      <div className={cn("mx-auto flex max-w-4xl flex-col", layoutGapClass[gap])}>
        <h2 className="text-xl font-semibold leading-tight">{title}</h2>

        {searchable || pageSize > 0 ? (
          <div className="flex flex-col gap-2 @sm:flex-row @sm:items-end @sm:justify-between">
            {searchable ? (
              <div className="w-full max-w-sm space-y-1.5">
                <Label htmlFor={searchId} className="sr-only">
                  Buscar en la tabla
                </Label>
                <Input
                  id={searchId}
                  type="search"
                  value={query}
                  placeholder="Buscar…"
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setPage(1);
                  }}
                />
                <p className="text-xs text-muted" aria-live="polite">
                  {resultLabel}
                </p>
              </div>
            ) : null}

            {pageSize > 0 ? (
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm text-muted">
                  Página {currentPage} de {totalPages}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => setPage(currentPage - 1)}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage(currentPage + 1)}
                >
                  Siguiente
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}

        <Table>
          <caption className="sr-only">{title}</caption>
          <TableHeader>
            <TableRow>
              {columns.map((column, index) => (
                <TableHead key={`head-${index}`}>{column}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleRows.length === 0 && hasQuery ? (
              <TableRow>
                <TableCell colSpan={Math.max(columns.length, 1)} className="text-sm text-muted">
                  No hay resultados.
                </TableCell>
              </TableRow>
            ) : (
              visibleRows.map((row, rowIndex) => (
                <TableRow key={`row-${rowIndex}`}>
                  {row.map((cell, cellIndex) => (
                    <TableCell key={`cell-${cellIndex}`}>{cell}</TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
