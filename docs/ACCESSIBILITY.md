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

Implementación y pruebas: `src/lib/contrast.ts` (Fase 5).
