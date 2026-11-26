# Changelog

Todos los cambios relevantes de este proyecto se documentan aquí.
Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y [SemVer](https://semver.org/lang/es/).

## [No publicado]

### Añadido — Hito 2B: datos de página y tabla conectada

- Modelo `PageDataset` (columnas con id estable y filas de texto) y esquema Zod con límites de 8 columnas, 200 filas y 100 KB.
- Operaciones puras del editor: añadir/quitar columna y fila, renombrar columna y actualizar celda, sin mutar el original.
- Migración `005_page_datasets.sql`: tabla `page_datasets` con FK en cascada, trigger `updated_at` y RLS de lectura pública solo para páginas publicadas; escritura solo del dueño.
- Repositorio del dataset con parseo Zod, carga por `page_id` y upsert con `onConflict`.
- Editor protegido `/pages/:id/datos` con tabla editable, confirmación de borrado de columna, contador, indicador «Sin guardar», estados de guardado/error y enlace a la página publicada.
- Enlaces **Datos** en las tarjetas de `/pages` y en la barra del builder.
- Bloque `table` con `source` (`static` por defecto, `page` para leer el dataset), cabeceras y celdas conectadas, caption accesible y ayudas distintas en builder y público.
- `PageRuntime.dataset` y carga tolerante a fallos en la página pública y en el builder.
- ADR-021 con la decisión de tabla aparte, RLS y retrocompatibilidad de `source`.
- Pruebas del esquema, operaciones, repositorio con Supabase simulado, render del bloque y editor de datos.
- E2E `pages-dataset.spec.ts` y comprobaciones de RLS para datasets (pendientes de ejecutar con la migración aplicada).

### Añadido — Hito 2A: formularios públicos y respuestas

- Migración `004_submissions.sql` con `page_submissions`, índices y RLS: inserción anónima solo en páginas públicas; lectura y gestión solo del dueño.
- Endpoint `POST /api/submit-page-form` con Zod estricto, honeypot, rate limit de 5/10 min por IP, clave `anon` y errores controlados.
- Formulario público real: campos controlados, estado **Enviando…**, honeypot, éxito y error sin perder valores; en el builder sigue siendo demostración.
- Cliente de envío con timeout, validación de la respuesta y mensajes claros para 404, 429 y red.
- Bandeja `/pages/:id/respuestas`: listar, marcar leída/no leída, eliminar con confirmación y descargar CSV.
- CSV generado en cliente con unión de campos, escape RFC 4180 y sin BOM.
- Plugin de Vite que sirve `/api/*` en `npm run dev` para probar los endpoints sin `vercel dev`.
- ADR-020 y documentación del flujo, RLS y límites del Hito 2A.

### Añadido — Anexo A · Page Builder (Hito 1)

- Rama `feat/page-builder` y tag `v1.0-theme-editor` como punto de retorno.
- ADR-017: evolución de editor de temas a constructor de páginas alojadas.
- Modelo de página con árbol normalizado, registro de bloques y `PageRenderer` único.
- Nueve bloques: navbar, hero, features, pricing, form, table, cta, footer y textImage.
- Builder con paleta, estructura, inspector y vista previa multidispositivo.
- Navbar configurable en cuatro ubicaciones (arriba, abajo, izquierda, derecha), adaptándose a barra superior en móvil y a altura completa/sticky en laterales.
- Migración `002_pages.sql` con RLS, repositorio, rutas `/pages`, `/builder` y `/p/:slug`.
- Corrección de defaults clonados por página.
- Layout v1 por bloque (ancho, alineación, dirección, orden inverso, columnas y espaciado) con defaults retrocompatibles e inspector común.
- Navbar con logo por URL, texto alternativo y opción de mostrar el nombre de marca. Sin subida de archivos ni Storage.
- Pruebas de layout y logo: defaults en páginas antiguas, validación Zod, `updateLayout`, renderer y store.
- Subida de logo a Supabase Storage: bucket `page-assets`, RLS por carpeta, 1 MB y PNG/JPEG/WebP; validación en cliente y E2E de subida.
- Navbar lateral: selección estable durante el scroll y modo **Límites** con colores por bloque.

### Añadido

- Inicialización del proyecto: Vite + React 18 + TypeScript estricto.
- Tailwind CSS, ESLint, Prettier, Husky, lint-staged y Commitlint.
- Vitest + Testing Library con prueba de humo.
- CI en GitHub Actions (lint, formato, typecheck, tests, build).
- Dockerfile multi-stage con nginx y fallback de SPA.
- Documentación base: README, ARCHITECTURE, DECISIONS, TESTING, ACCESSIBILITY.
- Sistema de tokens: modelo `Theme`, esquema Zod, temas claro/oscuro por defecto y mapeo de Tailwind a variables CSS.
- Galería de componentes accesible (Radix UI) con container queries: navegación, tabla, formulario, alertas y modal.
- Store de Zustand con historial acotado, undo/redo, atajos de teclado y autoguardado local validado con Zod.
- Panel de controles de color, tipografía, forma, espaciado y componentes, con vista previa en vivo.
- Vista previa multidispositivo (375/768/1280 px), rotación, ancho libre y modo "todas a la vez".
- Pruebas E2E con Playwright: reflujo por ancho y persistencia tras recarga.
- Autenticación con Supabase: enlace mágico y correo + contraseña.
- CRUD de temas en Supabase con RLS verificada con dos usuarios, y perfil protegido `/temas`.
- Compartición pública con URL `/t/:id` de solo lectura y duplicado a la cuenta propia.
- Verificador de contraste WCAG 2.x con corrección automática y panel de semáforos.
- Variante clara/oscura derivada conservando el tono de las marcas.
- Generador de paletas con IA en función serverless (Gemini free tier), con clave solo en servidor, validación doble y corrección de contraste.
- Configuración de Vercel con rewrites de SPA y función de IA.
- Error Boundary global con recuperación y detalle solo en desarrollo.
- Code splitting de rutas y vendors: el chunk mayor pasa de 500 kB a 231 kB.
- CI con cobertura mínima del 70 %, artefacto de cobertura y job E2E.
- Docker verificado con secretos de BuildKit; `robots.txt` y Lighthouse 100/100/100.
- Despliegue en producción en Vercel y script `check:deploy` de verificación.
- Cadena de modelos de Gemini y reserva local etiquetada para mantener la demo operativa ante 503.
- Caché de paletas en servidor y navegador (TTL 24 h) para evitar llamadas repetidas.
