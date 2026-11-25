# Pruebas

## Estrategia

| Nivel       | Herramienta              | Qué cubre                                                      |
| ----------- | ------------------------ | -------------------------------------------------------------- |
| Unidad      | Vitest                   | Esquema Zod, contraste WCAG, conversión de color, exportadores |
| Componentes | Vitest + Testing Library | Controles del editor, galería, estados de error                |
| Store       | Vitest                   | Acciones, undo/redo, límite de historial, persistencia         |
| E2E         | Playwright               | Reflujo por ancho del marco y persistencia tras recarga        |

Criterio de aceptación global: ≥ 70 % de cobertura en `src/lib` y `src/store` (Fase 6).

## Comandos

```bash
npm test
npm run test:watch
npm run test:coverage
npm run test:e2e
```

Antes de la primera ejecución E2E: `npx playwright install chromium`. El config arranca Vite en `127.0.0.1:4173` y lo reutiliza si ya está en marcha. jsdom no calcula CSS, así que las container queries solo se verifican aquí.

## Registro de ejecuciones

| Fecha      | Fase | Comando                              | Resultado                                         |
| ---------- | ---- | ------------------------------------ | ------------------------------------------------- |
| 2026-11-24 | 0    | `lint`, `typecheck`, `test`, `build` | Pasa: 1 archivo / 1 prueba                        |
| 2026-11-24 | 1    | `lint`, `typecheck`, `test`, `build` | Pasa: 5 archivos / 18 pruebas                     |
| 2026-11-24 | 2    | `lint`, `typecheck`, `test`, `build` | Pasa: 8 archivos / 44 pruebas                     |
| 2026-11-24 | 3    | `test`                               | Pasa: 9 archivos / 50 pruebas                     |
| 2026-11-24 | 3    | `test:e2e`                           | Pasa: 2 pruebas (chromium)                        |
| 2026-11-25 | 4    | `test`                               | Pasa: 17 archivos / 87 pruebas                    |
| 2026-11-25 | 4    | `test:e2e`                           | Pasa: 4 pruebas (chromium)                        |
| 2026-11-25 | 4    | `verify:rls`                         | Pasa: 9/9 comprobaciones                          |
| 2026-11-25 | 5    | `test`                               | Pasa: 23 archivos / 128 pruebas                   |
| 2026-11-25 | 6    | `test`                               | Pasa: 24 archivos / 135 pruebas                   |
| 2026-11-25 | 6    | `test:coverage`                      | Pasa: 93,75 % líneas / 92,07 % ramas              |
| 2026-11-25 | 6    | `test:e2e`                           | Pasa: 5 pruebas (incluye Pixel 5 emulado)         |
| 2026-11-25 | 6    | Lighthouse (preview)                 | A11y 100 · Best Practices 100 · SEO 100           |
| 2026-11-25 | 6    | `check:deploy` (Vercel)              | Pasa: Supabase, login, IA y aplicación en preview |
| 2026-11-25 | A.1  | `test`                               | Pasa: 30 archivos / 162 pruebas                   |
| 2026-11-25 | A.1  | `test:e2e`                           | Pasa: 6 pruebas (incluye Page Builder)            |
| 2026-11-25 | A.1  | `verify:rls`                         | Pasa: 14/14 (temas + paginas)                     |

## Page Builder (Anexo A)

Pruebas añadidas en el Hito 1:

- `src/lib/pageSchema.test.ts`: plantilla válida, tipo desconocido, URL peligrosa, ids repetidos, huérfanos, anidación y tema inválido.
- `src/lib/url.test.ts`: protocolos permitidos y bloqueo de `javascript:`, `data:` y `//host`.
- `pageOps.test.ts`: añadir, quitar, mover, actualizar props, renombrar y límite de bloques.
- `PageRenderer.test.tsx`: bloques de la plantilla, enlaces seguros, selección accesible y estado vacío.
- `pageRepository.test.ts`: slug, fila válida/dañada y resumen.
- `pageBuilderStore.test.ts`: carga, selección, edición, guardado y estado sucio.
- `e2e/pages.spec.ts`: plantilla → editar hero → guardar → publicar → abrir `/p/:slug` en 375/768/1280.

Se ejecutaron tras aplicar `002_pages.sql`: 6/6 E2E y 14/14 comprobaciones RLS.

## Cobertura

Umbral mínimo en CI: **70 %** en `src/lib` y `src/store` (líneas, funciones, ramas y sentencias).

| Área  | Sentencias | Ramas   | Funciones | Líneas  |
| ----- | ---------- | ------- | --------- | ------- |
| lib   | 93,51 %    | 91,72 % | 92,10 %   | 93,51 % |
| store | 94,59 %    | 92,98 % | 91,66 %   | 94,59 % |
| total | 93,75 %    | 92,07 % | 91,93 %   | 93,75 % |

Los huecos restantes son `file.ts` (descarga en navegador) y `supabase.ts` (creación del cliente), que dependen de APIs del navegador y del entorno.

## Lighthouse

Ejecutado con Lighthouse sobre el build de producción servido por `vite preview`:

| Categoría        | Puntuación |
| ---------------- | ---------- |
| Accesibilidad    | 100        |
| Buenas prácticas | 100        |
| SEO              | 100        |

El primer intento dio SEO 80 por falta de `robots.txt`; se añadió `public/robots.txt` y se repitió.

## Docker

Verificado en local:

```bash
docker build -t theme-studio .
docker run --rm -p 8080:80 theme-studio   # responde 200 y sirve la SPA
```

Con configuración de Supabase, las variables viajan como secreto de BuildKit (no quedan en capas ni en el historial):

```bash
docker build --secret id=vite_env,src=.env -t theme-studio .
```

Se comprobó dentro del contenedor que el bundle incluía la URL de Supabase en el segundo caso.

## Pruebas de IA

- `src/lib/aiPalette.test.ts`: respuesta válida, rate limit, colores mal formados, JSON ilegible, 404, fallo de red y timeout, con `fetch` simulado.
- `api/generate-palette.test.ts`: método, prompt fuera de rango, claves extra, falta de configuración, JSON con markdown, respuesta inválida, error del proveedor, fallo de red, límite por IP y caché en servidor, con `fetch` simulado.
- La llamada real al modelo no se ejecuta en las pruebas: requiere clave y consume cuota. Se comprueba a mano con `npm run smoke:ai` (HTTP 200 en ~1,5 s con `gemini-3.5-flash-lite`).

## Verificación de RLS

`npm run verify:rls` crea dos usuarios efímeros y comprueba la matriz de permisos directamente contra el proyecto configurado en `.env`:

- A guarda un tema privado y otro público.
- B no ve el privado, sí el público; no puede actualizarlo, borrarlo ni insertar a nombre de A.
- Un cliente anónimo solo ve el público.
- A conserva su tema intacto.

Requiere «Confirm email» desactivado para que `signUp` devuelva sesión. Los usuarios de prueba no se borran desde el cliente (necesitaría `service_role`): se limpian desde el dashboard.

## E2E con Supabase

`e2e/mobile.spec.ts` comprueba en un Pixel 5 emulado que no hay scroll horizontal y que los controles funcionan. `e2e/auth.spec.ts` y `e2e/share.spec.ts` reutilizan una cuenta fija (`theme-studio-e2e@example.com`) y la crean solo si no existe, para no chocar con el límite de correos de Supabase. Se ejecutan contra el proyecto de `.env`; en CI necesitan secretos o quedan fuera del job.
