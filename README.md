# Theme Studio

[![CI](https://github.com/DanielCB096/theme-studio/actions/workflows/ci.yml/badge.svg)](https://github.com/DanielCB096/theme-studio/actions/workflows/ci.yml)
[![Demo](https://img.shields.io/badge/demo-Vercel-000000?logo=vercel)](https://theme-studio-queserabernal.vercel.app)

Editor visual de temas que aplica tus decisiones de diseÃ±o **en tiempo real** sobre una galerÃ­a de componentes, con vista previa simultÃ¡nea en mÃ³vil, tableta y escritorio.

> Demo: **https://theme-studio-queserabernal.vercel.app**

![Editor de Theme Studio con vista previa de escritorio y panel de accesibilidad](docs/assets/editor.png)

![Paleta generada y aplicada desde el panel de IA](docs/assets/demo.png)

## Problema que resuelve

Elegir una paleta, una escala tipogrÃ¡fica y un radio de borde "a ojo" y descubrir en producciÃ³n que la interfaz se rompe en mÃ³vil. Theme Studio separa las decisiones de diseÃ±o (tokens) de su aplicaciÃ³n: editas tokens, ves el resultado en tres anchos reales y exportas el tema como CSS, JSON o configuraciÃ³n de Tailwind.

## Funciones principales

- Editor de tokens: colores, tipografÃ­a, radios, bordes, espaciado y densidad.
- Vista previa multidispositivo (375 / 768 / 1280 px y ancho libre) con container queries.
- Deshacer / rehacer con historial acotado y atajos de teclado.
- Verificador de contraste WCAG 2.x con correcciÃ³n sugerida.
- Variante clara/oscura derivada conservando la identidad de color.
- GeneraciÃ³n de paletas con IA, validada y corregida antes de aplicarla.
- Guardar, duplicar, exportar e importar temas; compartir por enlace de solo lectura.
- **Constructor de pÃ¡ginas**: landing desde plantilla, 9 tipos de bloque, ediciÃ³n de contenido, publicaciÃ³n en `/p/:slug` y vista previa mÃ³vil/tableta/escritorio.

## Constructor de pÃ¡ginas

Con una cuenta, entra en **PÃ¡ginas â†’ Nueva pÃ¡gina**: se crea una landing desde plantilla con nueve tipos de bloque (navbar, hero, features, pricing, form, table, cta, footer, textImage). Puedes aÃ±adir, reordenar y eliminar bloques, editar sus propiedades, verla en mÃ³vil/tableta/escritorio, guardarla en Supabase y publicarla en `/p/:slug`.

GuÃ­a y alcance: [`docs/PAGE_BUILDER.md`](docs/PAGE_BUILDER.md).

## Stack

| Ãrea        | TecnologÃ­a                           | Motivo                                           |
| ----------- | ------------------------------------- | ------------------------------------------------ |
| Build       | Vite + React 18 + TypeScript strict   | Feedback loop rÃ¡pido y tipado real              |
| Estilos     | Tailwind CSS + variables CSS          | Tokens en runtime sin CSS-in-JS                  |
| Componentes | shadcn/ui (Radix UI)                  | Accesibilidad de Radix sin lock-in               |
| Estado      | Zustand                               | Store pequeÃ±o, selectores granulares            |
| ValidaciÃ³n | Zod                                   | Una sola fuente de verdad para datos externos    |
| Backend     | Supabase (Postgres + Auth + RLS)      | Persistencia y autorizaciÃ³n sin servidor propio |
| IA          | FunciÃ³n serverless + API de Gemini   | Clave y cuota solo en servidor                   |
| Pruebas     | Vitest + Testing Library + Playwright | Unidad, componentes y flujo E2E                  |

Decisiones y alternativas descartadas: [`docs/DECISIONS.md`](docs/DECISIONS.md).
Alcance del Page Builder: **Anexo A** en [`AGENTS.md`](AGENTS.md) y guÃ­a tÃ©cnica en [`docs/PAGE_BUILDER.md`](docs/PAGE_BUILDER.md).

## Arquitectura

```mermaid
flowchart LR
  UI[Panel de controles] -->|acciones tipadas| Store[(Zustand store)]
  Store -->|selector| Vars[Aplicador de variables CSS]
  Vars --> Gallery[GalerÃ­a de componentes]
  Vars --> Preview[Vista previa multidispositivo]
  Store -.->|persist| LS[(localStorage)]
  Store -->|guardar| SB[(Supabase Â· temas)]
  API[POST /api/generate-palette] -->|JSON validado con Zod| Store
```

Detalle en [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## QuÃ© hace la IA y quÃ© hace el cÃ³digo propio

**La IA** interpreta una descripciÃ³n en lenguaje natural (Â«atardecer mediterrÃ¡neo, sereno y cÃ¡lidoÂ») y propone nueve colores con una forma concreta.

**El cÃ³digo** hace todo lo demÃ¡s:

- Valida el prompt con Zod (3â€“200 caracteres) y limita a 8 peticiones por IP cada 10 minutos.
- Llama a Gemini (nivel gratuito) con timeout y sin exponer la clave (vive solo en la funciÃ³n serverless).
- Extrae el objeto JSON de la respuesta (aunque venga con markdown) y lo valida con Zod.
- Vuelve a validar en el cliente antes de enseÃ±ar nada.
- Corrige automÃ¡ticamente el contraste AA de texto y primario, conservando el tono.
- No aplica nada hasta que pulsas Â«AplicarÂ»; queda en el historial para deshacer.

Una respuesta invÃ¡lida no modifica el tema: se muestra el error y tu trabajo sigue intacto.

**Reserva local.** Si el proveedor no responde (el nivel gratuito devuelve 503 con frecuencia), la funciÃ³n prueba otros modelos y, como Ãºltimo recurso, genera una paleta determinista a partir del prompt. La interfaz la marca como Â«Modo local (sin IA)Â»: nunca se presenta como generaciÃ³n del modelo. Esa paleta tambiÃ©n pasa por la validaciÃ³n y la correcciÃ³n de contraste.

**CachÃ© en dos capas.** Las paletas reales se guardan 24 h en memoria de la funciÃ³n (50 entradas por instancia) y en `localStorage` del navegador (20 entradas). Repetir el mismo prompt no consume cuota ni vuelve a llamar al modelo; la UI indica cuando la paleta viene de cachÃ©. La reserva local no se cachea, para que el siguiente intento pueda volver a usar la IA.

## Ejecutar en local

Requisitos: Node 20.19+ y npm 10+.

```bash
npm install
cp .env.example .env   # rellena Supabase; la clave de IA solo va en el servidor
npm run dev
```

La IA usa una funciÃ³n serverless: en local necesitas `vercel dev` (y `GEMINI_API_KEY` + `GEMINI_MODEL` en `.env`). Con `npm run dev`, el resto de la app funciona y el panel de IA explica que el endpoint no estÃ¡ disponible.

Comandos:

| Comando                 | QuÃ© hace                              |
| ----------------------- | -------------------------------------- |
| `npm run dev`           | Servidor de desarrollo                 |
| `npm run build`         | Typecheck + build de producciÃ³n       |
| `npm run preview`       | Sirve el build                         |
| `npm run lint`          | ESLint (0 warnings permitidos)         |
| `npm run typecheck`     | `tsc --noEmit`                         |
| `npm test`              | Vitest una vez                         |
| `npm run test:coverage` | Vitest con cobertura                   |
| `npm run test:e2e`      | Playwright (reflujo, auth y compartir) |
| `npm run verify:rls`    | Matriz RLS con dos usuarios reales     |

Antes de la primera ejecuciÃ³n E2E: `npx playwright install chromium`.

Las pruebas E2E de auth y comparticiÃ³n necesitan `.env` con el proyecto Supabase y Â«Confirm emailÂ» desactivado (ver [`docs/TESTING.md`](docs/TESTING.md)).

### Docker

```bash
docker build -t theme-studio .
docker run --rm -p 8080:80 theme-studio
```

Para incluir la configuraciÃ³n de Supabase en el build (como secreto de BuildKit, sin dejarla en capas):

```bash
docker build --secret id=vite_env,src=.env -t theme-studio .
docker run --rm -p 8080:80 theme-studio
```

## MÃ©tricas

| MÃ©trica                          | Valor                                                        |
| --------------------------------- | ------------------------------------------------------------ |
| Cobertura `src/lib` + `src/store` | 93,75 % de lÃ­neas Â· 92,07 % de ramas                       |
| Lighthouse Â· Accesibilidad       | 100                                                          |
| Lighthouse Â· Buenas prÃ¡cticas   | 100                                                          |
| Lighthouse Â· SEO                 | 100                                                          |
| Chunk mayor                       | 231 kB (60 kB gzip, vendor Supabase)                         |
| Pruebas                           | 162 unitarias/componentes Â· 6 E2E (Page Builder) Â· 14 RLS  |
| Respuesta de la IA                | 2â€“22 s segÃºn el modelo disponible; reserva local si falla |

## Pruebas

Ver [`docs/TESTING.md`](docs/TESTING.md).

## Seguridad

- La clave de Gemini vive solo en la funciÃ³n serverless (`api/`), nunca en el bundle.
- El cliente usa Ãºnicamente la clave pÃºblica (`publishable`/`anon`) de Supabase; RLS restringe cada fila a su dueÃ±o. La matriz se verifica con dos usuarios reales (`npm run verify:rls`).
- Las polÃ­ticas de `update` incluyen `with check`, asÃ­ que un dueÃ±o no puede transferir sus filas a otro usuario.
- Todo dato externo (respuesta de IA, JSON importado, enlaces compartidos, `data` leÃ­do de la base de datos) se valida con Zod.
- **En la demo** Â«Confirm emailÂ» estÃ¡ desactivado en Supabase para permitir el registro automatizado. Antes de un uso real hay que reactivarlo (ADR-010).

## Limitaciones conocidas

- **Enlace mÃ¡gico en producciÃ³n**: su destino depende de _Redirect URLs_ en Supabase. Si no aÃ±ades `https://theme-studio-queserabernal.vercel.app/**`, el correo apuntarÃ¡ a `localhost`. El acceso con contraseÃ±a sÃ­ funciona en la demo.
- El nivel gratuito de Gemini devuelve 503 con frecuencia; la funciÃ³n prueba varios modelos y, si todos fallan, responde con la reserva local etiquetada como tal.
- El rate limit de la IA vive en memoria: no es global entre instancias serverless ni sustituye a una cuota de producciÃ³n.
- Â«Confirm emailÂ» estÃ¡ desactivado en Supabase para permitir los E2E; es un tradeoff de demo, no una configuraciÃ³n recomendable en producciÃ³n.
- Los E2E usan una cuenta fija (`theme-studio-e2e@example.com`) y crean temas de prueba; los temas se pueden borrar desde la cuenta y las cuentas antiguas desde el dashboard.
- Tailwind 3: la migraciÃ³n a Tailwind 4 (`@theme`) queda como mejora futura.
- El SDK de Supabase se carga en el bundle inicial; se podrÃ­a diferir hasta la primera acciÃ³n de cuenta.

## Lo que aprendÃ­

- **Las container queries bastan para una vista previa propia**, pero jsdom no calcula CSS: sin Playwright, el reflujo por ancho serÃ­a una promesa sin evidencia.
- **RLS se demuestra con dos usuarios reales**, no con la interfaz. AÃ±adir `with check` al `update` fue la diferencia entre Â«no ves filas ajenasÂ» y Â«no puedes apropiÃ¡rtelasÂ».
- **La salida de un modelo necesita validaciÃ³n doble y una correcciÃ³n posterior**: la paleta mÃ¡s bonita es inÃºtil si el texto no se lee.
- **El historial necesita coalescencia**: sin agrupar arrastres, deshacer deja de ser una herramienta y se convierte en un castigo.
- **Aislar el proveedor de IA en una funciÃ³n** permitiÃ³ cambiar de Anthropic a Gemini sin tocar el editor y sin poner la clave en el navegador. AÃ±adir una reserva local hizo que la demo sobreviviera a los 503 del nivel gratuito sin mentir al usuario.

## Licencia

MIT.
