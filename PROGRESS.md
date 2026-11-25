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

## Fase 2 — Panel de controles y estado (2026-11-24)

**Hecho**

- Store de Zustand con acciones tipadas para colores, tipografía, forma, espaciado, densidad, tamaño de botón, nombre y modo.
- Historial acotado a 50 estados con agrupación de cambios rápidos (600 ms) y deshacer/rehacer; los atajos `Ctrl/Cmd+Z` y `Ctrl/Cmd+Shift+Z` ignoran los campos de texto para no romper el deshacer nativo.
- Autoguardado en localStorage con validación Zod al rehidratar.
- Panel de controles: paleta nativa + hex por color, sliders, select de fuente, densidad y tamaño de botón, alternador claro/oscuro.
- Vista previa suscrita solo al tema, con actualización en vivo de las variables CSS.
- Pruebas del store (acciones, límites, mezcla, undo/redo, persistencia, borrador inválido) y de la interfaz (slider, color, selects, atajos, renombrado).

**Pruebas**

- `npm run lint` — pasa.
- `npm run typecheck` — pasa.
- `npm test` — 8 archivos, 44 pruebas, en verde.
- Comprobación visual en navegador: pendiente; el navegador del entorno sigue desconectado.

**Problemas**

- Radix Slider requiere `setPointerCapture`, que jsdom no implementa: se añadieron stubs en `src/test/setup.ts`.
- Pasar `storage: undefined` a `persist` hacía que el middleware no resolviera localStorage: ahora la opción solo se incluye cuando se inyecta un storage explícito (pruebas).
- El cambio de modo aplica los neutros por defecto del modo y conserva las marcas de color. La derivación completa (5.3) queda pendiente.

**Siguiente**

- Fase 3: vista previa multidispositivo con marcos, rotación y modo "todas a la vez".

## Fase 3 — Vista previa multidispositivo (2026-11-24)

**Hecho**

- `DevicePreview` con modos móvil (375), tableta (768), escritorio (1280), ancho libre (320–1440) y "todas a la vez".
- Marcos con rótulo, dimensiones y porcentaje de escala; rotación vertical/horizontal en móvil y tableta.
- Escalado con `ResizeObserver` + `transform: scale()`: el contenido mantiene el ancho real del dispositivo.
- Verificación real en navegador: a 1280 px aparecen barra lateral y tabla; a 358 px de contenedor, la barra lateral y la tabla están en `display: none`, el menú desplegable y la lista de tarjetas visibles.
- Playwright configurado con arranque automático de Vite en `127.0.0.1:4173` y dos pruebas E2E (reflujo por ancho y persistencia tras recarga).

**Pruebas**

- `npm run lint`, `npm run typecheck` — pasan.
- `npm test` — 9 archivos, 50 pruebas, en verde.
- `npx playwright test` — 2 pruebas en verde (chromium headless).
- `npm run build` — pasa.

**Problemas**

- El servidor de desarrollo no aplicó el plugin de container queries hasta reiniciarlo: Vite recarga el CSS al cambiar `tailwind.config.ts`, pero la incorporación de un plugin exige arranque limpio. Se documentó en el ADR-004.
- Playwright no detectaba el servidor porque Vite escuchaba en `::1` y la comprobación iba a `127.0.0.1`; se fijó `--host 127.0.0.1`.
- Las pruebas de la app completa son lentas en jsdom (renderiza toda la galería); se mitigó con un mock de `GalleryApp` en las pruebas de `DevicePreview`. Optimizar el resto queda para la Fase 6.

**Siguiente**

- Fase 4: Supabase (auth, RLS, CRUD), exportación/importación y enlaces compartidos. Requiere credenciales del proyecto Supabase.

## Fase 4 — Persistencia, autenticación y compartición (2026-11-25)

**Hecho**

- Migración `supabase/migrations/001_themes.sql`: tabla, índices, trigger de `updated_at`, permisos explícitos para `anon`/`authenticated` y RLS con `with check`.
- Cliente Supabase validado con Zod; la app funciona en modo local si faltan claves y explica cómo configurarlas.
- Autenticación con enlace mágico y con correo + contraseña (registro y acceso). `AuthSync` mantiene la sesión; rutas protegidas y `safeRedirect` contra open redirects.
- CRUD: guardar (actualiza la fila propia o inserta copia si el id no es suyo), listar, abrir, duplicar, renombrar (nombre del tema) y eliminar con confirmación.
- Compartir: `is_public`, URL `/t/:id` visible en «Mis temas», página de solo lectura y duplicado a la cuenta propia.
- Exportación JSON/CSS/Tailwind e importación validada.
- Verificación real de RLS con dos usuarios: **9/9 comprobaciones** (privado invisible, público visible, sin update/delete/insert cruzados).
- E2E: registro → guardado → recarga y enlace compartido anónimo → duplicado pedido con sesión.

**Pruebas**

- `npm run lint`, `npm run typecheck` — pasan.
- `npm test` — 17 archivos, 87 pruebas.
- `npx playwright test` — 4 pruebas (preview ×2, auth, share).
- `npm run verify:rls` — 9/9.
- `npm run build` — pasa (aviso de chunk > 500 kB por el SDK de Supabase; se abordará en la Fase 6).

**Problemas**

- Vitest cargaba el `.env` real y las pruebas pasaban a depender de Supabase: se fijaron `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` a vacío en `test.env`.
- Tras el registro, la app redirige a `/temas` (destino por defecto), no a `/`; se ajustó el E2E.
- El diálogo tenía dos botones «Cerrar» (pie y aspa), lo que rompía el modo estricto de Playwright; se seleccionó el primero.
- El enlace compartido solo se copiaba al portapapeles; si fallaba, el usuario no podía obtenerlo. Ahora se muestra la URL y hay botón «Copiar enlace».
- «Confirm email» está desactivado en el proyecto para permitir E2E con usuarios nuevos. Documentado en ADR-010 con la recomendación de reactivarlo para uso real.
- Los usuarios de prueba (`theme-studio-*@example.com`) quedan en `auth.users`; se pueden borrar desde el dashboard.

**Siguiente**

- Fase 5: verificador de contraste WCAG y generador de paletas con IA (requiere clave de Anthropic solo en servidor).
