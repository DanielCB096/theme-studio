import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Frame,
  Loader2,
  Plus,
  Save,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { SiteHeader } from "@/components/layout/SiteHeader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BLOCK_LIST,
  createPageBlock,
  renderBlockInspector,
} from "@/features/page-builder/blocks/registry";
import { LayoutInspector } from "@/features/page-builder/builder/LayoutInspector";
import { blocksInOrder } from "@/features/page-builder/pageOps";
import { PageRenderer } from "@/features/page-builder/PageRenderer";
import {
  getPageRecord,
  publicPageUrl,
  savePage,
  setPageVisibility,
} from "@/features/page-builder/pageRepository";
import { usePageBuilderStore } from "@/features/page-builder/pageBuilderStore";
import { createLandingDocument } from "@/features/page-builder/templates/landing";
import { DevicePreview } from "@/features/preview/DevicePreview";
import { cn } from "@/lib/utils";
import { useThemeStore } from "@/store/themeStore";

export default function PageBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useThemeStore((state) => state.theme);
  const themeRef = useRef(theme);
  themeRef.current = theme;

  const page = usePageBuilderStore((state) => state.page);
  const selectedId = usePageBuilderStore((state) => state.selectedId);
  const savedId = usePageBuilderStore((state) => state.savedId);
  const dirty = usePageBuilderStore((state) => state.dirty);
  const load = usePageBuilderStore((state) => state.load);
  const select = usePageBuilderStore((state) => state.select);
  const add = usePageBuilderStore((state) => state.add);
  const remove = usePageBuilderStore((state) => state.remove);
  const move = usePageBuilderStore((state) => state.move);
  const updateProps = usePageBuilderStore((state) => state.updateProps);
  const updateLayout = usePageBuilderStore((state) => state.updateLayout);
  const rename = usePageBuilderStore((state) => state.rename);
  const markSaved = usePageBuilderStore((state) => state.markSaved);
  const clear = usePageBuilderStore((state) => state.clear);

  const [loading, setLoading] = useState(Boolean(id));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [published, setPublished] = useState(false);
  const [slug, setSlug] = useState<string | null>(null);
  const [showBounds, setShowBounds] = useState(false);

  useEffect(() => {
    let active = true;
    setError(null);
    setStatus(null);

    if (!id) {
      clear();
      load(createLandingDocument(themeRef.current));
      setPublished(false);
      setSlug(null);
      setLoading(false);
      return () => {
        active = false;
      };
    }

    setLoading(true);
    getPageRecord(id)
      .then((record) => {
        if (!active) return;
        load(record.page, { id: record.id, slug: record.slug });
        setPublished(record.isPublic);
        setSlug(record.slug);
      })
      .catch((cause: unknown) => {
        if (active)
          setError(cause instanceof Error ? cause.message : "No se pudo cargar la página.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id, clear, load]);

  const persist = async (): Promise<{ id: string; slug: string } | null> => {
    if (!page) return null;
    setSaving(true);
    setError(null);
    setStatus(null);
    try {
      const saved = await savePage(page, savedId);
      markSaved(saved);
      setSlug(saved.slug);
      setStatus("Cambios guardados.");
      if (!id) navigate(`/builder/${saved.id}`, { replace: true });
      return saved;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo guardar la página.");
      return null;
    } finally {
      setSaving(false);
    }
  };

  const togglePublished = async () => {
    const saved = savedId ? { id: savedId, slug: slug ?? "" } : await persist();
    if (!saved) return;
    setSaving(true);
    try {
      await setPageVisibility(saved.id, !published);
      setPublished((current) => !current);
      if (slug) setStatus(published ? "Página despublicada." : "Página publicada.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo publicar.");
    } finally {
      setSaving(false);
    }
  };

  const selectedBlock = page && selectedId ? page.blocks[selectedId] : undefined;
  const hasNavbar = page ? blocksInOrder(page).some((block) => block.type === "navbar") : false;

  return (
    <div className="flex h-dvh flex-col bg-background">
      <SiteHeader />

      <div className="flex flex-wrap items-center gap-2 border-b bg-surface px-density py-2">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/pages">
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Páginas
          </Link>
        </Button>

        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Label htmlFor="page-name" className="sr-only">
            Nombre de la página
          </Label>
          <Input
            id="page-name"
            value={page?.name ?? ""}
            maxLength={80}
            onChange={(event) => rename(event.target.value)}
            className="max-w-xs"
          />
          {dirty ? <span className="text-xs text-muted">Sin guardar</span> : null}
        </div>

        <span aria-live="polite" className="text-xs text-success">
          {status}
        </span>

        {published && slug ? (
          <a
            href={publicPageUrl(slug)}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-primary underline underline-offset-4"
          >
            /p/{slug}
          </a>
        ) : null}

        <Button
          variant={showBounds ? "secondary" : "outline"}
          size="sm"
          onClick={() => setShowBounds((value) => !value)}
          aria-pressed={showBounds}
          title="Colorea cada bloque para ver sus límites"
        >
          <Frame aria-hidden="true" className="h-4 w-4" />
          Límites
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => void togglePublished()}
          disabled={saving || !page}
        >
          <UploadCloud aria-hidden="true" className="h-4 w-4" />
          {published ? "Despublicar" : "Publicar"}
        </Button>
        <Button size="sm" onClick={() => void persist()} disabled={saving || !page}>
          {saving ? (
            <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
          ) : (
            <Save aria-hidden="true" className="h-4 w-4" />
          )}
          Guardar
        </Button>
      </div>

      {error ? (
        <div className="p-density">
          <Alert variant="danger">
            <div className="space-y-1">
              <AlertTitle>No se pudo completar</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </div>
          </Alert>
        </div>
      ) : null}

      {loading ? (
        <div
          role="status"
          className="flex flex-1 items-center justify-center gap-2 text-sm text-muted"
        >
          <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
          Cargando página…
        </div>
      ) : page ? (
        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          <aside
            aria-label="Bloques y estructura"
            className="w-full shrink-0 space-y-density overflow-y-auto border-b bg-surface p-density lg:h-full lg:w-72 lg:border-b-0 lg:border-r"
          >
            <section aria-labelledby="palette-title" className="space-y-2">
              <h2
                id="palette-title"
                className="text-xs font-semibold uppercase tracking-wide text-muted"
              >
                Bloques
              </h2>
              <div className="grid grid-cols-2 gap-1">
                {BLOCK_LIST.map((definition) => (
                  <Button
                    key={definition.type}
                    variant="outline"
                    size="sm"
                    className="justify-start"
                    disabled={
                      page.rootIds.length >= 30 || (definition.type === "navbar" && hasNavbar)
                    }
                    onClick={() => add(createPageBlock(definition.type))}
                  >
                    <Plus aria-hidden="true" className="h-3 w-3" />
                    {definition.label}
                  </Button>
                ))}
              </div>
            </section>

            <section aria-labelledby="structure-title" className="space-y-2">
              <h2
                id="structure-title"
                className="text-xs font-semibold uppercase tracking-wide text-muted"
              >
                Estructura
              </h2>
              <ol className="space-y-1">
                {blocksInOrder(page).map((block, index) => (
                  <li key={block.id} className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => select(block.id)}
                      aria-pressed={selectedId === block.id}
                      className={cn(
                        "min-w-0 flex-1 truncate rounded-sm px-2 py-1 text-left text-xs",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                        selectedId === block.id
                          ? "bg-primary text-primary-contrast"
                          : "hover:bg-background",
                      )}
                    >
                      {index + 1}. {block.type}
                    </button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Subir ${block.type}`}
                      disabled={index === 0}
                      onClick={() => move(block.id, -1)}
                    >
                      <ChevronUp aria-hidden="true" className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Bajar ${block.type}`}
                      disabled={index === blocksInOrder(page).length - 1}
                      onClick={() => move(block.id, 1)}
                    >
                      <ChevronDown aria-hidden="true" className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Eliminar ${block.type}`}
                      onClick={() => remove(block.id)}
                    >
                      <Trash2 aria-hidden="true" className="h-3 w-3" />
                    </Button>
                  </li>
                ))}
              </ol>
            </section>
          </aside>

          <main
            aria-label="Lienzo"
            className="min-h-0 flex-1 overflow-auto bg-background p-2 md:p-4"
          >
            <DevicePreview>
              <PageRenderer
                page={page}
                selectedId={selectedId}
                onSelect={select}
                debug={showBounds}
              />
            </DevicePreview>
          </main>

          <aside
            aria-label="Propiedades del bloque"
            className="w-full shrink-0 space-y-2 overflow-y-auto border-t bg-surface p-density lg:h-full lg:w-80 lg:border-l lg:border-t-0"
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">
                Propiedades
              </h2>
              {selectedBlock ? <Badge variant="neutral">{selectedBlock.type}</Badge> : null}
            </div>
            {selectedBlock ? (
              <>
                <LayoutInspector
                  block={selectedBlock}
                  onChange={(layout) => updateLayout(selectedBlock.id, layout)}
                />
                {renderBlockInspector(selectedBlock, (props) =>
                  updateProps(selectedBlock.id, props),
                )}
              </>
            ) : (
              <p className="text-sm text-muted">
                Selecciona un bloque en la estructura o con su botón «Seleccionar».
              </p>
            )}
          </aside>
        </div>
      ) : null}
    </div>
  );
}
