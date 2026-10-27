import { paths } from '../../../../shared/lib/paths.ts'
import { Pending } from '../../../../shared/ui/Pending.tsx'
import { useSheet } from '../../../../shared/ui/useSheet.ts'

/** C01 Ejercicios, C02 Registro y C03 Descanso: pantalla completa, sin pestañas. */
export function SesionScreen(props: { sessionId: string }) {
  const thisSession = useSheet('esta-sesion')
  return (
    <Pending code="C01–C03" title={`Entrenando ${props.sessionId}`}>
      <button type="button" onClick={thisSession.show}>
        Esta sesión
      </button>
      {thisSession.open && (
        <div role="dialog" aria-label="Esta sesión">
          <p>C08 · Esta sesión (hoja)</p>
          <a href={paths.summary(props.sessionId)}>Ver resumen</a> ·{' '}
          <button type="button" onClick={thisSession.close}>
            Cerrar
          </button>
        </div>
      )}
    </Pending>
  )
}
