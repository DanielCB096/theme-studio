import { ArrowLeft, Database, Loader2, Plus, Save, Trash2, Upload } from "lucide-react";
import { useEffect, useState, type ChangeEvent } from "react";
import { Link, useParams } from "react-router-dom";

import { SiteHeader } from "@/components/layout/SiteHeader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  addColumn,
  addRow,
  emptyDataset,
  removeColumn,
  removeRow,
  renameColumn,
  updateCell,
} from "@/features/page-builder/datasetOps";
import { getPageDataset, savePageDataset } from "@/features/page-builder/datasetRepository";
import { getPageRecord, publicPageUrl } from "@/features/page-builder/pageRepository";
import { datasetFromCsv, MAX_CSV_FILE_BYTES } from "@/lib/csv";
import { MAX_DATASET_COLUMNS, MAX_DATASET_ROWS, validatePageDataset } from "@/lib/datasetSchema";
import type { DatasetColumn, PageDataset } from "@/types/dataset";

interface PageInfo {
  name: string;
  slug: string;
  isPublic: boolean;
}

/** `File.text()` no existe en todos los navegadores/jsdom antiguos. */
function readFileText(file: File): Promise<string> {
  if (typeof file.text === "function") return file.text();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(new Error("No se pudo leer el archivo."));
    reader.readAsText(file);
  });
}

export default function DatasetPage() {
  const { id } = useParams<{ id: string }>();
  const [pageInfo, setPageInfo] = useState<PageInfo | null>(null);
  const [dataset, setDataset] = useState<PageDataset | null>(null);
  const [baseline, setBaseline] = useState<string | null>(null);
  const [hasStoredDataset, setHasStoredDataset] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [pendingColumn, setPendingColumn] = useState<DatasetColumn | null>(null);

  useEffect(() => {
    if (!id) {
      setError("Falta el identificador de la página.");
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);

    const load = async () => {
      try {
        const [record, storedDataset] = await Promise.all([getPageRecord(id), getPageDataset(id)]);
        if (!active) return;

        const initial = storedDataset ?? emptyDataset();
        setPageInfo({ name: record.page.name, slug: record.slug, isPublic: record.isPublic });
        setDataset(initial);
        setBaseline(JSON.stringify(initial));
        setHasStoredDataset(storedDataset !== null);
      } catch (cause) {
        if (active) {
          setError(cause instanceof Error ? cause.message : "No se pudieron cargar los datos.");
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [id]);

  const update = (next: PageDataset) => {
    setDataset(next);
    setStatus(null);
    setSaveError(null);
    setImportStatus(null);
    setImportError(null);
  };

  const importCsv = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Permite volver a elegir el mismo archivo después de un error o de guardar.
    event.target.value = "";
    if (!file) return;

    setImportStatus(null);
    setImportError(null);

    if (file.size > MAX_CSV_FILE_BYTES) {
      setImportError(`El archivo ocupa ${Math.ceil(file.size / 1024)} KB y el máximo es 100 KB.`);
      return;
    }

    try {
      const text = await readFileText(file);
      const imported = datasetFromCsv(text);
      update(imported);
      setImportStatus(
        `CSV importado: ${imported.rows.length} fila${
          imported.rows.length === 1 ? "" : "s"
        }. Pulsa “Guardar datos”.`,
      );
    } catch (cause) {
      setImportError(cause instanceof Error ? cause.message : "No se pudo leer el archivo CSV.");
    }
  };

  const dirty = dataset !== null && baseline !== null && JSON.stringify(dataset) !== baseline;

  const confirmRemoveColumn = () => {
    if (!dataset || !pendingColumn) return;
    update(removeColumn(dataset, pendingColumn.id));
    setPendingColumn(null);
  };

  const save = async () => {
    if (!dataset || !id) return;

    setSaving(true);
    setSaveError(null);
    setStatus(null);
    try {
      const validated = validatePageDataset(dataset);
      await savePageDataset(id, validated);
      setDataset(validated);
      setBaseline(JSON.stringify(validated));
      setHasStoredDataset(true);
      setStatus("Datos guardados.");
      setImportStatus(null);
    } catch (cause) {
      setSaveError(cause instanceof Error ? cause.message : "No se pudieron guardar los datos.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-dvh bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl space-y-density p-density">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div className="min-w-0">
            <Button variant="ghost" size="sm" asChild className="-ml-2 mb-1">
              <Link to="/pages">
                <ArrowLeft aria-hidden="true" className="h-4 w-4" />
                Páginas
              </Link>
            </Button>
            <h2 className="truncate text-xl font-semibold leading-tight">
              Datos{pageInfo ? ` de «${pageInfo.name}»` : ""}
            </h2>
            <p className="text-sm text-muted">
              Un único dataset por página. El bloque Tabla puede leer estas columnas y filas en su
              origen «Datos de la página».
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {id ? (
              <Button variant="outline" size="sm" asChild>
                <Link to={`/builder/${id}`}>Editar página</Link>
              </Button>
            ) : null}
            <Button size="sm" onClick={() => void save()} disabled={saving || !dataset}>
              {saving ? (
                <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
              ) : (
                <Save aria-hidden="true" className="h-4 w-4" />
              )}
              Guardar datos
            </Button>
          </div>
        </div>

        {pageInfo?.isPublic ? (
          <p className="text-sm text-muted">
            Página publicada:{" "}
            <Link
              to={`/p/${pageInfo.slug}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-sm text-primary underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {publicPageUrl(pageInfo.slug)}
            </Link>
          </p>
        ) : null}

        {error ? (
          <Alert variant="danger">
            <div className="space-y-1">
              <AlertTitle>No se pudieron cargar los datos</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </div>
          </Alert>
        ) : null}

        {saveError ? (
          <Alert variant="danger">
            <div className="space-y-1">
              <AlertTitle>No se pudieron guardar los datos</AlertTitle>
              <AlertDescription>{saveError}</AlertDescription>
            </div>
          </Alert>
        ) : null}

        {importError ? (
          <Alert variant="danger">
            <div className="space-y-1">
              <AlertTitle>No se pudo importar el CSV</AlertTitle>
              <AlertDescription>{importError}</AlertDescription>
            </div>
          </Alert>
        ) : null}

        {status ? (
          <p role="status" className="text-sm text-success">
            {status}
          </p>
        ) : null}

        {importStatus ? (
          <p role="status" className="text-sm text-success">
            {importStatus}
          </p>
        ) : null}

        {loading ? (
          <div role="status" className="flex items-center gap-2 p-6 text-sm text-muted">
            <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
            Cargando datos…
          </div>
        ) : dataset ? (
          <>
            <Alert variant="info">
              <div className="space-y-1">
                <AlertTitle>Datos de la página</AlertTitle>
                <AlertDescription>
                  {hasStoredDataset
                    ? "Los cambios no se ven en la página hasta pulsar «Guardar datos»."
                    : "Todavía no hay datos guardados. Añade filas y columnas y pulsa «Guardar datos»."}
                </AlertDescription>
              </div>
            </Alert>

            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <CardTitle>Celdas editables</CardTitle>
                    <CardDescription>
                      {dataset.columns.length} de {MAX_DATASET_COLUMNS} columnas ·{" "}
                      {dataset.rows.length} de {MAX_DATASET_ROWS} filas
                    </CardDescription>
                  </div>
                  {dirty ? <span className="text-xs text-muted">Sin guardar</span> : null}
                </div>
              </CardHeader>
              <CardContent className="space-y-density">
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    id="dataset-csv"
                    type="file"
                    accept=".csv,text/csv"
                    className="peer sr-only"
                    onChange={(event) => void importCsv(event)}
                  />
                  <Button variant="outline" size="sm" asChild>
                    <label
                      htmlFor="dataset-csv"
                      className="cursor-pointer peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background"
                    >
                      <Upload aria-hidden="true" className="h-4 w-4" />
                      Importar CSV
                    </label>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => update(addColumn(dataset))}
                    disabled={dataset.columns.length >= MAX_DATASET_COLUMNS}
                  >
                    <Plus aria-hidden="true" className="h-4 w-4" />
                    Añadir columna
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => update(addRow(dataset))}
                    disabled={dataset.rows.length >= MAX_DATASET_ROWS}
                  >
                    <Plus aria-hidden="true" className="h-4 w-4" />
                    Añadir fila
                  </Button>
                </div>
                <p className="text-xs text-muted">
                  Importar CSV: máximo 100 KB, primera fila como cabeceras, 8 columnas, 200 filas y
                  200 caracteres por celda. Reemplaza el dataset en edición; no se guarda hasta
                  pulsar «Guardar datos».
                </p>

                <Table className="min-w-[40rem]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <span aria-hidden="true">#</span>
                        <span className="sr-only">Número de fila</span>
                      </TableHead>
                      {dataset.columns.map((column, columnIndex) => (
                        <TableHead key={column.id} className="min-w-[11rem] align-top">
                          <div className="space-y-1.5 py-1">
                            <Label htmlFor={`column-label-${column.id}`} className="sr-only">
                              Etiqueta de la columna {columnIndex + 1}
                            </Label>
                            <Input
                              id={`column-label-${column.id}`}
                              aria-label={`Etiqueta de la columna ${columnIndex + 1}`}
                              value={column.label}
                              maxLength={40}
                              onChange={(event) =>
                                update(renameColumn(dataset, column.id, event.target.value))
                              }
                            />
                            <div className="flex items-center justify-between gap-1">
                              <span className="truncate text-[10px] font-normal normal-case tracking-normal text-muted">
                                id: {column.id}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label={`Eliminar columna ${columnIndex + 1}`}
                                title="Eliminar columna y sus datos"
                                disabled={dataset.columns.length <= 1}
                                onClick={() => setPendingColumn(column)}
                              >
                                <Trash2 aria-hidden="true" className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </TableHead>
                      ))}
                      <TableHead className="w-12 text-right">
                        <span className="sr-only">Acciones de la fila</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dataset.rows.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={dataset.columns.length + 2}
                          className="text-sm text-muted"
                        >
                          Sin filas todavía. Usa «Añadir fila» para crear la primera.
                        </TableCell>
                      </TableRow>
                    ) : (
                      dataset.rows.map((row, rowIndex) => (
                        <TableRow key={`row-${rowIndex}`}>
                          <TableCell className="text-xs text-muted">{rowIndex + 1}</TableCell>
                          {dataset.columns.map((column, columnIndex) => (
                            <TableCell key={column.id}>
                              <Label htmlFor={`cell-${rowIndex}-${column.id}`} className="sr-only">
                                Fila {rowIndex + 1}, columna {columnIndex + 1}
                              </Label>
                              <Input
                                id={`cell-${rowIndex}-${column.id}`}
                                aria-label={`Fila ${rowIndex + 1}, columna ${columnIndex + 1} (${column.label})`}
                                value={row[column.id] ?? ""}
                                maxLength={200}
                                onChange={(event) =>
                                  update(
                                    updateCell(dataset, rowIndex, column.id, event.target.value),
                                  )
                                }
                              />
                            </TableCell>
                          ))}
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`Eliminar fila ${rowIndex + 1}`}
                              title="Eliminar fila"
                              onClick={() => update(removeRow(dataset, rowIndex))}
                            >
                              <Trash2 aria-hidden="true" className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>

                <p className="text-xs text-muted">
                  <Database aria-hidden="true" className="mr-1 inline h-3 w-3" />
                  Límites: {MAX_DATASET_COLUMNS} columnas, {MAX_DATASET_ROWS} filas, 200 caracteres
                  por celda y 100 KB por dataset.
                </p>
              </CardContent>
            </Card>
          </>
        ) : null}
      </main>

      <Dialog
        open={pendingColumn !== null}
        onOpenChange={(open) => {
          if (!open) setPendingColumn(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar columna «{pendingColumn?.label}»</DialogTitle>
            <DialogDescription>
              Se borrarán también los datos de esta columna en todas las filas. El cambio no se
              guarda hasta pulsar «Guardar datos».
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button variant="danger" onClick={confirmRemoveColumn}>
              <Trash2 aria-hidden="true" className="h-4 w-4" />
              Eliminar columna
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
