# 4. Lógica: casos de uso y dominio puro

- **Estado:** aceptada
- **Fecha:** 2026-10-27

## Contexto

Las acciones de la app actual estaban repartidas y sobrescritas entre archivos.

## Decisión

Cada acción del usuario es un caso de uso (`startWorkout`, `logSet`, `finishWorkout`…) con un solo punto de entrada. Las reglas viven en `domain/` como funciones puras con pruebas.

## Alternativas descartadas

- Lógica dentro de las pantallas: imposible de probar sin abrir la app.

## Consecuencias

- Cada regla se prueba con Vitest en segundos.
- Las pantallas solo llaman a casos de uso y leen estado.
