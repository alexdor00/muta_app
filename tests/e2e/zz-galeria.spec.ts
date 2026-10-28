import { expect, test, type Page } from '@playwright/test'
import fs from 'node:fs'

// Recorre todas las pantallas y estados y guarda una captura de cada una con su explicación.
const OUT = 'tests/e2e/capturas/galeria'
const shots: { file: string; title: string; why: string }[] = []

async function shot(page: Page, file: string, title: string, why: string) {
  for (const img of await page.locator('img').all())
    await img.evaluate((el: HTMLImageElement) => el.decode()).catch(() => {})
  await page.evaluate(() => document.getAnimations().forEach((a) => a.finish()))
  await page.screenshot({ path: `${OUT}/${file}.png`, fullPage: true })
  shots.push({ file, title, why })
}

const LEVEL = { beginner: 'Principiante', intermediate: 'Intermedio', advanced: 'Avanzado' } as const

/** Hace la bienvenida con unas respuestas y deja la app en «Elige tu rutina». */
async function onboard(page: Page, goal: string, level: keyof typeof LEVEL, days: number) {
  await page.goto('/bienvenida/1')
  await page.getByText(goal).click()
  await page.getByRole('link', { name: 'Siguiente' }).click()
  await page.getByText(LEVEL[level], { exact: true }).click()
  await page.getByText(String(days), { exact: true }).click()
  await page.getByRole('button', { name: 'Siguiente' }).click()
  await expect(page).toHaveURL('/entreno/rutinas')
  await expect(page.getByText('Recomendadas para ti')).toBeVisible()
}

test.describe.configure({ mode: 'serial' })
// Solo con npm run galeria (no en la CI ni en npm run e2e)
test.skip(!process.env.GALERIA, 'galería: usa npm run galeria')

test('galería de pantallas', async ({ browser }) => {
  test.setTimeout(420_000)
  fs.mkdirSync(OUT, { recursive: true })
  const fresh = async () => (await browser.newContext({ ...test.info().project.use })).newPage()

  // 1. Primera vez
  let page = await fresh()
  await page.goto('/')
  await expect(page).toHaveURL('/bienvenida')
  await shot(
    page,
    '01-bienvenida',
    'A01 · Bienvenida',
    'Se ve al abrir la app cuando todavía no hay perfil guardado. Con perfil, la app abre en Hoy.',
  )
  await page.getByRole('link', { name: 'Comenzar' }).click()
  await shot(
    page,
    '02-objetivo',
    'A03 · Define tu objetivo (1/2)',
    'Viene marcado «Ganar músculo». El objetivo decide la fase: ganar músculo = volumen, perder grasa = definición, sentirte mejor = mantenimiento.',
  )
  await page.getByRole('link', { name: 'Siguiente' }).click()
  await shot(
    page,
    '03-plan-principiante',
    'A04 · Personaliza tu plan (2/2) · principiante',
    'Viene marcado Principiante y 3 días. Con Principiante solo se puede elegir de 2 a 5 días: el 6 no aparece.',
  )
  await page.getByText('Intermedio', { exact: true }).click()
  await shot(
    page,
    '04-plan-intermedio',
    'A04 · Personaliza tu plan · intermedio o avanzado',
    'Con Intermedio o Avanzado aparece el 6. Si tenías 6 y vuelves a Principiante, baja a 5.',
  )
  await page.close()

  // 2. Elige tu rutina según las respuestas
  const cases: [string, keyof typeof LEVEL, number, string, string][] = [
    [
      'Ganar músculo',
      'beginner',
      3,
      '05-rutinas-principiante-3',
      'Principiante, 3 días: recomienda las rutinas de 3 días pensadas para su nivel (la propia de MUTA primero) y, al final, las de intermedio marcadas «Ajustada a tu nivel».',
    ],
    [
      'Perder grasa',
      'beginner',
      5,
      '06-rutinas-principiante-5',
      'Principiante que pide 5 días: se le recomiendan de 4 con el aviso «más días no es mejor», y debajo «Si prefieres 5 días» con las de 5. Nunca se le ofrece una solo de 6.',
    ],
    [
      'Ganar músculo',
      'intermediate',
      4,
      '07-rutinas-intermedio-4',
      'Intermedio, 4 días: todas las de 4 días para su nivel, sin aviso ni ajustes.',
    ],
    [
      'Sentirte mejor',
      'advanced',
      6,
      '08-rutinas-avanzado-6',
      'Avanzado, 6 días: las de 6 días, con Empuje, tirón y pierna de MUTA primero.',
    ],
    [
      'Ganar músculo',
      'intermediate',
      2,
      '09-rutinas-intermedio-2',
      'Intermedio, 2 días: solo hay una rutina de 2 días (Esencial 45 min).',
    ],
  ]
  for (const [goal, level, days, file, why] of cases) {
    page = await fresh()
    await onboard(page, goal, level, days)
    await shot(page, file, `Elige tu rutina · ${LEVEL[level].toLowerCase()} · ${days} días`, why)
    if (file === '07-rutinas-intermedio-4') {
      await page.getByRole('button', { name: 'Ver rutinas de otros días' }).click()
      await shot(
        page,
        '10-rutinas-otras',
        'Elige tu rutina · otras rutinas desplegadas',
        'Lo que no es de tus días queda escondido detrás de «Ver rutinas de otros días».',
      )
      await page
        .getByRole('region', { name: 'Recomendadas para ti' })
        .getByRole('button', { name: /^MUTA/ })
        .click()
      await expect(page).toHaveURL(/\/entreno\/rutinas\/muta/)
      await shot(
        page,
        '10b-familia-muta',
        'Tipo de rutina · MUTA',
        'Al tocar una familia: arriba «Para ti» (las versiones que encajan con tus días y nivel) y debajo «Más de este tipo». Se puede elegir cualquiera.',
      )
    }
    if (file === '09-rutinas-intermedio-2') {
      // Con una rutina elegida: etiqueta «Tu rutina» y la app ya abre en Hoy
      await page
        .getByRole('button', { name: /Esencial 45 min/ })
        .first()
        .click()
      await expect(page).toHaveURL('/entreno')
      await shot(
        page,
        '11-tu-plan',
        'A05 · Tu plan (provisional)',
        'Tras elegir rutina se va a Entreno. Pendiente de diseño: aquí irá la portada con la sesión que toca.',
      )
      await page.goto('/entreno/rutinas')
      await expect(page.getByText('Tu rutina', { exact: true })).toBeVisible()
      await shot(
        page,
        '12-rutinas-con-elegida',
        'Elige tu rutina · con una ya elegida',
        'La rutina actual lleva la etiqueta «Tu rutina». Se entra desde «Cambiar rutina» en Tu plan.',
      )
      const rest: [string, string, string, string][] = [
        ['/', '13-hoy', 'Hoy (provisional)', 'Con perfil guardado, la app abre aquí. Pendiente de diseño.'],
        ['/entreno/rutina', '14-tu-rutina', 'A06 · Tu rutina (provisional)', 'Pendiente de diseño.'],
        [
          '/entreno/sesion/a1/inicio',
          '15-sesion-inicio',
          'C00 · Sesión antes de empezar (provisional)',
          'Lleva pestañas: todavía no estás entrenando.',
        ],
        [
          '/entreno/sesion/a1',
          '16-sesion',
          'C01–C03 · Sesión en curso (provisional)',
          'Pantalla completa, sin pestañas, para no salir por error.',
        ],
        [
          '/entreno/sesion/a1?hoja=esta-sesion',
          '17-hoja',
          'C08 · Hoja «Esta sesión» (provisional)',
          'Las hojas van en la dirección (?hoja=…): el gesto atrás del móvil cierra la hoja.',
        ],
        [
          '/entreno/sesion/a1/resumen',
          '18-resumen',
          'C24 · Resumen (provisional)',
          'Pantalla completa, sin pestañas.',
        ],
        [
          '/entreno/ejercicio/press_banca',
          '19-ficha',
          'Ficha de ejercicio (propuesta)',
          'Pendiente de diseño.',
        ],
        ['/comida', '20-comida', 'Comida (provisional)', 'Pendiente de diseño.'],
        ['/progreso', '21-progreso', 'Progreso (provisional)', 'Pendiente de diseño.'],
        ['/perfil', '22-perfil', 'Perfil (propuesta)', 'Se abre desde el avatar. No marca ninguna pestaña.'],
        ['/no-existe', '23-404', 'Pantalla que no existe', 'Cualquier dirección desconocida.'],
      ]
      for (const [url, f, title, w] of rest) {
        await page.goto(url)
        await page.locator('main').waitFor()
        await page.waitForTimeout(400)
        await shot(page, f, title, w)
      }
      await page.goto('/dev/ui')
      await shot(
        page,
        '24-dev-ui-claro',
        '/dev/ui · sistema de diseño (claro)',
        'Todas las piezas comunes. Una prueba mide que cumplen los tokens.',
      )
      await page.getByRole('button', { name: 'Oscuro' }).click()
      await shot(
        page,
        '25-dev-ui-oscuro',
        '/dev/ui · sistema de diseño (oscuro)',
        'Mismas piezas en modo oscuro.',
      )
    }
    await page.close()
  }

  fs.writeFileSync(`${OUT}/galeria.json`, JSON.stringify(shots, null, 2))
})
