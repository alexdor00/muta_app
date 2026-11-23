import { FotoEditable } from '../../../../shared/ui/FotoEditable.tsx'
import { Sheet } from '../../../../shared/ui/Sheet.tsx'
import { conFotoTuya, encuadresPlatos, fotos, type Plato } from '../../state/recetas.ts'
import { centrarFotoDePlato, ponerFotoDePlato, quitarFotoDePlato } from '../../use-cases/recipePhotos.ts'
import type { Aviso } from '../comun/useAviso.ts'
import s from './Plato.module.css'

/**
 * La foto de un plato (usuario, 2026-11-17: cambiarla y centrarla, como la de una sesión de Entreno): la tuya de la
 * galería o la cámara, que se arrastra para centrarla; quitarla vuelve a la que traía.
 */
export function FotoPlatoHoja(props: {
  plato: Plato
  onClose: () => void
  avisar: (texto: string, accion?: Aviso['accion']) => void
}) {
  const { plato: p, avisar } = props
  const tuya = conFotoTuya.value.includes(p.id)
  return (
    <Sheet title="Foto del plato" onClose={props.onClose} large>
      <FotoEditable
        key={fotos.value[p.id] ?? 'sin'}
        foto={fotos.value[p.id] ?? null}
        alt={`Foto de ${p.nombre}`}
        encuadre={encuadresPlatos.value[p.id] ?? { x: 50, y: 50 }}
        onCentrar={(x, y) => void centrarFotoDePlato(p.id, x, y)}
        onFoto={async (archivo) => {
          const ok = await ponerFotoDePlato(p.id, archivo)
          avisar(ok ? 'Foto puesta' : 'No se pudo leer esa imagen')
        }}
        onQuitar={
          tuya
            ? async () => {
                await quitarFotoDePlato(p.id)
                avisar('Foto quitada')
              }
            : undefined
        }
      >
        <span class={s.fotoNombre}>{p.nombre}</span>
      </FotoEditable>
    </Sheet>
  )
}
