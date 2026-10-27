# 5. Estado: señales por área

- **Estado:** aceptada
- **Fecha:** 2026-10-27

## Contexto

«24 de 4 esta semana» frente a «2 de 4»: el mismo dato calculado en dos sitios.

## Decisión

Señales (`@preact/signals`) por área y valores derivados con `computed`. Las pantallas leen; solo los casos de uso escriben. Un dato derivado sale de una sola función del dominio.

## Alternativas descartadas

- Estado global único (tipo Redux): más código para una app de este tamaño.
- Copias del dato en cada pantalla: es lo que falló.

## Consecuencias

- Las pantallas se actualizan solas y no se contradicen.
