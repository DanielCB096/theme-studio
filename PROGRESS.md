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

## Fase 5 — Accesibilidad, IA y variante de modo (2026-11-25)

**Hecho**

- `contrast.ts`: razón WCAG 2.1, clasificación AAA/AA/texto grande/fallo y ajuste de luminosidad conservando tono; imposible → extremo de mayor contraste.
- Panel de accesibilidad en vivo con cinco pares, semáforo, razón y botón «Corregir a AA». El texto del botón primario se marca como derivado.
- Variante de modo automática (`deriveVariant`): neutros reconstruidos con el tono del fondo, marcas conservadas y contraste garantizado (7:1 texto, 4.5:1 marcas).
- Función `api/generate-palette`: Zod, rate limit por IP, timeout, extracción de JSON, validación de colores y errores controlados. Proveedor **Gemini free tier** con clave solo en servidor (decisión ADR-011).
- Cliente `aiPalette.ts` con timeout, validación doble y mensajes de error específicos (404 en `vite dev`, 429, red, timeout).
- Panel de IA con prompt, swatches, aviso de correcciones y «Aplicar»/«Descartar»; el cambio entra en el historial.
- `vercel.json` con rewrites de SPA excluyendo `/api`.

**Pruebas**

- `npm test` — 23 archivos, 125 pruebas (contraste, paleta, panel, variante, cliente de IA y handler con `fetch` simulado).
- `npm run lint`, `npm run typecheck`, `npm run build` — pasan.
- `npm run test:e2e` — 4 pruebas.
- Llamada real a Gemini: **verificada** con `npm run smoke:ai` (HTTP 200 en ~1,5 s). `gemini-3.5-flash-lite` elegido tras descartar alias saturados y modelos retirados.

**Problemas**

- Cambio de proveedor respecto a la spec: sin clave de Anthropic, se usa el nivel gratuito de Gemini y se documenta en ADR-011. Se eliminó `@anthropic-ai/sdk` y la llamada es `fetch` directo.
- El SDK de Anthropic 1.14 ya no aceptaba `temperature`; el cambio a REST eliminó esa dependencia.
- `DeviceFrame` se encogía en la vista de un solo dispositivo por ser un flex item sin `w-full`; detectado en la captura y corregido (de 48 % a 83 % de escala).
- Los rewrites de Vercel deben excluir `/api/`; se añadió `vercel.json`.
- Sin `GEMINI_API_KEY` no se puede verificar la generación real; los tests cubren todos los fallos con el proveedor simulado.

**Siguiente**

- Fase 6: cobertura ≥ 70 %, Lighthouse, Error Boundary, Docker, despliegue en Vercel y README final. Para la IA real hace falta una clave gratuita de Google AI Studio.

## Fase 6 — Calidad, rendimiento y despliegue (2026-11-25)

**Hecho**

- `ErrorBoundary` global con mensaje accionable, botón de recarga, enlace al inicio y detalle solo en desarrollo; probado con un componente que lanza.
- Rutas secundarias con `React.lazy` y `Suspense`; vendors separados (`react`, `supabase`) en `manualChunks`. El chunk mayor baja de 500 kB a 231 kB y desaparece el aviso de Vite.
- CI: cobertura con umbral 70 %, artefacto de cobertura y job E2E con Chromium. Sin secretos de Supabase, las pruebas de auth y compartir se omiten solas.
- Docker verificado de punta a punta (build, run, HTTP 200) y con secretos de BuildKit para el build con Supabase. Se eliminaron los `ARG`/`ENV` de claves que marcaban los warnings.
- `robots.txt` añadido.
- Lighthouse sobre el build de producción: **Accesibilidad 100, Buenas prácticas 100, SEO 100**.
- Cobertura: **93,75 %** de líneas y 92,07 % de ramas en `src/lib` y `src/store`.
- Desplegado en Vercel: **https://theme-studio-queserabernal.vercel.app** con las variables de Supabase y Gemini. SSO de Deployment Protection desactivado para que la demo sea pública (ADR-015).
- `npm run check:deploy` verifica en producción: Supabase configurado, `/temas` redirige a login, pestaña de contraseña, generación de paleta (IA o reserva local) y aplicación a la vista previa, sin errores de consola.

**Pruebas**

- Caché de paletas en dos capas (memoria de la función y `localStorage`, TTL 24 h) para no repetir llamadas ni consumir cuota; la reserva local no se cachea.
- `npm test` — 24 archivos, 135 pruebas.
- `npm run test:coverage` — pasa con 93,75 %.
- `npm run test:e2e` — 5 pruebas, incluida una pasada en Pixel 5 emulado.
- `docker build` + `docker run` — HTTP 200; con `--secret` el bundle incluye Supabase.
- Lighthouse — 100/100/100.
- `npm run check:deploy` — pasa contra la URL de producción.

**Problemas**

- El primer Lighthouse dio SEO 80 por `robots.txt`; corregido.
- Docker marcaba las claves `VITE_*` como secretos por el nombre; se pasó a secreto de BuildKit y se documentó.
- Vercel activaba Deployment Protection y la demo devolvía 302; se desactivó SSO para el proyecto.
- Gemini free tier devuelve 503 con frecuencia y `gemini-2.5` ya no está disponible para cuentas nuevas: se añadió cadena de modelos lite y una reserva local etiquetada.
- Los usuarios y temas de prueba de los E2E se acumulan en Supabase; el script de RLS limpia los temas, no las cuentas.
- El enlace mágico en producción requiere añadir el dominio de Vercel a las Redirect URLs de Supabase.

**Siguiente**

- Opcional: configurar las Redirect URLs de Supabase para el enlace mágico y limpiar los usuarios de prueba desde el dashboard.

## Anexo A — Page Builder (2026-11-25)

**A.1 Preparación**

- Tag anotado `v1.0-theme-editor` creado sobre `main` como punto de retorno del editor de temas.
- Rama `feat/page-builder` creada.
- ADR-017 de evolución del producto añadido a `docs/DECISIONS.md`.
- Anexo A incorporado a `AGENTS.md` y `CLAUDE.md`, con A.1–A.6 y la propuesta RLS de A.5 aprobada.
- Decisiones cerradas: páginas alojadas en `/p/:slug`, backend solo Supabase, JSON de página como único export, tema en snapshot y `theme_id` opcional.

**Hito 1 (revisado, aprobado y en producción)**

- Modelo `PageDocument` con árbol normalizado, esquema Zod y saneamiento de URLs.
- Nueve bloques con schema, defaults, renderer e inspector; registro único y `PageRenderer` compartido por builder y página pública.
- Builder con paleta, estructura (subir/bajar/eliminar), inspector de propiedades y vista previa multidispositivo reutilizada.
- Navbar configurable en los cuatro lados (arriba, abajo, izquierda, derecha); en móvil, las laterales se convierten en barra superior.
- Corrección: la plantilla comparte defaults clonados; editar una página ya no muta los valores por defecto del registro.
- Persistencia: migración `002_pages.sql`, repositorio, rutas `/pages`, `/builder` y `/p/:slug`, y publicación.
- Layout v1 por bloque: ancho, alineación, dirección, invertir orden, columnas y espaciado; logo por URL en la navbar. Defaults por bloque para no alterar páginas antiguas.
- **179 pruebas** unitarias/componentes en verde, 6 E2E y RLS 14/14.
- Migración `002_pages.sql` aplicada. RLS verificada con dos usuarios: **14/14** (9 de temas + 5 de páginas).
- E2E de páginas: plantilla → editar hero → guardar → publicar → abrir `/p/:slug` anónimo en 375/768/1280. **6/6 E2E** en verde.
- Producción: **https://theme-studio-queserabernal.vercel.app** (rama `main`, fusionada con `--no-ff`).
- Revisión de la persona responsable completada: navbar en cuatro lados a altura completa, Layout v1 por bloque, logo por URL y página de demostración en `/p/landing-nebula`.
- Hito 2 no iniciado: requiere una nueva aprobación.

## Hito 1.2 — Subida de assets a Supabase Storage (2026-11-26)

- Migración `003_storage.sql`: bucket público `page-assets`, límite 1 MB, MIME PNG/JPEG/WebP y políticas por carpeta de usuario.
- Cliente `pageAssets.ts`: validación de tipo/tamaño, ruta `{user_id}/pages/{page_id|draft}/{uuid}` y URL pública.
- Inspector de navbar con “Subir logo”, estado de subida y errores legibles; se mantiene la opción de URL externa.
- Pruebas unitarias de validación y rutas; E2E de subida, publicación y carga en anónimo.
- **Verificado**: migración aplicada, 184 pruebas unitarias y **7/7 E2E**, incluida la subida real a Storage y la carga de la imagen en una página anónima.
- Fusionado a `main` y desplegado en producción; no se ha empezado el Hito 2.
- Revisión de la navbar lateral: la capa de selección ahora acompaña al bloque sticky durante el scroll; añadido el modo **Límites** con un color por bloque.

**Revisión — Layout v1 y logo por URL (2026-11-25)**

- `PageBlock.layout` con `width`, `align`, `direction`, `reverse`, `columns` y `gap`; schema con defaults retrocompatibles para páginas guardadas sin layout.
- `PageRenderer` aplica el ancho con clases estáticas y pasa `layout` a todos los renderers; hero, features, pricing, form, textImage, cta, footer y tabla usan los campos que tienen sentido.
- Inspector común `LayoutInspector` encima del inspector de props, con capacidades declaradas por bloque en el registro (columnas 1–3 en rejillas y 1–2 en formulario; invertir orden solo en fila).
- Navbar con logo por URL, texto alternativo y opción de mostrar el nombre; esquema rechaza `javascript:` y `data:`. **Sin subida de archivos ni Storage.**
- Pruebas añadidas: defaults de layout y logo en páginas antiguas, layout inválido, logo peligroso, `updateLayout` + dirty, aislamiento entre páginas, ancho en `PageRenderer`, logo con `alt` y marca textual.
- `npm run lint` — pasa. `npm run typecheck` — pasa. `npm test` — 31 archivos, 178 pruebas en verde.
- No se ejecutaron Playwright ni despliegues; sin commit ni push.
- Limitaciones: layout sin fondo/borde/padding por bloque; imágenes solo por URL (sin Storage); el ancho afecta al contenedor completo, incluido el fondo del bloque.

## Hito 2A — Formularios públicos, respuestas y CSV (2026-11-26)

**Estado: implementado, verificado y desplegado en producción.**

- Rama de trabajo `feat/forms`; `main` y el Hito 2B no se han tocado.
- Migración `004_submissions.sql`: tabla `page_submissions`, índices por `page_id` y `created_at desc`, grants y RLS (inserción anónima solo en páginas públicas; lectura/gestión solo del dueño).
- Endpoint `api/submit-page-form.ts`: Zod estricto, honeypot `website`, rate limit de 5/10 min por IP, inserción con clave `anon`, `maxDuration = 30` y errores 400/405/429/500/502 sin registrar datos del formulario.
- Cliente `submissions.ts` con timeout de 15 s, validación Zod de `{ ok: true }` y mensajes para 404, 429 y red.
- `pageRuntime.tsx` + `PageRenderer` con `runtime`: el formulario sigue siendo demostración en builder y envía de verdad en `/p/:slug` con id real. Campos controlados, honeypot, estado **Enviando…**, éxito y error sin perder valores.
- `submissionRepository.ts`: listar, marcar leída/no leída, eliminar y generar CSV (unión de campos, escape RFC 4180, sin BOM y neutralización de fórmulas tipo `=`, `+`, `-`, `@`).
- Página protegida `/pages/:id/respuestas` con bandeja responsive, confirmación de borrado y descarga CSV; enlaces desde `/pages` y desde el builder cuando hay `savedId`.
- Plugin de API en `vite.config.ts` para `npm run dev`: sirve `/api/*` con `ssrLoadModule`, adapta `req`/`res` y limita el cuerpo. Probado a mano: `POST /api/submit-page-form` inválido responde 400 y `GET /api/generate-palette` responde 405, sin llamar a la IA.
- Documentación: ADR-020, sección de formularios en `PAGE_BUILDER.md`, este registro, `CHANGELOG.md` y README.

**Pruebas ejecutadas**

- `npm run lint` — pasa, 0 warnings.
- `npm run typecheck` — pasa.
- `npm test` — 36 archivos, **209 pruebas** en verde.
- Playwright — **8/8** en verde, incluida la nueva `e2e/pages-form.spec.ts` (publicar → enviar anónimo → bandeja → marcar leída → CSV).
- `npm run verify:rls` — **21/21**, con 7 comprobaciones nuevas de respuestas de formulario.
- Migración `004_submissions.sql` aplicada en Supabase antes de ejecutar las pruebas.
- Fusionado a `main` (`62e731f`) y desplegado; etiqueta `v1.3-forms`.
- E2E contra producción: **8/8**, incluida la subida real a Storage y el envío real del formulario con su respuesta en la bandeja.
- Migración: **no aplicada** en Supabase; el flujo real requiere ejecutar `004_submissions.sql`.

**Problemas encontrados**

- `VercelRequest.headers` está tipado como `any`; el `user-agent` se trata como `unknown` antes de truncar para cumplir las reglas de TypeScript.
- Vite no vuelca `.env` en `process.env`; el plugin de desarrollo lo hace solo al arrancar el servidor, no durante Vitest.
- El primer intento de smoke test del middleware usó `Invoke-WebRequest` con parámetros no disponibles en Windows PowerShell 5.1; se repitió con `curl.exe`.
- En la revisión se detectó inyección de fórmulas en el CSV: un visitante podía enviar `=HYPERLINK(...)` y ejecutarse al abrir el archivo en Excel. Se neutralizan las celdas que empiezan por `=`, `+`, `-`, `@`, tabulador o retorno.
- El primer E2E del formulario agotó los 30 s por defecto durante el arranque en frío de Vite; se subió el timeout global de Playwright a 60 s.

**Siguiente**

- Revisión humana del formulario, la bandeja y el CSV en producción.
- Hito 2B solo con aprobación explícita.

## Hito 2B — Datos de página y tabla conectada (2026-11-26)

**Estado: implementado, verificado y pendiente de merge.**

- Rama `feat/page-datasets`; no se han tocado `main` ni el Hito 2A (formularios).
- Modelo `PageDataset` en `src/types/dataset.ts` y esquema Zod (`src/lib/datasetSchema.ts`): 1–8 columnas con id estable, etiquetas de 1–40, 0–200 filas, celdas de 200 caracteres, claves de fila existentes en `columns` y límite de 100 000 bytes serializados.
- Operaciones puras en `datasetOps.ts`: dataset vacío, id libre, añadir/quitar columna, renombrar, añadir/quitar fila y actualizar celda; ninguna muta el original.
- Migración `005_page_datasets.sql`: tabla `page_datasets` con `page_id` como PK y FK en cascada, `data jsonb` con límite `pg_column_size < 100000`, trigger `touch_updated_at`, grants y RLS (lectura pública solo si la página es pública; lectura del dueño; escritura solo del dueño). **Aplicada en Supabase.**
- `datasetRepository.ts`: carga con `maybeSingle`, parseo Zod con error legible y upsert `onConflict: "page_id"`. El guardado pide la fila devuelta y confirma con una lectura posterior antes de dar éxito, para no perder datos si se recarga de inmediato. Tipos `page_datasets` añadidos a `src/types/database.ts`.
- `PageRuntime.dataset` (default `null`). `PublicPage` carga el dataset y sigue mostrando la página si falla. `PageBuilderPage` carga el dataset sin bloquear la edición, avisa si falla y pasa `runtime={{ mode: "builder", pageId: savedId, dataset }}` al lienzo.
- Editor protegido `/pages/:id/datos`: nombre de página, dataset editable, confirmación con `Dialog` al borrar columna, límites y contador, «Sin guardar», «Datos guardados.», errores legibles, enlace a la página publicada y controles etiquetados.
- Enlaces **Datos** en las tarjetas de `/pages` y en la barra del builder junto a **Respuestas**.
- Bloque `table` con `source` (`static` por defecto para no alterar páginas antiguas; `page` para leer el dataset), caption accesible, celdas `row[id] ?? ""`, ayudas en builder y `null` en público cuando no hay datos o filas.
- Documentación: ADR-021, sección del Hito 2B en `PAGE_BUILDER.md`, `CHANGELOG.md`, README y este registro.
- E2E `e2e/pages-dataset.spec.ts` y comprobaciones de `page_datasets` en `scripts/verify-rls.mjs` ejecutados: **9/9** E2E y **29/29** RLS.

**Pruebas ejecutadas**

- `npm run format` — ejecutado.
- `npm run lint` — pasa, 0 warnings.
- `npm run typecheck` — pasa.
- `npm test` — **41 archivos, 251 pruebas en verde**.
- `npm run build` — pasa (chunk mayor 235,60 kB; vendor Supabase 230,92 kB).
- Playwright — **9/9 en verde**, incluida `e2e/pages-dataset.spec.ts`.
- `npm run verify:rls` — **29/29** comprobaciones (temas, páginas, respuestas y datasets).

**Problemas encontrados**

- `screen.getByRole` de Testing Library no admite `exact`; se corrigió el selector del diálogo de borrado de columna.
- La regla `react-refresh/only-export-components` marcaba el enlace auxiliar del bloque; se convirtió en una función que devuelve el nodo, sin exportar un componente adicional.
- La comprobación de tamaño usa Zod en cliente (`<= 100 000`) y `pg_column_size < 100000` en Postgres; son límites casi equivalentes, no idénticos byte a byte.
- Un dataset dañado no debe romper la página pública: se degrada a `dataset: null` y la tabla se omite. En el builder se muestra un aviso sin impedir seguir editando.
- El primer E2E del dataset falló: la tabla no aparecía en público porque la fila guardada no era visible al recargar de inmediato, aunque la interfaz mostraba «Datos guardados.». Se corrigió pidiendo la fila devuelta al upsert (`.select("page_id").single()`) y confirmando con una lectura con reintentos antes del éxito. El E2E ahora recarga y verifica la persistencia antes de conectar la tabla.

**Siguiente**

- Revisión humana del Hito 2B.
- Fusionar en `main`, desplegar y repetir el E2E del dataset contra producción.
- No iniciar un hito posterior sin revisión y aprobación explícitas.
