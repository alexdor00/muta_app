import { useState } from 'preact/hooks'
import { CheckIcon } from '../../../../shared/ui/icons.tsx'
import { Sheet } from '../../../../shared/ui/Sheet.tsx'
import { LetraMenu } from '../../components/LetraMenu.tsx'
import { dieta, hoy } from '../../state/comida.ts'
import { cicloDe, menu } from '../../state/recetas.ts'
import { cadaMenuDura, diaFijo, porSemana } from '../../use-cases/plan.ts'
import { TiraSemana } from './TiraSemana.tsx'
import d from './TiraDelMenu.module.css'

/** Cómo se repiten tus menús: todas las semanas (0) o cada 1, 2 o 3 días en orden. */
const REPETIR = [
  { k: 0, nombre: 'Todas las semanas', que: 'Cada día con su menú; tú eliges cuál' },
  { k: 1, nombre: 'Cada día, en orden', que: 'Uno cada día y vuelta a empezar' },
  { k: 2, nombre: 'Cada 2 días', que: 'Cada menú dos días seguidos' },
  { k: 3, nombre: 'Cada 3 días', que: 'Cada menú tres días seguidos' },
]

/** Cómo se repiten ahora (0: todas las semanas); null si es el ciclo de una dieta cargada. */
export function repetirAhora(): number | null {
  const m = menu.value
  if (m.ciclo && m.diasPorMenu) return m.diasPorMenu
  if (m.ciclo && dieta.value) return null
  return 0
}

/** «se repiten todas las semanas», «cada menú 2 días seguidos»… para la cabecera de Tu dieta. */
export function textoRepetir(): string {
  const r = repetirAhora()
  if (r === null) return `ciclo de tu dieta, ${cicloDe(menu.value, hoy.value).menus.length} días`
  if (r === 0) return 'se repiten todas las semanas'
  return r === 1 ? 'uno cada día, en orden' : `cada menú ${r} días seguidos`
}

/**
 * «Tu semana» en Tu dieta (usuario, 2026-11-19, `Desktop/MUTA-Tu-dieta-calendario.png`): la semana real con la letra de
 * cada día y «Repetir» como en el calendario del móvil. Todas las semanas: tocar un día le pone el menú que miras. Cada
 * 1, 2 o 3 días: van en orden desde hoy y la tira solo se mira. «Cambiar solo un día ›» abre ese día suelto.
 */
export function TiraDelMenu(props: { menuId: string; onDia: (fecha: string) => void }) {
  const [unDia, setUnDia] = useState(false)
  const [repetir, setRepetir] = useState(false)
  const r = repetirAhora()
  const m = menu.value
  const indice = m.menus.findIndex((x) => x.id === props.menuId)
  const actual = REPETIR.find((x) => x.k === r)
  return (
    <section class={d.card} aria-labelledby="tu-semana">
      <div class={d.cabeza}>
        <h3 id="tu-semana">Tu semana</h3>
        <button type="button" class={d.repetir} onClick={() => setRepetir(true)}>
          Repetir: {actual ? actual.nombre.toLowerCase() : 'tu dieta'} ▾
        </button>
      </div>
      <TiraSemana
        dia={null}
        onElegir={(f) => {
          if (unDia) {
            setUnDia(false)
            return props.onDia(f)
          }
          if (r === 0) void diaFijo(f, props.menuId)
        }}
      />
      <p class={d.nota}>
        {unDia ? (
          'Toca el día que quieres cambiar solo esta vez.'
        ) : r === 0 ? (
          <>
            Toca un día para ponerle el <b>menú {m.menus[indice]?.id ?? ''}</b>.
          </>
        ) : (
          'Van en orden desde hoy. Para elegir cada día, pon «Todas las semanas».'
        )}
      </p>
      <button type="button" class={d.enlace} onClick={() => setUnDia(!unDia)}>
        {unDia ? 'Cancelar' : 'Cambiar solo un día ›'}
      </button>
      {repetir && (
        <Sheet title="Repetir tus menús" onClose={() => setRepetir(false)}>
          <p class={d.sub}>Cómo van tus menús por los días.</p>
          <div class={d.opcionesRepetir} role="group" aria-label="Repetir tus menús">
            {REPETIR.map((o) => (
              <button
                key={o.k}
                type="button"
                class={d.opcion}
                aria-pressed={r === o.k}
                onClick={() => {
                  setRepetir(false)
                  if (r !== o.k) void (o.k ? cadaMenuDura(o.k) : porSemana())
                }}
              >
                <span class={d.opcionTexto}>
                  <b>{o.nombre}</b>
                  <small>{o.que}</small>
                </span>
                {r === o.k ? (
                  <CheckIcon />
                ) : o.k ? (
                  <span class={d.ejemplo} aria-hidden="true">
                    {Array.from({ length: 4 }, (_, i) => {
                      const k = Math.floor(i / o.k) % Math.max(1, m.menus.length)
                      const x = m.menus[k]
                      return x ? <LetraMenu key={i} id={x.id} indice={k} /> : null
                    })}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        </Sheet>
      )}
    </section>
  )
}
