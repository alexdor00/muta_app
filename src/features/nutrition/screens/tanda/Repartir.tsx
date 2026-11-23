// Repartir lo cocinado (rediseño 35; usuario, 2026-11-19: `Desktop/MUTA-Modo-Cocina`): los platos que se reparten, cada
// uno con un recipiente por comida que tocas al llenarlo; pesar, si lo quieres exacto (`RepartirPlato`).
import { useState } from 'preact/hooks'
import { deMasDe, factorOlla, gramosEnOlla, platosDeTanda, type Tanda } from '../../state/autopilot.ts'
import { diaSemana, menu, NOMBRE_DIA, nombreDeComida, personas } from '../../state/recetas.ts'
import c from './Cocina.module.css'
import { InfoOllas } from './Ollas.tsx'
import { RepartirPlato } from './RepartirPlato.tsx'

/**
 * Los platos de una tanda que se reparten: los de más de una comida, con raciones de más o, si cocinas para varias
 * personas, todos (usuario, 2026-11-21).
 */
export const conVariosDias = (t: Tanda) =>
  platosDeTanda(t).filter((x) => personas.value > 1 || x.raciones + deMasDe(t, x.plato) > 1)

export function Repartir({ t, todos }: { t: Tanda; todos?: boolean }) {
  const [llenos, setLlenos] = useState<string[]>([])
  const lleno = (k: string) => setLlenos(llenos.includes(k) ? llenos.filter((y) => y !== k) : [...llenos, k])
  return (
    <>
      <div class={c.repartirCabeza}>
        <h2>
          Reparte en recipientes <InfoOllas />
        </h2>
        <p>Uno por comida; tócalo al llenarlo</p>
      </div>
      {(todos ? platosDeTanda(t) : conVariosDias(t)).map((x) => (
        <RepartirPlato
          key={x.plato}
          plato={x.plato}
          recipientes={t.huecos
            .filter((h) => h.plato === x.plato)
            .map((h) => ({
              clave: `${h.fecha}|${h.comida}`,
              dia: NOMBRE_DIA[diaSemana(h.fecha)],
              sub: nombreDeComida(menu.value, h.comida),
              gramos: gramosEnOlla(t, h),
            }))}
          factor={factorOlla(t, x.plato)}
          extra={deMasDe(t, x.plato)}
          base={t.mixtos.some((h) => h.plato === x.plato)}
          llenos={llenos}
          onLleno={lleno}
        />
      ))}
    </>
  )
}
