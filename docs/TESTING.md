# Pruebas

## Estrategia

| Nivel       | Herramienta              | Qué cubre                                                      |
| ----------- | ------------------------ | -------------------------------------------------------------- |
| Unidad      | Vitest                   | Esquema Zod, contraste WCAG, conversión de color, exportadores |
| Componentes | Vitest + Testing Library | Controles del editor, galería, estados de error                |
| Store       | Vitest                   | Acciones, undo/redo, límite de historial, persistencia         |
| E2E         | Playwright               | Flujo de guardado y apertura de un tema compartido             |

Criterio de aceptación global: ≥ 70 % de cobertura en `src/lib` y `src/store` (Fase 6).

## Comandos

```bash
npm test
npm run test:watch
npm run test:coverage
npm run test:e2e
```

## Registro de ejecuciones

| Fecha      | Fase | Comando                              | Resultado              |
| ---------- | ---- | ------------------------------------ | ---------------------- |
| 2026-11-24 | 0    | `lint`, `typecheck`, `test`, `build` | Pendiente de registrar |
