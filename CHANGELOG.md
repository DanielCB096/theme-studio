# Changelog

Todos los cambios relevantes de este proyecto se documentan aquí.
Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y [SemVer](https://semver.org/lang/es/).

## [No publicado]

### Añadido

- Inicialización del proyecto: Vite + React 18 + TypeScript estricto.
- Tailwind CSS, ESLint, Prettier, Husky, lint-staged y Commitlint.
- Vitest + Testing Library con prueba de humo.
- CI en GitHub Actions (lint, formato, typecheck, tests, build).
- Dockerfile multi-stage con nginx y fallback de SPA.
- Documentación base: README, ARCHITECTURE, DECISIONS, TESTING, ACCESSIBILITY.
- Sistema de tokens: modelo `Theme`, esquema Zod, temas claro/oscuro por defecto y mapeo de Tailwind a variables CSS.
- Galería de componentes accesible (Radix UI) con container queries: navegación, tabla, formulario, alertas y modal.
