import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

// Comida · Dieta (versiones 2 y 3): empezar con la dieta de ejemplo del prototipo, apuntar el menú de un toque, la receta
// con sus intercambios y su edición, la compra, la cocina, la consulta (que solo propone), el escáner con Open Food Facts
// (simulado: las pruebas no salen a internet) y el día que ves con ‹ ›.

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

/** Empieza la dieta de ejemplo desde Comida · Dieta (hoy, día 1 del menú). */
async function empezarEjemplo(page: Page) {
  await abrirBase(page)
  await page.goto('/comida?vista=dieta')
  await page.getByRole('button', { name: 'Probar la dieta de ejemplo' }).click()
  const hoja = page.getByRole('dialog', { name: 'Empezar la dieta' })
  await expect(hoja).toContainText('Dieta de ejemplo')
  await expect(hoja).toContainText('menús')
  await hoja.getByRole('button', { name: 'Empezar hoy' }).click()
  await expect(page.getByRole('status')).toContainText('Empiezas «Dieta de ejemplo»')
}

test('empezar la dieta de ejemplo y apuntar el menú de hoy de un toque', async ({ page }) => {
  await empezarEjemplo(page)
  await expect(page.getByRole('heading', { name: 'Tu semana' })).toBeVisible()
  await expect(page.getByRole('link', { name: /Pollo con arroz y verduras/ })).toBeVisible()
  await page.getByText('Hoy', { exact: true }).first().click()
  await expect(page.getByRole('heading', { name: 'Tu menú · A' })).toBeVisible()
  await page.getByRole('button', { name: 'Apuntar Batido' }).click()
  await expect(page.getByRole('status')).toContainText('Batido: apuntada')
  await expect(page.getByRole('button', { name: 'Batido: apuntada, quitar' })).toBeVisible()
  // Lo apuntado sale también en su comida
  await expect(page.getByRole('button', { name: /^Desayuno.*Batido/ })).toBeVisible()
  await page.getByRole('button', { name: 'Batido: apuntada, quitar' }).click()
  await expect(page.getByRole('button', { name: 'Apuntar Batido' })).toBeVisible()
})

test('el día que ves: ‹ › para ver y apuntar en otro día', async ({ page }) => {
  await empezarEjemplo(page)
  await page.goto('/comida')
  await expect(page.getByRole('navigation', { name: 'Día' })).toContainText('Hoy')
  await expect(page.getByRole('button', { name: 'Día siguiente' })).toBeDisabled()
  await page.getByRole('button', { name: 'Día anterior' }).click()
  await expect(page.getByRole('navigation', { name: 'Día' })).toContainText('Ayer')
  // Ayer fue el día 7 del ciclo de la dieta (menú A)
  await expect(page.getByText(/día 7 del menú/)).toBeVisible()
})

test('la receta: versión de descanso, un intercambio para siempre y editar sus gramos', async ({ page }) => {
  await empezarEjemplo(page)
  await page.getByRole('link', { name: /Pollo con arroz y verduras/ }).click()
  await expect(page.getByRole('heading', { name: 'Pollo con arroz y verduras', level: 1 })).toBeVisible()
  await page.getByText('Día de descanso', { exact: true }).click()
  await expect(page.getByRole('button', { name: /Arroz \(en crudo\).*60 g/ })).toBeVisible()
  await page.getByText('Día de entreno', { exact: true }).click()
  await page.getByRole('button', { name: /Arroz \(en crudo\).*100 g/ }).click()
  const cambio = page.getByRole('dialog', { name: 'Cambiar arroz (en crudo)' })
  await expect(cambio).toContainText('79 g de hidratos')
  await cambio.getByText('En la receta, siempre').click()
  await cambio.getByRole('button', { name: /^Patata \(cruda\)/ }).click()
  await expect(page.getByRole('status')).toContainText('cambiado en la receta')
  await expect(page.getByRole('button', { name: /Patata \(cruda\).*465 g/ })).toBeVisible()
  await page.getByRole('button', { name: 'Editar receta' }).click()
  const editar = page.getByRole('dialog', { name: 'Editar receta' })
  await editar.getByRole('button', { name: 'Más Patata (cruda)' }).click()
  await expect(editar.getByLabel('Gramos de Patata (cruda)')).toHaveValue('470')
  await editar.getByRole('button', { name: 'Volver a la receta de la dieta' }).click()
  await expect(page.getByRole('button', { name: /Arroz \(en crudo\).*100 g/ })).toBeVisible()
})

test('la compra: sale de las recetas, se marca lo que tienes y se añade lo tuyo', async ({ page }) => {
  await empezarEjemplo(page)
  await page.goto('/comida/compra')
  await expect(page.getByRole('heading', { name: 'Carne y pescado' })).toBeVisible()
  const pollo = page.getByRole('button', { name: /^Pechuga de pollo/ })
  await pollo.click()
  await expect(pollo).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('button', { name: '+ Añadir algo' }).click()
  const hoja = page.getByRole('dialog', { name: 'Añadir a la lista' })
  await hoja.getByLabel('Qué').fill('Café')
  await hoja.getByRole('button', { name: 'Añadir', exact: true }).click()
  await expect(page.getByRole('button', { name: /^Café/ })).toBeVisible()
})

test('la cocina: repartir una olla y guardar un plato propio por 100 g', async ({ page }) => {
  await empezarEjemplo(page)
  await page.goto('/comida/cocina')
  await expect(page.getByRole('heading', { name: 'La olla de arroz' })).toBeVisible()
  const olla = page.getByRole('region', { name: 'Repartir una olla' })
  await olla.getByLabel('Olla vacía (g)').fill('1250')
  await olla.getByLabel('Llena (g)').fill('2890')
  await olla.getByLabel('Raciones').fill('3')
  await expect(olla).toContainText('547 g')
  const plato = page.getByRole('region', { name: 'Calcular un plato' })
  await plato.getByLabel('Nombre').fill('Mis lentejas')
  await plato.getByLabel('Buscar un ingrediente del plato').fill('lentejas cocidas')
  await plato
    .getByRole('button', { name: /^Lentejas/ })
    .first()
    .click()
  await plato.getByLabel('Peso cocinado (g, sin la olla)').fill('300')
  await plato.getByRole('button', { name: 'Guardar en Mis alimentos' }).click()
  await expect(page.getByRole('status')).toContainText('Mis lentejas: guardado en Mis alimentos')
})

test('la consulta semanal: la semana 1 no cambia nada y queda guardada', async ({ page }) => {
  await empezarEjemplo(page)
  await page.goto('/comida/consulta')
  await page.getByLabel('Cintura, a la altura del ombligo (cm)').fill('84,5')
  await page.getByRole('button', { name: 'Siguiente' }).click()
  await page.getByLabel('Sueño medio (horas)').fill('7')
  await page.getByRole('button', { name: 'Hambre: 8' }).click()
  await page.getByRole('button', { name: 'Ver el informe' }).click()
  await expect(page.getByRole('heading', { name: 'Semana 1: no se cambia nada' })).toBeVisible()
  // Con hambre alta, consejos (sin cambiar nada)
  await expect(page.getByText(/proteína repartida/)).toBeVisible()
  await expect(page.getByText('Sin señales de cansancio')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Aplicar desde mañana' })).toHaveCount(0)
})

test('el escáner: el código en Open Food Facts y la misma hoja de la ración', async ({ page }) => {
  await page.route('https://world.openfoodfacts.org/**', (route) =>
    route.fulfill({
      json: {
        status: 1,
        product: {
          product_name: 'Skyr natural',
          brands: 'Prueba',
          nutriments: { 'energy-kcal_100g': 63, proteins_100g: 11, carbohydrates_100g: 4, fat_100g: 0.2 },
          serving_quantity: 150,
        },
      },
    }),
  )
  await empezarEjemplo(page)
  await page.goto('/comida')
  await page.getByRole('button', { name: 'Añadir al desayuno' }).click()
  await page.getByRole('button', { name: 'Escanear un código de barras' }).click()
  const hoja = page.getByRole('dialog', { name: 'Escanear al desayuno' })
  await hoja.getByLabel('Código de barras').fill('8410000000000')
  await hoja.getByRole('button', { name: 'Buscar' }).click()
  await expect(hoja).toContainText('Encontrado en Open Food Facts')
  await expect(hoja).toContainText('Skyr natural · Prueba')
  await hoja.getByRole('button', { name: 'Elegir la ración' }).click()
  await expect(page.getByRole('dialog', { name: 'Skyr natural · Prueba' })).toBeVisible()
})

test('accesibilidad: Dieta, la receta, la compra, la cocina y la consulta', async ({ page }) => {
  test.setTimeout(150_000)
  await empezarEjemplo(page)
  const revisar = async (donde: string) => {
    const r = await new AxeBuilder({ page }).analyze()
    expect(r.violations, `${donde}: ${r.violations.map((v) => v.id).join(', ')}`).toEqual([])
  }
  await revisar('Dieta')
  await page.goto('/comida')
  await expect(page.getByRole('heading', { name: 'Tu menú · A' })).toBeVisible()
  await revisar('Hoy con dieta')
  await page.goto('/comida/receta/pollo_arroz')
  await expect(page.getByRole('heading', { name: 'Ingredientes' })).toBeVisible()
  await revisar('Receta')
  await page.goto('/comida/compra')
  await expect(page.getByRole('heading', { name: 'Carne y pescado' })).toBeVisible()
  await revisar('La compra')
  await page.goto('/comida/cocina')
  await expect(page.getByRole('heading', { name: 'Repartir una olla' })).toBeVisible()
  await revisar('Cocina')
  await page.goto('/comida/consulta')
  await expect(page.getByRole('heading', { name: 'La cinta' })).toBeVisible()
  await revisar('Consulta')
  await page.screenshot({ path: 'tests/e2e/capturas/comida-consulta.png', fullPage: true })
  await page.goto('/comida?vista=dieta')
  await page.screenshot({ path: 'tests/e2e/capturas/comida-dieta.png', fullPage: true })
  await page.goto('/comida')
  await page.screenshot({ path: 'tests/e2e/capturas/comida-hoy-dieta.png', fullPage: true })
  await page.goto('/comida/receta/pollo_arroz')
  await page.screenshot({ path: 'tests/e2e/capturas/comida-receta.png', fullPage: true })
})
