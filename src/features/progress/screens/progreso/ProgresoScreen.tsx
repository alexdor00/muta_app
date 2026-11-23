import { useEffect, useRef, useState } from 'preact/hooks'
import { useLocation } from 'preact-iso'
import { paths } from '../../../../shared/lib/paths.ts'
import { ChoiceSegmented } from '../../../../shared/ui/Choice.tsx'
import { CompactBar } from '../../../../shared/ui/CompactBar.tsx'
import { ScreenHeader } from '../../../../shared/ui/ScreenHeader.tsx'
import { Sheet } from '../../../../shared/ui/Sheet.tsx'
import { Toast } from '../../../../shared/ui/Toast.tsx'
import { useSheet } from '../../../../shared/ui/useSheet.ts'
import { detalle, estado, etapaDelMes, hoy, POSES, primerMes } from '../../state/progreso.ts'
import { abrirMesociclo } from '../../use-cases/mesocycles.ts'
import { cargarProgreso } from '../../use-cases/progress.ts'
import { Constancia, Musculos, Rutina } from '../mesociclo/Pestanas.tsx'
import { HojasEtapa } from './AccionesEtapa.tsx'
import { CabeceraMes } from './CabeceraMes.tsx'
import { CalibrarHoja } from './CalibrarHoja.tsx'
import { CompararHoja } from './CompararHoja.tsx'
import { Composicion } from './Composicion.tsx'
import { Cuerpo, MedidaHoja } from './Cuerpo.tsx'
import { Dias } from './Dias.tsx'
import { EjercicioHoja } from './EjercicioHoja.tsx'
import { EtapaHoja } from './EtapaHoja.tsx'
import { FotoHoja } from './FotoHoja.tsx'
import { FuerzaPorGrupo } from './FuerzaPorGrupo.tsx'
import { MesHoja } from './MesHoja.tsx'
import styles from './Progreso.module.css'
import { TuCambio } from './TuCambio.tsx'

const VISTAS = [
  { value: 'dias', label: 'Días' },
  { value: 'cuerpo', label: 'Cuerpo' },
  { value: 'fuerza', label: 'Fuerza' },
] as const
type Vista = (typeof VISTAS)[number]['value']

const esVista = (v: string | undefined): v is Vista => VISTAS.some((x) => x.value === v)

/**
 * Progreso, mes a mes (`/progreso?mes=2026-11&ver=dias`; de serie, el mes de hoy y Días): arriba el mes con sus flechas, su
 * etapa (abre su hoja) y tres cajas frente al mes anterior; debajo, Días (el calendario y lo que hiciste cada día), Cuerpo
 * (tus fotos comparadas con las de otro mes y tus medidas) y Fuerza (por grupo muscular). Lo que toca apuntar está en Hoy.
 */
export function ProgresoScreen() {
  const { query, route } = useLocation()
  const cabecera = useRef<HTMLDivElement>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const hojas = {
    foto: useSheet('foto'),
    etapa: useSheet('etapa'),
    musculos: useSheet('musculos'),
    rutina: useSheet('rutina'),
    constancia: useSheet('constancia'),
    calibrar: useSheet('calibrar'),
    mes: useSheet('mes'),
    medida: useSheet('medida'),
    comparar: useSheet('comparar'),
    composicion: useSheet('composicion'),
    cambio: useSheet('cambio'),
    ejercicio: useSheet('ejercicio'),
  }
  useEffect(() => {
    void cargarProgreso()
  }, [])
  useEffect(() => {
    if (!aviso) return
    const t = setTimeout(() => setAviso(null), 4000)
    return () => clearTimeout(t)
  }, [aviso])
  const esteMes = hoy.value.slice(0, 7)
  const pedido = query.mes && /^\d{4}-\d{2}$/.test(query.mes) ? query.mes : esteMes
  const mes = pedido > esteMes ? esteMes : pedido < primerMes.value ? primerMes.value : pedido
  const ver: Vista = esVista(query.ver) ? query.ver : 'dias'
  const etapa = estado.value === 'listo' ? etapaDelMes(mes) : null
  const mesoId = etapa?.id ?? null
  useEffect(() => {
    if (mesoId) void abrirMesociclo(mesoId)
  }, [mesoId])
  const d = mesoId && detalle.value !== 'cargando' && detalle.value?.meso.id === mesoId ? detalle.value : null
  const ir = (m: string, v: Vista) => route(`${paths.progress}?mes=${m}&ver=${v}`, true)
  return (
    <>
      <CompactBar title="Progreso" watch={cabecera} />
      <div ref={cabecera}>
        <ScreenHeader title="Progreso" avatarHref={paths.profile} inline />
      </div>
      {estado.value === 'listo' && (
        <div class={styles.stack}>
          <CabeceraMes
            mes={mes}
            puedeAntes={mes > primerMes.value}
            puedeDespues={mes < esteMes}
            onMes={(m) => ir(m, ver)}
            etapa={etapa}
            constancia={d?.porMes[mes]?.pct ?? null}
            onEtapa={() => hojas.etapa.show()}
          />
          <ChoiceSegmented
            name="vista"
            legend="Qué ver del mes"
            options={[...VISTAS]}
            value={ver}
            onChange={(v) => ir(mes, v)}
          />
          {ver === 'dias' && <Dias key={mes} mes={mes} avisar={setAviso} />}
          {ver === 'cuerpo' && (
            <Cuerpo
              key={mes}
              mes={mes}
              onFoto={(id) => hojas.foto.showWith({ foto: id })}
              onCambio={(pose) => hojas.cambio.showWith({ pose })}
              onMedida={(id) => hojas.medida.showWith({ medida: id })}
              onComposicion={() => hojas.composicion.show()}
              onMedir={() => hojas.mes.show()}
            />
          )}
          {ver === 'fuerza' && (
            <FuerzaPorGrupo
              key={mes}
              mes={mes}
              onEjercicio={(nombre) => hojas.ejercicio.showWith({ ejercicio: nombre })}
            />
          )}
        </div>
      )}
      {hojas.etapa.open && etapa && (
        <EtapaHoja
          m={etapa}
          d={d}
          onClose={hojas.etapa.close}
          onConstancia={() => hojas.constancia.show()}
          onMusculos={() => hojas.musculos.show()}
          onRutina={() => hojas.rutina.show()}
          onComparar={() => hojas.comparar.show()}
        />
      )}
      {d && <HojasEtapa d={d} avisar={setAviso} />}
      {hojas.foto.open && <FotoHoja id={query.foto ?? ''} onClose={hojas.foto.close} avisar={setAviso} />}
      {hojas.cambio.open && (
        <TuCambio
          pose={POSES.find((p) => p.id === query.pose)?.id ?? 'frente'}
          hasta={mes}
          onClose={hojas.cambio.close}
        />
      )}
      {hojas.ejercicio.open && (
        <EjercicioHoja nombre={query.ejercicio ?? ''} mes={mes} onClose={hojas.ejercicio.close} />
      )}
      {hojas.medida.open && <MedidaHoja id={query.medida ?? ''} mes={mes} onClose={hojas.medida.close} />}
      {hojas.musculos.open && d && (
        <Sheet title="Tus músculos" onClose={hojas.musculos.close} large>
          <div class={styles.hoja}>
            <Musculos d={d} />
          </div>
        </Sheet>
      )}
      {hojas.rutina.open && d && (
        <Sheet title="Tu rutina" onClose={hojas.rutina.close} large>
          <div class={styles.hoja}>
            <Rutina d={d} />
          </div>
        </Sheet>
      )}
      {hojas.constancia.open && d && (
        <Sheet title="Constancia" onClose={hojas.constancia.close} large>
          <div class={styles.hoja}>
            <Constancia d={d} />
          </div>
        </Sheet>
      )}
      {hojas.composicion.open && (
        <Sheet title="Tu composición" onClose={hojas.composicion.close} large>
          <div class={styles.hoja}>
            <Composicion
              onCalibrar={() => hojas.calibrar.show()}
              onMedir={() => hojas.mes.show()}
              avisar={setAviso}
            />
          </div>
        </Sheet>
      )}
      {hojas.calibrar.open && <CalibrarHoja onClose={hojas.calibrar.close} avisar={setAviso} />}
      {hojas.mes.open && <MesHoja onClose={hojas.mes.close} avisar={setAviso} />}
      {hojas.comparar.open && <CompararHoja onClose={hojas.comparar.close} />}
      <Toast message={aviso} />
    </>
  )
}
