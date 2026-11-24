# Registro de decisiones de arquitectura (ADR)

Formato: **Contexto → Opciones consideradas → Decisión → Consecuencias**.
Una entrada por decisión, en orden cronológico.

## ADR-001 · React 18 + Vite + TypeScript estricto como base

**Contexto.** El proyecto debe demostrar arquitectura de componentes y tipado real, no solo aparente, y a la vez ser desplegable en Vercel sin servidor propio.

**Opciones consideradas.**

1. Next.js (SSR + rutas + API incluidas).
2. Vite + React SPA.
3. Astro con islas.

**Decisión.** Vite + React 18 con TypeScript en modo `strict`. La aplicación es una herramienta con estado intensivo en el cliente; no necesita SSR ni SEO. Las funciones serverless puntuales (IA) se resuelven con una Vercel Function separada.

**Consecuencias.**

- Arranque y HMR muy rápidos; el bundle inicial es pequeño.
- Hay que resolver rutas y auth en cliente (`react-router-dom`) en lugar de heredarlos del framework.
- React 18 en lugar de 19 para máxima compatibilidad con Radix y Testing Library; actualizar es una tarea aislada.

## ADR-002 · Tailwind CSS 3 con tokens como variables CSS

**Contexto.** Los tokens del tema cambian en runtime y deben afectar a toda la interfaz sin recompilar CSS.

**Opciones consideradas.**

1. Tailwind 4 con `@theme` (CSS-first).
2. Tailwind 3 con `tailwind.config.ts`.
3. CSS-in-JS (styled-components / Emotion).

**Decisión.** Tailwind 3.4. Los valores del tema se publican como variables CSS (`--color-primary`, `--radius`, …) y `tailwind.config.ts` mapea clases a esas variables. Así una clase como `bg-primary` sigue funcionando aunque el valor cambie en caliente.

**Consecuencias.**

- Los componentes no contienen valores literales: todo degrada a variables.
- La exportación a "configuración de Tailwind" es natural porque el proyecto ya usa ese formato.
- Tailwind 4 (CSS-first) queda como mejora futura documentada: migrar requiere reemplazar el config por `@theme` y revisar la sintaxis de utilidades.
- Las container queries no son core en Tailwind 3: se usa el plugin oficial `@tailwindcss/container-queries` (dependencia de desarrollo, sin coste en el bundle).

## ADR-003 · Zustand para el estado del editor

**Contexto.** Muchos controles independientes escriben sobre un mismo tema; la vista previa y la galería deben suscribirse de forma granular.

**Opciones consideradas.**

1. Context + `useReducer`.
2. Redux Toolkit.
3. Zustand.

**Decisión.** Zustand con selectores por campo, middleware `persist` para el borrador local y un historial propio (máx. 50 estados) para undo/redo.

**Consecuencias.**

- Cero providers y renders mínimos: cada control se suscribe a su slice.
- El historial es explícito y probable; no dependemos de middleware temporal.
- Persistir solo el tema en curso, nunca tokens de sesión.
- Se agrupan los cambios de una misma propiedad dentro de una ventana de 600 ms; sin esa coalescencia, arrastrar un slider llenaría el historial y `Ctrl+Z` dejaría de ser útil.
- El borrador rehidratado se valida con Zod. Un JSON manipulado o de una versión anterior se ignora, con el coste asumido de perder ese borrador.
