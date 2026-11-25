# Registro de decisiones de arquitectura (ADR)

Formato: **Contexto → Opciones consideradas → Decisión → Consecuencias**.
Una entrada por decisión, en orden cronológico.

## ADR-001 · React 18 + Vite + TypeScript estricto como base

**Contexto.** El proyecto debe demostrar arquitectura de componentes y tipado real, no solo aparente, y a la vez ser desplegable en Vercel sin servidor propio.

**Opciones consideradas.**

1. Next.js (SSR + rutas + API incluidas).
2. Vite + React SPA.
3. Astro con islas.

**Decisión.** Vite + React 18 con TypeScript en modo `strict`. La aplicación es una herramienta con estado intensivo en el cliente; no necesita SSR ni SEO. Las funciones serverless puntuales (IA) se resuelven con una Vercel Function separada.

**Consecuencias.**

- Arranque y HMR muy rápidos; el bundle inicial es pequeño.
- Hay que resolver rutas y auth en cliente (`react-router-dom`) en lugar de heredarlos del framework.
- React 18 en lugar de 19 para máxima compatibilidad con Radix y Testing Library; actualizar es una tarea aislada.

## ADR-002 · Tailwind CSS 3 con tokens como variables CSS

**Contexto.** Los tokens del tema cambian en runtime y deben afectar a toda la interfaz sin recompilar CSS.

**Opciones consideradas.**

1. Tailwind 4 con `@theme` (CSS-first).
2. Tailwind 3 con `tailwind.config.ts`.
3. CSS-in-JS (styled-components / Emotion).

**Decisión.** Tailwind 3.4. Los valores del tema se publican como variables CSS (`--color-primary`, `--radius`, …) y `tailwind.config.ts` mapea clases a esas variables. Así una clase como `bg-primary` sigue funcionando aunque el valor cambie en caliente.

**Consecuencias.**

- Los componentes no contienen valores literales: todo degrada a variables.
- La exportación a "configuración de Tailwind" es natural porque el proyecto ya usa ese formato.
- Tailwind 4 (CSS-first) queda como mejora futura documentada: migrar requiere reemplazar el config por `@theme` y revisar la sintaxis de utilidades.
- Las container queries no son core en Tailwind 3: se usa el plugin oficial `@tailwindcss/container-queries` (dependencia de desarrollo, sin coste en el bundle).

## ADR-003 · Estado del editor con Zustand

**Contexto.** Muchos controles independientes escriben sobre un mismo tema; la vista previa y la galería deben suscribirse de forma granular.

**Opciones consideradas.**

1. Context + `useReducer`.
2. Redux Toolkit.
3. Zustand.

**Decisión.** Zustand con selectores por campo, middleware `persist` para el borrador local y un historial propio (máx. 50 estados) para undo/redo.

**Consecuencias.**

- Cero providers y renders mínimos: cada control se suscribe a su slice.
- El historial es explícito y probable; no dependemos de middleware temporal.
- Persistir solo el tema en curso, nunca tokens de sesión.
- Se agrupan los cambios de una misma propiedad dentro de una ventana de 600 ms; sin esa coalescencia, arrastrar un slider llenaría el historial y `Ctrl+Z` dejaría de ser útil.
- El borrador rehidratado se valida con Zod. Un JSON manipulado o de una versión anterior se ignora, con el coste asumido de perder ese borrador.

## ADR-004 · Container queries en lugar de iframe para la vista previa

**Contexto.** La vista previa debe mostrar la misma galería a 375, 768 y 1280 px y reorganizarse de verdad (no escalarse). Hay que decidir cómo aislar el layout de la vista previa del layout del editor.

**Opciones consideradas.**

1. **`<iframe>`** con la galería dentro.
2. **Shadow DOM** con estilos encapsulados.
3. **Container queries** sobre un contenedor de ancho fijo.

**Decisión.** Container queries (`@container` + variantes `@sm/@md/@xl/@2xl`), con el plugin oficial `@tailwindcss/container-queries` para Tailwind 3. El marco fija el ancho del dispositivo y la galería responde a ese ancho; si no cabe en pantalla, se escala visualmente con `transform: scale()` sin alterar el layout interno.

**Consecuencias.**

- Los tokens son variables CSS heredadas: no hay que inyectar CSS ni sincronizar nada entre documentos. En un iframe habría que copiar variables y escuchar cambios por `postMessage`.
- El árbol de accesibilidad es único: lectores de pantalla y pruebas pueden inspeccionar la galería directamente.
- Menos complejidad: sin `onload`, sin recarga del iframe al cambiar el tema y sin parpadeo.
- A cambio, el CSS del editor podría filtrarse a la galería (lo controlamos: no hay estilos globales agresivos) y las media queries de viewport dentro de la galería seguirían refiriéndose al navegador real; por eso la galería usa **solo** container queries.
- El aislamiento real de terceros o de estilos hostiles requeriría un iframe; no es el caso de una galería propia.

## ADR-005 · Historial propio con ventana de agrupación

**Contexto.** El editor necesita undo/redo predecible y acotado.

**Opciones consideradas.**

1. Middleware `temporal` de Zustand (zundo).
2. Historial propio dentro del store.
3. Historial por comandos (patrón command).

**Decisión.** Historial propio: `past`/`future` en el store, límite de 50, agrupación de cambios de la misma propiedad dentro de 600 ms. Sin dependencia extra.

**Consecuencias.**

- Control total del tamaño y de la semántica de "un paso".
- Arrastrar un slider genera un solo paso; escribir un hex completo, uno.
- Los cambios de propiedad distinta nunca se agrupan, así el deshacer es comprensible.
- Reimplementar `zundo` no aporta valor aquí; el store es pequeño y probado.

## ADR-006 · Escalado visual del marco, no zoom del contenido

**Contexto.** El escritorio mide 1280 px y la zona de vista previa suele ser menor.

**Opciones consideradas.**

1. Scroll horizontal a tamaño real.
2. `zoom`/`transform: scale()` del marco.
3. Reducir el ancho del dispositivo.

**Decisión.** Escalar el marco con `transform: scale()`, calculado con `ResizeObserver`. El ancho real pasado a la galería sigue siendo el del dispositivo, de modo que las container queries calculan el layout correcto.

**Consecuencias.**

- Se ve el diseño completo sin scroll horizontal y el layout no se falsea.
- El texto se reduce (con un mínimo de escala del 15 %); el rótulo indica el porcentaje.
- En el modo "todas", cada marco se escala de forma independiente, lo que permite comparar los tres anchos a la vez.

## ADR-007 · Playwright contra el servidor de desarrollo

**Contexto.** Las container queries y el reflujo no se pueden verificar en jsdom: no calcula estilos.

**Opciones consideradas.**

1. Confiar solo en pruebas unitarias de anchos de marco.
2. Playwright contra `vite preview` (requiere build).
3. Playwright contra `vite dev`.

**Decisión.** Playwright arranca `vite dev` en `127.0.0.1:4173` (puerto fijo, `--strictPort`). El build de producción se valida por separado en CI.

**Consecuencias.**

- Las pruebas E2E comprueban CSS real: tabla oculta y menú visible a 375 px.
- Se evita pagar un build en cada ejecución local.
- CI instalará Chromium y ejecutará las mismas pruebas.

## ADR-008 · Supabase para auth, base de datos y RLS

**Contexto.** El proyecto necesita cuentas, persistencia por usuario y una autorización que no dependa de código de cliente. También debe poder demostrarse con dos usuarios sin montar un backend propio.

**Opciones consideradas.**

1. Firebase (Firestore + Auth).
2. Backend propio (Node + Postgres) con sesiones.
3. Supabase (Postgres + Auth + Row Level Security).

**Decisión.** Supabase. El cliente usa solo la clave pública `publishable`/`anon`; todas las reglas viven en políticas RLS de Postgres.

**Consecuencias.**

- La autorización es comprobable en la base de datos, no en el bundle: se validó con dos usuarios reales (9/9 comprobaciones) que nadie lee ni modifica filas ajenas.
- La clave pública puede estar en el cliente sin riesgo mientras RLS esté bien definida; la `service_role` nunca se usa en la app.
- Menos código propio: sin API intermedia para el CRUD.
- A cambio, la lógica de negocio del guardado (actualizar o insertar copia) vive en el cliente y depende de RLS para ser segura.
- La validación Zod del `data` es imprescindible: la base de datos solo garantiza que es un objeto JSON.

## ADR-009 · RLS con `with check` en las actualizaciones

**Contexto.** Una política `for update using (auth.uid() = user_id)` decide qué filas se pueden leer para actualizar, pero no qué valores puede dejar el resultado.

**Opciones consideradas.**

1. Solo `using`.
2. `using` + `with check`.
3. Trigger que reescriba `user_id`.

**Decisión.** `using` y `with check` con `auth.uid() = user_id`.

**Consecuencias.**

- Un dueño no puede transferir su tema a otro usuario ni cambiar `user_id`.
- La regla es declarativa y se prueba con la matriz de dos usuarios.
- Si en el futuro se comparten temas con permisos por fila, habrá que ampliar la política de forma explícita.

## ADR-010 · Contraseña además del enlace mágico

**Contexto.** La especificación pide email + enlace mágico. Para automatizar el E2E «entrar → modificar → guardar → recargar» haría falta acceso a un buzón real en cada ejecución.

**Opciones consideradas.**

1. Solo enlace mágico y E2E manual.
2. Enlace mágico + contraseña.
3. OAuth con GitHub (requiere configurar una OAuth App y una cuenta de prueba).

**Decisión.** Mantener el enlace mágico y añadir correo + contraseña con `signUp`/`signInWithPassword`. Para el proyecto de demo se desactiva **Confirm email**, de modo que el registro devuelve sesión inmediata.

**Consecuencias.**

- El E2E crea usuarios reales (`@example.com`) y verifica el flujo completo sin buzón.
- La pantalla de acceso conserva el enlace mágico, que es el método principal de la spec.
- **Tradeoff de seguridad:** con la confirmación desactivada, cualquiera puede registrar un correo que no controla. Es aceptable en una demo con datos de prueba; antes de un uso real hay que reactivar «Confirm email» y el E2E deberá usar un proveedor de correo de pruebas o el admin API.
- Los usuarios de prueba se acumulan en `auth.users`; se limpian desde el dashboard.

## ADR-011 · Proveedor de IA: Gemini free tier y clave solo en servidor

**Contexto.** La especificación pedía la API de Anthropic, pero el proyecto no dispone de clave y es una demo de portafolio: no debe generar coste ni depender de una suscripción. En cualquier caso, la clave de cualquier proveedor jamás debe llegar al navegador.

**Opciones consideradas.**

1. Anthropic sin clave: función lista y probada con mocks, sin demo real.
2. Gemini con nivel gratuito y llamada REST desde la función serverless.
3. Motor local determinista disfrazado de IA.

**Decisión.** Gemini (`generativelanguage.googleapis.com`) con la clave en `GEMINI_API_KEY`, solo en el servidor. La llamada se hace con `fetch` desde `api/generate-palette.ts`; no se añade SDK. El cliente solo conoce `/api/generate-palette`. El modelo se toma de `GEMINI_MODEL` con alias por defecto `gemini-flash-latest`.

**Consecuencias.**

- Se desvía de la tecnología fijada en la spec; queda documentado aquí y en el README. Cambiar de proveedor solo afecta a la función.
- Sin SDK: menos dependencias y control total de timeout, cabeceras y forma de la respuesta.
- El nivel gratuito de Gemini tiene cuota y puede variar; si se agota, la función devuelve 502 con un mensaje accionable.
- El rate limit en memoria (8/10 min por IP) no es global entre instancias serverless: es una barrera de demo, no una cuota facturable. En producción haría falta un almacén compartido o el límite del proveedor.
- La validación de la respuesta (ADR-012) no depende del proveedor: si mañana se vuelve a Anthropic, se mantiene.

## ADR-012 · Validar la salida del modelo antes de aplicarla

**Contexto.** Un LLM puede devolver markdown, claves de más, hex inválidos o texto antes del JSON. Aplicar eso directamente rompería el tema y los exportadores.

**Opciones consideradas.**

1. Confiar en el prompt («devuelve solo JSON»).
2. Parsear y aplicar con comprobaciones mínimas.
3. Extraer el JSON, validarlo en servidor y volver a validarlo en cliente.

**Decisión.** Opción 3: el servidor recorta el objeto entre la primera `{` y la última `}`, valida con Zod y responde 502 si falla. El cliente valida otra vez con `themeColorsSchema` y corrige el contraste antes de ofrecer «Aplicar».

**Consecuencias.**

- Una respuesta inválida no modifica el tema: el usuario ve un error y conserva su trabajo.
- La doble validación es barata frente a un estado corrupto y permite confiar en la respuesta como dato externo.
- Los tests cubren respuesta válida, JSON ilegible, colores mal formados, error HTTP, 404, fallo de red y timeout.

## ADR-013 · Variante de modo derivada, no una paleta fija

**Contexto.** Cambiar claro/oscuro debe conservar la identidad del tema, no sustituirlo por los colores por defecto.

**Opciones consideradas.**

1. Aplicar los neutros del tema por defecto del modo destino.
2. Invertir todos los canales.
3. Derivar neutros con el tono actual y ajustar contraste conservando el tono de las marcas.

**Decisión.** Opción 3 (`deriveVariant`). Los neutros se reconstruyen; texto y marcas se ajustan en luminosidad hasta cumplir umbrales, manteniendo el tono.

**Consecuencias.**

- La marca sobrevive al cambio de modo; no aparece un azul distinto.
- La variante puede no ser idéntica al tema de origen si se alterna varias veces (los ajustes de contraste son acumulativos en luminosidad, no reversibles byte a byte).
- Es una transformación pura y probada; el historial permite deshacer el cambio.

## ADR-014 · Validar el entorno de Supabase sin romper la app

**Contexto.** El editor debe funcionar como demo local aunque no haya credenciales, pero las zonas de cuenta necesitan una configuración válida.

**Opciones consideradas.**

1. Fallar al arrancar si faltan variables.
2. `createClient` con cadenas vacías.
3. Validar con Zod y degradar a modo local.

**Decisión.** Zod valida `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`; si faltan, `supabase` es `null`, el editor sigue operativo y las rutas protegidas explican qué configurar.

**Consecuencias.**

- El proyecto se puede clonar y probar sin cuenta de Supabase.
- Un error de configuración se explica en pantalla, no con un stack trace.
- Las pruebas fijan esas variables a vacío para no depender del `.env` real ni tocar la red.
