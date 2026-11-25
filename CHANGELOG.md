# Changelog

Todos los cambios relevantes de este proyecto se documentan aquí.
Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y [SemVer](https://semver.org/lang/es/).

## [No publicado]

### En desarrollo — Anexo A · Page Builder

- Rama `feat/page-builder` y tag `v1.0-theme-editor` como punto de retorno.
- ADR-017: evolución de editor de temas a constructor de páginas alojadas.
- Modelo de página con árbol normalizado, registro de bloques y `PageRenderer` único.
- Nueve bloques: navbar, hero, features, pricing, form, table, cta, footer y textImage.
- Builder con paleta, estructura, inspector y vista previa multidispositivo.
- Navbar configurable en cuatro ubicaciones (arriba, abajo, izquierda, derecha), adaptándose a barra superior en móvil.
- Migración `002_pages.sql` con RLS, repositorio, rutas `/pages`, `/builder` y `/p/:slug`.
- Corrección de defaults clonados por página.

### Añadido

- Inicialización del proyecto: Vite + React 18 + TypeScript estricto.
- Tailwind CSS, ESLint, Prettier, Husky, lint-staged y Commitlint.
- Vitest + Testing Library con prueba de humo.
- CI en GitHub Actions (lint, formato, typecheck, tests, build).
- Dockerfile multi-stage con nginx y fallback de SPA.
- Documentación base: README, ARCHITECTURE, DECISIONS, TESTING, ACCESSIBILITY.
- Sistema de tokens: modelo `Theme`, esquema Zod, temas claro/oscuro por defecto y mapeo de Tailwind a variables CSS.
- Galería de componentes accesible (Radix UI) con container queries: navegación, tabla, formulario, alertas y modal.
- Store de Zustand con historial acotado, undo/redo, atajos de teclado y autoguardado local validado con Zod.
- Panel de controles de color, tipografía, forma, espaciado y componentes, con vista previa en vivo.
- Vista previa multidispositivo (375/768/1280 px), rotación, ancho libre y modo "todas a la vez".
- Pruebas E2E con Playwright: reflujo por ancho y persistencia tras recarga.
- Autenticación con Supabase: enlace mágico y correo + contraseña.
- CRUD de temas en Supabase con RLS verificada con dos usuarios, y perfil protegido `/temas`.
- Compartición pública con URL `/t/:id` de solo lectura y duplicado a la cuenta propia.
- Verificador de contraste WCAG 2.x con corrección automática y panel de semáforos.
- Variante clara/oscura derivada conservando el tono de las marcas.
- Generador de paletas con IA en función serverless (Gemini free tier), con clave solo en servidor, validación doble y corrección de contraste.
- Configuración de Vercel con rewrites de SPA y función de IA.
- Error Boundary global con recuperación y detalle solo en desarrollo.
- Code splitting de rutas y vendors: el chunk mayor pasa de 500 kB a 231 kB.
- CI con cobertura mínima del 70 %, artefacto de cobertura y job E2E.
- Docker verificado con secretos de BuildKit; `robots.txt` y Lighthouse 100/100/100.
- Despliegue en producción en Vercel y script `check:deploy` de verificación.
- Cadena de modelos de Gemini y reserva local etiquetada para mantener la demo operativa ante 503.
- Caché de paletas en servidor y navegador (TTL 24 h) para evitar llamadas repetidas.
