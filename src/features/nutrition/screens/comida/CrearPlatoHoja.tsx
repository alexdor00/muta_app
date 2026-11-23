import { useEffect, useState } from 'preact/hooks'
import { parseDecimal } from '../../../../shared/lib/format.ts'
import { Button } from '../../../../shared/ui/Button.tsx'
import { ChoiceSegmented } from '../../../../shared/ui/Choice.tsx'
import { Deslizable } from '../../../../shared/ui/Deslizable.tsx'
import { GripIcon, PlusIcon } from '../../../../shared/ui/icons.tsx'
import { useReordenar } from '../../../../shared/ui/useReordenar.ts'
import { recetario } from '../../state/recetas.ts'
import { cargarAlimentos } from '../../use-cases/foodLog.ts'
import { crearPlato } from '../../use-cases/recipes.ts'
import { centrarFotoDePlato, ponerFotoDePlato } from '../../use-cases/recipePhotos.ts'
import type { Aviso } from '../comun/useAviso.ts'
import { FotoEditable } from '../../../../shared/ui/FotoEditable.tsx'
import { gramosDeIngrediente, IngredientesReceta, type IngredienteNuevo } from './IngredientesReceta.tsx'
import { CifrasRacion } from './CifrasRacion.tsx'
import s from './CrearPlato.module.css'

type Props = {
  onClose: () => void
  onCreado: (id: string) => void
  avisar: (texto: string, accion?: Aviso['accion']) => void
}
type Paso = { texto: string; minutos: string }

const MINUTOS = [5, 10, 15, 20, 25, 30, 45, 60, 90, 120]
const DIFICULTADES = ['Fácil', 'Intermedia', 'Avanzada']

/** Mover un elemento de una lista de un sitio a otro. */
const mover = <T,>(xs: T[], de: number, a: number) => {
  const r = [...xs]
  const [x] = r.splice(de, 1)
  r.splice(a, 0, x)
  return r
}

/**
 * Crear tu receta (usuario, 2026-11-21; `Desktop/MUTA-Crear-receta-propuesta.png`): la foto, el nombre, sus datos
 * (categoría, tiempo, dificultad y raciones), lo que aporta por ración (de sus ingredientes) y, en dos pestañas, los
 * ingredientes (buscar, gramos, deslizar quita) y los pasos en su orden (con el asa, sus minutos si quieres).
 */
export function CrearPlatoHoja({ onClose, onCreado, avisar }: Props) {
  useEffect(() => {
    void cargarAlimentos()
  }, [])
  const [nombre, setNombre] = useState('')
  const [foto, setFoto] = useState<Blob | null>(null)
  const [vista, setVista] = useState<'ingredientes' | 'pasos'>('ingredientes')
  const [categoria, setCategoria] = useState('tuyos')
  const [minutos, setMinutos] = useState<number | null>(null)
  const [dificultad, setDificultad] = useState('Fácil')
  const [raciones, setRaciones] = useState(1)
  const [lista, setLista] = useState<IngredienteNuevo[]>([])
  const [encuadre, setEncuadre] = useState({ x: 50, y: 50 })
  const [pasos, setPasos] = useState<Paso[]>([])
  const { listaRef, orden, levantada, asa } = useReordenar(pasos.length, (de, a) =>
    setPasos(mover(pasos, de, a)),
  )
  const [fotoUrl, setFotoUrl] = useState<string | null>(null)

  const total = lista.reduce(
    (t, i) => ({
      kcal: t.kcal + (i.alimento.kcal * gramosDeIngrediente(i)) / 100,
      protein: t.protein + (i.alimento.protein * gramosDeIngrediente(i)) / 100,
      carbs: t.carbs + (i.alimento.carbs * gramosDeIngrediente(i)) / 100,
      fat: t.fat + (i.alimento.fat * gramosDeIngrediente(i)) / 100,
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  )
  // Con un decimal, como en el resto de la app
  const uno = (x: number) => Math.round((x / raciones) * 10) / 10
  const porRacion = {
    kcal: uno(total.kcal),
    protein: uno(total.protein),
    carbs: uno(total.carbs),
    fat: uno(total.fat),
  }
  const categorias = recetario.value?.categorias ?? []

  async function guardar() {
    const conTexto = pasos.filter((p) => p.texto.trim())
    const id = await crearPlato(
      nombre,
      lista.map((i) => ({ alimento: i.alimento, gramos: gramosDeIngrediente(i) })),
      conTexto.map((p) => p.texto.trim()),
      {
        categoria,
        dificultad,
        minutos,
        raciones,
        minutosPasos: conTexto.map((p) => parseDecimal(p.minutos) ?? null),
      },
    )
    if (!id) return
    if (foto && (await ponerFotoDePlato(id, foto))) await centrarFotoDePlato(id, encuadre.x, encuadre.y)
    onCreado(id)
  }

  return (
    // A pantalla completa (usuario, 2026-11-21: «que no sea un desplegable»)
    <div class={s.pantalla} role="dialog" aria-modal="true" aria-labelledby="tu-receta">
      <header class={s.cabeza}>
        <button type="button" class={s.cancelar} onClick={onClose}>
          Cancelar
        </button>
        <h1 id="tu-receta">Tu receta</h1>
        <span />
      </header>
      <div class={s.hoja}>
        {/* La foto: de la galería o la cámara, que se arrastra para centrarla (la misma pieza de los platos) */}
        <FotoEditable
          foto={fotoUrl}
          alt="Foto de tu receta"
          encuadre={encuadre}
          onCentrar={(x, y) => setEncuadre({ x, y })}
          onFoto={(f) => {
            setFoto(f)
            setFotoUrl(URL.createObjectURL(f))
          }}
          onQuitar={
            foto
              ? () => {
                  setFoto(null)
                  setFotoUrl(null)
                }
              : undefined
          }
        />

        <input
          class={s.nombre}
          value={nombre}
          placeholder="Nombre de tu receta"
          aria-label="Nombre de la receta"
          onInput={(e) => setNombre(e.currentTarget.value)}
        />

        {/* Sus datos, en pastillas con desplegable */}
        <div class={s.datos}>
          <select
            class={s.dato}
            aria-label="Categoría"
            value={categoria}
            onChange={(e) => setCategoria(e.currentTarget.value)}
          >
            <option value="tuyos">Sin categoría</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
          <select
            class={s.dato}
            aria-label="Tiempo"
            value={minutos ?? ''}
            onChange={(e) => setMinutos(e.currentTarget.value ? Number(e.currentTarget.value) : null)}
          >
            <option value="">Tiempo</option>
            {MINUTOS.map((m) => (
              <option key={m} value={m}>
                {m} min
              </option>
            ))}
          </select>
          <select
            class={s.dato}
            aria-label="Dificultad"
            value={dificultad}
            onChange={(e) => setDificultad(e.currentTarget.value)}
          >
            {DIFICULTADES.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
          <select
            class={s.dato}
            aria-label="Raciones"
            value={raciones}
            onChange={(e) => setRaciones(Number(e.currentTarget.value))}
          >
            {Array.from({ length: 10 }, (_, k) => k + 1).map((n) => (
              <option key={n} value={n}>
                {n} {n === 1 ? 'ración' : 'raciones'}
              </option>
            ))}
          </select>
        </div>

        {lista.length > 0 && (
          <div>
            <CifrasRacion m={porRacion} />
            <p class={s.nota}>Por ración, de sus ingredientes</p>
          </div>
        )}

        <ChoiceSegmented
          name="receta-vista"
          legend="Qué ves"
          options={[
            { value: 'ingredientes', label: `Ingredientes · ${lista.length}` },
            { value: 'pasos', label: `Pasos · ${pasos.length}` },
          ]}
          value={vista}
          onChange={setVista}
        />

        {vista === 'ingredientes' ? (
          <IngredientesReceta lista={lista} onCambio={setLista} avisar={avisar} />
        ) : (
          <section class={s.tarjeta} aria-label="Pasos">
            <ol ref={listaRef} class={s.lista}>
              {orden.map((k) => {
                const p = pasos[k]
                return (
                  <li key={k} class={levantada === k ? s.levantada : ''}>
                    <Deslizable
                      fondo="surface"
                      plano
                      ariaLabel={`Quitar el paso ${k + 1}`}
                      onQuitar={() => setPasos(pasos.filter((_, j) => j !== k))}
                    >
                      <div class={s.paso}>
                        <span class={s.numero} aria-hidden="true">
                          {k + 1}
                        </span>
                        <span class={s.pasoTexto}>
                          <textarea
                            rows={2}
                            value={p.texto}
                            placeholder="Qué haces en este paso"
                            aria-label={`Paso ${k + 1}`}
                            onInput={(e) =>
                              setPasos(
                                pasos.map((x, j) => (j === k ? { ...x, texto: e.currentTarget.value } : x)),
                              )
                            }
                          />
                          <label class={s.minutos}>
                            <input
                              inputMode="numeric"
                              value={p.minutos}
                              placeholder="—"
                              aria-label={`Minutos del paso ${k + 1}`}
                              onInput={(e) =>
                                setPasos(
                                  pasos.map((x, j) =>
                                    j === k ? { ...x, minutos: e.currentTarget.value } : x,
                                  ),
                                )
                              }
                            />
                            min (si quieres)
                          </label>
                        </span>
                        <button type="button" class={s.asa} aria-label={`Mover el paso ${k + 1}`} {...asa(k)}>
                          <GripIcon />
                        </button>
                      </div>
                    </Deslizable>
                  </li>
                )
              })}
            </ol>
            <button
              type="button"
              class={`${s.fila} ${s.anadir}`}
              onClick={() => setPasos([...pasos, { texto: '', minutos: '' }])}
            >
              <PlusIcon />
              Añadir paso
            </button>
          </section>
        )}
      </div>
      <div class={s.abajo}>
        <Button disabled={!nombre.trim() || !lista.length} onClick={() => void guardar()}>
          Guardar receta
        </Button>
      </div>
    </div>
  )
}
