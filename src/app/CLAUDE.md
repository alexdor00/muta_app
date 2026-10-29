# Arranque de la app (`src/app`)

Es la única parte que puede usar todo lo demás.

- `main.tsx`, `startup.ts` — arranque: abre la base de datos (con sus migraciones), guarda los errores en ella, carga los programas locales, registra las actualizaciones y pide almacenamiento persistente.
- `App.tsx` — rutas (`preact-iso`, cada pantalla con `lazy`) y la barra de pestañas (`TabBar.tsx`).
- `ScreenErrorBoundary.tsx` — si una pantalla falla se ve un aviso con «Volver» y el resto sigue.
- `updates.ts`, `updatePolicy.ts` — la versión nueva se descarga sola y se aplica al abrir, **nunca durante un entreno**.
- `dev/` — páginas solo para desarrollo (`/dev/ui` con todos los componentes en claro y oscuro).

Convenciones: las rutas y sus patrones salen de `shared/lib/paths.ts`; no escribir rutas a mano. Una pantalla
nueva se añade aquí con `lazy` y su ruta. Las pestañas se ven siempre salvo durante una sesión.
