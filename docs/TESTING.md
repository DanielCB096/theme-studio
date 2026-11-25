# Pruebas

## Estrategia

| Nivel       | Herramienta              | QuÃ© cubre                                                      |
| ----------- | ------------------------ | --------------------------------------------------------------- |
| Unidad      | Vitest                   | Esquema Zod, contraste WCAG, conversiÃ³n de color, exportadores |
| Componentes | Vitest + Testing Library | Controles del editor, galerÃ­a, estados de error                |
| Store       | Vitest                   | Acciones, undo/redo, lÃ­mite de historial, persistencia         |
| E2E         | Playwright               | Reflujo por ancho del marco y persistencia tras recarga         |

Criterio de aceptaciÃ³n global: â‰¥ 70 % de cobertura en `src/lib` y `src/store` (Fase 6).

## Comandos

```bash
npm test
npm run test:watch
npm run test:coverage
npm run test:e2e
```

Antes de la primera ejecuciÃ³n E2E: `npx playwright install chromium`. El config arranca Vite en `127.0.0.1:4173` y lo reutiliza si ya estÃ¡ en marcha. jsdom no calcula CSS, asÃ­ que las container queries solo se verifican aquÃ­.

## Registro de ejecuciones

| Fecha      | Fase | Comando                              | Resultado                                          |
| ---------- | ---- | ------------------------------------ | -------------------------------------------------- |
| 2026-11-24 | 0    | `lint`, `typecheck`, `test`, `build` | Pasa: 1 archivo / 1 prueba                         |
| 2026-11-24 | 1    | `lint`, `typecheck`, `test`, `build` | Pasa: 5 archivos / 18 pruebas                      |
| 2026-11-24 | 2    | `lint`, `typecheck`, `test`, `build` | Pasa: 8 archivos / 44 pruebas                      |
| 2026-11-24 | 3    | `test`                               | Pasa: 9 archivos / 50 pruebas                      |
| 2026-11-24 | 3    | `test:e2e`                           | Pasa: 2 pruebas (chromium)                         |
| 2026-11-25 | 4    | `test`                               | Pasa: 17 archivos / 87 pruebas                     |
| 2026-11-25 | 4    | `test:e2e`                           | Pasa: 4 pruebas (chromium)                         |
| 2026-11-25 | 4    | `verify:rls`                         | Pasa: 9/9 comprobaciones                           |
| 2026-11-25 | 5    | `test`                               | Pasa: 23 archivos / 128 pruebas                    |
| 2026-11-25 | 6    | `test`                               | Pasa: 24 archivos / 135 pruebas                    |
| 2026-11-25 | 6    | `test:coverage`                      | Pasa: 93,75 % lÃ­neas / 92,07 % ramas              |
| 2026-11-25 | 6    | `test:e2e`                           | Pasa: 5 pruebas (incluye Pixel 5 emulado)          |
| 2026-11-25 | 6    | Lighthouse (preview)                 | A11y 100 Â· Best Practices 100 Â· SEO 100          |
| 2026-11-25 | 6    | `check:deploy` (Vercel)              | Pasa: Supabase, login, IA y aplicaciÃ³n en preview |
| 2026-11-25 | A.1  | `test`                               | Pasa: 30 archivos / 165 pruebas                    |
| 2026-11-25 | A.1  | `test:e2e`                           | Pasa: 6 pruebas (incluye Page Builder)             |
| 2026-11-25 | A.1  | `verify:rls`                         | Pasa: 14/14 (temas + paginas)                      |

## Page Builder (Anexo A)

Pruebas aÃ±adidas en el Hito 1:

- `src/lib/pageSchema.test.ts`: plantilla vÃ¡lida, tipo desconocido, URL peligrosa, ids repetidos, huÃ©rfanos, anidaciÃ³n y tema invÃ¡lido.
- `src/lib/url.test.ts`: protocolos permitidos y bloqueo de `javascript:`, `data:` y `//host`.
- `pageOps.test.ts`: aÃ±adir, quitar, mover, actualizar props, renombrar y lÃ­mite de bloques.
- `PageRenderer.test.tsx`: bloques de la plantilla, enlaces seguros, selecciÃ³n accesible y estado vacÃ­o.
- `pageRepository.test.ts`: slug, fila vÃ¡lida/daÃ±ada y resumen.
- `pageBuilderStore.test.ts`: carga, selecciÃ³n, ediciÃ³n, guardado y estado sucio.
- `e2e/pages.spec.ts`: plantilla â†’ editar hero â†’ guardar â†’ publicar â†’ abrir `/p/:slug` en 375/768/1280.

Se ejecutaron tras aplicar `002_pages.sql`: 6/6 E2E y 14/14 comprobaciones RLS.

## Cobertura

Umbral mÃ­nimo en CI: **70 %** en `src/lib` y `src/store` (lÃ­neas, funciones, ramas y sentencias).

| Ãrea  | Sentencias | Ramas   | Funciones | LÃ­neas |
| ----- | ---------- | ------- | --------- | ------- |
| lib   | 93,51 %    | 91,72 % | 92,10 %   | 93,51 % |
| store | 94,59 %    | 92,98 % | 91,66 %   | 94,59 % |
| total | 93,75 %    | 92,07 % | 91,93 %   | 93,75 % |

Los huecos restantes son `file.ts` (descarga en navegador) y `supabase.ts` (creaciÃ³n del cliente), que dependen de APIs del navegador y del entorno.

## Lighthouse

Ejecutado con Lighthouse sobre el build de producciÃ³n servido por `vite preview`:

| CategorÃ­a        | PuntuaciÃ³n |
| ----------------- | ----------- |
| Accesibilidad     | 100         |
| Buenas prÃ¡cticas | 100         |
| SEO               | 100         |

El primer intento dio SEO 80 por falta de `robots.txt`; se aÃ±adiÃ³ `public/robots.txt` y se repitiÃ³.

## Docker

Verificado en local:

```bash
docker build -t theme-studio .
docker run --rm -p 8080:80 theme-studio   # responde 200 y sirve la SPA
```

Con configuraciÃ³n de Supabase, las variables viajan como secreto de BuildKit (no quedan en capas ni en el historial):

```bash
docker build --secret id=vite_env,src=.env -t theme-studio .
```

Se comprobÃ³ dentro del contenedor que el bundle incluÃ­a la URL de Supabase en el segundo caso.

## Pruebas de IA

- `src/lib/aiPalette.test.ts`: respuesta vÃ¡lida, rate limit, colores mal formados, JSON ilegible, 404, fallo de red y timeout, con `fetch` simulado.
- `api/generate-palette.test.ts`: mÃ©todo, prompt fuera de rango, claves extra, falta de configuraciÃ³n, JSON con markdown, respuesta invÃ¡lida, error del proveedor, fallo de red, lÃ­mite por IP y cachÃ© en servidor, con `fetch` simulado.
- La llamada real al modelo no se ejecuta en las pruebas: requiere clave y consume cuota. Se comprueba a mano con `npm run smoke:ai` (HTTP 200 en ~1,5 s con `gemini-3.5-flash-lite`).

## VerificaciÃ³n de RLS

`npm run verify:rls` crea dos usuarios efÃ­meros y comprueba la matriz de permisos directamente contra el proyecto configurado en `.env`:

- A guarda un tema privado y otro pÃºblico.
- B no ve el privado, sÃ­ el pÃºblico; no puede actualizarlo, borrarlo ni insertar a nombre de A.
- Un cliente anÃ³nimo solo ve el pÃºblico.
- A conserva su tema intacto.

Requiere Â«Confirm emailÂ» desactivado para que `signUp` devuelva sesiÃ³n. Los usuarios de prueba no se borran desde el cliente (necesitarÃ­a `service_role`): se limpian desde el dashboard.

## E2E con Supabase

`e2e/mobile.spec.ts` comprueba en un Pixel 5 emulado que no hay scroll horizontal y que los controles funcionan. `e2e/auth.spec.ts` y `e2e/share.spec.ts` reutilizan una cuenta fija (`theme-studio-e2e@example.com`) y la crean solo si no existe, para no chocar con el lÃ­mite de correos de Supabase. Se ejecutan contra el proyecto de `.env`; en CI necesitan secretos o quedan fuera del job.
