import { Save } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
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
import { useAuthStore } from "@/features/auth/authStore";
import { saveTheme } from "@/features/themes/themeRepository";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useThemeStore } from "@/store/themeStore";

export function SaveThemeDialog() {
  const theme = useThemeStore((state) => state.theme);
  const setThemeId = useThemeStore((state) => state.setThemeId);
  const status = useAuthStore((state) => state.status);

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setError(null);
      setSaved(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const stored = await saveTheme(theme);
      setThemeId(stored.id);
      setSaved(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo guardar el tema.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Save aria-hidden="true" className="h-4 w-4" />
          Guardar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Guardar tema</DialogTitle>
          <DialogDescription>
            Se guarda en tu cuenta como «{theme.name}». Podrás abrirlo desde Mis temas.
          </DialogDescription>
        </DialogHeader>

        {!isSupabaseConfigured ? (
          <Alert variant="danger">
            <div className="space-y-1">
              <AlertTitle>Supabase no está configurado</AlertTitle>
              <AlertDescription>
                Añade <code>VITE_SUPABASE_URL</code> y <code>VITE_SUPABASE_ANON_KEY</code> en{" "}
                <code>.env</code> y reinicia el servidor.
              </AlertDescription>
            </div>
          </Alert>
        ) : null}

        {isSupabaseConfigured && status === "anonymous" ? (
          <Alert>
            <div className="space-y-2">
              <AlertTitle>Necesitas una sesión</AlertTitle>
              <AlertDescription>
                <Link to="/entrar?redirect=/" className="text-primary underline">
                  Entra con tu correo
                </Link>{" "}
                para guardar temas en tu cuenta. El borrador local no se pierde.
              </AlertDescription>
            </div>
          </Alert>
        ) : null}

        {error ? (
          <Alert variant="danger">
            <div className="space-y-1">
              <AlertTitle>No se pudo guardar</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </div>
          </Alert>
        ) : null}

        {saved ? (
          <Alert variant="success">
            <div className="space-y-1">
              <AlertTitle>Tema guardado</AlertTitle>
              <AlertDescription>Ya está disponible en Mis temas.</AlertDescription>
            </div>
          </Alert>
        ) : null}

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">{saved ? "Cerrar" : "Cancelar"}</Button>
          </DialogClose>
          {status === "authenticated" && !saved ? (
            <Button onClick={() => void handleSave()} disabled={saving}>
              <Save aria-hidden="true" className="h-4 w-4" />
              {saving ? "Guardando…" : "Guardar tema"}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
