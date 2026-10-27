# 9. Calidad: CI en cada cambio

- **Estado:** aceptada
- **Fecha:** 2026-10-27

## Contexto

En la app actual los errores se veían al abrir la pantalla.

## Decisión

GitHub Actions (`.github/workflows/ci.yml`) en cada push y pull request: formato, linter con fronteras, tipos, pruebas y construcción. En local, `npm run check` hace lo mismo. Playwright, axe y size-limit se añaden cuando haya pantallas.

## Alternativas descartadas

- Comprobar solo a mano: depende de acordarse.

## Consecuencias

- Nada roto llega a `main` sin aviso. Falta proteger la rama en GitHub.
