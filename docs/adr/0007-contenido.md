# 7. Contenido en JSON versionado

- **Estado:** aceptada
- **Fecha:** 2026-10-27

## Contexto

La biblioteca (141 ejercicios), los consejos y las plantillas están mezclados con el código de la app actual.

## Decisión

Contenido en `src/shared/content/*.json`, extraído con script de la app actual, con versión y pruebas de validación. Los cambios del usuario se guardan aparte.

## Alternativas descartadas

- Copiar a mano: errores seguros con cientos de entradas.
- Contenido dentro del código: cada cambio toca código.

## Consecuencias

- Se actualiza la biblioteca sin tocar código ni perder lo editado por el usuario.
