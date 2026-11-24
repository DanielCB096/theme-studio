import { GalleryApp } from "@/features/preview/GalleryApp";

export default function App() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-surface px-6 py-4">
        <h1 className="text-lg font-semibold">Theme Studio</h1>
        <p className="text-sm text-muted">
          Galería de muestra gobernada por tokens. Cambia una variable CSS en DevTools y todo se
          repinta.
        </p>
      </header>

      <main className="p-4 md:p-8">
        {/*
          Sin estilos en línea: la galería usa los tokens de `:root` (index.css).
          Así se puede comprobar en DevTools que editar una variable repinta todo.
          La Fase 2 sustituirá esto por el editor + vista previa con tokens en runtime.
        */}
        <div className="mx-auto max-w-5xl overflow-hidden rounded-xl border bg-surface shadow-panel">
          <GalleryApp />
        </div>
      </main>
    </div>
  );
}
