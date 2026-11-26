# Page Builder (Anexo A)

Constructor de páginas alojadas que reutiliza el editor de temas como sistema de estilos. **Hito 1 y 1.2 (assets) completados y en producción**: https://theme-studio-queserabernal.vercel.app · **Hito 2A implementado, pendiente de migración/E2E**.

## Alcance

- Páginas renderizadas desde JSON en **`/p/:slug`** (solo lectura pública si están publicadas).
- Backend exclusivamente **Supabase** (Postgres + Auth + RLS).
- Exportación/importación limitada al **JSON de la página**.
- El tema se guarda como **snapshot** en cada página.
- Sin anidación de bloques ni HTML/CSS libres en este hito.

## Rutas

| Ruta                    | Acceso                 | Función                                           |
| ----------------------- | ---------------------- | ------------------------------------------------- |
| `/pages`                | autenticado            | Lista, publicar, copiar enlace y eliminar páginas |
| `/builder`              | autenticado            | Nueva página desde la plantilla de landing        |
| `/builder/:id`          | autenticado (dueño)    | Editar una página existente                       |
| `/pages/:id/respuestas` | autenticado (dueño)    | Bandeja de respuestas del formulario y CSV        |
| `/p/:slug`              | público si `is_public` | Página publicada, solo lectura                    |

## Modelo de datos

```ts
type PageDocument = {
  version: 1;
  name: string;
  theme: Theme; // snapshot
  rootIds: string[]; // orden de los bloques
  blocks: Record<string, PageBlock>;
};
```

- **Árbol normalizado**: los bloques viven en `blocks` y el orden en `rootIds`.
- `childIds` existe para el futuro, pero debe estar vacío en el Hito 1.
- Un bloque es `{ id, type, childIds, layout, props }`; `props` depende del tipo y `layout` es la presentación común.
- `pageDocumentSchema` (Zod) comprueba ids, huérfanos, orden, tema y URLs.

## Layout v1

Cada bloque guarda un `layout` con defaults retrocompatibles: las páginas anteriores a esta versión parsean sin error y reciben los valores por defecto.

| Campo       | Valores                             | Defecto  | Aplicación                                                                        |
| ----------- | ----------------------------------- | -------- | --------------------------------------------------------------------------------- |
| `width`     | `compact`, `normal`, `wide`, `full` | `normal` | Contenedor del bloque: `max-w-2xl`, `max-w-4xl`, `max-w-6xl` o `w-full`, centrado |
| `align`     | `left`, `center`, `right`           | `left`   | Alineación del contenido y de los grupos principales                              |
| `direction` | `row`, `column`                     | `column` | Fila o columna en los bloques con dos grupos                                      |
| `reverse`   | booleano                            | `false`  | Invierte los dos grupos cuando la dirección es fila                               |
| `columns`   | `1`, `2`, `3`                       | `1`      | Rejilla de ventajas/planes (hasta 3) y campos del formulario (hasta 2)            |
| `gap`       | `compact`, `normal`, `spacious`     | `normal` | Separación interna del contenedor principal (`gap-2`, `gap-density`, `gap-6`)     |

- El **registro** declara qué campos tienen sentido por bloque (`layoutCapabilities`); el inspector común (`builder/LayoutInspector.tsx`) muestra solo esos controles.
- `PageRenderer` aplica `width` al contenedor de cada bloque con clases estáticas y pasa `layout` a cada renderer.
- `navbar` conserva su `placement` (arriba, abajo, izquierda o derecha) y su comportamiento sticky de altura completa en laterales.
- No hay fondo por bloque en esta iteración.

## Bloques (9 tipos)

| Tipo        | Props principales                                                                          |
| ----------- | ------------------------------------------------------------------------------------------ |
| `navbar`    | marca, enlaces, CTA, ubicación (arriba, abajo, izquierda, derecha) y logo por URL opcional |
| `hero`      | antetítulo, título, subtítulo, CTA, alineación                                             |
| `features`  | título y hasta 6 ventajas                                                                  |
| `pricing`   | hasta 3 planes con ventajas y CTA                                                          |
| `form`      | campos, botón y mensaje de éxito; en páginas públicas guarda respuestas                    |
| `table`     | columnas y filas estáticas                                                                 |
| `cta`       | título, descripción y botón                                                                |
| `footer`    | texto y enlaces                                                                            |
| `textImage` | título, texto, imagen opcional y posición                                                  |

Cada bloque tiene una carpeta con `schema.ts` (Zod + defaults) e `index.tsx` (renderer + inspector). El **registro** (`blocks/registry.ts`) es la única fuente para la paleta, los tipos y el render.

## Logo en la navbar (URL o subida a Storage)

- `NavbarProps` añade `logoUrl` (vacío por defecto), `logoAlt` (máximo 120) y `showBrandText` (`true` por defecto).
- `logoUrl` acepta cadena vacía o una URL de imagen segura (`https`, `http` o ruta interna); `javascript:` y `data:` se rechazan con Zod.
- Si hay logo, se renderiza con `object-contain` y altura basada en tokens (`--space-unit`); si además `showBrandText` está activo, el nombre acompaña a la imagen. Sin logo siempre se muestra la marca textual.
- Funciona igual en barra horizontal y en columna lateral; respeta `placement`.
- El inspector permite pegar una URL o **subir un archivo** con el campo “Subir logo”.
- Subida: bucket público `page-assets`; ruta `{user_id}/pages/{page_id|draft}/{uuid}.{ext}`; 1 MB máximo; PNG, JPEG o WebP (sin SVG); validación en cliente y en el bucket.
- Escritura solo dentro de la carpeta del usuario (RLS de Storage); lectura pública para que las páginas publicadas carguen la imagen.
- Ejemplo publicado con logo: https://theme-studio-queserabernal.vercel.app/p/landing-nebula

## Render

Un único `PageRenderer` alimenta el lienzo, la vista previa multidispositivo y la página pública. Aplica `ThemeScope` (tokens del snapshot) y container queries. El ancho del layout se aplica al contenedor de cada bloque con clases estáticas y `layout` viaja al renderer de cada tipo. En el builder añade un botón de selección por bloque; la página publicada se renderiza sin controles. El botón **Límites** colorea cada bloque con un tono distinto para inspeccionar sus bordes.

## Formularios reales y respuestas (Hito 2A)

El bloque `form` distingue dos modos mediante `PageRuntime` (`{ mode: "builder" | "public", pageId }`):

- **Builder o borrador**: sigue siendo una demostración. El envío solo muestra el mensaje de éxito y no llama a la red.
- **Página publicada**: `PublicPage` pasa `mode: "public"` y el id real que devuelve `getPublicPage`. Los campos son controlados; el botón muestra **Enviando…**; el éxito usa `successMessage`; un error se muestra en una alerta sin borrar lo escrito. Si falta `pageId`, no se envía nada.

Protección del formulario:

- Campo honeypot `website`, oculto con `aria-hidden`, `tabIndex={-1}` y `autoComplete="off"`.
- Cliente de envío (`submissions.ts`): timeout de 15 s, validación de `{ ok: true }` con Zod y mensajes claros para 404, 429, red y respuesta inválida.

### Endpoint y migración

`POST /api/submit-page-form` recibe `{ pageId, values, website? }` y valida con Zod estricto:

- `pageId` uuid; `values` con 1–12 claves, clave ≤ 60 y valor ≤ 2000 caracteres; tamaño serializado ≤ 20 000 bytes; `website` ≤ 200.
- Honeypot relleno → `200 { ok: true }` sin insertar.
- Rate limit en memoria: 5 peticiones por IP cada 10 minutos; `429` con `Retry-After`.
- Inserta con la clave `anon` en `page_submissions`. **RLS decide** si la página es pública; el endpoint nunca usa `service_role`.
- Códigos controlados: 400 (validación), 405 (método), 429 (límite), 500 (configuración) y 502 (fallo de inserción). No se registran los valores del formulario en logs.
- `maxDuration = 30`.

Migración `004_submissions.sql`:

| Columna      | Tipo                                       |
| ------------ | ------------------------------------------ |
| `id`         | uuid, PK                                   |
| `page_id`    | uuid, FK a `pages` con `on delete cascade` |
| `data`       | jsonb objeto, `pg_column_size < 20000`     |
| `user_agent` | text opcional                              |
| `created_at` | timestamptz                                |
| `read_at`    | timestamptz nullable                       |

Índices por `page_id` y `created_at desc`. Políticas RLS: `insert` para `anon` y `authenticated` solo si la página es pública; `select`, `update` y `delete` solo para el dueño de la página, con `using` y `with check` en `update`.

### Bandeja y CSV

- Ruta protegida `/pages/:id/respuestas`, enlazada desde cada tarjeta de `/pages` y desde el botón **Respuestas** del builder cuando la página ya está guardada.
- Carga el nombre de la página con `getPageRecord` y las respuestas con `listSubmissions`; estados de carga, vacío y error.
- Tabla responsive con fecha, unión de campos, estado **Nueva/Leída** y acciones para marcar leída/no leída y eliminar con confirmación.
- **Descargar CSV** se genera en el navegador: primera columna `Fecha` (ISO), después la unión de claves ordenada alfabéticamente, escape RFC 4180 de comillas, comas y saltos de línea, sin BOM. Las celdas que empiezan por `=`, `+`, `-`, `@`, tabulador o retorno se prefijan con `'` para que una hoja de cálculo no las ejecute como fórmulas.

### Endpoint en desarrollo

`npm run dev` sirve `/api/*` con un plugin de Vite (`configureServer`) que carga el handler TS con `ssrLoadModule`, adapta `req`/`res` a `VercelRequest`/`VercelResponse` y limita el cuerpo JSON. También funciona para `/api/generate-palette`. Toma las variables del `.env` y las publica en `process.env` solo en el servidor de desarrollo. En producción siguen siendo Vercel Functions.

### Límites del Hito 2A

- Sin correo de notificación, adjuntos ni captcha.
- El rate limit es por instancia y en memoria; no es una cuota distribuida.
- Sin paginación ni filtros en la bandeja: se listan todas las respuestas de la página.
- Los campos del formulario se editan desde la plantilla; el inspector de listas sigue pendiente.
- La migración debe aplicarse a mano en Supabase antes de probar el flujo real.

## Seguridad

- Todo JSON externo se valida con Zod (`pageDocumentSchema`) antes de renderizar o guardar.
- URLs: solo `https`, `http`, `mailto`, `tel`, anclas y rutas internas; `javascript:` y `data:` se rechazan.
- Sin `dangerouslySetInnerHTML`.
- RLS de `pages`: lectura del dueño, lectura pública solo con `is_public`, insert/update/delete solo del dueño, `with check` en update.
- RLS de Storage: bucket público de lectura; escritura solo si la primera carpeta coincide con `auth.uid()`; límite de 1 MB y MIME permitidos en el bucket.
- RLS de `page_submissions`: inserción anónima solo en páginas públicas; lectura y gestión solo del dueño.
- Los formularios envían datos a un endpoint que valida, aplica honeypot y rate limit, e inserta con la clave `anon`; nunca con `service_role`.

## Pruebas

- Esquema: plantilla válida, tipo desconocido, URL peligrosa, ids repetidos, huérfanos, anidación y tema inválido.
- Esquema (Layout v1): página antigua sin `layout` ni logo parsea con defaults; layout inválido y logo `javascript:` se rechazan.
- Operaciones del árbol: añadir, quitar, mover, actualizar props y layout, renombrar y límite de bloques.
- Renderer: bloques de la plantilla, enlaces seguros, selección, ancho de layout, logo con texto alternativo, marca textual y estado vacío.
- Repositorio: slug, fila válida/dañada y resumen.
- Store: carga, selección, edición, guardado, estado sucio y actualización de layout sin mutar otras páginas.
- Assets: validación de tipo/tamaño, ruta por usuario/página y rechazo de SVG, GIF y archivos vacíos.
- Endpoint de respuestas: envío válido, honeypot, uuid inválido, límites de campos/valores, claves desconocidas, rate limit, método, configuración ausente, fallo de inserción y JSON inválido (con `@supabase/supabase-js` mockeado).
- Cliente de envío: éxito, 429, respuesta inválida, red y 404 del entorno local.
- Formulario: envío público con campos controlados, éxito, error sin perder valores y ausencia de `pageId`.
- Respuestas: parseo de fila, fila dañada y CSV exacto con acentos, comillas, comas, saltos de línea y neutralización de fórmulas.
- E2E (`e2e/pages.spec.ts`): plantilla → editar → guardar → publicar → abrir anónimo en 375/768/1280.
- E2E (`e2e/pages-upload.spec.ts`): subir logo a Storage, guardar, publicar y verificar la imagen pública.
- E2E (`e2e/pages-form.spec.ts`): publicar → enviar el formulario anónimo → ver la respuesta, marcarla leída y descargar el CSV.
- `npm run verify:rls` amplía la matriz con páginas y respuestas privadas/públicas.

## Limitaciones conocidas (Hito 1 y 2A)

- Sin anidación, drag & drop ni historial propio del builder.
- Layout v1 no incluye fondo, borde ni padding por bloque; el ancho se aplica al contenedor completo del bloque.
- Subida de imágenes disponible para el logo; falta limpieza automática de assets al reemplazar el logo o borrar la página.
- Formularios sin correo de notificación, adjuntos ni captcha; el rate limit es en memoria por instancia.
- Sin paginación ni filtros en la bandeja de respuestas.
- Sin edición de listas complejas de planes/formularios desde el inspector (se completará).
- El tema se captura al crear la página; cambiarlo después no afecta a páginas existentes salvo que se edite el snapshot.
- La migración `004_submissions.sql` y el E2E del envío real quedan pendientes de aplicar/ejecutar.
