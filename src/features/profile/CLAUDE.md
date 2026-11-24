# Perfil y bienvenida (`src/features/profile`)

Bienvenida (A01–A04: objetivo, nivel y días por semana) y, más adelante, el perfil.

- `screens/` — `bienvenida`, `onboarding` (pasos 1 y 2 de 4, con `shared/ui/Pasos`: al terminar guarda el perfil y sigue con los pasos 3 y 4, de comida, que pone Nutrición en `/bienvenida/comida/1` y `/2` y se pueden saltar —usuario, 2026-11-17—), `perfil` (tu **copia de seguridad**, usuario 2026-11-24, `Desktop/MUTA-Copia-de-seguridad-propuesta.png`: `CopiaDeSeguridad`
  con la última copia, «Guardar copia» —un `.json` con todo, fotos incluidas, por el menú de compartir; si se cancela no
  cuenta— y «Recuperar una copia» —enseña qué trae, guarda aparte lo de ahora y lo sustituye—; `copia.ts` (aparte del `index.ts`) la da también
  a la pantalla de error. «Tu material» se quitó ese día.) y `AvisoCopia` (el cuadro al abrir la app una vez al mes:
  «Haz tu copia de seguridad», «Guardar ahora · Ahora no»; sin ninguna copia, a la semana de empezar; «Ahora no», otro mes;
  ni en la bienvenida ni en una sesión). `copia.ts` (aparte del `index.ts`) da los dos a `src/app`.
- `state/copia.ts` y `use-cases/copia.ts` — la última copia y si toca recordarla; guardar, posponer, abrir y recuperar.
- `components/` — iconos de objetivo.
- `state/onboarding.ts` — señales con las respuestas en curso.
- `use-cases/completeOnboarding.ts` — guarda el perfil en el almacén `profile` (un solo registro).
- `domain/onboarding.ts` — reglas de los pasos (con su prueba).

Convenciones: las capas y sus límites son las de [Entreno](../training/CLAUDE.md). Sin cuenta ni servidor: todo se guarda
en el móvil. `index.ts` es la API pública (`phaseOf`, `Goal`, `Phase`). Entreno lee el perfil guardado desde `shared/data`,
nunca importando archivos internos de este área.
