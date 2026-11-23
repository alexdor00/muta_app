// Las instrucciones para que una IA pase cualquier rutina (Word, PDF, foto…) al CSV que lee MUTA (usuario, 2026-11-19).
// Siguen el formato de `csvRoutine.ts` (docs/datos.md · «Tu rutina desde un CSV»).

export const INSTRUCCIONES_IA_RUTINA = `Convierte la rutina de entrenamiento que te paso (al final o en el archivo adjunto) en un CSV para la app MUTA. Devuélvelo listo para guardar como .csv.

FORMATO
- Separador: punto y coma (;). Sin comillas salvo que un texto lleve «;».
- Primera fila, exactamente estos títulos:
Sesión;Ejercicio;Series;Repeticiones;RIR;Descanso;Notas
- Una fila por ejercicio, en el orden en que se hace la semana: todos los de la primera sesión, luego los de la segunda…

UNA SEMANA, QUE SE REPITE
- Escribe UNA sola semana: MUTA la repite igual todas las semanas.
- Si una sesión se hace dos veces en la semana (por ejemplo, «Torso» el lunes y el jueves), escríbela las dos veces, cada una en su sitio.
- Si la rutina cambia de una semana a otra (semana 1, 2, 3…), pasa solo la semana 1 y avísame debajo.

COLUMNAS
- Sesión: el nombre de la sesión («Torso», «Pierna», «Día 1»). Las filas seguidas con la misma sesión forman esa sesión.
- Ejercicio: el nombre en español, el más común («Press banca», «Sentadilla», «Remo con barra»).
- Series: las series efectivas, sin el calentamiento.
- Repeticiones: un rango «6-10», un número «5» o, si cada serie es distinta, una por serie con comas: «4,6,8».
- RIR: repeticiones en reserva (0-9). Si la rutina usa RPE: RIR = 10 − RPE. Si no lo dice, vacío.
- Descanso: entre series, como «3:00», «90 s» o «2 min».
- Notas: técnica, tempo, superserie, dropset u otra indicación de la rutina, tal cual.

DÍAS DE DESCANSO
- Si la rutina marca un día de descanso entre sesiones, pon una fila con «Descanso» en la columna Sesión y el resto vacío, en ese punto.

REGLAS
- No inventes nada: ni ejercicios, ni series, ni repeticiones, ni descansos. Si algo no está, deja la celda vacía.
- Devuelve SOLO el CSV dentro de un bloque de código. Debajo, en una línea, las dudas que hayas tenido.

EJEMPLO
Sesión;Ejercicio;Series;Repeticiones;RIR;Descanso;Notas
Torso;Press banca;3;6-10;2;3:00;
Torso;Remo con barra;3;8-12;2;2:00;
Pierna;Sentadilla;4;5;2;3:00;
Pierna;Peso muerto rumano;3;8-10;2;2:00;Bajada en 3 segundos
Descanso;;;;;;
Torso;Press inclinado con mancuernas;3;4,6,8;1;2:30;

MI RUTINA:
`
