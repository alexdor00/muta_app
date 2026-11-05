import { ChevronLeftIcon } from '../../../../shared/ui/icons.tsx'
import { RoundButton } from '../../../../shared/ui/RoundButton.tsx'
import p from './Pagina.module.css'

/** La barra de arriba de una pantalla completa de Comida: «‹» para volver y el título en el centro (como Tu objetivo). */
export function Barra({ titulo, volver }: { titulo: string; volver: string }) {
  return (
    <header class={p.bar}>
      <RoundButton label="Volver" variant="plain" href={volver}>
        <ChevronLeftIcon />
      </RoundButton>
      <h1 class={p.barTitle}>{titulo}</h1>
      <span />
    </header>
  )
}
