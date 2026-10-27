# 6. Datos: IndexedDB local

- **Estado:** aceptada
- **Fecha:** 2026-10-27

## Contexto

Años de historial en el móvil, sin servidor, sin perder datos.

## Decisión

IndexedDB con `idb`, un almacén por tipo de dato con índices, transacciones en escrituras múltiples, versión de esquema con migraciones numeradas y campos `id`, `createdAt`, `updatedAt`, `deletedAt` para sincronizar en el futuro.

## Alternativas descartadas

- localStorage: lento con mucho historial y sin transacciones.
- Servidor: obliga a cuenta y cobertura.

## Consecuencias

- Copia automática antes de cada migración y aviso de copia cada 14 días.
- Importar valida y escribe antes de borrar.
