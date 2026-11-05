import { expect, test as base, type Page } from '@playwright/test'
import fs from 'node:fs'
import { test as conPlan } from './plan.ts'

// Recorre las pantallas de hoy y guarda una captura de cada una con su explicación (npm run galeria). Primero la
// bienvenida y Elige tu rutina (sin perfil); después Entreno con el plan de prueba de plan.ts (toca B1, con historial).
const OUT = 'tests/e2e/capturas/galeria'
const shots: { file: string; title: string; why: string }[] = []

async function shot(page: Page, file: string, title: string, why: string) {
  // Tras un toque, la transición entre pantallas termina antes de mirar nada
  await page.waitForTimeout(500)
  // Las imágenes ya decodificadas (una de fuera de la pantalla puede no decodificarse nunca: como mucho 2 s)
  for (const img of await page.locator('img').all())
    await img
      .evaluate((el: HTMLImageElement) =>
        Promise.race([el.decode(), new Promise((r) => setTimeout(r, 2000))]),
      )
      .catch(() => {})
  await page.evaluate(() => document.getAnimations().forEach((a) => a.finish()))
  // Con una hoja abierta, solo la pantalla: la página entera mezclaría la hoja con lo de detrás
  const hoja = await page.getByRole('dialog').count()
  await page.screenshot({ path: `${OUT}/${file}.png`, fullPage: hoja === 0 })
  shots.push({ file, title, why })
}

/** Espera a que la pantalla esté pintada (sin animaciones a medias). */
async function lista(page: Page) {
  await page.locator('main').first().waitFor()
  await page.waitForTimeout(400)
}

base.describe.configure({ mode: 'serial' })
// Solo con npm run galeria (no en la CI ni en npm run e2e)
base.skip(!process.env.GALERIA, 'galería: usa npm run galeria')

// Sin capturas de antes: cada vez, solo las pantallas de ahora
base.beforeAll(() => {
  fs.rmSync(OUT, { recursive: true, force: true })
  fs.mkdirSync(OUT, { recursive: true })
})
base.afterAll(() => fs.writeFileSync(`${OUT}/galeria.json`, JSON.stringify(shots, null, 2)))

base('galería · bienvenida y elegir rutina', async ({ page }) => {
  base.setTimeout(180_000)
  await page.goto('/')
  await expect(page).toHaveURL('/bienvenida')
  await shot(
    page,
    '01-bienvenida',
    'A01 · Bienvenida',
    'Al abrir la app sin perfil guardado. Con perfil, abre en Hoy.',
  )
  await page.getByRole('link', { name: 'Comenzar' }).click()
  await expect(page).toHaveURL('/bienvenida/1')
  await shot(
    page,
    '02-objetivo',
    'A03 · Define tu objetivo (1/2)',
    'Viene marcado «Ganar músculo». El objetivo decide la fase: volumen, definición o mantenimiento.',
  )
  await page.getByRole('link', { name: 'Siguiente' }).click()
  await expect(page).toHaveURL('/bienvenida/2')
  await shot(
    page,
    '03-nivel-y-dias',
    'A04 · Personaliza tu plan (2/2)',
    'Nivel y días por semana. Con Principiante, de 2 a 5 días; con Intermedio o Avanzado, también 6.',
  )
  await page.getByText('Intermedio', { exact: true }).click()
  await page.getByText('4', { exact: true }).click()
  await page.getByRole('button', { name: 'Siguiente' }).click()
  await expect(page).toHaveURL('/entreno/rutinas')
  await expect(page.getByRole('region', { name: 'Para ti' })).toBeVisible()
  await shot(
    page,
    '04-elegir-rutina',
    'Elige tu rutina',
    'Arriba «Para ti» (las que encajan con tus días y tu nivel), debajo los tipos de entrenamiento y cargar tu rutina desde un CSV.',
  )
  await page
    .getByRole('region', { name: 'Tipos de entrenamiento' })
    .getByRole('button', { name: /^Hipertrofia/ })
    .click()
  await expect(page).toHaveURL('/entreno/rutinas/hipertrofia')
  await shot(
    page,
    '05-tipo',
    'Tipo de entrenamiento',
    'Cabecera con foto, cuántas rutinas hay, filtros y la lista.',
  )
  await page.goto('/entreno/programa/muta-cuerpo-completo-4d')
  await lista(page)
  await shot(
    page,
    '06-rutina',
    'Detalle de la rutina',
    'La rutina tal cual, por sesiones; los ejercicios opcionales en gris. «Empezar esta rutina» la guarda como tu plan.',
  )
})

conPlan('galería · Entreno con tu plan', async ({ page }) => {
  conPlan.setTimeout(300_000)
  await page.goto('/entreno')
  await lista(page)
  await shot(
    page,
    '10-tu-plan',
    'Tu plan',
    'Carrusel de sesiones con «Empezar», tu semana con los descansos y la biblioteca. «Editar» abre Tu rutina.',
  )
  await page.getByRole('button', { name: 'Editar', exact: true }).click()
  await shot(page, '11-tu-rutina', 'Tu rutina', 'Editar rutina, cambiarla, el coach y volver a la original.')
  await page
    .getByRole('dialog', { name: 'Tu rutina' })
    .getByRole('button', { name: /Editar rutina/ })
    .click()
  const editar = page.getByRole('dialog', { name: 'Editar rutina' })
  await expect(editar.getByRole('list', { name: 'Tu semana' })).toBeVisible()
  await shot(
    page,
    '12-editar-rutina',
    'Editar rutina',
    'Tu semana con los días de descanso; se toca una sesión.',
  )
  await editar
    .getByRole('list', { name: 'Tu semana' })
    .getByRole('button', { name: /^\d+ Isquios, glúteo y pecho/ })
    .click()
  await shot(
    page,
    '13-editar-sesion',
    'Editar rutina · una sesión',
    'Orden, quitar, añadir ejercicios (solo aquí, no en la sesión), superseries y foto.',
  )
  await page
    .getByRole('button', { name: /^Peso muerto rumano/ })
    .first()
    .click()
  const ej = page.getByRole('dialog', { name: 'Peso muerto rumano' })
  await ej.locator('summary', { hasText: 'Técnica' }).click()
  await shot(
    page,
    '14-editar-ejercicio',
    'Editar ejercicio',
    'Series, repeticiones (o cada serie distinta), descanso, superserie, RIR y la técnica de intensidad.',
  )

  await page.goto('/entreno/rutina/b1')
  await lista(page)
  await shot(
    page,
    '15-ver-sesion',
    'Ver sesión',
    'La gráfica de la sesión y cada ejercicio con su cambio frente a la última vez.',
  )

  await page.goto('/entreno/sesion/b1')
  await lista(page)
  await shot(
    page,
    '16-sesion',
    'Sesión en curso',
    'Pantalla completa. La vez anterior en gris; teclado propio, descanso abajo y ★ si mejoras.',
  )
  await page.getByRole('button', { name: /^Esta sesión/ }).click()
  await shot(
    page,
    '17-esta-sesion',
    'Esta sesión',
    'Tiempo, consejos de hoy, cambiar de sesión y descartarla.',
  )
  await page.getByRole('button', { name: 'Cerrar' }).click()
  await page.getByRole('button', { name: 'Opciones de Peso muerto rumano' }).click()
  await shot(
    page,
    '18-opciones-ejercicio',
    '«···» de un ejercicio',
    'Tus notas, la ficha, hacer ahora, cambiar, discos y cronómetro.',
  )
  await page.getByRole('button', { name: 'Discos' }).click()
  await page.getByLabel('Peso total').fill('62,5')
  await shot(
    page,
    '19-discos',
    'Discos por lado',
    'Con los discos que hay en tu gimnasio (se eligen aquí o en el Perfil).',
  )
  await page.getByRole('button', { name: 'Cerrar' }).click()
  for (let n = 1; n <= 3; n++) await page.getByRole('button', { name: `Serie ${n} hecha` }).click()
  await page.getByRole('button', { name: 'Terminar' }).click()
  await page
    .getByRole('dialog', { name: '¿Terminar con tan poco?' })
    .getByRole('button', { name: 'Terminar' })
    .click()
  await expect(page).toHaveURL('/entreno/sesion/b1/resumen')
  await lista(page)
  await shot(
    page,
    '20-resumen',
    'Resumen',
    'Racha, semana, cifras y frente a la última vez; se puede compartir como imagen.',
  )

  await page.goto('/entreno/ejercicio/peso_muerto_rumano')
  await lista(page)
  await shot(
    page,
    '21-ficha',
    'Ficha del ejercicio',
    'Explicación, músculos, tus notas y las dos gráficas. «···» lo añade o cambia en tu plan.',
  )
  await page
    .getByRole('region', { name: 'Músculos que trabaja' })
    .getByRole('button', { name: 'Femoral' })
    .click()
  await shot(
    page,
    '22-musculo',
    'Ficha del músculo',
    'Series por semana frente a tu rango, objetivo y dónde lo entrenas.',
  )

  const resto: [string, string, string, string][] = [
    [
      '/entreno?hoja=biblioteca',
      '23-biblioteca',
      'Biblioteca de ejercicios',
      'Buscar y filtrar por músculo.',
    ],
    ['/perfil', '24-perfil', 'Perfil · Tu material', 'Tu material y los discos del gimnasio.'],
    ['/hoy', '25-hoy', 'Hoy (pendiente)', 'La siguiente área por diseñar.'],
    ['/comida', '26-comida', 'Comida (pendiente)', 'Pendiente de diseño.'],
    ['/progreso', '27-progreso', 'Progreso (pendiente)', 'Pendiente de diseño.'],
    ['/no-existe', '28-404', 'Pantalla que no existe', 'Cualquier dirección desconocida.'],
  ]
  for (const [url, f, title, why] of resto) {
    await page.goto(url)
    await lista(page)
    await shot(page, f, title, why)
  }
  await page.goto('/dev/ui')
  await shot(
    page,
    '29-dev-ui-claro',
    '/dev/ui · sistema de diseño (claro)',
    'Las piezas comunes; una prueba mide que cumplen los tokens.',
  )
  await page.getByRole('button', { name: 'Oscuro' }).click()
  await shot(page, '30-dev-ui-oscuro', '/dev/ui · sistema de diseño (oscuro)', 'Las mismas piezas en oscuro.')
})
