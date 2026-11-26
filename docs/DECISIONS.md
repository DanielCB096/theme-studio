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

**Decisión.** Gemini (`generativelanguage.googleapis.com`) con la clave en `GEMINI_API_KEY`, solo en el servidor. La llamada se hace con `fetch` desde `api/generate-palette.ts`; no se añade SDK. El cliente solo conoce `/api/generate-palette`. El modelo se toma de `GEMINI_MODEL`; el valor por defecto es `gemini-3.5-flash-lite`, elegido tras comprobar que `gemini-flash-latest` devolv?a 503 por saturaci?n y que `gemini-2.5-flash` ya no existe para cuentas nuevas.

**Consecuencias.**

- Se desvía de la tecnología fijada en la spec; queda documentado aquí y en el README. Cambiar de proveedor solo afecta a la función.
- Sin SDK: menos dependencias y control total de timeout, cabeceras y forma de la respuesta.
- El nivel gratuito de Gemini tiene cuota y puede variar; si se agota, la función devuelve 502 con un mensaje accionable.
- El rate limit en memoria (8/10 min por IP) no es global entre instancias serverless: es una barrera de demo, no una cuota facturable. En producción haría falta un almacén compartido o el límite del proveedor.
- La validación de la respuesta (ADR-012) no depende del proveedor: si mañana se vuelve a Anthropic, se mantiene.
- El free tier devuelve 503 con frecuencia: se prueban tres modelos lite en cadena y, si todos fallan, se responde con una paleta local determinista marcada `source: "local"`. La UI la etiqueta como «Modo local (sin IA)».

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

## ADR-015 · Demo pública sin Deployment Protection

**Contexto.** Vercel activa Vercel Authentication en los proyectos nuevos. La URL de producción devolvía 302 a `vercel.com/sso-api`, así que la demo no era accesible para un reclutador ni para Lighthouse.

**Opciones consideradas.**

1. Compartir un enlace de bypass temporal.
2. Mantener la protección y pedir login a quien quiera ver la demo.
3. Desactivar SSO para este proyecto y dejar solo la protección de los datos reales (RLS).

**Decisión.** Opción 3: `vercel project protection disable theme-studio --sso`. La aplicación es pública; los datos siguen protegidos por Supabase Auth + RLS y la clave de Gemini vive en variables de entorno del servidor.

**Consecuencias.**

- La demo es accesible y verificable sin cuenta.
- Cualquiera puede registrarse (la confirmación de correo está desactivada) y crear sus propios temas; no puede leer los de otros.
- Si el proyecto se reutiliza con datos reales, hay que reactivar la protección y la confirmación de correo.

## ADR-016 · Caché de paletas en dos capas

**Contexto.** El nivel gratuito de Gemini devuelve 503 con frecuencia y cada reintento consume cuota. Una demo suele repetir prompts parecidos, y no tiene sentido pagar latencia y cuota por el mismo resultado.

**Opciones consideradas.**

1. Sin caché: cada petición llama al proveedor.
2. Caché distribuida (Upstash/Redis o tabla en Supabase).
3. Caché en memoria de la función + caché en `localStorage` del navegador.

**Decisión.** Opción 3: 24 h de TTL, 50 entradas por instancia en servidor y 20 por navegador. La clave es el prompt normalizado (minúsculas, espacios colapsados). Solo se cachean paletas reales (`source: "gemini"`); la reserva local no, para permitir reintentar la IA.

**Consecuencias.**

- Repetir un prompt es instantáneo y no consume cuota.
- La caché de servidor no es global entre instancias serverless ni sobrevive a un arranque en frío; la del navegador sí persiste para ese usuario.
- Los datos cacheados se validan con Zod al leerlos; una entrada corrupta se ignora.
- Si se quiere una caché compartida y persistente, habría que añadir un almacén externo (ADR futuro).

## ADR-017 · Evolución a constructor de páginas (Anexo A)

**Contexto.** La especificación original define un editor de tokens con un tema global y una galería fija. El objetivo real del producto cambia: el usuario quiere **componer páginas completas** y publicarlas, y después conectarles funcionalidad de backend. Mantener solo el editor de temas no cubre esa necesidad.

**Opciones consideradas.**

1. Quedarse en el editor de temas y exportar CSS/Tailwind.
2. Constructor que genere código React/HTML para llevarlo a otro proyecto.
3. Constructor de páginas **alojadas**, renderizadas desde JSON, con Supabase como backend.

**Decisión.** Opción 3, detallada en el **Anexo A** de `AGENTS.md`: páginas en `/p/:slug`, backend exclusivamente Supabase, exportación/importación solo del JSON de la página, tema guardado como snapshot, árbol normalizado de bloques, registro con un archivo por bloque, un único `PageRenderer`, Zod para todo dato externo y saneamiento de URLs. Se trabaja en `feat/page-builder` con el tag `v1.0-theme-editor`.

**Consecuencias.**

- El editor de temas pasa a ser el panel de «Estilo global» del builder; no se reescribe.
- Aparece una nueva entidad (`pages`) con su migración, RLS, repositorio, rutas y E2E.
- El snapshot del tema hace que una página publicada no cambie si después se edita el tema, y `theme_id` opcional queda para trazabilidad.
- No se genera código fuente: el entregable es una página renderizada y su JSON.
- La ampliación aumenta el alcance del producto y exige revisar seguridad y accesibilidad en cada bloque.
- El tag `v1.0-theme-editor` conserva un punto de retorno del editor de temas terminado.

## ADR-018 · Modelo de página normalizado y tema en snapshot

**Contexto.** El builder necesita un documento manipulable, validable y renderizable sin duplicar datos. Además, una página publicada no debería cambiar de aspecto si el autor sigue editando su tema.

**Opciones consideradas.**

1. Árbol anidado con hijos dentro de cada bloque.
2. Lista plana de secciones con `order`.
3. Mapa normalizado por id + `rootIds` para el orden.

**Decisión.** Opción 3 para el Hito 1, sin anidación (`childIds` vacío) y con `theme` como snapshot dentro del documento. `PageRenderer` es único y el registro de bloques aporta schema, defaults, renderer e inspector.

**Consecuencias.**

- Operaciones simples e inmutables (añadir, quitar, mover, actualizar props) y validación de huérfanos/duplicados con Zod.
- Cambiar el tema global no altera páginas ya creadas; para actualizarlas habría que editar el snapshot (Hito futuro).
- La anidación queda preparada en el modelo, pero fuera de alcance hasta que el producto la necesite.
- Un solo renderer evita divergencias entre builder y página publicada.

## ADR-019 · Assets de página en Supabase Storage

**Contexto.** El logo y las imágenes de `textImage` se referenciaban por URL externa. Eso provoca enlaces roídos, hotlinks y dependencia de terceros. El proyecto ya tiene Supabase, así que no hace falta un servicio de assets aparte.

**Opciones consideradas.**

1. Seguir solo con URL externa.
2. Guardar el binario en base64 dentro del JSON de la página.
3. Supabase Storage con bucket público y RLS por carpeta.

**Decisión.** Opción 3. Bucket `page-assets`, lectura pública, escritura solo en `{auth.uid()}/pages/...`, 1 MB y PNG/JPEG/WebP. El JSON guarda únicamente la URL pública. La validación de tipo y tamaño se hace en cliente y el bucket repite las restricciones.

**Consecuencias.**

- Los assets publicados tienen URL estable y no dependen de webs externas.
- La lectura es pública por diseño: cualquiera con la URL puede ver el archivo, aunque no conozca su ruta sin acceso a la página.
- No se acepta SVG en el MVP porque puede contener scripts; sanearlo requeriría una librería y una política propia.
- La limpieza al reemplazar un logo o borrar una página queda pendiente: hoy no se eliminan binarios huérfanos.
- No hay antivirus ni análisis de contenido; el límite de MIME y tamaño es la única barrera además de la validación del navegador.
- Los assets subidos antes de guardar la página van a `pages/draft/`; siguen siendo válidos y públicos, pero no se reorganizan al guardar.

## ADR-020 · Formularios públicos con endpoint, honeypot y RLS

**Contexto.** El bloque `form` era una demostración: no enviaba nada ni guardaba respuestas. El Hito 2A necesita recibir datos reales en páginas públicas sin añadir un backend propio ni exponer claves privilegiadas. La clave `anon` de Supabase puede viajar al navegador, pero una inserción directa deja todo el control de abuso en el cliente.

**Opciones consideradas.**

1. Insertar desde el navegador directamente en `page_submissions` con una política de `insert` para `anon`.
2. Endpoint serverless propio (`POST /api/submit-page-form`) que valida, aplica honeypot y rate limit, e inserta con la clave `anon`; RLS decide si la página es pública.
3. Servicio externo de formularios (Formspree y similares).

**Decisión.** Opción 2. El endpoint usa Zod estricto (`pageId` uuid, 1–12 campos, claves de 60 y valores de 2000 caracteres, 20 KB serializados), descarta envíos con el honeypot `website` relleno, limita a 5 peticiones por IP cada 10 minutos y escribe con la clave `anon`, nunca con `service_role`. La tabla `page_submissions` tiene RLS: `anon` y `authenticated` solo pueden insertar si la página referenciada es pública; el dueño puede leer, marcar como leída y eliminar las respuestas de sus páginas. La bandeja y el CSV viven en el cliente autenticado.

**Consecuencias.**

- La autorización real está en Postgres: aunque alguien llame al endpoint directamente, RLS rechaza inserciones en páginas privadas.
- El honeypot y el límite reducen spam básico, pero no lo eliminan: un atacante con muchas IPs puede seguir enviando. El rate limit es en memoria y no es global entre instancias serverless. Además, como el cliente usa la clave `anon`, alguien podría llamar a PostgREST directamente y saltarse el endpoint: el honeypot y el límite son disuasorios, no una barrera criptográfica.
- No hay captcha, verificación por correo ni adjuntos en este hito; los límites de tamaño y el saneamiento de datos son la única defensa adicional.
- El endpoint no registra los valores del formulario en logs. Un fallo de inserción responde 502 genérico para no filtrar detalles de RLS.
- Si una página deja de ser pública, las respuestas nuevas se rechazan de inmediato; las ya guardadas siguen visibles para el dueño.
- El CSV se genera en el navegador a partir de datos ya autorizados, sin un endpoint de exportación adicional.
- El CSV neutraliza fórmulas: las celdas que empiezan por `=`, `+`, `-`, `@`, tabulador o retorno se prefijan con `'`, porque un visitante puede enviar esos valores y el dueño abriría el archivo en Excel o Sheets. El texto original se conserva en la bandeja.
