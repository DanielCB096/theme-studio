import { Copy, CopyPlus, FolderOpen, Link2, Loader2, RefreshCw, Trash2 } from "lucide-react";
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
  deleteTheme,
  duplicateTheme,
  getTheme,
  listThemes,
  setThemeVisibility,
  shareUrl,
  type SavedThemeSummary,
} from "@/features/themes/themeRepository";
import { copyText } from "@/lib/file";
import { useThemeStore } from "@/store/themeStore";

const dateFormatter = new Intl.DateTimeFormat("es-ES", { dateStyle: "medium", timeStyle: "short" });

export default function ThemesPage() {
  const [items, setItems] = useState<SavedThemeSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const loadTheme = useThemeStore((state) => state.loadTheme);
  const navigate = useNavigate();

  const refresh = useCallback(async () => {
    setError(null);
    try {
      setItems(await listThemes());
    } catch (cause) {
      setItems([]);
      setError(cause instanceof Error ? cause.message : "No se pudieron cargar los temas.");
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const run = async (id: string, action: () => Promise<void>) => {
    setBusyId(id);
    setError(null);
    try {
      await action();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "La operación falló.");
    } finally {
      setBusyId(null);
    }
  };

  const handleOpen = (id: string) =>
    run(id, async () => {
      const theme = await getTheme(id);
      loadTheme(theme);
      navigate("/");
    });

  const handleDuplicate = (id: string) =>
    run(id, async () => {
      await duplicateTheme(id);
      setItems(await listThemes());
      setCopiedId(null);
    });

  const handleShare = (item: SavedThemeSummary) =>
    run(item.id, async () => {
      await setThemeVisibility(item.id, !item.isPublic);
      if (!item.isPublic) {
        const copied = await copyText(shareUrl(item.id));
        setCopiedId(copied ? item.id : null);
      } else {
        setCopiedId(null);
      }
      setItems(await listThemes());
    });

  const handleDeleted = (id: string) => {
    setItems((current) => current?.filter((item) => item.id !== id) ?? null);
    if (copiedId === id) setCopiedId(null);
  };

  return (
    <div className="min-h-dvh bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl space-y-density p-density">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-xl font-semibold leading-tight">Mis temas</h2>
            <p className="text-sm text-muted">
              Tus temas guardados, solo visibles para ti salvo que los compartas.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => void refresh()}>
              <RefreshCw aria-hidden="true" className="h-4 w-4" />
              Actualizar
            </Button>
            <Button size="sm" asChild>
              <Link to="/">Volver al editor</Link>
            </Button>
          </div>
        </div>

        {error ? (
          <Alert variant="danger">
            <div className="space-y-1">
              <AlertTitle>No se pudieron cargar los temas</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </div>
          </Alert>
        ) : null}

        {items === null ? (
          <div role="status" className="flex items-center gap-2 p-6 text-sm text-muted">
            <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
            Cargando temas…
          </div>
        ) : items.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Todavía no hay temas</CardTitle>
              <CardDescription>
                Diseña uno en el editor y pulsa Guardar. Aparecerá aquí automáticamente.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Link
                to="/"
                className="text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                Ir al editor
              </Link>
            </CardFooter>
          </Card>
        ) : (
          <ul className="grid grid-cols-1 gap-density md:grid-cols-2">
            {items.map((item) => {
              const busy = busyId === item.id;
              return (
                <li key={item.id}>
                  <Card className="flex h-full flex-col">
                    <CardHeader>
                      <div className="flex flex-wrap items-center gap-2">
                        <CardTitle className="mr-auto">{item.name}</CardTitle>
                        <Badge variant={item.mode === "dark" ? "primary" : "neutral"}>
                          {item.mode === "dark" ? "Oscuro" : "Claro"}
                        </Badge>
                        {item.isPublic ? <Badge variant="success">Público</Badge> : null}
                      </div>
                      <CardDescription>
                        Actualizado el {dateFormatter.format(new Date(item.updatedAt))}
                      </CardDescription>
                      {!item.isValid ? (
                        <p className="text-xs text-danger">
                          Los datos guardados no pasan la validación; ábrelo para revisarlo.
                        </p>
                      ) : null}
                    </CardHeader>

                    <CardContent className="flex-1" />

                    <CardFooter className="flex flex-wrap gap-2">
                      <Button size="sm" onClick={() => void handleOpen(item.id)} disabled={busy}>
                        <FolderOpen aria-hidden="true" className="h-4 w-4" />
                        Abrir
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => void handleDuplicate(item.id)}
                        disabled={busy}
                      >
                        <CopyPlus aria-hidden="true" className="h-4 w-4" />
                        Duplicar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => void handleShare(item)}
                        disabled={busy}
                      >
                        {item.isPublic ? (
                          <Link2 aria-hidden="true" className="h-4 w-4" />
                        ) : (
                          <Copy aria-hidden="true" className="h-4 w-4" />
                        )}
                        {item.isPublic ? "Dejar de compartir" : "Compartir"}
                      </Button>
                      {copiedId === item.id ? (
                        <span role="status" className="self-center text-xs text-success">
                          Enlace copiado
                        </span>
                      ) : null}
                      <div className="ml-auto">
                        <DeleteThemeDialog item={item} onDeleted={handleDeleted} />
                      </div>
                    </CardFooter>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}

function DeleteThemeDialog({
  item,
  onDeleted,
}: {
  item: SavedThemeSummary;
  onDeleted: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      await deleteTheme(item.id);
      onDeleted(item.id);
      setOpen(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo eliminar.");
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
            Esta acción no se puede deshacer. Si el tema está compartido, el enlace dejará de
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
