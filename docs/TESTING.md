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

| Fecha      | Fase | Comando                              | Resultado                     |
| ---------- | ---- | ------------------------------------ | ----------------------------- |
| 2026-11-24 | 0    | `lint`, `typecheck`, `test`, `build` | Pasa: 1 archivo / 1 prueba    |
| 2026-11-24 | 1    | `lint`, `typecheck`, `test`, `build` | Pasa: 5 archivos / 18 pruebas |
| 2026-11-24 | 2    | `lint`, `typecheck`, `test`, `build` | Pasa: 8 archivos / 44 pruebas |
| 2026-11-24 | 3    | `test`                               | Pasa: 9 archivos / 50 pruebas |
| 2026-11-24 | 3    | `test:e2e`                           | Pasa: 2 pruebas (chromium)    |
