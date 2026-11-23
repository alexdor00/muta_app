import AxeBuilder from '@axe-core/playwright'
import { expect, type Page } from '@playwright/test'
import { guardarMenu, prepararObjetivo } from './nutricion.ts'
import { sinAnimaciones, testGuardando as test } from './plan.ts'

// Tu semana resuelta (piloto automático de compra y cocina), sin el recetario privado (platos «De ejemplo»): elegir el
// día de la compra y los días de cocina, verla en Tu plan y en Hoy, comprar (entra en tu despensa), el modo cocina (una
// receta cada vez, repartir en tápers y «Hecho») y pasar a hoy una tanda que no hiciste. Con axe en sus pantallas.

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const local = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/** En Hoy, lo de la comida va dentro de Nutrición, plegado: se despliega al tocarla. */
async function abrirNutricion(page: Page) {
  const nutricion = page.getByRole('button', { name: /^Nutrición/ })
  if ((await nutricion.getAttribute('aria-expanded')) !== 'true') await nutricion.click()
}

/** El modo cocina (rediseño 33 a 35): lo que sacas, los pasos uno a uno, repartir y «Terminar». */
async function cocinarHastaTerminar(page: Page, donde: string) {
  await expect(page.getByRole('heading', { name: 'Saca esto' })).toBeVisible()
  await axe(page, `${donde}: lo que sacas`)
  await page.getByRole('button', { name: 'Empezar', exact: true }).click()
  const siguiente = page.getByRole('button', { name: 'Siguiente', exact: true })
  if (await page.getByText(/^Paso 1 de/).isVisible()) await axe(page, `${donde}: un paso`)
  while (await siguiente.isVisible()) await siguiente.click()
  const repartir = page.getByRole('button', { name: 'A repartir' })
  // Repartir solo sale si algo va a varios recipientes (varias comidas, de más o más personas)
  if (await repartir.isVisible()) {
    await repartir.click()
    await expect(page.getByRole('heading', { name: 'Repartir' })).toBeVisible()
    await axe(page, `${donde}: repartir`)
  }
  await page.getByRole('button', { name: 'Terminar' }).click()
  await expect(page.getByRole('status')).toContainText('Tanda hecha')
}

async function axe(page: Page, donde: string) {
  await sinAnimaciones(page)
  const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
  expect(r.violations, `${donde}: ${r.violations.map((v) => v.id).join(', ')}`).toEqual([])
}

/** Un menú con el pollo en la comida y el salmón en la cena todos los días. */
const MENU = {
  menus: [{ id: 'A', nombre: 'Menú A', platos: { comida: 'ej-pollo_arroz', cena: 'ej-salmon_patata' } }],
  semana: Array(7).fill('A'),
  reparto: 'seguidos',
  cocinados: [],
  compraEl: null,
  avisos: { cocinar: true, compra: true, comidas: false, antesMin: 30 },
  descartadas: [],
  hechos: [],
  sinPlato: [],
}

test('organizar la semana: la compra y cocinar hoy, en Tu plan y en Hoy; comprar y el modo cocina', async ({
  page,
}) => {
  test.setTimeout(120_000)
  await prepararObjetivo(page)
  await guardarMenu(page, MENU)
  const hoy = DIAS[new Date().getDay()]
  // Mi plan · 3 Cocina, sin organizar: «Cómo cocinas» abre su pantalla (usuario, 2026-11-19)
  await page.goto('/comida?vista=plan')
  await page.getByRole('radio', { name: '3 Cocina' }).check({ force: true })
  await expect(page.getByText('Aún no has dicho cuándo cocinas')).toBeVisible()
  await page.getByRole('button', { name: 'Cómo cocinas', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Cómo cocinas', level: 1 })).toBeVisible()
  // Cocinas los días que eliges (solo hoy) y compras un día a la semana, hoy
  await page.getByRole('button', { name: /^Mis días/ }).click()
  for (const d of DIAS) {
    const b = page.getByRole('button', { name: `Cocinar el ${d}` })
    if (((await b.getAttribute('aria-pressed')) === 'true') !== (d === hoy)) await b.click()
  }
  await page.getByRole('radio', { name: 'Un día fijo' }).check({ force: true })
  await page.getByRole('button', { name: `Comprar el ${hoy}` }).click()
  await axe(page, 'Cómo cocinas')
  await page.getByRole('button', { name: 'Organizar mi semana' }).click()
  // En Mi plan · Cocina: cuántas veces cocinas y tu semana de cocina
  await page.goto('/comida?vista=plan')
  await page.getByRole('radio', { name: '3 Cocina' }).check({ force: true })
  await expect(page.getByText(/^Cocinas \d+ (vez|veces)/)).toBeVisible()
  await axe(page, 'Mi plan · Cocina')

  // En Hoy: la compra y la tanda de hoy
  await page.goto('/hoy')
  const queda = page.getByRole('region', { name: 'Te queda', exact: true })
  await abrirNutricion(page)
  await expect(queda.getByRole('link', { name: /^La compra/ })).toBeVisible()
  await expect(queda.getByRole('link', { name: /^Cocinar/ })).toBeVisible()

  // La compra de tu semana, con sus secciones plegadas: se abre una y se tacha algo
  await page.goto('/comida/compra')
  await expect(page.getByRole('heading', { name: 'La compra', level: 1 })).toBeVisible()
  const cosa = page
    .getByRole('button', { pressed: false })
    .filter({ hasText: /\d+ (g|kg)$/ })
    .first()
  const marcadas = await page.getByRole('button', { pressed: true }).count()
  await cosa.click()
  // Tachada: una marcada más
  await expect(page.getByRole('button', { pressed: true })).toHaveCount(marcadas + 1)
  await axe(page, 'La compra de tu semana')
  // Sin despensa (usuario, 2026-11-21): lo que ya tienes, se tacha y ya está

  // El modo cocina: las recetas y tus tápers, deslizando; «Hecho»
  await page.goto('/hoy')
  await abrirNutricion(page)
  await page
    .getByRole('region', { name: 'Te queda', exact: true })
    .getByRole('link', { name: /^Cocinar/ })
    .click()
  await cocinarHastaTerminar(page, 'Modo cocina')
  await page.getByRole('button', { name: 'Listo' }).first().click()
  // Lo de la comida va dentro de la tarjeta de Nutrición: ahí se marca («: hecha»)
  await abrirNutricion(page)
  // Hecha, no abre el modo cocina: se despliega con su frase
  await page.getByRole('button', { name: /^Cocinar.*: hecha$/, expanded: false }).click()
  await expect(page.getByText(/^Ya has cocinado todo lo que te propusiste/)).toBeVisible()
})

test('la tanda que no hiciste: Hoy propone pasarla a hoy («Aplicar» / «Ahora no»)', async ({ page }) => {
  await prepararObjetivo(page)
  const ayer = new Date()
  ayer.setDate(ayer.getDate() - 1)
  await guardarMenu(page, {
    ...MENU,
    piloto: {
      compra: null,
      cocina: { modo: 'dias', dias: [(ayer.getDay() + 6) % 7], hora: '19:00' },
      preparar: { comida: 'taper', cena: 'taper' },
      porPlato: {},
      tandas: [local(ayer)],
      saltadas: [],
      hechas: [],
      descartadas: [],
      desde: local(ayer),
    },
  })
  await page.goto('/hoy')
  const propuesta = page.getByRole('list', { name: 'Te proponemos' })
  await expect(propuesta).toContainText(`No cocinaste el ${DIAS[ayer.getDay()]}`)
  await axe(page, 'Hoy con una propuesta')
  await propuesta.getByRole('button', { name: 'Aplicar' }).click()
  await expect(page.getByRole('status')).toContainText('Tu tanda, hoy')
  await expect(page.getByRole('list', { name: 'Te proponemos' })).toHaveCount(0)
  await abrirNutricion(page)
  await expect(
    page.getByRole('region', { name: 'Te queda', exact: true }).getByRole('link', { name: /^Cocinar/ }),
  ).toBeVisible()
})

test('la cena con la proteína al momento: Hoy dice qué hacer y la pantalla «Al momento» la apunta', async ({
  page,
}) => {
  await prepararObjetivo(page)
  const ayer = new Date()
  ayer.setDate(ayer.getDate() - 1)
  await guardarMenu(page, {
    ...MENU,
    piloto: {
      compra: null,
      cocina: { modo: 'dias', dias: [(ayer.getDay() + 6) % 7], hora: '19:00' },
      preparar: { comida: 'taper', cena: 'mixto' },
      porPlato: {},
      tandas: [local(ayer)],
      saltadas: [],
      hechas: [local(ayer)],
      descartadas: [],
      desde: local(ayer),
    },
  })
  // En Hoy, una sola fila con tus comidas; abre la pantalla que las pasa deslizando
  await page.goto('/hoy')
  await abrirNutricion(page)
  await page
    .getByRole('region', { name: 'Te queda', exact: true })
    .getByRole('link', { name: /^Tus comidas de hoy/ })
    .click()
  // La comida, de tu táper; la cena, con la base en tu táper y lo demás ese día
  await expect(page.getByText(/Ya está hecho: caliéntalo/)).toBeVisible()
  await expect(page.getByText(/La base ya está hecha: hoy, solo esto/)).toBeAttached()
  await axe(page, 'Tus comidas de hoy')
  // Apuntada, ya no sale: queda la cena
  await page
    .getByRole('button', { name: /^Hecho y apuntar/ })
    .first()
    .click()
  await expect(page.getByRole('status')).toContainText('Comida: apuntada')
  await expect(page.getByRole('button', { name: /^Hecho y apuntar/ })).toHaveCount(1)
  await page.getByRole('button', { name: /^Hecho y apuntar/ }).click()
  // Todas apuntadas: de vuelta en Hoy, la fila en gris («: hecha»)
  await page.waitForURL('**/hoy*')
  await abrirNutricion(page)
  await page.getByRole('button', { name: /^Tus comidas de hoy: hecha$/, expanded: false }).click()
  await expect(page.getByText('Ya has apuntado todas tus comidas de hoy.')).toBeVisible()
})

test('cocinar aparte: desde Hoy, con sus pasos; al terminar se marca hecho en Hoy', async ({ page }) => {
  await prepararObjetivo(page)
  const hoy = local(new Date())
  await guardarMenu(page, {
    ...MENU,
    cocinados: [{ id: 'c1', plato: 'ej-salmon_patata', fecha: hoy, hora: '20:30', para: [`${hoy}|cena`] }],
  })
  await page.goto('/hoy')
  await abrirNutricion(page)
  await expect(
    page.getByRole('region', { name: 'Te queda', exact: true }).getByText(/^Cocina salmón/),
  ).toBeVisible()
  // Desde Hoy, lo de aparte lleva a cocinarlo con sus pasos; al terminar, «Hecho»
  await page
    .getByRole('region', { name: 'Te queda', exact: true })
    .getByRole('link', { name: /^Cocina salmón/ })
    .click()
  await cocinarHastaTerminar(page, 'Cocinar aparte')
  await page.goto('/hoy')
  await abrirNutricion(page)
  await page.getByRole('button', { name: /^Cocina salmón.*: hecha$/, expanded: false }).click()
  await expect(page.getByText(/^Ya has cocinado lo que te propusiste/)).toBeVisible()
})
