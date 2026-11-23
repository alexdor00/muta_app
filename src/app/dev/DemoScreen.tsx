import { useLocation } from 'preact-iso'
import { useEffect, useState } from 'preact/hooks'
import { paths } from '../../shared/lib/paths.ts'
import { Button } from '../../shared/ui/Button.tsx'
import styles from './DemoScreen.module.css'
import { cargarPerfilDemo } from './perfilDemo.ts'

/**
 * /dev/demo — carga un perfil inventado para ver la app como se vería de verdad (Progreso, Hoy, Entreno y Nutrición con
 * unos 100 días de datos). Borra lo de este dispositivo: se pregunta antes. Con `?cargar=1` empieza solo (preguntando) y,
 * con `&ir=hoy`, al terminar abre Hoy.
 */
type Estado = 'listo' | 'cargando' | 'error'

/** Pregunta, borra lo de este dispositivo, pone el perfil de prueba y abre `destino` (recargando entera la app). */
async function cargar(destino: string, setEstado: (e: Estado) => void) {
  if (
    !window.confirm(
      'Se borra todo lo que tengas en este dispositivo (entrenos, pesajes, comidas, medidas y fotos) y se pone el perfil de prueba. ¿Seguir?',
    )
  )
    return
  setEstado('cargando')
  try {
    await cargarPerfilDemo()
    // Se recarga entera: así nada se queda en memoria de antes
    window.location.href = destino
  } catch {
    setEstado('error')
  }
}

export function DemoScreen() {
  const { query } = useLocation()
  const [estado, setEstado] = useState<Estado>('listo')
  const destino = query.ir === 'hoy' ? paths.today : paths.progress
  const solo = query.cargar === '1'
  useEffect(() => {
    if (solo) void cargar(destino, setEstado)
  }, [solo, destino])
  return (
    <main class={styles.page}>
      <h1 class={styles.titulo}>Perfil de prueba</h1>
      <p class={styles.texto}>
        Un perfil inventado con unos 100 días en la app: la rutina MUTA Cuerpo completo A/B cuatro días por
        semana, tres mesociclos (volumen de verano, mantener y la definición de ahora), pesajes cada mañana,
        medidas y fotos de cada mes (dibujadas), consultas semanales y lo que comió las tres últimas semanas.
      </p>
      <p class={styles.aviso}>
        <b>Borra lo que haya en este dispositivo.</b> Para no perder lo tuyo, ábrelo en una ventana privada o
        en el ordenador.
      </p>
      <Button onClick={() => void cargar(destino, setEstado)} disabled={estado === 'cargando'}>
        {estado === 'cargando' ? 'Cargando…' : 'Cargar el perfil de prueba'}
      </Button>
      {estado === 'error' && (
        <p class={styles.texto}>No se pudo cargar. Recarga la página y prueba otra vez.</p>
      )}
    </main>
  )
}
