import { ArrowLeft, Check, Download, Loader2, Mail, Pencil, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { SiteHeader } from "@/components/layout/SiteHeader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getPageRecord } from "@/features/page-builder/pageRepository";
import {
  deleteSubmission,
  listSubmissions,
  markSubmissionRead,
  submissionFieldColumns,
  submissionsToCsv,
  type PageSubmission,
} from "@/features/page-builder/submissionRepository";
import { downloadTextFile } from "@/lib/file";

const dateFormatter = new Intl.DateTimeFormat("es-ES", {
  dateStyle: "medium",
  timeStyle: "short",
});

interface PageInfo {
  name: string;
  slug: string;
}

export default function SubmissionsPage() {
  const { id } = useParams<{ id: string }>();
  const [pageInfo, setPageInfo] = useState<PageInfo | null>(null);
  const [items, setItems] = useState<PageSubmission[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<PageSubmission | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!id) {
      setError("Falta el identificador de la página.");
      setItems([]);
      return;
    }

    setError(null);
    try {
      const [record, submissions] = await Promise.all([getPageRecord(id), listSubmissions(id)]);
      setPageInfo({ name: record.page.name, slug: record.slug });
      setItems(submissions);
    } catch (cause) {
      setItems([]);
      setError(cause instanceof Error ? cause.message : "No se pudieron cargar las respuestas.");
    }
  }, [id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const toggleRead = async (item: PageSubmission) => {
    setBusyId(item.id);
    setError(null);
    try {
      const nextRead = item.readAt === null;
      await markSubmissionRead(item.id, nextRead);
      setItems((current) =>
        current
          ? current.map((row) =>
              row.id === item.id
                ? { ...row, readAt: nextRead ? new Date().toISOString() : null }
                : row,
            )
          : current,
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo actualizar la respuesta.");
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      await deleteSubmission(deleting.id);
      setItems((current) => (current ? current.filter((row) => row.id !== deleting.id) : current));
      setDeleting(null);
    } catch (cause) {
      setDeleteError(cause instanceof Error ? cause.message : "No se pudo eliminar la respuesta.");
    } finally {
      setDeleteBusy(false);
    }
  };

  const downloadCsv = () => {
    if (!items || !pageInfo) return;
    downloadTextFile(`${pageInfo.slug}-respuestas.csv`, submissionsToCsv(items), "text/csv");
  };

  const fields = items ? submissionFieldColumns(items) : [];
  const unread = items?.filter((item) => item.readAt === null).length ?? 0;

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
              Respuestas{pageInfo ? ` de «${pageInfo.name}»` : ""}
            </h2>
            <p className="text-sm text-muted">
              {items === null
                ? "Cargando respuestas del formulario…"
                : `${items.length} respuesta(s) · ${unread} sin leer`}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {id ? (
              <Button variant="outline" size="sm" asChild>
                <Link to={`/builder/${id}`}>
                  <Pencil aria-hidden="true" className="h-4 w-4" />
                  Editar página
                </Link>
              </Button>
            ) : null}
            <Button
              size="sm"
              onClick={downloadCsv}
              disabled={!items || items.length === 0 || !pageInfo}
            >
              <Download aria-hidden="true" className="h-4 w-4" />
              Descargar CSV
            </Button>
          </div>
        </div>

        {error ? (
          <Alert variant="danger">
            <div className="space-y-1">
              <AlertTitle>No se pudieron cargar las respuestas</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </div>
          </Alert>
        ) : null}

        {items === null ? (
          <div role="status" className="flex items-center gap-2 p-6 text-sm text-muted">
            <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
            Cargando respuestas…
          </div>
        ) : items.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Todavía no hay respuestas</CardTitle>
              <CardDescription>
                Publica la página y comparte su enlace. Cada envío del formulario aparecerá aquí.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted">
                Los formularios solo guardan datos cuando la página está publicada.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    {fields.map((field) => (
                      <TableHead key={field}>{field}</TableHead>
                    ))}
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="whitespace-nowrap text-muted">
                        <time dateTime={item.createdAt}>
                          {dateFormatter.format(new Date(item.createdAt))}
                        </time>
                      </TableCell>
                      {fields.map((field) => (
                        <TableCell key={field} className="max-w-xs whitespace-pre-wrap break-words">
                          {item.data[field] || "—"}
                        </TableCell>
                      ))}
                      <TableCell>
                        {item.readAt === null ? (
                          <Badge variant="success">Nueva</Badge>
                        ) : (
                          <Badge variant="neutral">Leída</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={
                              item.readAt === null
                                ? "Marcar respuesta como leída"
                                : "Marcar respuesta como no leída"
                            }
                            title={
                              item.readAt === null ? "Marcar como leída" : "Marcar como no leída"
                            }
                            disabled={busyId === item.id}
                            onClick={() => void toggleRead(item)}
                          >
                            {item.readAt === null ? (
                              <Check aria-hidden="true" className="h-4 w-4" />
                            ) : (
                              <Mail aria-hidden="true" className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Eliminar respuesta"
                            onClick={() => {
                              setDeleteError(null);
                              setDeleting(item);
                            }}
                          >
                            <Trash2 aria-hidden="true" className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </main>

      <Dialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar respuesta</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. La respuesta se borrará de la bandeja y del CSV.
            </DialogDescription>
          </DialogHeader>
          {deleteError ? (
            <Alert variant="danger">
              <AlertDescription>{deleteError}</AlertDescription>
            </Alert>
          ) : null}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button variant="danger" onClick={() => void confirmDelete()} disabled={deleteBusy}>
              {deleteBusy ? (
                <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 aria-hidden="true" className="h-4 w-4" />
              )}
              {deleteBusy ? "Eliminando…" : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
