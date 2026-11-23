import type { ComponentChildren } from 'preact'
import { useLocation } from 'preact-iso'
import { paths, vieneDeHoy } from '../../../../shared/lib/paths.ts'
import { ChevronLeftIcon } from '../../../../shared/ui/icons.tsx'
import { RoundButton } from '../../../../shared/ui/RoundButton.tsx'
import { useVolver } from '../../../../shared/ui/useVolver.ts'
import p from './Pagina.module.css'

/**
 * La barra de arriba de una pantalla completa de Nutrición: «‹» para volver y el título en el centro (como Tu objetivo).
 * «‹» vuelve a la pantalla de la que vienes; si entraste directamente, a `volver` (o a Hoy, si el enlace era de Hoy).
 */
export function Barra({
  titulo,
  volver,
  accion,
}: {
  titulo: string
  volver: string
  /** A la derecha (el «+» de Tus menús). */
  accion?: ComponentChildren
}) {
  const { query } = useLocation()
  const deHoy = vieneDeHoy(query)
  const atras = useVolver(deHoy ? paths.today : volver)
  return (
    <header class={p.bar}>
      <RoundButton label={deHoy ? 'Volver a Hoy' : 'Volver'} variant="plain" onClick={atras}>
        <ChevronLeftIcon />
      </RoundButton>
      <h1 class={p.barTitle}>{titulo}</h1>
      {accion ?? <span />}
    </header>
  )
}
