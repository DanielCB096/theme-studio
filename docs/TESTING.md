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

| Fecha      | Fase | Comando                              | Resultado                       |
| ---------- | ---- | ------------------------------------ | ------------------------------- |
| 2026-11-24 | 0    | `lint`, `typecheck`, `test`, `build` | Pasa: 1 archivo / 1 prueba      |
| 2026-11-24 | 1    | `lint`, `typecheck`, `test`, `build` | Pasa: 5 archivos / 18 pruebas   |
| 2026-11-24 | 2    | `lint`, `typecheck`, `test`, `build` | Pasa: 8 archivos / 44 pruebas   |
| 2026-11-24 | 3    | `test`                               | Pasa: 9 archivos / 50 pruebas   |
| 2026-11-24 | 3    | `test:e2e`                           | Pasa: 2 pruebas (chromium)      |
| 2026-11-25 | 4    | `test`                               | Pasa: 17 archivos / 87 pruebas  |
| 2026-11-25 | 4    | `test:e2e`                           | Pasa: 4 pruebas (chromium)      |
| 2026-11-25 | 4    | `verify:rls`                         | Pasa: 9/9 comprobaciones        |
| 2026-11-25 | 5    | `test`                               | Pasa: 23 archivos / 125 pruebas |

## Pruebas de IA

- `src/lib/aiPalette.test.ts`: respuesta válida, rate limit, colores mal formados, JSON ilegible, 404, fallo de red y timeout, con `fetch` simulado.
- `api/generate-palette.test.ts`: método, prompt fuera de rango, claves extra, falta de configuración, JSON con markdown, respuesta inválida y límite por IP, con el SDK de Anthropic simulado.
- La llamada real al modelo no se ejecuta en las pruebas: requiere clave y consume cuota.

## Verificación de RLS

`npm run verify:rls` crea dos usuarios efímeros y comprueba la matriz de permisos directamente contra el proyecto configurado en `.env`:

- A guarda un tema privado y otro público.
- B no ve el privado, sí el público; no puede actualizarlo, borrarlo ni insertar a nombre de A.
- Un cliente anónimo solo ve el público.
- A conserva su tema intacto.

Requiere «Confirm email» desactivado para que `signUp` devuelva sesión. Los usuarios de prueba no se borran desde el cliente (necesitaría `service_role`): se limpian desde el dashboard.

## E2E con Supabase

`e2e/auth.spec.ts` y `e2e/share.spec.ts` crean usuarios reales `@example.com` y guardan temas. Se ejecutan contra el proyecto de `.env`; en CI necesitarán secretos o quedarán fuera del job hasta configurarlos.
