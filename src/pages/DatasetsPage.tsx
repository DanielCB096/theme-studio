import { ArrowLeft, Database, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { SiteHeader } from "@/components/layout/SiteHeader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  createPageDataset,
  deletePageDataset,
  listPageDatasets,
} from "@/features/page-builder/datasetRepository";
import { getPageRecord, publicPageUrl } from "@/features/page-builder/pageRepository";
import { MAX_DATASETS_PER_PAGE } from "@/lib/datasetSchema";
import type { PageDatasetRecord } from "@/types/dataset";

interface PageInfo {
  name: string;
  slug: string;
  isPublic: boolean;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function DatasetsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [pageInfo, setPageInfo] = useState<PageInfo | null>(null);
  const [datasets, setDatasets] = useState<PageDatasetRecord[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<PageDatasetRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  const refresh = useCallback(async () => {
    if (!id) {
      setError("Falta el identificador de la página.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [record, list] = await Promise.all([getPageRecord(id), listPageDatasets(id)]);
      setPageInfo({ name: record.page.name, slug: record.slug, isPublic: record.isPublic });
      setDatasets(list);
    } catch (cause) {
      setDatasets(null);
      setError(cause instanceof Error ? cause.message : "No se pudieron cargar los datasets.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const create = async () => {
    if (!id || !datasets) return;
    setCreating(true);
    setActionError(null);
    try {
      const record = await createPageDataset(id, `Datos ${datasets.length + 1}`);
      navigate(`/pages/${id}/datos/${record.id}`);
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : "No se pudo crear el dataset.");
    } finally {
      setCreating(false);
    }
  };

  const remove = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    setActionError(null);
    try {
      await deletePageDataset(pendingDelete.id);
      setPendingDelete(null);
      await refresh();
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : "No se pudo eliminar el dataset.");
    } finally {
      setDeleting(false);
    }
  };

  const atLimit = (datasets?.length ?? 0) >= MAX_DATASETS_PER_PAGE;

  return (
    <div className="min-h-dvh bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl space-y-density p-density">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div className="min-w-0">
            <Button variant="ghost" size="sm" asChild className="-ml-2 mb-1">
              <Link to="/pages">
                <ArrowLeft aria-hidden="true" className="h-4 w-4" />
                Páginas
              </Link>
            </Button>
            <h2 className="truncate text-xl font-semibold leading-tight">
              Datasets{pageInfo ? ` de «${pageInfo.name}»` : ""}
            </h2>
            <p className="text-sm text-muted">
              Cada bloque Tabla puede leer un dataset distinto de esta página.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {id ? (
              <Button variant="outline" size="sm" asChild>
                <Link to={`/builder/${id}`}>Editar página</Link>
              </Button>
            ) : null}
            <Button
              size="sm"
              onClick={() => void create()}
              disabled={creating || !datasets || atLimit}
            >
              {creating ? (
                <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
              ) : (
                <Plus aria-hidden="true" className="h-4 w-4" />
              )}
              Nuevo dataset
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
              <AlertTitle>No se pudieron cargar los datasets</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </div>
          </Alert>
        ) : null}

        {actionError ? (
          <Alert variant="danger">
            <div className="space-y-1">
              <AlertTitle>No se pudo completar</AlertTitle>
              <AlertDescription>{actionError}</AlertDescription>
            </div>
          </Alert>
        ) : null}

        {loading ? (
          <div role="status" className="flex items-center gap-2 p-6 text-sm text-muted">
            <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
            Cargando datasets…
          </div>
        ) : datasets ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted">
              <p>
                {datasets.length} de {MAX_DATASETS_PER_PAGE} datasets · máximo 8 columnas y 200
                filas por dataset.
              </p>
              {atLimit ? <p>Has alcanzado el máximo de datasets de esta página.</p> : null}
            </div>

            {datasets.length === 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Todavía no hay datasets</CardTitle>
                  <CardDescription>
                    Crea el primero para que una tabla conectada muestre columnas y filas. Puedes
                    importar un CSV después.
                  </CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button onClick={() => void create()} disabled={creating}>
                    <Database aria-hidden="true" className="h-4 w-4" />
                    Crear el primero
                  </Button>
                </CardFooter>
              </Card>
            ) : (
              <ul className="grid grid-cols-1 gap-density md:grid-cols-2">
                {datasets.map((record) => (
                  <li key={record.id}>
                    <Card className="flex h-full flex-col">
                      <CardHeader>
                        <CardTitle>{record.name}</CardTitle>
                        <CardDescription>
                          {record.dataset.columns.length}{" "}
                          {record.dataset.columns.length === 1 ? "columna" : "columnas"} ·{" "}
                          {record.dataset.rows.length}{" "}
                          {record.dataset.rows.length === 1 ? "fila" : "filas"} · actualizado el{" "}
                          {formatDate(record.updatedAt)}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex-1">
                        <p className="text-xs text-muted">
                          {record.dataset.rows.length === 0
                            ? "Sin filas todavía."
                            : record.dataset.rows
                                .slice(0, 2)
                                .map((row) =>
                                  record.dataset.columns
                                    .map((column) => row[column.id] ?? "")
                                    .join(" · "),
                                )
                                .join(" / ")}
                        </p>
                      </CardContent>
                      <CardFooter className="flex flex-wrap gap-2">
                        <Button size="sm" asChild>
                          <Link to={`/pages/${id}/datos/${record.id}`}>
                            <Pencil aria-hidden="true" className="h-4 w-4" />
                            Editar
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-auto"
                          aria-label={`Eliminar ${record.name}`}
                          onClick={() => setPendingDelete(record)}
                        >
                          <Trash2 aria-hidden="true" className="h-4 w-4" />
                          Eliminar
                        </Button>
                      </CardFooter>
                    </Card>
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : null}
      </main>

      <Dialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar dataset «{pendingDelete?.name}»</DialogTitle>
            <DialogDescription>
              Se borrarán sus columnas y filas. Las tablas que usen este dataset dejarán de mostrar
              datos. Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button variant="danger" onClick={() => void remove()} disabled={deleting}>
              {deleting ? (
                <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 aria-hidden="true" className="h-4 w-4" />
              )}
              Eliminar dataset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
