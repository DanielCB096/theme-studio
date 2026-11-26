# Page Builder (Anexo A)

Constructor de páginas alojadas que reutiliza el editor de temas como sistema de estilos. **Hito 1 completado y en producción**: https://theme-studio-queserabernal.vercel.app

## Alcance

- Páginas renderizadas desde JSON en **`/p/:slug`** (solo lectura pública si están publicadas).
- Backend exclusivamente **Supabase** (Postgres + Auth + RLS).
- Exportación/importación limitada al **JSON de la página**.
- El tema se guarda como **snapshot** en cada página.
- Sin anidación de bloques ni HTML/CSS libres en este hito.

## Rutas

| Ruta           | Acceso                 | Función                                           |
| -------------- | ---------------------- | ------------------------------------------------- |
| `/pages`       | autenticado            | Lista, publicar, copiar enlace y eliminar páginas |
| `/builder`     | autenticado            | Nueva página desde la plantilla de landing        |
| `/builder/:id` | autenticado (dueño)    | Editar una página existente                       |
| `/p/:slug`     | público si `is_public` | Página publicada, solo lectura                    |

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
| `form`      | campos, botón y mensaje de éxito (demostración)                                            |
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

Un único `PageRenderer` alimenta el lienzo, la vista previa multidispositivo y la página pública. Aplica `ThemeScope` (tokens del snapshot) y container queries. El ancho del layout se aplica al contenedor de cada bloque con clases estáticas y `layout` viaja al renderer de cada tipo. En el builder añade un botón de selección por bloque; la página publicada se renderiza sin controles.

## Seguridad

- Todo JSON externo se valida con Zod (`pageDocumentSchema`) antes de renderizar o guardar.
- URLs: solo `https`, `http`, `mailto`, `tel`, anclas y rutas internas; `javascript:` y `data:` se rechazan.
- Sin `dangerouslySetInnerHTML`.
- RLS de `pages`: lectura del dueño, lectura pública solo con `is_public`, insert/update/delete solo del dueño, `with check` en update.
- RLS de Storage: bucket público de lectura; escritura solo si la primera carpeta coincide con `auth.uid()`; límite de 1 MB y MIME permitidos en el bucket.
- Los formularios no envían datos en el Hito 1: no hay endpoint ni tabla de respuestas.

## Pruebas

- Esquema: plantilla válida, tipo desconocido, URL peligrosa, ids repetidos, huérfanos, anidación y tema inválido.
- Esquema (Layout v1): página antigua sin `layout` ni logo parsea con defaults; layout inválido y logo `javascript:` se rechazan.
- Operaciones del árbol: añadir, quitar, mover, actualizar props y layout, renombrar y límite de bloques.
- Renderer: bloques de la plantilla, enlaces seguros, selección, ancho de layout, logo con texto alternativo, marca textual y estado vacío.
- Repositorio: slug, fila válida/dañada y resumen.
- Store: carga, selección, edición, guardado, estado sucio y actualización de layout sin mutar otras páginas.
- Assets: validación de tipo/tamaño, ruta por usuario/página y rechazo de SVG, GIF y archivos vacíos.
- E2E (`e2e/pages.spec.ts`): plantilla → editar → guardar → publicar → abrir anónimo en 375/768/1280.
- E2E (`e2e/pages-upload.spec.ts`): subir logo a Storage, guardar, publicar y verificar la imagen pública.
- `npm run verify:rls` amplía la matriz con páginas privadas y públicas.

## Limitaciones conocidas del Hito 1

- Sin anidación, drag & drop ni historial propio del builder.
- Layout v1 no incluye fondo, borde ni padding por bloque; el ancho se aplica al contenedor completo del bloque.
- Subida de imágenes disponible para el logo; falta limpieza automática de assets al reemplazar el logo o borrar la página.
- Sin formulario conectado a Supabase (Hito 2).
- Sin edición de listas complejas de planes/formularios desde el inspector (se completará).
- El tema se captura al crear la página; cambiarlo después no afecta a páginas existentes salvo que se edite el snapshot.
