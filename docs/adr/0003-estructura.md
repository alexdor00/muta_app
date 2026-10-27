# 3. Estructura por funcionalidades con fronteras

- **Estado:** aceptada
- **Fecha:** 2026-10-27

## Contexto

En la app actual Entreno dependía de código de Hoy y Comida, y un fallo en un archivo tumbaba pantallas de otras áreas.

## Decisión

`src/app`, `src/features/<área>/{screens,components,state,use-cases,domain}` con su `index.ts` como API pública, y `src/shared/{ui,data,content,platform,lib}`. `eslint-plugin-boundaries` hace cumplir la tabla «Quién puede usar a quién»: un import prohibido es un error.

## Alternativas descartadas

- Carpetas solo por capas (todas las pantallas juntas): mezcla áreas.
- Fronteras por disciplina, sin linter: es lo que falló.

## Consecuencias

- Rehacer un área no toca las demás.
- Lo que está en la raíz de un área (su `index.ts`) es lo único que ven las otras.
