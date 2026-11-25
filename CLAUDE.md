# AGENTS.md — Theme Studio: editor de temas con vista previa multidispositivo

> Este archivo es la especificación maestra del proyecto. Léelo completo antes de escribir código.
> Compatible con Claude Code (cópialo también como `CLAUDE.md`), Cursor, Copilot y otros agentes.

---

## 0. Prompt de arranque (pégalo en el agente)

```
Lee AGENTS.md completo. Construye el proyecto fase por fase, en orden.
Al terminar cada fase: ejecuta lint, typecheck y tests; actualiza PROGRESS.md y la
documentación afectada; haz un commit con Conventional Commits. No avances a la
siguiente fase si la actual no cumple sus criterios de aceptación.
Si algo requiere una credencial o decisión que no puedes tomar, detente y pregúntame.
```

---

## 1. Objetivo

Construir **Theme Studio**, una aplicación web donde el usuario personaliza visualmente el tema de una interfaz (colores, tipografía, bordes, espaciado, tamaño de componentes) y ve **en tiempo real** cómo se adapta a móvil, tableta y escritorio. Puede guardar, duplicar, exportar y compartir sus temas, y generar paletas con IA.

Es un **proyecto de portafolio** para un ingeniero en sistemas computacionales. Por eso importan tanto la calidad del código y la documentación como las funciones. Todo debe poder explicarse en una entrevista técnica.

**Habilidades que debe demostrar:** arquitectura de componentes, manejo de estado, diseño responsivo, accesibilidad, persistencia y autenticación, validación de datos externos, pruebas, CI/CD y despliegue.

---

## 2. Stack (no cambiar sin documentar en `docs/DECISIONS.md`)

| Área                | Tecnología                                                                                    |
| ------------------- | --------------------------------------------------------------------------------------------- |
| Build / framework   | Vite + React 18 + TypeScript (modo `strict`)                                                  |
| Estilos             | Tailwind CSS + variables CSS (design tokens)                                                  |
| Componentes         | shadcn/ui (Radix UI)                                                                          |
| Estado              | Zustand (con middleware `persist` y `temporal`/historial propio para undo/redo)               |
| Validación          | Zod                                                                                           |
| Backend / auth / BD | Supabase (Postgres + Auth + Row Level Security)                                               |
| IA                  | Función serverless (Vercel Function o Supabase Edge Function) que llama a la API de Anthropic |
| Pruebas             | Vitest + React Testing Library (unitarias/componentes), Playwright (1–2 pruebas E2E)          |
| Calidad             | ESLint, Prettier, Husky + lint-staged, Commitlint                                             |
| CI/CD               | GitHub Actions + despliegue en Vercel                                                         |
| Contenedor          | Dockerfile para desarrollo/build (opcional pero recomendado)                                  |

---

## 3. Reglas generales para el agente

1. **TypeScript estricto.** Prohibido `any` salvo justificación en comentario.
2. **Todo estilo sale de tokens.** No usar colores, radios ni espaciados "hardcodeados" en componentes; siempre variables CSS o clases de Tailwind mapeadas a ellas.
3. **Accesibilidad primero.** Elementos semánticos, etiquetas en controles, foco visible, navegación por teclado, `aria-*` donde corresponda.
4. **Seguridad.**
   - Nunca subir `.env` ni claves al repositorio. Crea `.env.example` con variables vacías.
   - La clave de la API de IA vive **solo en el servidor**. Jamás en el cliente.
   - En el cliente solo se usa la clave `anon` de Supabase, protegida con RLS.
   - Aplicar límite de peticiones (rate limit) a la función de IA.
5. **Todo dato externo se valida con Zod** (respuesta de IA, JSON importado, parámetros de enlaces compartidos).
6. **Commits pequeños** con Conventional Commits (`feat:`, `fix:`, `docs:`, `test:`, `chore:`, `refactor:`).
7. **No inventes.** Si no estás seguro de una API o versión, consulta la documentación oficial. No simules resultados de pruebas: ejecútalas.
8. **Idioma:** código, nombres y commits en inglés; documentación (`README`, `docs/`) en español.
9. **Mantén el alcance.** No agregues funciones fuera de este documento sin documentarlas en `docs/DECISIONS.md`.

---

## 4. Estructura de carpetas

```
theme-studio/
├─ .github/workflows/ci.yml
├─ docs/
│  ├─ ARCHITECTURE.md
│  ├─ DECISIONS.md          # ADRs: una entrada por decisión técnica
│  ├─ TESTING.md
│  ├─ ACCESSIBILITY.md
│  └─ assets/               # capturas, GIFs, diagramas
├─ api/                     # funciones serverless (generate-palette.ts)
├─ supabase/
│  └─ migrations/           # SQL versionado
├─ e2e/                     # pruebas Playwright
├─ src/
│  ├─ components/ui/        # shadcn/ui
│  ├─ features/
│  │  ├─ editor/            # panel de controles
│  │  ├─ preview/           # vista previa multidispositivo
│  │  ├─ themes/            # guardar, cargar, duplicar, exportar, compartir
│  │  ├─ ai/                # generador de paletas
│  │  └─ auth/
│  ├─ store/                # Zustand
│  ├─ lib/                  # contraste, conversión de color, export, validación
│  ├─ types/
│  └─ main.tsx
├─ AGENTS.md
├─ PROGRESS.md              # bitácora que el agente actualiza al final de cada fase
├─ CHANGELOG.md
├─ README.md
├─ .env.example
├─ Dockerfile
└─ package.json
```

---

## 5. Modelo de datos del tema

Definir en `src/types/theme.ts` y validar con Zod (`src/lib/themeSchema.ts`):

```ts
type Theme = {
  id: string;
  name: string;
  mode: "light" | "dark";
  colors: {
    primary: string; // hex, ej. "#2563eb"
    secondary: string;
    background: string;
    surface: string;
    text: string;
    muted: string;
    border: string;
    success: string;
    danger: string;
  };
  typography: {
    fontFamily: string; // lista blanca de fuentes seguras
    baseSize: number; // px, 12–20
    scale: number; // razón tipográfica, 1.1–1.5
  };
  shape: {
    radius: number; // px, 0–24
    borderWidth: number; // px, 0–4
  };
  spacing: {
    unit: number; // px, 2–8 (múltiplo base)
  };
  components: {
    buttonSize: "sm" | "md" | "lg";
    density: "compact" | "comfortable" | "spacious";
  };
};
```

Los valores se aplican como variables CSS en el contenedor de la vista previa: `--color-primary`, `--color-bg`, `--radius`, `--font-size-base`, `--space-unit`, etc.

### Esquema SQL (Supabase) — `supabase/migrations/001_themes.sql`

```sql
create table public.themes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  data jsonb not null,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.themes enable row level security;

create policy "owner can read own" on public.themes
  for select using (auth.uid() = user_id);
create policy "anyone can read public" on public.themes
  for select using (is_public = true);
create policy "owner can insert" on public.themes
  for insert with check (auth.uid() = user_id);
create policy "owner can update" on public.themes
  for update using (auth.uid() = user_id);
create policy "owner can delete" on public.themes
  for delete using (auth.uid() = user_id);
```

---

## 6. Fases de trabajo

Cada fase tiene tareas, criterios de aceptación y entregables de documentación. **No pases a la siguiente si no se cumplen.**

### Fase 0 — Inicialización (0.5 día)

- [ ] Crear proyecto con Vite + React + TS; configurar Tailwind, shadcn/ui, ESLint, Prettier, Husky, Commitlint.
- [ ] Configurar alias de importación `@/`.
- [ ] Crear `.env.example`, `.gitignore`, `PROGRESS.md`, `CHANGELOG.md`, esqueleto de `README.md` y de `docs/`.
- [ ] Configurar GitHub Actions: `lint`, `typecheck`, `test`, `build` en cada push y PR.

**Aceptación:** `npm run lint`, `npm run typecheck`, `npm test` y `npm run build` pasan en limpio y el CI está en verde.

### Fase 1 — Sistema de tokens (2–3 días)

- [ ] Definir el tema por defecto (claro y oscuro) y los tokens como variables CSS.
- [ ] Mapear los tokens en `tailwind.config` (colores, radios, espaciado, fuentes).
- [ ] Crear una **galería de componentes de muestra** que dependa exclusivamente de tokens: botones (3 tamaños), inputs, tarjeta, tabla, alerta, navegación, formulario, modal.
- [ ] Implementar el esquema Zod del tema y un tema por defecto validado.

**Aceptación:** al cambiar manualmente una variable CSS en DevTools, toda la galería se actualiza. Pruebas unitarias del esquema Zod (casos válidos e inválidos). Ningún componente contiene colores hardcodeados.

**Docs:** sección "Sistema de tokens" en `ARCHITECTURE.md` y ADR "Por qué variables CSS en lugar de estilos en línea o CSS-in-JS".

### Fase 2 — Panel de controles y estado (3–4 días)

- [ ] Store de Zustand con el tema actual, acciones tipadas (`setColor`, `setRadius`, `setTypography`, `reset`, etc.) y selectores.
- [ ] Controles: selector de color (con entrada hex), sliders (radio, borde, tamaño base, espaciado), selector de fuente, selector de densidad y tamaño de botón, alternador claro/oscuro.
- [ ] **Deshacer / rehacer** con historial acotado (máx. 50 estados) y atajos `Ctrl/Cmd+Z` y `Ctrl/Cmd+Shift+Z`.
- [ ] Los cambios se reflejan en tiempo real en la galería (sin recargar). Evitar renders innecesarios con selectores granulares.
- [ ] Autoguardado local (`persist`) del tema en curso.

**Aceptación:** pruebas de componentes de cada tipo de control; pruebas del store (acciones, undo/redo, límite de historial). Todos los controles son operables con teclado y tienen etiquetas.

**Docs:** ADR "Por qué Zustand" y diagrama del flujo de datos (control → store → variables CSS → vista previa) en `ARCHITECTURE.md`.

### Fase 3 — Vista previa multidispositivo (2–3 días)

- [ ] Componente `DevicePreview` con tres modos: móvil (375px), tableta (768px), escritorio (1280px) y un modo "libre" con ancho arrastrable.
- [ ] Marcos visuales simples para cada dispositivo; botón para rotar (vertical/horizontal).
- [ ] Renderizar la vista previa en un `iframe` aislado o en un contenedor con **container queries**. Documentar cuál se eligió y por qué.
- [ ] La galería debe reorganizarse de verdad con breakpoints y container queries (no solo escalarse).
- [ ] Vista "todas a la vez" que muestre los tres tamaños lado a lado.

**Aceptación:** al cambiar de dispositivo la disposición de los componentes cambia (por ejemplo, navegación lateral → menú hamburguesa, tabla → tarjetas). Pruebas que verifiquen los cambios por ancho.

**Docs:** ADR "iframe vs container queries"; GIF de la vista previa en el README.

### Fase 4 — Persistencia, autenticación y exportación (3–4 días)

- [ ] Autenticación con Supabase (email + enlace mágico o OAuth con GitHub). Rutas protegidas.
- [ ] Aplicar la migración SQL con RLS. Probar con dos usuarios que **no pueden ver ni editar** los temas del otro.
- [ ] CRUD de temas: guardar, listar, renombrar, duplicar, eliminar. Estados de carga, vacío y error.
- [ ] Exportar: **JSON**, **CSS** (variables en `:root`) y **configuración de Tailwind** (`theme.extend`). Botón de copiar y descargar.
- [ ] Importar JSON validado con Zod, con mensajes de error comprensibles.
- [ ] **Compartir por enlace:** marcar un tema como público y generar una URL `/t/:id` de solo lectura que cualquiera pueda abrir y duplicar.

**Aceptación:** pruebas unitarias de los tres exportadores (salida exacta esperada), pruebas del importador con entradas inválidas, y una prueba E2E del flujo: iniciar sesión → modificar → guardar → recargar → el tema persiste.

**Docs:** diagrama del modelo de datos y de la política RLS en `ARCHITECTURE.md`; sección de seguridad.

### Fase 5 — Funciones diferenciadoras (3–5 días)

**5.1 Verificador de accesibilidad (obligatorio)**

- [ ] Implementar en `src/lib/contrast.ts` el cálculo de **relación de contraste WCAG 2.x** (luminancia relativa y razón (L1+0.05)/(L2+0.05)).
- [ ] Evaluar los pares texto/fondo, texto/superficie, primario/fondo y botón/texto del botón. Mostrar nivel **AA / AAA** o fallo, con sugerencia de corrección automática (ajustar luminosidad hasta cumplir).
- [ ] Panel visible con semáforo de resultados.
- [ ] Pruebas con valores de referencia conocidos (por ejemplo, negro sobre blanco = 21:1).

**5.2 Generador de paletas con IA (obligatorio)**

- [ ] Función serverless `api/generate-palette` que reciba `{ prompt: string }`, valide con Zod (máx. 200 caracteres), llame a la API de Anthropic con un system prompt que exija **solo JSON** con el esquema de `colors`, y devuelva el resultado.
- [ ] En el cliente, **validar la respuesta con Zod antes de aplicarla**; si es inválida, mostrar error y no modificar el tema.
- [ ] Verificar el contraste del resultado y corregirlo automáticamente si no cumple AA.
- [ ] Rate limit por usuario/IP, timeout y manejo de errores. Botón de "aplicar" y de "deshacer" (usa el historial).
- [ ] Pruebas con la API de IA **simulada** (mock): respuesta válida, JSON inválido, respuesta con colores mal formados, error de red.

**5.3 Modo claro/oscuro automático**

- [ ] A partir de un tema, derivar su variante opuesta conservando la identidad de color.

**Aceptación:** todo lo anterior con pruebas; el README explica qué hace la IA y qué hace el código propio (validación, corrección de contraste).

**Docs:** `docs/ACCESSIBILITY.md` con la fórmula usada y ADR "Por qué validar la salida del modelo".

### Fase 6 — Calidad, rendimiento y despliegue (2 días)

- [ ] Cobertura de pruebas ≥ 70 % en `src/lib` y `src/store`; reportar en CI.
- [ ] 2 pruebas E2E con Playwright (flujo principal y tema compartido).
- [ ] Auditoría con Lighthouse: Accesibilidad ≥ 95, Buenas prácticas ≥ 90. Registrar resultados en `docs/TESTING.md`.
- [ ] Revisión de errores: Error Boundary global, estados vacíos, mensajes claros.
- [ ] Dockerfile funcional (`docker build` + `docker run`).
- [ ] Desplegar en Vercel con variables de entorno configuradas; añadir la URL al README.

**Aceptación:** la URL pública funciona de punta a punta; el CI está en verde; el README está completo.

---

## 7. Documentación obligatoria

### README.md (en español) debe incluir, en este orden

1. Título, descripción en una frase y **enlace a la demo**.
2. Captura de pantalla y **GIF** del editor en acción (`docs/assets/`).
3. Problema que resuelve y funciones principales.
4. Stack y por qué se eligió.
5. **Diagrama de arquitectura** (Mermaid).
6. Cómo ejecutarlo localmente (requisitos, variables de entorno, comandos) y con Docker.
7. Cómo correr las pruebas.
8. **Decisiones técnicas** (resumen con enlace a `docs/DECISIONS.md`).
9. Qué hace la IA en el proyecto y cómo se valida su salida.
10. Métricas: cobertura, Lighthouse, tiempo de respuesta de la función de IA.
11. Limitaciones conocidas y mejoras futuras.
12. **Lo que aprendí** (3–5 puntos honestos).
13. Licencia.

### docs/DECISIONS.md

Un ADR por decisión, con formato: **Contexto → Opciones consideradas → Decisión → Consecuencias**. Mínimo: variables CSS, Zustand, Supabase, iframe vs container queries, validación con Zod, ubicación de la clave de IA.

### docs/ARCHITECTURE.md

Diagramas Mermaid de: flujo de datos del editor, modelo de datos con RLS, flujo de la generación de paletas con IA, pipeline de CI/CD.

### PROGRESS.md

Al terminar cada fase, agregar: fecha, qué se hizo, qué pruebas se ejecutaron y su resultado, problemas encontrados, siguientes pasos. Debe ser honesto: si algo quedó pendiente, escribirlo.

### CHANGELOG.md

Formato _Keep a Changelog_.

---

## 8. Definición de "terminado"

- [ ] Todas las fases cumplen sus criterios de aceptación.
- [ ] CI en verde (lint, typecheck, tests, build).
- [ ] Sin secretos en el repositorio ni en el historial.
- [ ] Sin `any` injustificados ni `console.log` olvidados.
- [ ] README completo con demo, GIF y diagrama.
- [ ] Todas las decisiones relevantes están en `DECISIONS.md`.
- [ ] La aplicación está desplegada y probada en un móvil real o emulado.

---

## 9. Qué NO hacer

- No usar localStorage para guardar secretos o tokens manualmente (Supabase gestiona la sesión).
- No llamar a la API de IA desde el navegador.
- No aplicar la respuesta del modelo sin validarla.
- No dejar el README con texto de plantilla.
- No marcar tareas como hechas sin haber ejecutado las pruebas correspondientes.
- No agregar dependencias pesadas sin justificarlas en un ADR.

---

## Anexo A — Evolución a constructor de páginas (Page Builder)

> **Precedencia:** este anexo complementa el cuerpo principal y, donde lo contradiga, prevalece sobre él.
> Decisiones de alcance cerradas: no se cambian sin un nuevo ADR aprobado.

### A.1 Preparación

Antes de escribir código de producto:

1. Crear el tag anotado `v1.0-theme-editor` sobre `main`.
2. Crear la rama `feat/page-builder`.
3. Escribir el ADR de evolución del producto en `docs/DECISIONS.md`.
4. Abrir las secciones de Page Builder en `PROGRESS.md` y `CHANGELOG.md`.

### A.2 Alcance cerrado

1. **Páginas alojadas en `/p/:slug`**. No se genera código fuente (React/HTML) como entregable: la página se renderiza desde su JSON. La exportación e importación se limitan al **JSON de la página**.
2. **Backend solo Supabase** (Postgres + Auth + RLS). Nada de APIs externas arbitrarias ni claves de terceros en el cliente.
3. **Mismo repositorio**, rama `feat/page-builder`, con el tag `v1.0-theme-editor` creado antes de empezar.

Se conserva el editor de temas como pilar: sus tokens se aplican a las páginas y el tema se guarda como **snapshot** en la página.

### A.3 Principios técnicos obligatorios

- **Un único `PageRenderer`** para builder, vista previa y página publicada. Sin renderers duplicados.
- **Registro de bloques**: un archivo o carpeta por bloque con schema, defaults, renderer e inspector. El registro es la única fuente de tipos y metadatos.
- **Árbol normalizado**: los bloques viven en un mapa por id y el orden se expresa con ids; sin estructuras duplicadas ni índices frágiles.
- **Zod para todo lo que entra**: JSON de plantilla, importación, datos de Supabase, respuestas y parámetros de ruta.
- **Saneamiento de URLs**: solo `https:`, `http:`, `mailto:`, `tel:` y rutas internas; bloqueo explícito de `javascript:` y `data:`.
- Sin `dangerouslySetInnerHTML` ni HTML/CSS libres por bloque en el Hito 1.
- Accesibilidad: controles etiquetados, foco visible y navegación por teclado.

### A.4 Bloques y entregable del Hito 1

Máximo **9 tipos**: `navbar`, `hero`, `features`, `pricing`, `form`, `table`, `cta`, `footer`, `textImage`.

**Solo Hito 1.** No iniciar el Hito 2 hasta que el Hito 1 esté desplegado, probado, documentado y revisado.

Entregable: una **landing creada desde plantilla**, editada en el builder, guardada en Supabase, publicada en `/p/:slug` y visible correctamente en móvil, tableta y escritorio.

### A.5 Datos y RLS

Tabla `pages` con `user_id`, `name`, `slug` único, `data jsonb`, `theme jsonb` (snapshot), `is_public` y timestamps.

**Propuesta inicial pendiente de validación antes de ejecutar:**

```sql
create table public.pages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  data jsonb not null check (jsonb_typeof(data) = 'object'),
  theme jsonb not null check (jsonb_typeof(theme) = 'object'),
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select on public.pages to anon;
grant select, insert, update, delete on public.pages to authenticated;
```

Reglas: lectura privada solo para el dueño; lectura pública si `is_public = true`; insert solo con `user_id` propio; update y delete solo del dueño; `with check` en update; trigger `touch_updated_at`.

Si la revisión cambia estas políticas, se actualiza este anexo antes de la migración.

### A.6 Flujo de trabajo y paradas

- Al terminar el Hito 1: `lint`, `typecheck`, tests reales (sin simular), build y E2E; actualizar `docs/PAGE_BUILDER.md`, `DECISIONS.md`, `PROGRESS.md` y `README.md`; commits con Conventional Commits.
- **Detenerse y avisar** ante una credencial faltante, una decisión no cubierta o un problema de seguridad/diseño (incluidas las RLS de A.5).
- No avanzar al Hito 2 sin revisión humana del Hito 1.
