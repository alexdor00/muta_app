# 10. Actualizaciones: nunca durante un entreno

- **Estado:** aceptada
- **Fecha:** 2026-10-27

## Contexto

Una actualización a mitad de sesión podría perder la sesión en curso.

## Decisión

La versión nueva se descarga en segundo plano y se aplica al abrir la app o al tocar «Actualizar», nunca con un entreno en curso. Si cambia el formato de datos: copia automática y después migración.

## Alternativas descartadas

- Recargar sola en cuanto hay versión nueva.

## Consecuencias

- El service worker comprueba si hay entreno en curso antes de activarse.
