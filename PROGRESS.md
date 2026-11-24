# Progreso

Bitácora honesta del proyecto. Al final de cada fase: fecha, qué se hizo, pruebas ejecutadas, problemas y siguientes pasos.

## Fase 0 — Inicialización (2026-11-24)

**Hecho**

- Proyecto Vite + React 18 + TypeScript `strict` (con `noUncheckedIndexedAccess`).
- Tailwind CSS 3.4 + PostCSS; tokens se definirán en la Fase 1.
- Alias `@/` en Vite y TypeScript.
- ESLint 9 (flat config, `typescript-eslint` type-checked, jsx-a11y, react-hooks) + Prettier.
- Husky + lint-staged + Commitlint (hooks `pre-commit` y `commit-msg`).
- Vitest + Testing Library + jsdom con prueba de humo.
- GitHub Actions: lint, formato, typecheck, tests y build en cada push/PR.
- Dockerfile multi-stage (build + nginx) con fallback de SPA.
- `.env.example`, `.gitignore`, README, CHANGELOG y documentos base.

**Pruebas**

- `npm run lint` — pasa.
- `npm run typecheck` — pasa.
- `npm test` — 1 archivo, 1 prueba, en verde.
- `npm run build` — pasa (bundle inicial ~143 kB).

**Problemas**

- El scaffold actual de Vite genera React 19 / TS 7 / oxlint; se reescribió la configuración para respetar el stack especificado (React 18, ESLint).
- Husky requiere `.git`; se inicializó el repositorio antes de instalar los hooks.

**Siguiente**

- Fase 1: tokens, tema por defecto, esquema Zod y galería de componentes.

## Fase 1 — Sistema de tokens (2026-11-24)

**Hecho**

- Modelo `Theme` en `src/types/theme.ts` y esquema Zod estricto en `src/lib/themeSchema.ts` (hex de 6 dígitos, rangos, lista blanca de fuentes, objetos estrictos).
- Temas por defecto claro y oscuro, validados al importar el módulo.
- `themeToCssVars` traduce un tema a variables CSS, incluidas las derivadas: contraste de botones, escala tipográfica, densidad y tamaño de control.
- `tailwind.config.ts` mapea colores, radios, bordes, tipografía y espaciado a las variables; ningún color literal en los componentes.
- Galería de muestra (`GalleryApp`) con botones en tres tamaños y seis variantes, inputs, select, checkbox, tarjetas, tabla, alerta, navegación, formulario y modal Radix.
- La galería se reorganiza con container queries: tabla → tarjetas y navegación lateral → menú desplegable.
- Pruebas de esquema, conversión de color, tokens y galería (render, envío de formulario, apertura y cierre del modal).

**Pruebas**

- `npm run lint` — pasa.
- `npm run typecheck` — pasa.
- `npm test` — 5 archivos, 18 pruebas, en verde.
- `npm run build` — pasa (CSS 20,1 kB; JS 292,5 kB).
- Revisión visual en navegador real: pendiente de repetir tras corregir el plugin de container queries.

**Problemas**

- Las container queries no son core en Tailwind 3.4: se añadió el plugin oficial `@tailwindcss/container-queries`. Sin él, `@container` no generaba `container-type` y la galería no se reorganizaba.
- jsdom no implementa `ResizeObserver` (lo usa Radix para el modal): se añadió un stub inocuo en `src/test/setup.ts`.
- El navegador se desconectó durante la comprobación visual; se verificó la presencia de `container-type` en el CSS compilado.

**Siguiente**

- Fase 2: store de Zustand, panel de controles, undo/redo y autoguardado local.
