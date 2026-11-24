# Arranque de la app (`src/app`)

Es la única parte que puede usar todo lo demás.

- `main.tsx`, `startup.ts` — arranque: abre la base de datos (con sus migraciones), guarda los errores en ella, carga los programas locales, registra las actualizaciones y pide almacenamiento persistente.
- `App.tsx` — rutas (`preact-iso`, cada pantalla con `lazy`) y la barra de pestañas (`TabBar.tsx`).
- `ScreenErrorBoundary.tsx` — si una pantalla falla se ve un aviso con «Volver», el detalle del error y tu copia de seguridad (guardar o recuperar, por si sigue fallando); el resto sigue. Si una pantalla no carga (`cargarPantalla`: piezas viejas tras una actualización), la app se recarga sola una vez antes de enseñar el error.
- Avisos que salen solos (ni en la bienvenida ni en una sesión): tu logro o tu premio (`AvisoLogro`, de `progress/logro.ts`; al abrir o al volver a una pestaña) y, si no hay ninguno abierto, el cuadro de la copia (`AvisoCopia`, de `profile/copia.ts`).
- `updates.ts`, `updatePolicy.ts` — la versión nueva se descarga sola y se aplica al abrir, **nunca durante un entreno**.
- Comida: `/comida` (pestaña, con `?vista=dieta`) y, a pantalla completa como la ficha del ejercicio,
  todo lo que cuelga de ella: `/comida/objetivo`, `/comida/receta/:id`, `/comida/compra`, `/comida/cocina`, `/comida/consulta`,
  el modo cocina de una tanda (`/comida/tanda/:fecha`), una comida al momento (`/comida/al-momento/:fecha/:comida`) y tu despensa (`/comida/despensa`).
- Progreso: `/progreso` (pestaña, con `?mes=AAAA-MM&ver=dias|cuerpo|fuerza`; de serie, el mes de hoy y Días) y, a pantalla
  completa, un día de entreno (`/progreso/dia/:fecha`, desde su calendario).
- `dev/` — páginas solo para desarrollo (`/dev/ui` con todos los componentes en claro y oscuro; `/dev/demo` carga un perfil
  inventado de unos 100 días —`perfilDemo.ts` y, su menú, `perfilDemoMenu.ts`: entrenos, tres mesociclos, pesajes, medidas y fotos dibujadas de cada mes,
  consultas y comidas— para ver la app como de verdad; borra lo del dispositivo y pregunta antes).

Convenciones: las rutas y sus patrones salen de `shared/lib/paths.ts`; no escribir rutas a mano. Una pantalla
nueva se añade aquí con `lazy` y su ruta. Las pestañas se ven siempre salvo durante una sesión.
