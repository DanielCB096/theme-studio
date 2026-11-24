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

## ADR-003 · Estado del editor con Zustand

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

## ADR-004 · Container queries en lugar de iframe para la vista previa

**Contexto.** La vista previa debe mostrar la misma galería a 375, 768 y 1280 px y reorganizarse de verdad (no escalarse). Hay que decidir cómo aislar el layout de la vista previa del layout del editor.

**Opciones consideradas.**

1. **`<iframe>`** con la galería dentro.
2. **Shadow DOM** con estilos encapsulados.
3. **Container queries** sobre un contenedor de ancho fijo.

**Decisión.** Container queries (`@container` + variantes `@sm/@md/@xl/@2xl`), con el plugin oficial `@tailwindcss/container-queries` para Tailwind 3. El marco fija el ancho del dispositivo y la galería responde a ese ancho; si no cabe en pantalla, se escala visualmente con `transform: scale()` sin alterar el layout interno.

**Consecuencias.**

- Los tokens son variables CSS heredadas: no hay que inyectar CSS ni sincronizar nada entre documentos. En un iframe habría que copiar variables y escuchar cambios por `postMessage`.
- El árbol de accesibilidad es único: lectores de pantalla y pruebas pueden inspeccionar la galería directamente.
- Menos complejidad: sin `onload`, sin recarga del iframe al cambiar el tema y sin parpadeo.
- A cambio, el CSS del editor podría filtrarse a la galería (lo controlamos: no hay estilos globales agresivos) y las media queries de viewport dentro de la galería seguirían refiriéndose al navegador real; por eso la galería usa **solo** container queries.
- El aislamiento real de terceros o de estilos hostiles requeriría un iframe; no es el caso de una galería propia.

## ADR-005 · Historial propio con ventana de agrupación

**Contexto.** El editor necesita undo/redo predecible y acotado.

**Opciones consideradas.**

1. Middleware `temporal` de Zustand (zundo).
2. Historial propio dentro del store.
3. Historial por comandos (patrón command).

**Decisión.** Historial propio: `past`/`future` en el store, límite de 50, agrupación de cambios de la misma propiedad dentro de 600 ms. Sin dependencia extra.

**Consecuencias.**

- Control total del tamaño y de la semántica de "un paso".
- Arrastrar un slider genera un solo paso; escribir un hex completo, uno.
- Los cambios de propiedad distinta nunca se agrupan, así el deshacer es comprensible.
- Reimplementar `zundo` no aporta valor aquí; el store es pequeño y probado.

## ADR-006 · Escalado visual del marco, no zoom del contenido

**Contexto.** El escritorio mide 1280 px y la zona de vista previa suele ser menor.

**Opciones consideradas.**

1. Scroll horizontal a tamaño real.
2. `zoom`/`transform: scale()` del marco.
3. Reducir el ancho del dispositivo.

**Decisión.** Escalar el marco con `transform: scale()`, calculado con `ResizeObserver`. El ancho real pasado a la galería sigue siendo el del dispositivo, de modo que las container queries calculan el layout correcto.

**Consecuencias.**

- Se ve el diseño completo sin scroll horizontal y el layout no se falsea.
- El texto se reduce (con un mínimo de escala del 15 %); el rótulo indica el porcentaje.
- En el modo "todas", cada marco se escala de forma independiente, lo que permite comparar los tres anchos a la vez.

## ADR-007 · Playwright contra el servidor de desarrollo

**Contexto.** Las container queries y el reflujo no se pueden verificar en jsdom: no calcula estilos.

**Opciones consideradas.**

1. Confiar solo en pruebas unitarias de anchos de marco.
2. Playwright contra `vite preview` (requiere build).
3. Playwright contra `vite dev`.

**Decisión.** Playwright arranca `vite dev` en `127.0.0.1:4173` (puerto fijo, `--strictPort`). El build de producción se valida por separado en CI.

**Consecuencias.**

- Las pruebas E2E comprueban CSS real: tabla oculta y menú visible a 375 px.
- Se evita pagar un build en cada ejecución local.
- CI instalará Chromium y ejecutará las mismas pruebas.
