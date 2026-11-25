# Accesibilidad

## Compromisos

- Estructura semántica: un `h1` por vista, regiones con `main`/`nav`/`section` y encabezados jerárquicos.
- Todo control tiene etiqueta asociada (`<label for>` o `aria-labelledby`); los sliders exponen `aria-valuetext` legible.
- Foco visible en todos los elementos interactivos; nunca `outline: none` sin sustituto.
- Navegación completa por teclado, con `Ctrl/Cmd+Z` y `Ctrl/Cmd+Shift+Z` para undo/redo.
- Contraste: el verificador evalúa los pares texto/fondo y ofrece corrección automática.

## Contraste WCAG 2.x

Se usa la fórmula de la especificación WCAG 2.1:

```
L = 0.2126·R + 0.7152·G + 0.0722·B      (canales sRGB linealizados)
ratio = (L1 + 0.05) / (L2 + 0.05)       (L1 = luminancia más clara)
```

Umbrales:

| Nivel | Texto normal | Texto grande |
| ----- | ------------ | ------------ |
| AA    | ≥ 4.5:1      | ≥ 3:1        |
| AAA   | ≥ 7:1        | ≥ 4.5:1      |

Valores de referencia usados en pruebas: negro sobre blanco = 21:1; gris `#767676` sobre blanco ≈ 4.54:1.

## Implementación

`src/lib/contrast.ts` calcula la razón y clasifica el resultado:

- `AAA`: ≥ 7:1 (texto normal).
- `AA`: ≥ 4.5:1.
- `Solo texto grande`: ≥ 3:1; válido para texto ≥ 24 px o ≥ 18.66 px en negrita.
- `Falla`: por debajo de 3:1.

El panel (`src/features/accessibility/ContrastPanel.tsx`) evalúa cinco pares en vivo:

1. Texto sobre fondo.
2. Texto sobre superficie.
3. Atenuado sobre superficie.
4. Primario sobre fondo.
5. Texto del botón primario (se deriva del primario y siempre se recalcula).

Cada fila muestra la razón, un semáforo y, si no llega a AA, un botón **Corregir a AA** que ajusta la luminosidad conservando tono y saturación (`adjustForContrast`). Si el fondo es un gris medio y el objetivo es imposible, se devuelve el extremo con mayor contraste en lugar de un color que tampoco cumpliría.

Las paletas generadas por IA pasan por `ensureAccessibleColors` antes de mostrarse; la corrección se anuncia en la interfaz y queda en el historial, así que se puede deshacer.

Pruebas: `src/lib/contrast.test.ts`, `src/lib/palette.test.ts` y `src/features/accessibility/ContrastPanel.test.tsx` (valores de referencia, clasificación, corrección, panel y botón).
