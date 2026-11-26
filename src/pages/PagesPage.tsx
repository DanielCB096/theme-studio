import {
  Copy,
  Database,
  Eye,
  EyeOff,
  FilePlus2,
  Inbox,
  Loader2,
  Pencil,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { SiteHeader } from "@/components/layout/SiteHeader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  deletePage,
  listPages,
  publicPageUrl,
  setPageVisibility,
  type SavedPageSummary,
} from "@/features/page-builder/pageRepository";
import { copyText } from "@/lib/file";

export default function PagesPage() {
  const [items, setItems] = useState<SavedPageSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const navigate = useNavigate();

  const refresh = useCallback(async () => {
    setError(null);
    try {
      setItems(await listPages());
    } catch (cause) {
      setItems([]);
      setError(cause instanceof Error ? cause.message : "No se pudieron cargar las páginas.");
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const togglePublic = async (item: SavedPageSummary) => {
    setBusyId(item.id);
    setError(null);
    try {
      await setPageVisibility(item.id, !item.isPublic);
      if (!item.isPublic) {
        const copied = await copyText(publicPageUrl(item.slug));
        setCopiedId(copied ? item.id : null);
      } else {
        setCopiedId(null);
      }
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo cambiar la visibilidad.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="min-h-dvh bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl space-y-density p-density">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-xl font-semibold leading-tight">Mis páginas</h2>
            <p className="text-sm text-muted">
              Páginas creadas con el constructor. Publica para compartirlas en <code>/p/:slug</code>
              .
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/">Editor de temas</Link>
            </Button>
            <Button size="sm" onClick={() => navigate("/builder")}>
              <FilePlus2 aria-hidden="true" className="h-4 w-4" />
              Nueva página
            </Button>
          </div>
        </div>

        {error ? (
          <Alert variant="danger">
            <div className="space-y-1">
              <AlertTitle>No se pudieron cargar las páginas</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </div>
          </Alert>
        ) : null}

        {items === null ? (
          <div role="status" className="flex items-center gap-2 p-6 text-sm text-muted">
            <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
            Cargando páginas…
          </div>
        ) : items.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Tu primera página empieza con una plantilla</CardTitle>
              <CardDescription>
                Crea una landing con secciones ya maquetadas, edítala y publícala.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button onClick={() => navigate("/builder")}>Crear landing</Button>
            </CardFooter>
          </Card>
        ) : (
          <ul className="grid grid-cols-1 gap-density md:grid-cols-2">
            {items.map((item) => (
              <li key={item.id}>
                <Card className="flex h-full flex-col">
                  <CardHeader>
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle className="mr-auto">{item.name}</CardTitle>
                      {item.isPublic ? <Badge variant="success">Pública</Badge> : null}
                      {!item.isValid ? <Badge variant="danger">Dañada</Badge> : null}
                    </div>
                    <CardDescription>
                      /p/{item.slug} · actualizada el{" "}
                      {new Intl.DateTimeFormat("es-ES", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(item.updatedAt))}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="flex-1">
                    {item.isPublic ? (
                      <Link
                        to={`/p/${item.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-sm text-xs text-primary underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        {publicPageUrl(item.slug)}
                      </Link>
                    ) : null}
                  </CardContent>

                  <CardFooter className="flex flex-wrap gap-2">
                    <Button size="sm" asChild>
                      <Link to={`/builder/${item.id}`}>
                        <Pencil aria-hidden="true" className="h-4 w-4" />
                        Editar
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/pages/${item.id}/datos`}>
                        <Database aria-hidden="true" className="h-4 w-4" />
                        Datos
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/pages/${item.id}/respuestas`}>
                        <Inbox aria-hidden="true" className="h-4 w-4" />
                        Respuestas
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void togglePublic(item)}
                      disabled={busyId === item.id}
                    >
                      {item.isPublic ? (
                        <EyeOff aria-hidden="true" className="h-4 w-4" />
                      ) : (
                        <Eye aria-hidden="true" className="h-4 w-4" />
                      )}
                      {item.isPublic ? "Despublicar" : "Publicar"}
                    </Button>
                    {item.isPublic ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          void copyText(publicPageUrl(item.slug)).then((ok) =>
                            setCopiedId(ok ? item.id : null),
                          );
                        }}
                      >
                        <Copy aria-hidden="true" className="h-4 w-4" />
                        Copiar enlace
                      </Button>
                    ) : null}
                    {copiedId === item.id ? (
                      <span role="status" className="self-center text-xs text-success">
                        Enlace copiado
                      </span>
                    ) : null}
                    <div className="ml-auto">
                      <DeletePageDialog item={item} onDeleted={() => void refresh()} />
                    </div>
                  </CardFooter>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

function DeletePageDialog({ item, onDeleted }: { item: SavedPageSummary; onDeleted: () => void }) {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      await deletePage(item.id);
      setOpen(false);
      onDeleted();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo eliminar la página.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Eliminar ${item.name}`}>
          <Trash2 aria-hidden="true" className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Eliminar «{item.name}»</DialogTitle>
          <DialogDescription>
            Esta acción no se puede deshacer. Si la página está publicada, el enlace dejará de
            funcionar.
          </DialogDescription>
        </DialogHeader>
        {error ? (
          <Alert variant="danger">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button variant="danger" onClick={() => void handleDelete()} disabled={deleting}>
            {deleting ? "Eliminando…" : "Eliminar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
