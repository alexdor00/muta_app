import AxeBuilder from '@axe-core/playwright'
import { expect, type Page } from '@playwright/test'
import { sinAnimaciones, testGuardando as test } from './plan.ts'

// Comida: calcular tu objetivo, apuntar con «Deshacer», el peso de hoy y la sugerencia del entrenador (que nunca se aplica
// sola). Datos de prueba escritos a mano: 30 días de pesajes bajando 0,28 kg por semana, 4 semanas comiendo 2.300 kcal
// y el objetivo que sale de la fórmula con esos datos (2.375 kcal, desde hace 33 días, con 10.300 pasos al día): el caso del
// diseño aprobado, bajar más despacio de lo previsto.

const DIA = 86_400_000
const fecha = (dias: number) => {
  const d = new Date(Date.now() - dias * DIA)
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 10)
}

async function abrirBase(page: Page) {
  await page.goto('/dev/ui')
  await page.evaluate(async () => {
    for (let i = 0; i < 100; i++) {
      const dbs = await indexedDB.databases()
      if (dbs.some((d) => d.name === 'muta' && (d.version ?? 0) > 1)) break
      await new Promise((ok) => setTimeout(ok, 50))
    }
  })
}

/** Perfil (perder grasa, 4 días), tus ajustes, pesajes y comida de 4 semanas. */
async function prepararComida(page: Page) {
  await abrirBase(page)
  const pesajes = Array.from({ length: 30 }, (_, i) => ({ date: fecha(29 - i), kg: 81 - 0.04 * i }))
  const comidas = Array.from({ length: 28 }, (_, i) => fecha(i + 1))
  await page.evaluate(
    async ({ lista, dias, desde }) => {
      const db = await new Promise<IDBDatabase>((ok, ko) => {
        const r = indexedDB.open('muta')
        r.onsuccess = () => ok(r.result)
        r.onerror = () => ko(r.error)
      })
      const ahora = new Date().toISOString()
      const tx = db.transaction(['profile', 'userContent', 'bodyLog', 'foodLog'], 'readwrite')
      tx.objectStore('profile').put({
        id: 'me',
        daysPerWeek: 4,
        level: 'intermediate',
        goal: 'lose_fat',
        createdAt: ahora,
        updatedAt: ahora,
        deletedAt: null,
      })
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

test('sin objetivo: tus datos lo calculan y sale lo que te queda por comer', async ({ page }) => {
  await abrirBase(page)
  await page.goto('/comida')
  await page.getByRole('button', { name: 'Calcular mi objetivo' }).click()
  const hoja = page.getByRole('dialog', { name: 'Tus datos' })
  await hoja.getByText('Hombre').click()
  await hoja.getByLabel('Edad').fill('30')
  await hoja.getByLabel('Altura (cm)').fill('180')
  await hoja.getByLabel('Peso (kg)').fill('80')
  await hoja.getByLabel('Pasos al día').fill('9.000')
  await hoja.getByRole('button', { name: 'Calcular mi objetivo' }).click()
  // Sin perfil: mantenimiento, 3 días → 1.780 × 1,61 = 2.866 kcal
  await expect(page.getByRole('region', { name: 'Lo que llevas hoy' })).toContainText('de 2.866')
  await expect(page.getByRole('region', { name: 'Lo que llevas hoy' })).toContainText('Te quedan 2.866 kcal')
  await page.getByRole('link', { name: 'Objetivo' }).click()
  await expect(page.getByRole('heading', { name: 'Cómo sale' })).toBeVisible()
  await expect(page.getByText('Mifflin-St Jeor: 80 kg, 180 cm, 30 años')).toBeVisible()
  await expect(page.getByText(/Para revisar tu semana me faltan 9 pesajes/)).toBeVisible()
})

test('después de la bienvenida, tus datos preguntan qué quieres (viene marcado lo de la bienvenida)', async ({
  page,
}) => {
  await page.goto('/bienvenida/1')
  await page.getByText('Perder grasa').click()
  await page.getByRole('link', { name: 'Siguiente' }).click()
  await page.getByRole('button', { name: 'Siguiente' }).click()
  await expect(page).toHaveURL('/entreno/rutinas')
  await page.goto('/comida')
  await page.getByRole('button', { name: 'Calcular mi objetivo' }).click()
  const hoja = page.getByRole('dialog', { name: 'Tus datos' })
  const queQuieres = hoja.getByRole('group', { name: '¿Qué quieres?' })
  await expect(queQuieres.getByRole('radio', { name: 'Definir' })).toBeChecked()
  await queQuieres.getByText('Volumen').click()
  await hoja.getByLabel('Edad').fill('30')
  // En metros también vale
  await hoja.getByLabel('Altura (cm)').fill('1,80')
  await hoja.getByLabel('Peso (kg)').fill('80')
  await hoja.getByLabel('Pasos al día').fill('8000')
  await hoja.getByRole('button', { name: 'Calcular mi objetivo' }).click()
  await expect(hoja).toHaveCount(0)
  await page.getByRole('link', { name: 'Objetivo' }).click()
  await expect(page.getByText('Mifflin-St Jeor: 80 kg, 180 cm, 30 años')).toBeVisible()
  await expect(page.getByText(/Empiezas en .* kcal · volumen/)).toBeVisible()
})

test('añadir un alimento con su ración, verlo en su comida y deshacerlo', async ({ page }) => {
  await prepararComida(page)
  await page.goto('/comida')
  await page.getByRole('button', { name: 'Añadir a la cena' }).click()
  const hoja = page.getByRole('dialog', { name: 'Añadir a la cena' })
  await hoja.getByLabel('Buscar un alimento').fill('salmon plancha')
  await hoja
    .getByRole('button', { name: /^Salmón a la plancha/ })
    .first()
    .click()
  const racion = page.getByRole('dialog', { name: 'Salmón a la plancha' })
  await expect(racion.getByRole('region', { name: 'Así queda tu día' })).toBeVisible()
  await racion.getByRole('button', { name: 'Más' }).click()
  await racion.getByRole('button', { name: 'Añadir a la cena' }).click()
  await expect(page.getByRole('status')).toContainText('Salmón a la plancha')
  await expect(page.getByRole('button', { name: /^Cena.*Salmón a la plancha/ })).toBeVisible()
  await page.getByRole('status').getByRole('button', { name: 'Deshacer' }).click()
  await expect(page.getByRole('button', { name: /^Cena.*Salmón/ })).toHaveCount(0)
})

test('solo kcal y proteína, y repetir la comida de ayer', async ({ page }) => {
  await prepararComida(page)
  await page.goto('/comida')
  await page.getByRole('button', { name: 'Añadir a la comida' }).click()
  const hoja = page.getByRole('dialog', { name: 'Añadir a la comida' })
  await hoja.getByRole('button', { name: /Repetir la comida de ayer/ }).click()
  await expect(page.getByRole('button', { name: /^Comida.*Menú del día/ })).toBeVisible()
  await page.getByRole('button', { name: 'Añadir a la cena' }).click()
  await page.getByRole('button', { name: /Solo kcal y proteína/ }).click()
  const rapido = page.getByRole('dialog', { name: 'Solo kcal y proteína' })
  await rapido.getByLabel('Kcal').fill('600')
  await rapido.getByLabel('Proteína (g)').fill('35')
  await rapido.getByRole('button', { name: 'Guardar' }).click()
  const dia = page.getByRole('region', { name: 'Lo que llevas hoy' })
  await expect(dia).toContainText('2.900kcalde 2.375')
  await expect(dia).toContainText('525 kcal de más')
})

test('sin Semana ni peso en Comida: el peso de hoy se apunta en la pestaña Hoy', async ({ page }) => {
  await prepararComida(page)
  await page.goto('/comida')
  await expect(page.getByRole('heading', { name: 'Comidas' })).toBeVisible()
  await expect(page.getByText('Semana', { exact: true })).toHaveCount(0)
  await expect(page.getByText(/Pésate/)).toHaveCount(0)
  await page.goto('/hoy')
  const peso = page.getByRole('region', { name: /Tu peso/ })
  await peso.getByRole('button', { name: 'Cambiar' }).click()
  await page.getByLabel('Peso en kilos').fill('79,8')
  await page.getByRole('dialog', { name: 'Tu peso de hoy' }).getByRole('button', { name: 'Guardar' }).click()
  await expect(page.getByRole('status')).toContainText('79,8 kg apuntados')
  await expect(peso).toContainText('79,8')
})

test('el entrenador propone −150 kcal; nada cambia hasta aplicarlo y se puede deshacer', async ({ page }) => {
  await prepararComida(page)
  await page.goto('/comida')
  await expect(page.getByRole('region', { name: 'Lo que llevas hoy' })).toContainText('de 2.375')
  await page.getByRole('button', { name: /Te propongo un cambio: −150 kcal/ }).click()
  const hoja = page.getByRole('dialog', { name: 'El entrenador' })
  await expect(hoja.getByRole('heading', { name: 'Bajas más despacio de lo previsto' })).toBeVisible()
  await expect(hoja.getByText('2.225', { exact: true })).toBeVisible()
  await expect(hoja.getByText(/10\.300 pasos al día/)).toBeVisible()
  await hoja.getByRole('button', { name: 'Aplicar desde mañana' }).click()
  await expect(page.getByRole('status')).toContainText('2.225 kcal desde mañana')
  // Hoy sigue el objetivo de antes
  await expect(page.getByRole('region', { name: 'Lo que llevas hoy' })).toContainText('de 2.375')
  await page.getByRole('link', { name: 'Objetivo' }).click()
  await expect(page.getByRole('region', { name: 'Tu objetivo' })).toContainText('2.225')
  await expect(page.getByText('desde mañana')).toBeVisible()
  await page.getByRole('button', { name: 'Deshacer' }).click()
  await expect(page.getByRole('region', { name: 'Tu objetivo' })).toContainText('2.375')
})

test('«Ahora no» deja el objetivo como estaba y queda en el historial', async ({ page }) => {
  await prepararComida(page)
  await page.goto('/comida/objetivo')
  await page.getByRole('button', { name: 'Ver la sugerencia' }).click()
  await page.getByRole('button', { name: 'Ahora no' }).click()
  await expect(page.getByRole('region', { name: 'Tu objetivo' })).toContainText('2.375')
  await expect(page.getByText('−150 kcal · «Ahora no»')).toBeVisible()
  await page.goto('/comida')
  await expect(page.getByRole('button', { name: /Te propongo un cambio/ })).toHaveCount(0)
})

async function sinFallos(page: Page) {
  await sinAnimaciones(page)
  const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
  const graves = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
  expect(
    graves.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`),
    'fallos de accesibilidad',
  ).toEqual([])
}

test('accesibilidad: Hoy, Añadir, la ración, Tu objetivo y la sugerencia', async ({ page }) => {
  test.setTimeout(90_000)
  await prepararComida(page)
  await page.goto('/comida')
  await expect(page.getByRole('region', { name: 'Lo que llevas hoy' })).toBeVisible()
  await sinFallos(page)
  await page.screenshot({ path: 'tests/e2e/capturas/comida-hoy.png', fullPage: true })
  await page.getByRole('button', { name: 'Añadir a la cena' }).click()
  await expect(page.getByRole('button', { name: /^Salmón|^Pechuga|^Huevo/ }).first()).toBeVisible()
  await sinFallos(page)
  await page.screenshot({ path: 'tests/e2e/capturas/comida-anadir.png' })
  await page.getByLabel('Buscar un alimento').fill('salmon plancha')
  await page
    .getByRole('button', { name: /^Salmón a la plancha/ })
    .first()
    .click()
  await sinFallos(page)
  await page.screenshot({ path: 'tests/e2e/capturas/comida-racion.png' })
  await page.goto('/comida/objetivo')
  await sinFallos(page)
  await page.screenshot({ path: 'tests/e2e/capturas/comida-objetivo.png', fullPage: true })
  await page.getByRole('button', { name: 'Ver la sugerencia' }).click()
  await sinFallos(page)
  await page.screenshot({ path: 'tests/e2e/capturas/comida-sugerencia.png' })
})
