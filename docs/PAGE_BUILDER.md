# Page Builder (Anexo A)

Constructor de páginas alojadas que reutiliza el editor de temas como sistema de estilos. **Hito 1 completado y desplegado en preview**: https://theme-studio-git-feat-page-builder-queserabernal.vercel.app

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
- Un bloque es `{ id, type, childIds, props }`; `props` depende del tipo.
- `pageDocumentSchema` (Zod) comprueba ids, huérfanos, orden, tema y URLs.

## Bloques (9 tipos)

| Tipo        | Props principales                               |
| ----------- | ----------------------------------------------- |
| `navbar`    | marca, enlaces, CTA                             |
| `hero`      | antetítulo, título, subtítulo, CTA, alineación  |
| `features`  | título y hasta 6 ventajas                       |
| `pricing`   | hasta 3 planes con ventajas y CTA               |
| `form`      | campos, botón y mensaje de éxito (demostración) |
| `table`     | columnas y filas estáticas                      |
| `cta`       | título, descripción y botón                     |
| `footer`    | texto y enlaces                                 |
| `textImage` | título, texto, imagen opcional y posición       |

Cada bloque tiene una carpeta con `schema.ts` (Zod + defaults) e `index.tsx` (renderer + inspector). El **registro** (`blocks/registry.ts`) es la única fuente para la paleta, los tipos y el render.

## Render

Un único `PageRenderer` alimenta el lienzo, la vista previa multidispositivo y la página pública. Aplica `ThemeScope` (tokens del snapshot) y container queries. En el builder añade un botón de selección por bloque; la página publicada se renderiza sin controles.

## Seguridad

- Todo JSON externo se valida con Zod (`pageDocumentSchema`) antes de renderizar o guardar.
- URLs: solo `https`, `http`, `mailto`, `tel`, anclas y rutas internas; `javascript:` y `data:` se rechazan.
- Sin `dangerouslySetInnerHTML`.
- RLS de `pages`: lectura del dueño, lectura pública solo con `is_public`, insert/update/delete solo del dueño, `with check` en update.
- Los formularios no envían datos en el Hito 1: no hay endpoint ni tabla de respuestas.

## Pruebas

- Esquema: plantilla válida, tipo desconocido, URL peligrosa, ids repetidos, huérfanos, anidación y tema inválido.
- Operaciones del árbol: añadir, quitar, mover, actualizar props, renombrar y límite de bloques.
- Renderer: bloques de la plantilla, enlaces seguros, selección y estado vacío.
- Repositorio: slug, fila válida/dañada y resumen.
- Store: carga, selección, edición, guardado y estado sucio.
- E2E (`e2e/pages.spec.ts`): plantilla → editar → guardar → publicar → abrir anónimo en 375/768/1280.
- `npm run verify:rls` amplía la matriz con páginas privadas y públicas.

## Limitaciones conocidas del Hito 1

- Sin anidación, drag & drop ni historial propio del builder.
- Sin formulario conectado a Supabase (Hito 2).
- Sin edición de listas complejas de planes/formularios desde el inspector (se completará).
- El tema se captura al crear la página; cambiarlo después no afecta a páginas existentes salvo que se edite el snapshot.
