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
