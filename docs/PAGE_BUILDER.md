# Page Builder (Anexo A)

Constructor de páginas alojadas que reutiliza el editor de temas como sistema de estilos. **Hito 1, 1.2 (assets), 2A (formularios), 2B (datasets) y 2C (buscador, paginación, CSV y varios datasets) completados y en producción**. En producción: https://theme-studio-queserabernal.vercel.app.

## Alcance

- Páginas renderizadas desde JSON en **`/p/:slug`** (solo lectura pública si están publicadas).
- Backend exclusivamente **Supabase** (Postgres + Auth + RLS).
- Exportación/importación limitada al **JSON de la página**.
- El tema se guarda como **snapshot** en cada página.
- Sin anidación de bloques ni HTML/CSS libres en este hito.

## Rutas

| Ruta                          | Acceso                 | Función                                                       |
| ----------------------------- | ---------------------- | ------------------------------------------------------------- |
| `/pages`                      | autenticado            | Lista, publicar, copiar enlace y eliminar páginas             |
| `/builder`                    | autenticado            | Nueva página desde la plantilla de landing                    |
| `/builder/:id`                | autenticado (dueño)    | Editar una página existente                                   |
| `/pages/:id/datos`            | autenticado (dueño)    | Lista de datasets de la página (máx. 10)                      |
| `/pages/:id/datos/:datasetId` | autenticado (dueño)    | Editor de un dataset concreto (columnas, filas, CSV y nombre) |
| `/pages/:id/respuestas`       | autenticado (dueño)    | Bandeja de respuestas del formulario y CSV                    |
| `/p/:slug`                    | público si `is_public` | Página publicada, solo lectura                                |

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
| `table`     | origen estático o un dataset de la página (`source` y `datasetId`), columnas y filas       |
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

## Datos de página y tablas conectadas (Hitos 2B y 2C)

Permite mantener **varios datasets editables por página** (máximo 10) y conectar cada bloque `table` a uno distinto. La página publicada solo los muestra; la edición vive en la zona autenticada.

### Modelo y límites

```ts
type DatasetColumn = { id: string; label: string };
type PageDataset = { columns: DatasetColumn[]; rows: Record<string, string>[] };
type PageDatasetRecord = {
  id: string;
  pageId: string;
  name: string;
  dataset: PageDataset;
  updatedAt: string;
};
```

- Columnas: **1–8**. El `id` cumple `/^[a-z0-9][a-z0-9-]{0,23}$/` y es estable al renombrar; la etiqueta se recorta y admite 1–40 caracteres.
- Filas: **0–200**. Cada celda es texto de hasta **200 caracteres**.
- Todas las claves de una fila deben existir en `columns`; una clave extra se rechaza.
- Tamaño serializado máximo: **100 000 bytes** (Zod en cliente; `pg_column_size < 100000` en Postgres).
- Nombre del dataset: **1–60** caracteres, recortado; único por página sin distinguir mayúsculas.
- Máximo **10 datasets por página**.
- Operaciones puras en `datasetOps.ts`: añadir/quitar columna, renombrar, añadir/quitar fila y actualizar celda, sin mutar el original.

### Migraciones y RLS

`005_page_datasets.sql` creó `public.page_datasets` con `page_id` como PK, `data jsonb`, `updated_at` y el trigger `touch_updated_at()`.

`006_multiple_datasets.sql` evoluciona esa tabla **sin perder la fila existente**:

1. Añade `id` y `name` como columnas nullable, rellena la fila con `gen_random_uuid()` y `'Datos'`, y después las marca `not null` con sus defaults.
2. Quita la PK de `page_id` (buscando su nombre real en `pg_constraint`) y pone la PK en `id`.
3. Añade el check `char_length(name) between 1 and 60`, un índice por `page_id` y un índice único por `(page_id, lower(name))`.
4. Conserva `data jsonb` con su check, `updated_at`, el trigger, los grants y las políticas RLS.

La migración es idempotente y se puede reejecutar. **No está aplicada en Supabase**: hay que ejecutarla antes de probar el flujo real.

RLS (sin cambios de semántica):

- `select` para `anon` y `authenticated` si la página es pública (`p.is_public = true`) **o** el usuario es su dueño (`p.user_id = auth.uid()`).
- `insert`, `update` y `delete` solo para el dueño de la página; `update` incluye `using` y `with check`.
- Son políticas por fila: funcionan igual con uno o varios datasets de la misma página.
- Al borrar la página, sus datasets caen por la FK con `on delete cascade`.

### Lista y editor de datasets

- Ruta protegida `/pages/:id/datos`: **lista** de datasets con nombre, columnas, filas, fecha de actualización y acciones **Editar** y **Eliminar**. Muestra el contador `N de 10`, el estado vacío y los enlaces a **Editar página**, **Páginas** y la URL pública si procede.
- **Nuevo dataset** crea uno con nombre `Datos N` y navega a su editor; maneja el error (por ejemplo, haber llegado al máximo). La creación reintenta el nombre si choca con `Datos 2`, `Datos 3`…
- **Eliminar** pide confirmación con un `Dialog` y avisa de que las tablas que usen ese dataset dejarán de mostrar datos. El borrado no vive en el editor.
- Ruta protegida `/pages/:id/datos/:datasetId`: **editor** del dataset concreto. Carga `getPageRecord` y `getPageDatasetRecord`; si el dataset pertenece a otra página, muestra un error claro y no permite editar.
- Campo **Nombre del dataset** (1–60) junto a las celdas; se guarda con los datos.
- Tabla editable: etiquetas de columna, celdas, eliminar columna (con `Dialog` de confirmación porque borra datos), eliminar fila, añadir columna/fila hasta el límite y contador visible.
- **Guardar datos** valida dataset y nombre con Zod, actualiza por `id`, pide la fila devuelta y confirma la lectura antes de mostrar «Datos guardados.» o un error legible. Una colisión de nombre se explica sin perder lo escrito. El indicador «Sin guardar» compara nombre y datos con el último estado guardado.
- Todos los controles tienen `aria-label` único, foco visible y navegación por teclado; la tabla usa scroll horizontal. No se usa `window.confirm`.
- Si la página está publicada, se muestra su URL `/p/:slug` para probar.
- **Importar CSV**: botón/etiqueta con un `input type="file"` oculto (`accept=".csv,text/csv"`) accesible por teclado. Rechaza archivos de más de 100 KB. Lee el archivo en el navegador, valida con Zod y reemplaza el dataset **en edición**; muestra «CSV importado: N filas. Pulsa “Guardar datos”.» o una alerta «No se pudo importar el CSV» con el mensaje. No guarda hasta pulsar «Guardar datos» y permite reimportar el mismo archivo.

### Bloque `table`

- `TableProps.source` es `static` (por defecto) o `page`.
- `TableProps.datasetId` es un uuid o `null` (default retrocompatible). En modo `page`:
  - con `datasetId`, usa ese dataset;
  - con `datasetId: null`, usa el **primero** de la página (fallback de las tablas 2B);
  - si el id ya no existe, **no** cae al primero: en el builder muestra «Dataset no encontrado» con enlace a la lista; en público no renderiza la sección.
- `TableProps.searchable` (booleano) y `TableProps.pageSize` (`0`, `5`, `10` o `20`) tienen defaults retrocompatibles `false` y `0`: una tabla guardada antes de 2C conserva su aspecto. Un bloque nuevo usa `searchable: true` y `pageSize: 10`.
- Origen **estático**: conserva columnas y filas del bloque, como antes.
- Origen **dataset**: usa las columnas del dataset elegido y una fila por registro (`row[column.id] ?? ""`). Añade `<caption class="sr-only">` con el título.
- **Buscador**: si `searchable`, aparece un `input type="search"` etiquetado con placeholder «Buscar…». Filtra por cualquier celda sin distinguir mayúsculas ni acentos (`normalize("NFD")`, se eliminan los diacríticos y se usa `toLocaleLowerCase("es")`) y anuncia «N resultados» con `aria-live="polite"`. Si no hay coincidencias muestra una fila «No hay resultados.» con `colSpan`; la tabla no se oculta.
- **Paginación**: si `pageSize > 0`, muestra `Página X de Y` y botones **Anterior**/**Siguiente** deshabilitados en los extremos. Vuelve a la página 1 al cambiar la búsqueda o el tamaño y recorta la página al rango válido si cambian las filas. `0` muestra todas las filas.
- Los controles se renderizan igual en builder y público, pero en el lienzo del builder la capa de selección de `BlockShell` los cubre; se usan en la página publicada y en la vista previa. Esto es intencional y no cambia la capa de selección.
- Sin datasets o sin columnas: en el builder muestra una ayuda con enlace a `/pages/{pageId}/datos` o «Guarda la página para conectar datos»; en público devuelve `null`.
- Con cero filas: en el builder muestra cabeceras y «Sin filas todavía» con enlace; en público devuelve `null` para no dejar una sección vacía.
- El inspector mantiene el título y añade **Origen de datos**, **Dataset** (con «Primero disponible» para el fallback legacy), **Buscador** y **Filas por página** (Todas, 5, 10, 20) para ambos orígenes. Al pasar de estático a página con datasets y `datasetId: null`, selecciona el primero. Enlaza a la lista y, si hay uno seleccionado, a su editor; sin datasets, invita a crearlos. En modo estático conserva los campos de columnas y filas.
- `PageRuntime` incorpora `datasets?: PageDatasetRecord[]` (por defecto `[]`); `PublicPage` y el lienzo del builder cargan la lista y la pasan al `PageRenderer`.

### Límites de los Hitos 2B y 2C

- Máximo 10 datasets por página y **un dataset por bloque**; no hay varios datasets a la vez en una misma tabla.
- El máximo de 10 se comprueba en cliente antes de insertar: dos pestañas podrían superarlo a la vez porque Postgres no impone ese límite.
- No se pueden mover datasets entre páginas ni reordenarlos; la lista se ordena por nombre.
- La búsqueda y la paginación son en cliente sobre las filas ya cargadas: no hay consultas, índices ni filtros por columna, y no se ordena.
- La importación CSV sustituye el dataset completo en edición; no fusiona filas ni admite varios archivos a la vez. El archivo debe ser UTF-8 con comas (no se detecta punto y coma).
- Sin imágenes en celdas.
- Un dataset dañado hace fallar la carga de la lista: en público la página se muestra sin datasets y en el builder se avisa sin impedir editar la página.
- La tabla estática sigue disponible y es el valor por defecto de las páginas existentes.
- Las migraciones 005 y 006 están aplicadas en Supabase. Los E2E de 2C están en verde (12/12) y la matriz RLS en 33/33.

## Seguridad

- Todo JSON externo se valida con Zod (`pageDocumentSchema`) antes de renderizar o guardar.
- URLs: solo `https`, `http`, `mailto`, `tel`, anclas y rutas internas; `javascript:` y `data:` se rechazan.
- Sin `dangerouslySetInnerHTML`.
- RLS de `pages`: lectura del dueño, lectura pública solo con `is_public`, insert/update/delete solo del dueño, `with check` en update.
- RLS de Storage: bucket público de lectura; escritura solo si la primera carpeta coincide con `auth.uid()`; límite de 1 MB y MIME permitidos en el bucket.
- RLS de `page_submissions`: inserción anónima solo en páginas públicas; lectura y gestión solo del dueño.
- RLS de `page_datasets`: lectura pública si la página es pública o si el usuario es el dueño; escritura solo del dueño. Las políticas son por fila, así que cubren varios datasets por página.
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
- Datos: esquema Zod (válido, sin columnas, más de 8, ids duplicados, etiqueta vacía, clave desconocida, valor de más de 200, más de 200 filas y tamaño excesivo), operaciones puras e inmutabilidad, y repositorio (listado válido y dañado, carga por id, creación con colisión de nombre, límite de 10, guardado con confirmación, renombrado y borrado con Supabase simulado).
- Nombre de dataset: 1–60, recortado; colisión de nombre explicada al guardar y al renombrar.
- Tabla: render estático, datos del dataset en builder y público, selección por `datasetId`, fallback legacy al primero, id inexistente sin caer al primero, dos datasets distintos en dos bloques, ayuda sin dataset, «Sin filas todavía» y ausencia de sección vacía en público.
- Inspector de tabla: paso de estático a página con selección del primer dataset, elección de dataset y vuelta a «Primero disponible», enlaces a la lista/editor y aviso sin datasets.
- Tabla 2C: defaults retrocompatibles (`searchable: false`, `pageSize: 0`), búsqueda sin acentos ni mayúsculas, «No hay resultados.», paginación 5 de 7, botones deshabilitados en los extremos, reinicio de página al buscar y recorte al cambiar las filas; sin controles cuando ambos están desactivados.
- CSV: comas, comillas, saltos dentro de comillas, `""`, CRLF, BOM, comilla sin cerrar, cabeceras vacías/duplicadas, límites de 8 columnas/200 filas/200 caracteres y fila con más celdas que cabeceras.
- Editor de datos: importación de un CSV en jsdom sin guardar hasta pulsar «Guardar datos», archivo de más de 100 KB y error del parser.
- Editor de datos: carga por id, nombre, edición de celda, añadir fila, guardado con id/datos/nombre, confirmación de borrado de columna, error de guardado y dataset de otra página.
- Lista de datasets: carga, estado vacío, creación y navegación al editor, borrado con confirmación, recarga tras borrar y errores legibles.
- E2E (`e2e/pages.spec.ts`): plantilla → editar → guardar → publicar → abrir anónimo en 375/768/1280.
- E2E (`e2e/pages-upload.spec.ts`): subir logo a Storage, guardar, publicar y verificar la imagen pública.
- E2E (`e2e/pages-form.spec.ts`): publicar → enviar el formulario anónimo → ver la respuesta, marcarla leída y descargar el CSV.
- E2E (`e2e/pages-dataset.spec.ts`): crear página → crear dataset → editar datos → conectar la tabla → publicar → ver los datos en anónimo. **Ejecutado y en verde (12/12 con la suite de 2C).**
- E2E (`e2e/pages-table.spec.ts`): tabla estática de 7 filas con búsqueda y paginación en la página publicada. **Ejecutado y en verde.**
- E2E (`e2e/pages-csv.spec.ts`): importar `e2e/fixtures/dataset.csv`, guardar, recargar y publicar una tabla conectada. **Ejecutado y en verde.**
- E2E (`e2e/pages-multiple-datasets.spec.ts`): dos datasets, dos tablas con `datasetId` distinto, publicación anónima, lista conservada y editor recargado por id. **Escrito; no ejecutado en esta fase.**
- `npm run verify:rls` amplía la matriz con páginas, respuestas y datasets privados/públicos. Incluye dos datasets en la misma página, unicidad de nombre, lectura anónima de ambos y borrado selectivo del dueño. **Ejecutado: 33/33.**

## Limitaciones conocidas (Hitos 1, 2A, 2B y 2C)

- Sin anidación, drag & drop ni historial propio del builder.
- Layout v1 no incluye fondo, borde ni padding por bloque; el ancho se aplica al contenedor completo del bloque.
- Subida de imágenes disponible para el logo; falta limpieza automática de assets al reemplazar el logo o borrar la página.
- Formularios sin correo de notificación, adjuntos ni captcha; el rate limit es en memoria por instancia.
- Sin paginación ni filtros en la bandeja de respuestas.
- Sin edición de listas complejas de planes/formularios desde el inspector (se completará).
- Datos de página: hasta 10 datasets por página y uno por bloque, sin mover datasets entre páginas, ordenación, filtros por columna ni imágenes en celdas. La búsqueda y la paginación de la tabla son en cliente; la importación CSV sustituye el dataset completo.
- El máximo de 10 datasets no está impuesto en Postgres: dos pestañas podrían superarlo a la vez.
- La migración `006` está aplicada; el flujo real de varios datasets se verificó con E2E y RLS.
- El tema se captura al crear la página; cambiarlo después no afecta a páginas existentes salvo que se edite el snapshot.
