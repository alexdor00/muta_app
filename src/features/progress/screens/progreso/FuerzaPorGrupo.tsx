import { useState } from 'preact/hooks'
import { formatMonthName } from '../../../../shared/lib/format.ts'
import { ChevronDownIcon, ChevronRightIcon } from '../../../../shared/ui/icons.tsx'
import { desdeElPrincipio, ejercicioEnMes, entreno, fuerzaDelMes, otroMes } from '../../state/progreso.ts'
import { fuerzaTexto, textoSerie, conSigno } from './formato.ts'
import { Cambio, Grafica, Record, TituloSeccion } from './Piezas.tsx'
import styles from './Progreso.module.css'

/**
 * Fuerza: arriba, tus básicos como la gráfica de Ver sesión (la cifra del mes frente al anterior y la línea hasta ese mes);
 * debajo, «Por grupo muscular» en una lista plana. Al abrir un grupo, sus ejercicios (sus básicos, los primeros) con su mejor
 * serie del mes frente a la de antes y «Récord»; un ejercicio abre su hoja (`EjercicioHoja`).
 */
export function FuerzaPorGrupo({ mes, onEjercicio }: { mes: string; onEjercicio: (nombre: string) => void }) {
  const [abierto, setAbierto] = useState<string | null>(null)
  const e = entreno.value
  if (!e) return null
  const ejercicios = e.ejercicios.flatMap((x) => {
    const en = ejercicioEnMes(x.puntos, mes)
    return en ? [{ ...x, ...en }] : []
  })
  // Los grupos en el orden de siempre (el de los récords); dentro, sus básicos primero y luego los que más hiciste
  const orden = (n: string) => {
    const i = e.basicos.indexOf(n)
    return i < 0 ? e.basicos.length : i
  }
  const grupos = [...e.records.map((r) => r.nombre), 'Otros'].flatMap((grupo) => {
    const suyos = ejercicios
      .filter((x) => (x.grupo ?? 'Otros') === grupo)
      .sort((a, b) => orden(a.nombre) - orden(b.nombre) || b.puntos.length - a.puntos.length)
    if (!suyos.length) return []
    const cambios = suyos.flatMap((x) => (x.cambio === null ? [] : [x.cambio]))
    return [
      {
        grupo,
        ejercicios: suyos,
        records: suyos.filter((x) => x.record).length,
        cambio: cambios.length ? cambios.reduce((t, c) => t + c, 0) / cambios.length : null,
      },
    ]
  })
  const anterior = formatMonthName(otroMes(mes, -1)).toLowerCase()
  const semanal = e.fuerzaSemanal.map((s) => ({ date: s.lunes, cambio: s.cambio }))
  const basicos = fuerzaDelMes(semanal, mes)
  const linea = desdeElPrincipio(semanal, { desde: null, hasta: `${mes}-31` }).map((s) => ({
    date: s.date,
    v: Math.round(s.cambio * 1000) / 10,
    dato: null,
  }))
  const records = grupos.reduce((t, g) => t + g.records, 0)
  if (!grupos.length) return <p class={styles.notaCentro}>Sin ejercicios con peso este mes.</p>
  return (
    <>
      {linea.length > 1 && (
        <Grafica
          etiqueta="Tus básicos"
          titulo="Tus básicos · 1RM estimado"
          valor={basicos === null ? null : fuerzaTexto(basicos)}
          texto={(v) => (Math.round(v) === 0 ? '=' : `${conSigno(Math.round(v))} %`)}
          cambio={basicos === null ? null : `frente a ${anterior}`}
          puntos={linea}
          resumen={`Tu fuerza en tus básicos hasta ${formatMonthName(mes).toLowerCase()}, en % desde que empezaste`}
        />
      )}
      <section class={styles.bloque} aria-labelledby="fuerza-mes">
        <TituloSeccion
          id="fuerza-mes"
          titulo="Por grupo muscular"
          dato={records ? `${records} ${records === 1 ? 'récord' : 'récords'}` : `frente a ${anterior}`}
        />
        <ul class={styles.plana}>
          {grupos.map((g) => (
            <li key={g.grupo}>
              <button
                type="button"
                class={styles.filaPlana}
                aria-expanded={abierto === g.grupo}
                onClick={() => setAbierto(abierto === g.grupo ? null : g.grupo)}
              >
                <span class={styles.filaTexto}>
                  <span class={styles.filaTitulo}>{g.grupo}</span>
                  <span class={styles.filaDetalle}>
                    {g.ejercicios.length} {g.ejercicios.length === 1 ? 'ejercicio' : 'ejercicios'}
                    {g.records ? ` · ${g.records} ${g.records === 1 ? 'récord' : 'récords'}` : ''}
                  </span>
                </span>
                <Cambio cambio={g.cambio} que={anterior} />
                <ChevronDownIcon />
              </button>
              {abierto === g.grupo && (
                <ul class={styles.dentroGrupo}>
                  {g.ejercicios.map((x) => (
                    <li key={x.nombre}>
                      <button type="button" class={styles.filaPlana} onClick={() => onEjercicio(x.nombre)}>
                        <span class={styles.filaTexto}>
                          <span class={styles.filaTitulo}>
                            {x.nombre}
                            {e.basicos.includes(x.nombre) ? ' · básico' : ''}
                            {x.record && <Record />}
                          </span>
                          <span class={styles.filaDetalle}>
                            Mejor serie{' '}
                            {x.anterior
                              ? `${textoSerie(x.anterior.serie)} → ${textoSerie(x.mejor.serie)}`
                              : textoSerie(x.mejor.serie)}
                          </span>
                        </span>
                        <Cambio cambio={x.cambio} que={anterior} />
                        <ChevronRightIcon />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}
