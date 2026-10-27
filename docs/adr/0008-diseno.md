# 8. Diseño: tokens y CSS por componente

- **Estado:** aceptada
- **Fecha:** 2026-10-27

## Contexto

5.700 líneas de CSS en capas que se pisaban, con `!important` ganando a los estilos nuevos.

## Decisión

Un único `tokens.css` con colores, tipos, espacios y radios; CSS Modules por componente; `!important` prohibido.

## Alternativas descartadas

- Tailwind: otra sintaxis que aprender y difícil de alinear con el sistema de diseño.
- CSS global: es lo que falló.

## Consecuencias

- Cambiar la estética en un solo sitio. Claro y oscuro desde las mismas variables.

## Cómo se hace cumplir (2026-10-27)

- Toda medida, color, letra y movimiento sale de `src/shared/ui/tokens.css` (incluidas las alturas de control: `--control`, `--control-lg`, `--row`).
- Las piezas reutilizables viven en `src/shared/ui` (Button, Choice…). Las pantallas las montan y no definen su propio aspecto.
- **Stylelint** (`npm run lint:css`, también en la CI) prohíbe fuera de `tokens.css` colores escritos a mano, medidas en px, tamaños o pesos de letra sin `var(--…)` y `!important`.
- **`/dev/ui`** enseña todas las piezas en claro y oscuro; una prueba de Playwright comprueba que miden lo que dicen los tokens. Cada pieza nueva se añade ahí antes de usarla.
