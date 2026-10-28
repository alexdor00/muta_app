import { useEffect, useState } from 'preact/hooks'
import { Button } from '../../shared/ui/Button.tsx'
import { ChoiceCards, ChoiceChips, ChoiceCircles, ChoicePills } from '../../shared/ui/Choice.tsx'
import { BookmarkIcon, SlidersIcon } from '../../shared/ui/icons.tsx'
import { ListRow } from '../../shared/ui/ListRow.tsx'
import { PillButton } from '../../shared/ui/PillButton.tsx'
import { RoundButton } from '../../shared/ui/RoundButton.tsx'
import { PhotoCard } from '../../shared/ui/PhotoCard.tsx'
import { ScreenHeader } from '../../shared/ui/ScreenHeader.tsx'
import { Tiles } from '../../shared/ui/Tiles.tsx'
import styles from './DevUiScreen.module.css'

// /dev/ui: todas las piezas de shared/ui juntas, en claro y en oscuro.
// Cada pieza nueva se añade aquí antes de usarla en una pantalla.

const TYPE = [
  ['--text-large-title', 'Título grande'],
  ['--text-title-1', 'Título 1'],
  ['--text-title-2', 'Título 2'],
  ['--text-headline', 'Titular'],
  ['--text-body', 'Cuerpo'],
  ['--text-subhead', 'Subtítulo'],
  ['--text-footnote', 'Nota'],
  ['--text-caption', 'Pie'],
  ['--text-big-number', '120'],
] as const

const COLORS = [
  '--bg',
  '--surface',
  '--surface-2',
  '--label',
  '--label-2',
  '--separator',
  '--accent',
  '--good',
  '--warning',
  '--critical',
]

type Theme = 'light' | 'dark'

export function DevUiScreen() {
  const [theme, setTheme] = useState<Theme>('light')
  const [level, setLevel] = useState('beginner')
  const [days, setDays] = useState(3)
  const [goal, setGoal] = useState('a')
  const [chip, setChip] = useState('Todos')
  const [muscle, setMuscle] = useState(['hombros'])
  const [muscles, setMuscles] = useState(['pecho', 'gemelos'])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    return () => {
      delete document.documentElement.dataset.theme
    }
  }, [theme])

  return (
    <div class={styles.page}>
      <header class={styles.header}>
        <h1 class={styles.h1}>Sistema de diseño</h1>
        <div style={{ width: '40%' }}>
          <Button variant="secondary" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
            {theme === 'light' ? 'Oscuro' : 'Claro'}
          </Button>
        </div>
      </header>

      <section>
        <h2 class={styles.h2}>Tipografía</h2>
        <div class={styles.stack}>
          {TYPE.map(([token, label]) => (
            <div key={token} class={styles.type}>
              <span style={{ font: `var(${token})` }}>{label}</span>
              <span class={styles.tokenName}>{token}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 class={styles.h2}>Color</h2>
        <div class={styles.swatches}>
          {COLORS.map((token) => (
            <div
              key={token}
              class={styles.swatch}
              style={{
                background: `var(${token})`,
                color: token === '--bg' || token.startsWith('--surface') ? 'var(--label)' : 'var(--bg)',
              }}
            >
              {token}
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 class={styles.h2}>Botones</h2>
        <div class={styles.stack} data-testid="buttons">
          <Button chevron="inline">Principal</Button>
          <Button variant="secondary">Secundario</Button>
          <Button disabled>Desactivado</Button>
          <div class={styles.photo}>
            <Button variant="onPhoto" chevron="edge">
              Sobre foto
            </Button>
          </div>
        </div>
      </section>

      <section>
        <h2 class={styles.h2}>Cabecera</h2>
        <ScreenHeader title="Título de pestaña" intro="Explicación corta" avatarHref="/dev/ui" />
      </section>

      <section data-testid="photo-cards">
        <h2 class={styles.h2}>Tarjetas con foto</h2>
        <div class={styles.stack}>
          <PhotoCard
            title="Con foto"
            subtitle="Subtítulo · 4 días"
            photo="/photos/bienvenida.jpg"
            badge="Tu rutina"
          />
          {([1, 2, 3, 4, 5, 6] as const).map((tone) => (
            <PhotoCard key={tone} title={`Tono ${tone}`} subtitle="Sin foto: degradado" tone={tone} />
          ))}
        </div>
      </section>

      <section data-testid="list">
        <h2 class={styles.h2}>Lista</h2>
        <div class={styles.stack}>
          <div class={styles.photo}>
            <RoundButton label="Volver">‹</RoundButton>
          </div>
          <PillButton icon={<SlidersIcon />} onClick={() => {}}>
            Filtros
          </PillButton>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            <ListRow
              title="Fila de lista"
              lines={['Volumen medio · Cuerpo completo · Gimnasio', '4 días · ~60 min · 10 semanas']}
              eyebrow="Para tus días"
              href="/dev/ui"
              thumbBig="4"
              thumbSmall="días"
              trailing={
                <RoundButton label="Guardar" variant="plain">
                  <BookmarkIcon />
                </RoundButton>
              }
            />
          </ul>
          <ChoiceChips
            name="dev-chips"
            legend="Etiquetas"
            showLegend
            value={chip}
            onChange={setChip}
            options={['Todos', 'Cuerpo completo', 'Torso y pierna', 'Empuje, tirón y pierna'].map((v) => ({
              value: v,
              label: v,
            }))}
          />
        </div>
      </section>

      <section data-testid="tiles">
        <h2 class={styles.h2}>Azulejos</h2>
        <div class={styles.stack}>
          <Tiles
            name="dev-un-musculo"
            legend="Uno (círculo)"
            showLegend
            value={muscle}
            onChange={setMuscle}
            options={[
              { value: 'hombros', label: 'Hombros', detail: '3 ejercicios' },
              { value: 'dorsales', label: 'Dorsales (anchura de espalda)', detail: '3 ejercicios' },
              { value: 'isquios', label: 'Isquiotibiales', detail: 'Consejo' },
              { value: 'gemelos', label: 'Gemelos', detail: '2 ejercicios' },
            ]}
          />
          <Tiles
            name="dev-varios"
            legend="Varios, con tope de 3 (casilla)"
            showLegend
            mode="multi"
            value={muscles}
            onChange={setMuscles}
            options={[
              { value: 'pecho', label: 'Pecho', detail: '2 ejercicios' },
              {
                value: 'biceps',
                label: 'Bíceps',
                detail: '3 ejercicios',
                disabled: muscles.length >= 3 && !muscles.includes('biceps'),
              },
              { value: 'gemelos', label: 'Gemelos', detail: '2 ejercicios' },
              {
                value: 'abdomen',
                label: 'Abdomen',
                detail: '3 ejercicios',
                disabled: muscles.length >= 3 && !muscles.includes('abdomen'),
              },
            ]}
          />
        </div>
      </section>

      <section data-testid="choices">
        <h2 class={styles.h2}>Opciones</h2>
        <ChoicePills
          name="dev-nivel"
          legend="Pastillas"
          showLegend
          value={level}
          onChange={setLevel}
          options={[
            { value: 'beginner', label: 'Principiante' },
            { value: 'intermediate', label: 'Intermedio' },
            { value: 'advanced', label: 'Avanzado' },
          ]}
        />
        <ChoiceCircles
          name="dev-dias"
          legend="Círculos"
          showLegend
          value={days}
          onChange={setDays}
          options={[2, 3, 4, 5, 6].map((n) => ({ value: n, label: String(n) }))}
        />
        <ChoiceCards
          name="dev-tarjetas"
          legend="Tarjetas"
          showLegend
          value={goal}
          onChange={setGoal}
          options={[
            { value: 'a', label: 'Opción elegida', detail: 'Con detalle debajo', icon: '★' },
            { value: 'b', label: 'Otra opción', detail: 'Con detalle debajo', icon: '•' },
          ]}
        />
      </section>
    </div>
  )
}
