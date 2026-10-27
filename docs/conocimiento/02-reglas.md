# Parte II · Reglas

Cálculos y decisiones del motor y del coach, con cifras exactas y su origen en la app actual.
Destino: `src/features/training/domain/` (cada regla con pruebas: mismas entradas, mismas salidas).

## 1. Fuerza y progresión → `domain/e1rm.ts`, `domain/progression.ts`

### 1RM estimado (`motor.js · e1rm`)
```
1RM = kg × (1 + (reps + RIR) / 30)
```
- Sin kilos (peso corporal): 1RM = reps + RIR.
- Datos de una sugerencia sin medir (`auto`) no cuentan mientras haya series medidas en la sesión.

### Doble progresión con RIR (`motor.js · suggestFor`)
Base: la misma serie de la última vez en ese hueco del plan.

| Situación | Propuesta | Texto |
|---|---|---|
| Nunca en este hueco, sí en otra sesión | kg = 1RM reciente (mejor de las 3 últimas) ÷ (1 + (reps mín. + RIR)/30), redondeado hacia abajo al salto | «Calculado con tu 1RM estimado de este ejercicio en otra sesión.» |
| Nunca lo has hecho | Sin kilos; rango del plan | «Primera vez: elige un peso con el que hagas X–Y reps dejando N en reserva.» |
| Ciclo de descarga | Mismos kilos | «Mismos kilos, menos series y lejos del fallo (RIR 3).» |
| Peso corporal y llegaste al máximo | Máx.+ | «Añade lastre o pasa a una variante más difícil.» |
| Peso corporal sin llegar | +1 rep (sin pasar del máx.) | «Busca N reps (la última vez M).» |
| Máximo del rango con RIR ≤ objetivo + 1 | Sube el salto. Si te pasaste 2+ reps del máx., sube hasta lo que da tu 1RM, tope +10 % | «Llegaste a N reps: subes X kg y vuelves a la parte baja del rango.» |
| RIR ≥ objetivo + 3 dentro del rango | Sube el salto | «Te sobraron N reps de reserva: subes X kg.» |
| Por debajo del mínimo | −5 % (mínimo un salto) | «Te quedaste en N, por debajo de M: bajas un 5 % para volver al rango.» |
| Resto | Mismo peso, +1 rep | «Mismo peso y busca N reps.» |

- «Series distintas» (top set, descarga…): cada serie usa su rango y RIR.
- Ajuste «Kilos de cada serie» apagado → la sesión empieza sin kilos.

### Salto de peso (`motor.js · incOf`)
Hueco del plan → usuario para ese material → ejercicio → 2,5 kg.

### Estado de un ejercicio (`motor.js · statusOf`), con el 1RM de cada vez en ese hueco
| Estado | Cuándo |
|---|---|
| Sin datos / Nuevo | 0 o 1 sesión |
| Progresa | Última vez es récord: >1 % sobre el mejor anterior |
| Baja | Última vez < 95 % del mejor de las 3 anteriores |
| Estancado | 2+ sesiones seguidas sin récord |
| Igual | Resto |

**RIR real (`realRIR`):** media del RIR apuntado a mano en la última sesión; el rellenado con el objetivo no cuenta.

### Récords y comparaciones
- **Récord histórico:** 1RM de la sesión >1 % sobre el mejor de todas las anteriores (`coach.js · afterSession`, `motivacion.js · prCount`).
- **Frente a la última vez (★ y sonidos):** 1RM de la misma serie vs la misma serie de la vez anterior: mejor / igual / peor (`vsLast`).
- **Resumen:** «+kg» si subió el peso máximo; si no, «+reps»/«−reps» por suma de reps; «Igual»; «Nuevo» (`diseno-aprobado.js · v6Vs`).
- **Tonelaje:** kg × reps de series hechas; peso corporal cuenta el 65 % del peso (`setTon`).

## 2. Volumen y rangos → `domain/volume.ts`, `domain/duration.ts`

- Cada ejercicio aporta **1** al principal (directa) y **0,5** a los que ayudan (indirecta).
- Los rangos se comparan solo con series **directas**; indirectas aparte.
- Series por semana del plan = series de cada sesión × factor semanal (días/semana ÷ nº sesiones del ciclo).
- Días/semana: con descansos en el ciclo, sesiones × 7 ÷ días del ciclo; sin descansos, los del perfil (1–7).
- En ciclo de descarga el plan cuenta el 70 % de las series.
- Series hechas en 7 días: solo marcadas como hechas, mismo criterio.

### Rangos por nivel (`motor.js · levelRange, targetOf`)
| Nivel | Desarrollar | Prioridad |
|---|---|---|
| Principiante | Grandes 4–8. Resto: mín × 0,6, máx × 0,7 (máx ≥ 2) | Grandes 6–10. Resto: × 0,7 y × 0,75 |
| Intermedio | Tabla | Tabla |
| Avanzado | Máx +2 grandes, +1 resto | Mín +2 y máx +4 grandes; máx +2 resto |

- Grandes: Pecho, Dorsal, Espalda alta, Hombro lateral, Bíceps, Tríceps, Cuádriceps, Femoral, Glúteo, Gemelo.
- Core en principiante: 4–6. Cuello sin ejercicios en el plan: 0–6.
- Un rango puesto a mano manda sobre todo.
- Máximo 4 músculos en Prioridad.
- Estado: < mín = **corto**; > máx = **pasado**; dentro = **bien**.

### Duración de una sesión
```
minutos = Σ series × (descanso + 45 s) / 60 + 8 de calentamiento
```

## 3. Sesión → `domain/rest.ts`, `domain/warmup.ts`, `domain/deload.ts`, `domain/sets.ts`

### Descanso entre series
- Base: descanso del ejercicio en el plan.
- Serie con <80 % de las reps de la primera (≥5 reps y peso ≥97 % del de la primera): **+60 s** y aviso «Bajaste de N a M reps. Descansa 1 minuto más».
- Superserie con el siguiente: **20 s** y pasa al otro.
- Al acabar: suena, vibra, «¡A por ella!»; a los 90 s pasados se cierra solo. Botones −15/+15 s y Saltar.

### Ajuste automático tras la sesión (si «Descansos» activo; `coach.js · afterSession`)
Compara 1.ª y 2.ª serie con mismo peso y RIR parecido:
- 2.ª < 80 % de reps: **+45 s** al plan (máx.: el del ejercicio + 2 min).
- 2.ª ≥ 95 % y la sesión duró más que tu tiempo máximo: **−15 s** (mínimos 150 s pesados, 120 s compuestos, 60 s aislamientos).

### Avisos de RIR al terminar
- Compuesto con objetivo RIR ≥ 1,5 y llegaste 1,5+ por debajo: «En compuestos exigentes el fallo acumula fatiga».
- RIR real 2,5+ por encima del objetivo: «Te dejaste ~N reps de más. Acércate al RIR objetivo».

### Calentamiento (`calentamiento.js`)
Solo la primera vez que un grupo grande trabaja en la sesión (principal o secundario de un ejercicio anterior). No cuenta como volumen ni récords; se guarda aparte.

| Ejercicio | Rampa |
|---|---|
| Peso corporal | Sin calentamiento |
| Compuesto de grupo grande, ≥30 kg | 50 % × 8 · 70 % × 5 · 85 % × 3 |
| Compuesto de grupo grande, <30 kg | 50 % × 10 · 75 % × 5 |
| Otro compuesto, o aislamiento de grupo grande | 50 % × 10 · 75 % × 5 |
| Aislamiento de grupo pequeño | 60 % × 10 |

Grupos grandes (calentamiento): Pecho, Dorsal, Espalda alta, Cuádriceps, Femoral, Glúteo, Hombro anterior, Hombro lateral.
Kilos redondeados hacia abajo al salto; se quitan repetidos y los que igualan el peso de trabajo.

### Datos al apuntar
- >600 kg o >100 reps: no se acepta. >300 kg o >50 reps: pide confirmación (C07).
- Sin reps escritas: vale la sugerencia o el mínimo y la serie queda **no medida**; igual con kilos y RIR.
- La siguiente serie hereda el peso de la marcada.
- Sesión abierta >4 h: duración hasta la última serie + 2 min.

### Descarga
Al empezar en ciclo de descarga: 70 % de las series (redondeado, mínimo 1), RIR 3, mismos kilos.

## 4. Rotación y generador → `domain/rotation.ts`, `domain/generator.ts`

### Ciclo (no depende del calendario)
- Lista ordenada de sesiones y descansos (p. ej. A1, B1, descanso, A2, B2, descanso, descanso).
- Toca lo que marca el puntero. Si cae en descanso: hoy es descanso si ayer entrenaste; el descanso se consume al pasar el día.
- Al terminar una sesión el puntero avanza; si hiciste otra distinta, se coloca después de esa.
- Al dar la vuelta: +1 ciclo y revisión de ciclo del coach.
- Objetivo de sesiones/semana = parte entera de (días/semana + 0,25).

### Generador (`motor.js · generateProgram, calibrate`)
1. Plantilla: ≤4 días y sin ciclo de 8 → fb4 (V16). Si no → ppl6 (V11). Con ciclo de 8: EA, TA, PA, descanso, EB, TB, PB, descanso.
2. En cada hueco, la primera opción disponible con tu material.
3. Hombro anterior directo solo si es prioridad. Hombro posterior se quita a principiantes salvo prioridad.
4. Principiante: RIR 3 en pesados y 2 en el resto.
5. Calibración (hasta 40 pasadas): músculo bajo su rango → +1 serie al ejercicio con menos series (máx. 4, sin pasar de 11 series del músculo en la sesión). Por encima → −1 serie al que más tiene (mín. 2) o quitar un opcional.
6. Tiempo: mientras una sesión pase de tus minutos (75 por defecto), quitar el último opcional no prioritario; si no hay, −1 serie al ejercicio con más series no prioritario.

**Alternativas:** mismo músculo principal y disponible con tu material; primero mismo tipo (compuesto/aislamiento), luego mismo patrón.

## 5. Coach → `domain/coach/recovery.ts`, `cycleReview.ts`, `experiments.ts`

### Señales de mala recuperación (`coach.js · recoverySignals`; revisión de últimos 14 días + comida y peso)
| Señal | Umbral |
|---|---|
| Sueño | < 6 h de media |
| Fatiga o energía | Fatiga ≥ 7 o energía ≤ 4 (1–10) |
| Dolor articular | ≥ 6 |
| Motivación | ≤ 3 |
| Proteína | < 1,4 g/kg media 7 días (objetivo ≠ mantener; ≥4 días apuntados) |
| Déficit | En definición, < 75 % del gasto |
| Ritmo de pérdida | En definición, > 1,2 % del peso/semana |

### Revisión de ciclo
1. **Descarga.** Señales: 2+ ejercicios bajan; ≥30 % estancados (con ≥4 evaluados); cada señal de mala recuperación. Con 3+ señales y ≥3 ciclos desde la última descarga: descarga (si automático) o propuesta. Con 2: aviso «Vigila la recuperación».
2. **Estancados**, en orden: lejos del fallo (RIR real ≥ objetivo + 2) → «acércate al RIR antes de cambiar nada»; mala recuperación → «primero sueño y comida»; prioridades → análisis de volumen; en definición → un solo aviso («mantener los kilos ya es buen resultado en déficit»); resto → prueba de cambio de rango ±2 (mín ≥10 baja; si no, sube). Máximo 2 pruebas a la vez.
3. **Volumen por grupo muscular** (apartado 6).
4. **Resumen positivo:** ejercicios que progresan («No toques lo que funciona»).
5. **Calibrar el RIR cada 4 ciclos:** última serie de 2–3 ejercicios estables, apunta las que crees que quedan y sigue al fallo técnico.

### Pruebas (prueba y error)
- Tipos: +1 serie, −1 serie, cambio de rango, ejercicio nuevo, cambio de ejercicio. Se guarda el estado anterior.
- Se evalúan tras 3 sesiones del ejercicio: mejor 1RM desde el cambio vs el de las 2 sesiones de antes.
- Ejercicio suelto: ≥ +2 % → se queda. < −1 % o 2 señales malas → se deshace. Sin efecto claro → 2 sesiones más; después, +1 serie se deshace y lo demás se queda.
- Grupo muscular (media de sus ejercicios): «cansado» = 2 señales malas, <85 % series completadas o RIR real 1,5+ por debajo. Quitar serie: se queda si rinde ≥99 % y no cansado; se deshace <97 %. Añadir: se queda ≥ +1,5 % sin cansancio; se deshace si cansado o <99 %.

### Ajustes automáticos que el usuario puede apagar
Kilos de cada serie · Descansos (regla del 80 %) · Series y rangos (pruebas) · Calorías (tendencia de peso) · Descargas.

## 6. Volumen inteligente por grupo → `domain/coach/volume.ts` (`volumen.js`)

### Coste de fatiga base
| Ejercicio | Coste |
|---|---|
| Compuesto con barra | 3 |
| Compuesto con mancuerna | 2,5 |
| Compuesto con peso corporal | 2,3 |
| Otro compuesto (máquina, polea) | 1,9 |
| Aislamiento estable | 1 |
| Aislamiento no estable | 1,3 |

+0,3 si pesado; +0,25 por cada otro músculo al que aporta ≥0,5; +0,2 en compuestos durante definición.
Estímulo: 1 si es el principal; con énfasis elegido 1,15 si trabaja esa zona y 0,55 si no.
**Eficiencia = estímulo ÷ coste.**

### Decisión
1. Sin ejercicios directos → nada. En descarga → no se toca. Sin datos y por encima del mínimo → esperar.
2. El grupo baja y no recuperas → −1 serie (la de menor eficiencia, peor si baja/estancada).
3. Por encima de máx + 0,5 y no recuperas → −1 serie.
4. No recuperas → mantener.
5. Motivos para añadir: bajo el mínimo; o bajo el máximo siendo prioridad y progresando/igual; o estancado recuperando bien (no en definición si no es prioridad).
6. Sin motivo → mantener. Énfasis sin cubrir → proponer cambiar el peor ejercicio por uno de esa zona.
7. Dónde añadir: +1 serie a un ejercicio existente (máx 4 series, 5 en aislamientos estables; máx 11 series del músculo en la sesión; sesión ≤ tus minutos + 10). Puntuación = eficiencia × rendimiento (progresa 1,15 · igual 1 · estancado 0,8 · baja 0,45) × RIR (0,85 si vas más al fallo de lo previsto) × (1 − 7 % por serie por encima de 2). O ejercicio nuevo de 2 series en la sesión con más hueco: eficiencia × 0,85 (× 1,25 si cubre énfasis sin cubrir).

### Zonas de énfasis (→ `content/emphasis.json`, mejor como lista explícita de ids)
| Músculo | Zonas |
|---|---|
| Pecho | Pecho superior · Pecho medio e inferior |
| Tríceps | Cabeza larga (brazo por encima) · Lateral y medial |
| Bíceps | Estirado (brazo por detrás) · Acortado (predicador) |
| Cuádriceps | Recto femoral (extensiones) · Vastos (sentadillas y prensas) |
| Femoral | Estirado (bisagras) · Curl femoral |
| Glúteo | Estirado (bisagras y sentadillas) · Acortado (hip thrust y abducción) |
| Dorsal | Tirones verticales y pullover · Remos |

## 7. Consejos según la sesión y cobertura → `content/session-rules.json`, `content/coverage.json`, `domain/tips/`

### Tipo de sesión
Se suman series: empuje (horizontal, inclinado, vertical), tirón (tracción vertical y horizontal), pierna (sentadilla, bisagra, unilateral, empuje de cadera). Aislamientos cuentan 0,6 (pierna) o 0,5 (empuje y tirón) según su músculo. Gana el mayor; si nada, «mixta».

### Recomendaciones de «Consejos de hoy»
- Lateral en polea: empuje → cable por delante; tirón → por detrás. En tirón con hombro lateral, opción en polea alta por detrás (2–3 series).
- Empuje: bíceps intercalado entre los press (si falta y no está en Mantener, sugerir).
- Tirón: tríceps intercalado entre ejercicios de espalda; si hay bíceps, tarde.
- Una prioridad fuera de los dos primeros ejercicios: subirla.
- Gemelo: intercalar entre series.
- Core: en polea o máquina, hueco que no compita; si es de estabilidad, añadir crunch con carga.
- Antebrazo: tras los tirones; en día sin tirón, 24–48 h hasta espalda.
- Curl femoral + bisagra: si el curl hunde el rumano, invertir.
- Hack + prensa: prensa después (p. ej. 2 + 3).

### Cobertura según el método
| Músculo | Pide | Si falta, sugiere |
|---|---|---|
| Pecho | Un inclinado y trabajo horizontal | Press inclinado / press plano |
| Espalda | Dorsal vertical y trapecio (remo con apoyo, Kelso) | Remo en T con apoyo, Kelso / jalón |
| Hombro lateral | Elevaciones laterales | Laterales en polea o mancuernas |
| Bíceps | Predicador y martillo | Predicador / martillo |
| Tríceps | Extensión con hombro elevado | Katana, sobre la cabeza |
| Cuádriceps | Recto femoral | Extensión, sissy, nórdico inverso |
| Isquios | Un curl, mejor sentado | Curl femoral sentado |
| Glúteo | Acortado, estirado y abducción | Hip thrust, abducción, rumano, búlgara |
| Gemelo | Rodilla extendida | Talones en prensa o de pie |
| Core | Dinámico progresable | Crunch en polea o máquina |
| Hombro posterior (si prioridad) | Abducción horizontal | En polea, contractora posterior |

## 8. Nutrición → `domain/nutrition/`

### Tendencia y ritmo
- Tendencia = anterior + 0,15 × (peso de hoy − anterior).
- Ritmo semanal: regresión lineal de la tendencia de 14 días (≥4 pesajes en ≥6 días), en % del peso/semana.

### Gasto y objetivo
```
Basal (Mifflin-St Jeor) = 10 × kg + 6,25 × cm − 5 × edad + 5 (hombre) | − 161 (mujer)
```
- Factor actividad = 1,25 + 0,045 por cada 1.000 pasos sobre 3.000 (hasta 8.000 más) + 0,03 por día de entreno, entre 1,3 y 1,95.
- Gasto = basal × factor (hasta aprender el real).
- **Definición:** gasto − (ritmo % × peso × 7.700 / 7), ritmo por defecto 0,75 %/sem. Suelo: máx(basal × 1,1; 1.500 hombre / 1.200 mujer).
- **Volumen:** gasto + máx(75 kcal; 0,375 % del peso al mes en kcal).
- **Salir de dieta:** objetivo guardado o gasto − 300. **Mantener / recomposición:** gasto.
- Macros: proteína 1,5 g/kg (1,5 · 1,8 · 2,2), grasa 0,6 g/kg (0,6 · 0,8 · 1,0), resto hidratos. Pasos 10.000.

### Revisión semanal automática (sin dieta cargada)
- Con 8 pesajes y 8 días de comida en 14: gasto observado = comida media − pendiente del peso × 7.700. Nuevo gasto = 0,6 × anterior + 0,4 × observado (entre basal × 1,1 y × 2,6).
- Sin datos, por ritmo: definición más lenta de −0,25 %/sem dos semanas → primero 10.000 pasos, luego −150 kcal; más rápida de −1,2 %/sem → +150. Volumen <0,1 %/mes → +100; >0,8 %/mes → −100. Salir de dieta con peso estable (±0,15 %) → +200 kcal hidratos. Mantener ±0,3 %/sem → ∓100.

### Ajuste semanal propuesto (±150 kcal)
- Necesita ≥10 pesajes en 14 días y 12 días de comida en 4 semanas.
- Comida fuera del 85–115 % del objetivo → no toca («primero, comer lo que marca el plan»).
- 10 días entre cambios. Margen: ±0,2 %/sem en definición, ±0,15 resto.
- Nunca bajo el suelo. En definición, antes de comer menos: 10.000 pasos. Subidas en hidratos (+37 g). Pasos y cardio no suben calorías.

### Consulta semanal con dieta cargada
1. Cambio de fase al llegar a la siguiente del plan.
2. Semana 1: nada (1,5–2,5 kg es agua y glucógeno).
3. Plan cumplido <60 % → «primero, cumplir el plan».
4. Dos semanas bajando más que el umbral rápido (0,9 kg) o fuerza en básicos −3 % (fuera de fase final) → +150–200 kcal hidratos.
5. Dos semanas bajo el umbral lento (0,3 kg): cintura −0,5 cm o más → nada; 1.000 pasos menos que el plan → pasos; si no, +2.000 pasos o −100/150 kcal en descansos.
6. Fase final (semana 9 o grasa a 3 puntos del objetivo) y fuerza −2 % → proteína hacia 1,9 g/kg.
7. Una sola semana fuera → esperar.
8. Hambre alta o energía baja → consejos (verdura, proteína repartida, hidratos antes de entrenar, sueño).

Entrenador en la consulta: descarga si toca; «recuperación justa» con 2 señales; 3+ récords en 7 días → «no toques lo que funciona»; si no, «semana sólida». Fuerza en básicos: los 3 compuestos más repetidos, mejor 1RM de 2 semanas vs las 2 anteriores.

Pausa de dieta: a las 10 semanas de definición, 1–2 en mantenimiento. Peso objetivo: semanas = ln(objetivo ÷ peso) ÷ ln(1 + ritmo/100), con ritmo real de 21 días y con el del plan.

## 9. Cuerpo, cardio y hábitos → `domain/body.ts`, `domain/cardio.ts`, `domain/habits.ts`, `domain/tools/plates.ts`

### Composición corporal (Marina EE. UU., medidas en pulgadas)
- Hombre: 86,010 × log10(cintura − cuello) − 70,041 × log10(altura) + 36,76
- Mujer: 163,205 × log10(cintura + cadera − cuello) − 97,684 × log10(altura) − 78,387
- Calibración opcional con medida real: se guarda la diferencia. Rango ±3,5 puntos (±2 calibrado). Mínimo 3 %.
- Magra = peso tendencia × (1 − grasa). FFMI = magra ÷ altura², corregido a 1,80 m; techo ~25 hombres naturales (Kouri 1995).
- Objetivo de grasa: 8·10·12·15 % (hombre), 18·20·22·25 % (mujer); peso objetivo = magra ÷ (1 − objetivo).

### Revisión semanal (check-in)
Cintura (40–200 cm), sueño medio (2–14 h) y escalas 1–10: energía, fatiga y agujetas, dolor articular, ganas de entrenar, hambre, estrés; nota.

### Cardio
- Gasto = MET × kg × horas.
- Minutos semanales: intenso cuenta doble; objetivo OMS 150.
- Día de pierna = sesión con ≥5 series de cuádriceps, femoral y glúteo.
- Consejo del día: descanso → 20–40 min suaves; pierna → suave y después de pesas (nada de correr ni HIIT antes); otro día → después o separado; si mañana pierna, bici o cinta inclinada.
- Por objetivo: definición → pasos primero, luego 2–3 sesiones suaves de 20–40 min; volumen → 150 min suaves; resto → 150–300 (OMS).

### Checklist
- Diario: pesarse en ayunas · entrenar si toca · apuntar comida · pasos · sueño.
- Semanal: sesiones previstas · consulta · 150 min cardio · informe del coach.
- Mensual: medidas · fotos · copia de seguridad (cada 2 semanas).

### Herramientas
- Calculadora de discos (discos 25…1,25; barras 20/15/10 o sin barra; indica lo que sobra).
- Cronómetro de serie: cadencia y cuenta atrás para isométricos (20 s–2 min; automática en planchas).

### Juego de la app
«Esencia, rango y misiones»: no es conocimiento de fitness; **decidir si se lleva**.
