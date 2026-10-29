# Perfil y bienvenida (`src/features/profile`)

Bienvenida (A01–A04: objetivo, nivel y días por semana) y, más adelante, el perfil.

- `screens/` — `bienvenida`, `onboarding` (pasos 1 y 2), `perfil` (pendiente).
- `components/` — `OnboardingLayout`, iconos de objetivo.
- `state/onboarding.ts` — señales con las respuestas en curso.
- `use-cases/completeOnboarding.ts` — guarda el perfil en el almacén `profile` (un solo registro).
- `domain/onboarding.ts` — reglas de los pasos (con su prueba).

Convenciones: las capas y sus límites son las de [Entreno](../training/CLAUDE.md). Sin cuenta ni servidor: todo se guarda
en el móvil. `index.ts` es la API pública (`phaseOf`, `Goal`, `Phase`). Entreno lee el perfil guardado desde `shared/data`,
nunca importando archivos internos de este área.
