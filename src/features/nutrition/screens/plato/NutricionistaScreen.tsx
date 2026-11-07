import { useEffect } from 'preact/hooks'
import { paths } from '../../../../shared/lib/paths.ts'
import { CheckIcon } from '../../../../shared/ui/icons.tsx'
import { Button } from '../../../../shared/ui/Button.tsx'
import { Toast } from '../../../../shared/ui/Toast.tsx'
import { estado } from '../../state/comida.ts'
import { estadoRecetas, menu, propuestas } from '../../state/recetas.ts'
import { aplicarPropuesta, ahoraNo, deshacerHecho } from '../../use-cases/menu.ts'
import { cargarComida } from '../../use-cases/nutritionStore.ts'
import { cargarRecetas } from '../../use-cases/recipes.ts'
import { Barra } from '../comun/Barra.tsx'
import { useAviso } from '../comun/useAviso.ts'
import p from '../comun/Pagina.module.css'
import h from '../comun/Hojas.module.css'

/**
 * Tu nutricionista: mira tu menú de los próximos 7 días y propone con sus motivos. Nunca cambia nada solo: «Aplicar»
 * o «Ahora no»; lo aplicado se deshace.
 */
export function NutricionistaScreen() {
  useEffect(() => {
    void cargarComida().then(cargarRecetas)
  }, [])
  const { aviso, avisar } = useAviso()
  if (estado.value === 'cargando' || estadoRecetas.value !== 'listo') return null
  const hechos = menu.value.hechos.filter((x) => x.estado === 'aplicado').slice(0, 5)
  return (
    <div class={p.page}>
      <Barra titulo="Tu nutricionista" volver={`${paths.nutrition}?vista=menu`} />
      {propuestas.value.length ? (
        propuestas.value.map((x) => (
          <section key={x.id} class={h.card} aria-label={x.titulo}>
            <p class={h.eyebrow}>{x.tipo === 'proteina' ? 'Proteína del día' : 'Kcal del día'}</p>
            <h2 class={p.cardTitle}>{x.titulo}</h2>
            <p class={h.sub}>{x.detalle}</p>
            <div class={h.searchRow}>
              <Button
                onClick={async () => {
                  await aplicarPropuesta(x)
                  avisar('Aplicado en tu menú')
                }}
              >
                Aplicar
              </Button>
              <Button variant="secondary" onClick={() => void ahoraNo(x)}>
                Ahora no
              </Button>
            </div>
          </section>
        ))
      ) : (
        <section class={h.card} aria-labelledby="todo-cuadra">
          <h2 id="todo-cuadra" class={h.hecho}>
            <CheckIcon /> Todo cuadra
          </h2>
          <p class={h.sub}>
            Tu menú de los próximos 7 días cuadra con tu objetivo. Cuando un día con al menos 3 comidas en el
            menú no llegue a la proteína o se pase de kcal, te lo propongo aquí.
          </p>
        </section>
      )}
      {hechos.length > 0 && (
        <section class={h.card} aria-label="Ya hecho">
          <p class={h.eyebrow}>Ya hecho</p>
          {hechos.map((x) => (
            <p key={x.id} class={h.line}>
              <span>{x.titulo}</span>
              <button
                type="button"
                class={h.textButton}
                onClick={async () => {
                  await deshacerHecho(x.id)
                  avisar('Deshecho: tu menú vuelve a como estaba')
                }}
              >
                Deshacer
              </button>
            </p>
          ))}
        </section>
      )}
      <p class={h.foot}>
        Mira la proteína y las kcal de cada día frente a tu objetivo. Avisa a partir de 15 g de proteína o 200
        kcal de diferencia (sugerido).
      </p>
      <Toast message={aviso?.texto ?? null} action={aviso?.accion ?? null} />
    </div>
  )
}
