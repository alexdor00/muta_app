import { useLocation } from 'preact-iso'
import { paths } from '../../../../shared/lib/paths.ts'
import { TIP_BOTON, TarjetaConsejos } from '../../../../shared/ui/Consejos.tsx'
import { propuestas } from '../../state/recetas.ts'
import { ahoraNo } from '../../use-cases/menu.ts'

/**
 * «Tu nutricionista» en Mi plan (usuario, 2026-11-19: igual que Tu entrenador, sin aplicar nada): plegada, con cuántas
 * propuestas; cada una numerada con su porqué, «Entendido» y «Ver dónde se edita ›», que abre ese menú en Tu dieta con
 * la comida marcada para que la cambies tú.
 */
export function NutricionistaCard() {
  const { route } = useLocation()
  const xs = propuestas.value
  const editar = (menu: string, comida: string, id: string) =>
    route(`${paths.nutrition}?vista=menus&menu=${menu}&marca=${comida}&p=${encodeURIComponent(id)}`)
  return (
    <TarjetaConsejos
      id="nutricionista"
      titulo="Tu nutricionista"
      resumen={`${xs.length} ${xs.length === 1 ? 'consejo' : 'consejos'}`}
      consejos={xs.map((x) => ({
        text: x.titulo,
        why: x.detalle,
        pie: (
          <>
            <button type="button" class={TIP_BOTON.secundario} onClick={() => void ahoraNo(x)}>
              Entendido
            </button>
            <button
              type="button"
              class={TIP_BOTON.enlace}
              onClick={() => editar(x.menu, x.antes[0]?.comida ?? '', x.id)}
            >
              Ver dónde se edita ›
            </button>
          </>
        ),
      }))}
      nota="Nada cambia solo: te dice qué falta y dónde cambiarlo, y lo cambias tú."
    />
  )
}
