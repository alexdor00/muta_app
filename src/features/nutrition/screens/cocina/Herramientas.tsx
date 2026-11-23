import { useEffect, useState } from 'preact/hooks'
import { formatInt } from '../../../../shared/lib/format.ts'
import { paths } from '../../../../shared/lib/paths.ts'
import { ChevronRightIcon, MinusIcon, PlusIcon } from '../../../../shared/ui/icons.tsx'
import { LetraMenu } from '../../components/LetraMenu.tsx'
import { COMIDAS, hoy } from '../../state/comida.ts'
import {
  deCrudoACocido,
  enCrudoDe,
  fotos,
  menu,
  menuDelDia,
  parejasCocidas,
  platoPorId,
  platosDelMenu,
} from '../../state/recetas.ts'
import { cargarAlimentos } from '../../use-cases/foodLog.ts'
import a from '../comida/Anadir.module.css'
import { HoyCocinas } from '../comida/HoyCocinas.tsx'
import r from '../comida/Racion.module.css'
import s from './Herramientas.module.css'

/** Las herramientas de la cocina (`?h=`), con su nombre. */
export const HERRAMIENTAS = {
  crudo: 'De crudo a cocinado',
  repartir: 'Repartir en raciones',
  plato: 'Calcular un plato mío',
  pesar: 'Cómo pesar bien',
} as const
export type Herramienta = keyof typeof HERRAMIENTAS

/**
 * Cocinar ahora (usuario, 2026-11-21: «poder cocinar cualquier plato de todos los menús»): lo que cocinas hoy, si toca, y
 * arriba las letras de tus menús y, del que elijas, sus platos; tocar uno abre su modo cocina (`CocinarPlatoScreen`). Las herramientas (`?h=`) siguen, sin acceso
 * desde aquí.
 */
export function CentroCocina() {
  const menus = menu.value.menus
  const [elegido, setElegido] = useState(() => menuDelDia(menu.value, hoy.value)?.id ?? menus[0]?.id ?? '')
  const x = menus.find((y) => y.id === elegido) ?? menus[0]
  // Los platos de ese menú, en el orden del día (el suyo y los de más que son otro plato)
  const platos = x
    ? COMIDAS.flatMap((c) =>
        [platosDelMenu(x)[c.id], ...(x.extras?.[c.id] ?? []).map((e) => e.platoId)]
          .filter((id): id is string => !!id)
          .map((id) => ({ id, comida: c.id, nombreComida: c.nombre })),
      )
    : []
  return (
    <div class={s.centro}>
      <HoyCocinas />
      {menus.length > 1 && (
        <div class={s.letras} role="group" aria-label="Menú">
          {menus.map((y, i) => (
            <button
              key={y.id}
              type="button"
              class={s.letra}
              aria-pressed={y.id === x?.id}
              aria-label={y.nombre}
              onClick={() => setElegido(y.id)}
            >
              <LetraMenu id={y.id} indice={i} tam="grande" elegida={y.id === x?.id} />
            </button>
          ))}
        </div>
      )}
      {x && (
        <section class={s.menu} aria-label={x.nombre}>
          <h2 class={s.titulo}>Qué cocinas del {x.nombre}</h2>
          {platos.length ? (
            <ul class={s.platos}>
              {platos.map(({ id, comida, nombreComida }) => {
                const p = platoPorId(id)
                if (!p) return null
                return (
                  <li key={`${comida}-${id}`}>
                    <a class={s.plato} href={paths.cookDish(id, x.id, comida)}>
                      <span
                        class={s.foto}
                        aria-hidden="true"
                        style={fotos.value[id] ? { backgroundImage: `url(${fotos.value[id]})` } : undefined}
                      />
                      <span class={a.filaTexto}>
                        <b class={a.nombre}>{p.nombre}</b>
                        <span class={a.detalle}>
                          {nombreComida}
                          {p.minutos ? ` · ${p.minutos} min` : ''}
                        </span>
                      </span>
                      <ChevronRightIcon />
                    </a>
                  </li>
                )
              })}
            </ul>
          ) : (
            <p class={a.detalle}>Este menú aún no tiene platos.</p>
          )}
        </section>
      )}
    </div>
  )
}

/**
 * De crudo a cocinado (rediseño, pantalla 37): un cereal o legumbre de la base, lo que pesas en crudo o cocinado y lo que
 * pesará al otro lado (por sus kcal: es una media).
 */
export function CrudoACocinado() {
  useEffect(() => {
    void cargarAlimentos()
  }, [])
  const lista = parejasCocidas.value
  const [elegido, setElegido] = useState<string | null>(null)
  const [enCrudo, setEnCrudo] = useState(true)
  const [gramos, setGramos] = useState(75)
  const par = lista.find((x) => x.cocido.id === elegido) ?? lista[0]
  if (!par) return <p class={s.nota}>Cargando alimentos…</p>
  const otro = enCrudo
    ? Math.round(deCrudoACocido(par.cocido.id, gramos))
    : (enCrudoDe(par.cocido.id, gramos)?.gramos ?? gramos)
  const nombre = (x: string) => x.replace(/\s*\((crud|cocid)[oa]s?\)/i, '')
  return (
    <div class={s.centro}>
      <div class={a.pastillas} role="group" aria-label="Alimento">
        {lista.map((x) => (
          <button
            key={x.cocido.id}
            type="button"
            class={`${a.pastilla} ${x === par ? a.on : ''}`}
            aria-pressed={x === par}
            onClick={() => setElegido(x.cocido.id)}
          >
            {nombre(x.cocido.name)}
          </button>
        ))}
      </div>
      <div class={a.segmento} role="group" aria-label="Qué tienes">
        <button
          type="button"
          class={enCrudo ? a.on : ''}
          aria-pressed={enCrudo}
          onClick={() => setEnCrudo(true)}
        >
          Tengo el peso en crudo
        </button>
        <button
          type="button"
          class={!enCrudo ? a.on : ''}
          aria-pressed={!enCrudo}
          onClick={() => setEnCrudo(false)}
        >
          Lo tengo cocinado
        </button>
      </div>
      <section class={r.tarjeta} aria-label="La cuenta">
        <div class={r.paso}>
          <button
            type="button"
            class={r.redondo}
            aria-label="Menos"
            onClick={() => setGramos(Math.max(5, gramos - 5))}
          >
            <MinusIcon />
          </button>
          <label class={r.cifra}>
            <input
              inputMode="numeric"
              aria-label={enCrudo ? 'Gramos en crudo' : 'Gramos cocinado'}
              value={String(gramos)}
              onInput={(e) => setGramos(Math.max(0, Number(e.currentTarget.value) || 0))}
            />
            <span>{enCrudo ? 'g en crudo' : 'g cocinado'}</span>
          </label>
          <button type="button" class={r.redondo} aria-label="Más" onClick={() => setGramos(gramos + 5)}>
            <PlusIcon />
          </button>
        </div>
        <p class={s.resultado}>
          <b>≈ {formatInt(otro)}</b> {enCrudo ? 'g cocinado' : 'g en crudo'}
        </p>
      </section>
      <p class={s.nota}>Es una media: depende del agua y del tiempo. Pesa el tuyo una vez para saberlo.</p>
    </div>
  )
}

/** Cómo pesar bien (rediseño, pantalla 40): cuatro reglas en tarjetas. */
export function ComoPesarBien() {
  const reglas = [
    ['En crudo, lo que cambia al cocinarse', 'Arroz, pasta, carne y pescado se pesan antes de cocinar.'],
    ['El aceite, siempre', 'Es lo que más calorías suma sin que se note.'],
    ['Lo cocinado junto, por raciones', 'Pesa la olla vacía y llena, y reparte a partes iguales.'],
    ['El plato, a cero', 'Pon el plato en la báscula, tara y sirve hasta tu peso.'],
  ]
  return (
    <div class={s.centro}>
      <ol class={s.reglas}>
        {reglas.map(([t, d], i) => (
          <li key={t}>
            <span class={s.numero}>{i + 1}</span>
            <span class={a.filaTexto}>
              <b class={a.nombre}>{t}</b>
              <span class={s.detalleRegla}>{d}</span>
            </span>
          </li>
        ))}
      </ol>
      <p class={s.nota}>Con esto basta. Lo demás, a ojo: una fruta es una fruta.</p>
    </div>
  )
}
