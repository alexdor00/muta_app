# Comida (`src/features/nutrition`)

Apuntar lo que comes, tu semana y tu objetivo de kcal, con la revisión semanal del entrenador. Diseño aprobado el
2026-11-05 (`Desktop/MUTA-Comida-diseno.png`, versión 1). Las capas y sus límites son los de [Entreno](../training/CLAUDE.md):
las pantallas no importan el dominio; lo que necesitan de él lo reexporta `state/comida.ts`.

## Regla de oro: el entrenador **propone**, nunca cambia nada solo

Tu objetivo se calcula una vez (con tus datos) y se **guarda**. Después solo cambia si tú lo cambias (fase, a mano, tus datos)
o si aceptas una sugerencia («Aplicar desde mañana»; «Ahora no» la deja en el historial). La última aceptada se deshace.
Ni bajar de peso mueve el objetivo por sí solo (decisión 2026-11-05).

## Dónde está cada cosa

- `domain/food.ts` — alimentos (por 100 g) y apuntes: `macrosDe`, `sumar`, comidas del día (`COMIDAS`, nombres sugeridos,
  con su artículo: «a la cena»), comida por la hora, raciones o gramos, buscador (cada palabra en el nombre; lo cocinado antes
  que lo crudo) y recientes. Reglas del prototipo (`js/comida/comida.js`).
- `domain/targets.ts` — objetivo: Mifflin-St Jeor, factor de actividad, suelo, déficit y superávit, macros por kilo
  (proteína 1,5 y grasa 0,6 de serie; hidratos, lo que queda). `docs/conocimiento/02-reglas.md` · sección 8.
- `domain/weight.ts` — tendencia del peso (0,15), ritmo semanal (regresión de 14 días), gasto medido.
- `domain/review.ts` — la revisión: faltan datos (10 pesajes en 14 días, 12 días de comida en 4 semanas) → cumplir
  (85–115 %) → ritmo frente al previsto (±0,2 % definición, ±0,15 el resto) → 10 días entre cambios → en definición, antes
  10.000 pasos → ±150 kcal (nunca bajo el suelo). Devuelve qué pasa y las comprobaciones que se enseñan.
- `domain/week.ts` — los 7 últimos días: media sin hoy, días con la proteína hecha.
- `state/comida.ts` — señales (`ajustes`, `dias`, `pesajes`, `cambios`, `propios`, `guardadas`, `base`) y lo calculado:
  objetivo del día (`objetivoDe`: una sugerencia aplicada vale desde `desde`), semana, `revisionDeHoy`, `pendiente`, `gastoReal`.
- `use-cases/nutritionStore.ts` — carga y guarda; al cargar, cada 7 días la revisión deja su sugerencia (`pendiente`) o
  «sin cambios». `use-cases/target.ts` — tus datos, fase, a mano, aplicar, «Ahora no» y deshacer.
  `use-cases/foodLog.ts` — añadir, cambiar, quitar (con «Deshacer»), repetir lo de ayer, comidas guardadas, tus alimentos y
  la base (`cargarAlimentos`, descarga aparte la primera vez que se abre «Añadir»).
- `components/` — `DayHero` (tarjeta lima: lo que te queda), `CoachCard` (aviso negro del entrenador), `MealList`,
  `WeekBars`, `TrendChart` (tendencia, pesajes y banda de lo previsto), `TargetHero` (tarjeta negra de tu objetivo).
  La letra es la de Entreno, un tamaño por papel (cifra protagonista 40, de tarjeta 30): sin tamaños propios de Comida.
- `screens/comida` — Comida (pestaña): Hoy · Semana y sus hojas (añadir, ración, solo kcal y proteína, crear alimento, la
  comida del día, tu peso, tus datos). `screens/objetivo` — Tu objetivo (`/comida/objetivo`, pantalla completa): cómo sale,
  revisión semanal, historial; hojas de fase, a mano y la sugerencia.

## Datos

- `userContent`: `nutricion` (tus datos y tu objetivo), `alimentos-propios`, `comidas-guardadas`.
- `foodLog` (por fecha: los apuntes del día), `bodyLog` (`[fecha, 'weight']`: tus pesajes; hasta que exista Hoy, el peso se
  apunta en Semana), `coach` (`area: 'nutricion'`: cada cambio del objetivo y cada sugerencia, con su estado).
- La base de alimentos es `shared/content/foods.json` (sale del prototipo con `node scripts/foods-from-prototype.cjs`).

## Para después (versión 2 y 3, fuera de este diseño)

Dieta cargada (menú según entreno o descanso, recetas, lista de la compra) y la consulta semanal; escáner de códigos y Open
Food Facts; calcular un plato cocinado.
