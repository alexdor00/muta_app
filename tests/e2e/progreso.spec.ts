import AxeBuilder from '@axe-core/playwright'
import { expect, type Page } from '@playwright/test'
import { ENTRENOS_MEJORANDO, guardado, prepararPlan, sinAnimaciones, testGuardando as test } from './plan.ts'

// Progreso mes a mes: el mes con su etapa, Días, Cuerpo (fotos y medidas), Fuerza (por grupo), la hoja de la etapa y Hoy.
// Datos escritos a mano: el plan con B1 cada semana durante 4 semanas (2,5 kg más cada vez), 30 días de pesajes bajando y
// 6 días comiendo 2.300 kcal con 150 g de proteína.

const DIA = 86_400_000
const fecha = (dias: number) => {
  const d = new Date(Date.now() - dias * DIA)
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 10)
}

const axe = (page: Page) => new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()

/** Tu objetivo, tus pesajes y lo que comiste (encima del plan de `prepararPlan`). */
async function prepararCuerpo(page: Page) {
  const pesajes = Array.from({ length: 30 }, (_, i) => ({ date: fecha(29 - i), kg: 81 - 0.04 * i }))
  const comidas = Array.from({ length: 6 }, (_, i) => fecha(i + 1))
  await page.evaluate(
    async ({ lista, dias, desde }) => {
      const db = await new Promise<IDBDatabase>((ok, ko) => {
        const r = indexedDB.open('muta')
        r.onsuccess = () => ok(r.result)
        r.onerror = () => ko(r.error)
      })
      const ahora = new Date().toISOString()
      const tx = db.transaction(['userContent', 'bodyLog', 'foodLog'], 'readwrite')
      tx.objectStore('userContent').put({
        id: 'nutricion',
        target: 'nutricion',
        cuerpo: { sexo: 'hombre', edad: 30, alturaCm: 180, pesoKg: 81 },
        pasos: 10300,
        diasEntreno: 4,
        fase: 'definicion',
        ritmo: 0.75,
        proteinaGKg: 1.8,
        grasaGKg: 0.8,
        kcal: 2375,
        kcalAnterior: null,
        desde,
        aMano: false,
        creado: desde,
      })
      for (const p of lista)
        tx.objectStore('bodyLog').put({ ...p, type: 'weight', createdAt: ahora, updatedAt: ahora })
      for (const date of dias)
        tx.objectStore('foodLog').put({
          date,
          apuntes: [
            {
              id: `c-${date}`,
              comida: 'comida',
              nombre: 'Menú del día',
              alimentoId: null,
              gramos: null,
              raciones: null,
              racion: null,
              kcal: 2300,
              protein: 150,
              carbs: 250,
              fat: 70,
            },
          ],
          createdAt: ahora,
          updatedAt: ahora,
        })
      await new Promise((ok, ko) => {
        tx.oncomplete = ok
        tx.onerror = () => ko(tx.error)
      })
      db.close()
    },
    { lista: pesajes, dias: comidas, desde: fecha(33) },
  )
}

/** Una imagen PNG de 1 × 1 px (para subir una foto). */
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
)

/** Elige Días, Cuerpo o Fuerza. */
const ver = (page: Page, vista: string) =>
  page.locator('label', { hasText: new RegExp(`^${vista}$`) }).click()

test('sin datos: el mes de hoy, sin entrenos ni medidas, y cada vista dice dónde empezar', async ({
  page,
}) => {
  await page.goto('/progreso')
  await expect(page.getByRole('heading', { name: 'Progreso', level: 1 })).toBeVisible()
  await expect(page.getByRole('region', { name: /\d{4}$/ })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Mes siguiente' })).toBeDisabled()
  await expect(page.getByText('Sin entrenos este mes')).toBeVisible()
  expect((await axe(page)).violations).toEqual([])
  await ver(page, 'Cuerpo')
  await expect(page).toHaveURL(/ver=cuerpo/)
  await expect(page.getByRole('region', { name: /^Tus medidas/ })).toContainText('Aún sin medidas')
  expect((await axe(page)).violations).toEqual([])
})

test('tu mes: Días, Cuerpo y Fuerza; la hoja de la etapa; lo de Hoy', async ({ page }) => {
  test.slow() // un recorrido largo: con todos a la vez pasa de 30 s
  await prepararPlan(page, ENTRENOS_MEJORANDO)
  await prepararCuerpo(page)

  // En Hoy: las medidas y fotos del mes, el día que tocan, en una hoja
  await page.goto('/')
  await page.getByRole('button', { name: /^Medidas y fotos del mes/ }).click()
  const hoja = page.getByRole('dialog', { name: 'Medidas y fotos del mes' })
  await sinAnimaciones(page)
  expect((await axe(page)).violations).toEqual([])
  await hoja.getByLabel('Brazo en cm').fill('38,5')
  await hoja.getByLabel('Cintura en cm').fill('85')
  await hoja.getByLabel('Cuello en cm').fill('38')
  await hoja
    .getByLabel('Foto de frente')
    .setInputFiles({ name: 'frente.png', mimeType: 'image/png', buffer: PNG })
  await hoja.getByRole('button', { name: 'Guardar' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Medidas y fotos guardadas' })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Hecho' })).toContainText('Medidas y fotos del mes')

  // Progreso abre en el mes de hoy, con su etapa y sus tres cajas
  await page.goto('/progreso')
  await expect(page.getByRole('button', { name: /^Etapa Primer mesociclo/ })).toContainText('semana')
  await expect(page.getByRole('list', { name: 'Frente al mes anterior' })).toContainText('tu fuerza')

  // Días: un día sin entreno lo dice; uno con entreno enseña debajo lo que hiciste
  if (!(await page.getByRole('link', { name: /, B1$/ }).count()))
    await page.getByRole('button', { name: 'Mes anterior' }).click()
  await page
    .getByRole('button', { name: /^\d+ de \p{L}+$/u })
    .first()
    .click()
  await expect(page.getByRole('status')).toContainText(/Sin entreno ese día|Hoy aún no has entrenado/)
  await page.getByRole('link', { name: /, B1$/ }).first().click()
  await expect(page).toHaveURL(/\/progreso\/dia\//)
  const press = page.getByRole('table', { name: 'Press inclinado con mancuernas' })
  await expect(press.getByRole('columnheader', { name: /^Sesión anterior/ })).toBeVisible()
  await page.screenshot({ path: 'tests/e2e/capturas/progreso-dia.png', fullPage: true })
  expect((await axe(page)).violations).toEqual([])
  // «‹» vuelve a la pantalla de la que vienes (usuario, 2026-11-23)
  await page.getByRole('link', { name: 'Volver', exact: true }).click()
  await expect(page).not.toHaveURL(/dia/)
  await expect(page).toHaveURL(/progreso/)
  await page.screenshot({ path: 'tests/e2e/capturas/progreso.png', fullPage: true })
  expect((await axe(page)).violations).toEqual([])
  await page.goto('/progreso')

  // Cuerpo: tu foto del mes, tus medidas frente al mes anterior (cada una, su gráfica) y tu composición
  await ver(page, 'Cuerpo')
  await expect(page.getByRole('region', { name: 'Tus fotos' }).getByRole('img')).toHaveCount(1)
  await expect(page.getByRole('region', { name: 'Tus medidas' })).toContainText('Brazo')
  await page.getByRole('button', { name: /^Peso/ }).click()
  await expect(
    page.getByRole('dialog', { name: 'Peso' }).getByRole('img', { name: /^Peso: de/ }),
  ).toBeVisible()
  await page.goBack()
  await page.getByRole('button', { name: /^Tu composición/ }).click()
  const comp = page
    .getByRole('dialog', { name: 'Tu composición' })
    .getByRole('region', { name: 'Composición' })
  await expect(comp.getByRole('img', { name: /de grasa estimada/ })).toBeVisible()
  await comp.locator('label', { hasText: '12 %' }).click()
  await expect(comp).toContainText('A un 12 % pesarías unos')
  await comp.getByRole('button', { name: 'Calibrar con una medida real' }).click()
  const cal = page.getByRole('dialog', { name: 'Calibrar tu grasa' })
  await cal.getByLabel('% de grasa medido').fill('14')
  await cal.getByRole('button', { name: 'Calibrar' }).click()
  await expect(comp).toContainText('Calibrada')
  await page.goBack()
  await page.screenshot({ path: 'tests/e2e/capturas/progreso-cuerpo.png', fullPage: true })
  expect((await axe(page)).violations).toEqual([])

  // Fuerza: solo por grupos; al abrir uno, sus ejercicios (sus básicos, los primeros); tocar uno, su gráfica
  await ver(page, 'Fuerza')
  if (!(await page.getByRole('button', { name: /^Femoral/ }).count()))
    await page.getByRole('button', { name: 'Mes anterior' }).click()
  await expect(page.getByRole('region', { name: /^Por grupo muscular/ })).toBeVisible()
  await page.getByRole('button', { name: /^Femoral/ }).click()
  await page.getByRole('button', { name: /^Curl femoral tumbado/ }).click()
  await expect(
    page.getByRole('dialog', { name: 'Curl femoral tumbado' }).getByRole('img', { name: /1RM estimado/ }),
  ).toBeVisible()
  await page.screenshot({ path: 'tests/e2e/capturas/progreso-fuerza.png', fullPage: true })
  expect((await axe(page)).violations).toEqual([])
  await page.goto('/progreso')

  // La etapa, en su hoja: constancia, tus músculos y tu rutina (cada una, su hoja; atrás vuelve a la etapa) y tu comida
  await page.getByRole('button', { name: /^Etapa / }).click()
  const etapa = page.getByRole('dialog', { name: 'Primer mesociclo' })
  await expect(etapa).toContainText('2.300')
  await sinAnimaciones(page)
  expect((await axe(page)).violations).toEqual([])
  await etapa.getByRole('button', { name: /^Constancia/ }).click()
  await expect(page.getByRole('dialog', { name: 'Constancia' })).toContainText('Racha')
  await page.goBack()
  await etapa.getByRole('button', { name: /^Tus músculos/ }).click()
  await expect(page.getByRole('dialog', { name: 'Tus músculos' })).toContainText('Pecho')
  await page.goBack()
  await etapa.getByRole('button', { name: /^Tu rutina/ }).click()
  const b1 = page
    .getByRole('dialog', { name: 'Tu rutina' })
    .locator('details', { has: page.getByText(/^B1 · /) })
  await b1.locator('summary').click()
  await expect(b1.getByText('Press inclinado con mancuernas')).toBeVisible()
  await page.goBack()
  await expect(etapa).toBeVisible()

  await guardado(page)
  await page.goto('/progreso?ver=cuerpo')
  await page.getByRole('button', { name: /^Tu composición/ }).click()
  await expect(page.getByRole('dialog', { name: 'Tu composición' })).toContainText('Calibrada')
})

test('renombrar la etapa, empezar otra y compararlas', async ({ page }) => {
  test.slow() // un recorrido largo: con todos a la vez pasa de 30 s
  await prepararPlan(page, ENTRENOS_MEJORANDO)
  await prepararCuerpo(page)
  await page.goto('/progreso')
  await page.getByRole('button', { name: /^Etapa / }).click()
  await page.getByRole('button', { name: 'Renombrar esta etapa' }).click()
  await page.getByRole('textbox', { name: 'Nombre de la etapa' }).fill('Bloque de fuerza')
  await page.getByRole('dialog').getByRole('button', { name: 'Guardar' }).click()
  await page.goto('/progreso')
  await expect(page.getByRole('button', { name: /^Etapa Bloque de fuerza/ })).toBeVisible()
  await page.getByRole('button', { name: /^Etapa / }).click()
  await page.getByRole('button', { name: 'Empezar otra etapa' }).click()
  const nuevo = page.getByRole('dialog', { name: 'Empezar otra etapa' })
  await expect(nuevo).toContainText('se archiva con todas sus sesiones')
  await nuevo.getByLabel('Nombre de la etapa nueva').fill('Bloque 2')
  await nuevo.getByRole('button', { name: 'Empezar hoy' }).click()
  await expect(page.getByRole('button', { name: /^Etapa Bloque 2/ })).toContainText('semana 1')

  await page.getByRole('button', { name: /^Etapa / }).click()
  await page.getByRole('button', { name: 'Comparar con otra etapa' }).click()
  // La misma rutina: se comparan a la misma semana (usuario, 2026-11-23)
  await expect(page.getByRole('dialog', { name: 'Comparar etapas' })).toContainText(
    'a la semana 1 de las dos',
  )
  await sinAnimaciones(page)
  expect((await axe(page)).violations).toEqual([])
})

test('una medida fuera de lo razonable no se guarda', async ({ page }) => {
  await page.goto('/progreso?hoja=mes')
  const hoja = page.getByRole('dialog', { name: 'Medidas y fotos del mes' })
  await hoja.getByLabel('Muslo en cm').fill('5')
  await hoja.getByRole('button', { name: 'Guardar' }).click()
  await expect(page.getByRole('status')).toContainText('Muslo: escribe los cm')
  await expect(hoja).toBeVisible()
})

test('las fotos del mes con la cámara: sin cámara, de la galería, postura a postura', async ({ page }) => {
  await page.goto('/progreso?hoja=mes')
  await page.getByRole('button', { name: /^Hacer las fotos/ }).click()
  const frente = page.getByRole('dialog', { name: 'Foto de frente' })
  await expect(frente).toBeVisible()
  await frente
    .getByLabel('Elegir la foto de frente de la galería')
    .setInputFiles({ name: 'frente.png', mimeType: 'image/png', buffer: PNG })
  const perfil = page.getByRole('dialog', { name: 'Foto de perfil' })
  await expect(perfil).toBeVisible()
  await expect(perfil.getByRole('button', { name: '✓ Frente' })).toBeVisible()
  expect((await axe(page)).violations).toEqual([])
  await perfil.getByRole('button', { name: 'Cerrar' }).click()
  // La foto elegida ya sale en su casilla (sin texto alternativo: es la vista previa)
  await expect(
    page.getByRole('dialog', { name: 'Medidas y fotos del mes' }).locator('img[src^="blob:"]'),
  ).toHaveCount(1)
})
