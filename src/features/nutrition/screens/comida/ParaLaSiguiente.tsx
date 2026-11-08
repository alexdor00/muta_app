import { formatInt } from '../../../../shared/lib/format.ts'
import { paths } from '../../../../shared/lib/paths.ts'
import { Carrusel, PlatoTarjeta } from '../../components/Platos.tsx'
import { fotos, paraLaSiguiente, siguiente } from '../../state/recetas.ts'
import { comidaDe } from '../comun/platos.ts'

/** «Para la cena · te faltan 534 kcal»: las recetas que mejor cuadran con lo que falta, ya ajustadas. */
export function ParaLaSiguiente() {
  const s = siguiente.value
  if (!s || !paraLaSiguiente.value.length) return null
  return (
    <Carrusel
      id="para-ti"
      titulo={`Para ${comidaDe(s.comida).el}`}
      extra={`te faltan ${formatInt(s.objetivo.kcal)} kcal`}
    >
      {paraLaSiguiente.value.map((e) => (
        <PlatoTarjeta
          key={e.plato.id}
          nombre={e.plato.nombre}
          foto={fotos.value[e.plato.id] ?? null}
          linea={`≈ ${formatInt(e.ajuste.total.kcal)} kcal · ${formatInt(e.ajuste.total.protein)} P${e.plato.ajustable ? ' · ajustada' : ''}`}
          href={paths.dish(e.plato.id, { comida: s.comida })}
        />
      ))}
    </Carrusel>
  )
}
