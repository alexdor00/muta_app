# 2. Interfaz: Preact + TypeScript + Vite

- **Estado:** aceptada
- **Fecha:** 2026-10-27

## Contexto

La app actual no tiene componentes, tipos ni pruebas, y sus pantallas se reescribían desde varios archivos.

## Decisión

Preact (unos 4 KB) para componentes, TypeScript estricto para los tipos y Vite para el servidor de desarrollo y el empaquetado. Se usa **TypeScript 6.0**: la plantilla traía la 7, pero `typescript-eslint` aún no la soporta (pide < 6.1).

## Alternativas descartadas

- Módulos del navegador sin herramientas (Live Server): sin tipos, sin pruebas cómodas ni linter.
- React: unas 10 veces más pesado para lo mismo.
- TypeScript 7: rompe el linter; se sube cuando `typescript-eslint` lo soporte.

## Consecuencias

- Hace falta Node en el ordenador (no en la app).
- Los imports llevan extensión (`./archivo.ts`).
