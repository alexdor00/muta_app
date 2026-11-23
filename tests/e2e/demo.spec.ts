import { expect, test } from './plan.ts'

// El perfil de prueba de /dev/demo: se carga (preguntando antes) y la app lo enseña en Progreso (Días, Cuerpo con sus fotos
// comparadas y «Ver tu cambio», Fuerza y la etapa) y en Hoy.

test('el perfil de prueba se carga y se ve en Progreso (cada vista y la etapa) y en Hoy', async ({
  page,
}) => {
  test.slow() // dibuja 12 fotos y escribe unos 100 días
  page.on('dialog', (d) => void d.accept())
  await page.goto('/dev/demo')
  await page.getByRole('button', { name: 'Cargar el perfil de prueba' }).click()
  await page.waitForURL('**/progreso')
  await expect(page.getByRole('button', { name: /^Etapa Definición/ })).toBeVisible()
  await page.screenshot({ path: 'tests/e2e/capturas/demo-progreso.png', fullPage: true })

  // Cuerpo: la foto partida antes / ahora, la tira de meses y «Ver tu cambio»
  await page.goto('/progreso?ver=cuerpo')
  await expect(page.getByRole('slider', { name: 'Desliza para ver antes y ahora' })).toBeVisible()
  await page.screenshot({ path: 'tests/e2e/capturas/demo-cuerpo.png', fullPage: true })
  await page.getByRole('button', { name: 'Ver tu cambio' }).click()
  const cambio = page.getByRole('dialog', { name: 'Tu cambio, mes a mes' })
  await expect(cambio.getByRole('img')).toBeVisible()
  await cambio.getByRole('group', { name: 'Tus meses' }).getByRole('button').last().click()
  await page.screenshot({ path: 'tests/e2e/capturas/demo-cambio.png' })
  await cambio.getByRole('button', { name: 'Cerrar' }).click()
  await expect(cambio).toBeHidden()

  // Un día de entreno, en su pantalla
  await page.goto('/progreso')
  await page
    .getByRole('link', { name: /, [AB][0-9]/ })
    .last()
    .click()
  await expect(page.getByRole('columnheader', { name: /^Sesión anterior/ }).first()).toBeVisible()
  await page.screenshot({ path: 'tests/e2e/capturas/demo-dia.png', fullPage: true })

  // Fuerza y la etapa
  await page.goto('/progreso?ver=fuerza')
  await expect(page.getByRole('region', { name: /^Por grupo muscular/ })).toBeVisible()
  await page.getByRole('button', { name: /^Pecho/ }).click()
  await page
    .getByRole('button', { name: /^Press/ })
    .first()
    .click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.screenshot({ path: 'tests/e2e/capturas/demo-ejercicio.png' })
  await page.goBack()
  await page.screenshot({ path: 'tests/e2e/capturas/demo-fuerza.png', fullPage: true })
  await page.getByRole('button', { name: /^Etapa / }).click()
  await expect(page.getByRole('dialog', { name: /Definición/ })).toContainText('Récords')
  await page.screenshot({ path: 'tests/e2e/capturas/demo-etapa.png' })

  await page.goto('/')
  // En Hoy, las medidas del mes aún no tocan: sale cuándo
  await expect(
    page.getByRole('button', { name: /^Próximo: medidas y fotos en \d+ días? · elegir día$/ }),
  ).toBeVisible()
})
