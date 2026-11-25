import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

/** Explica qué falta cuando la app arranca sin variables de Supabase. */
export function SupabaseSetupNotice() {
  return (
    <div className="mx-auto max-w-2xl p-density">
      <Alert variant="danger">
        <div className="space-y-2">
          <AlertTitle>Supabase no está configurado</AlertTitle>
          <AlertDescription>
            <p>
              Esta zona necesita autenticación y base de datos. Copia <code>.env.example</code> a{" "}
              <code>.env</code> y rellena:
            </p>
            <pre className="mt-2 overflow-x-auto rounded-md border bg-background p-2 text-xs">
              {`VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_clave_publica`}
            </pre>
            <p className="mt-2">
              Después ejecuta la migración <code>supabase/migrations/001_themes.sql</code> en el SQL
              Editor y reinicia el servidor.
            </p>
          </AlertDescription>
        </div>
      </Alert>
    </div>
  );
}
