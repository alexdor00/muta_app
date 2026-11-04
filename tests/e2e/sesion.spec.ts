import { expect, test } from './plan.ts'

// La sesión en curso (C01–C06) con los datos de prueba de state/muestra.

test('«Empezar B1» abre la sesión: tiempo, series y sin pestañas', async ({ page }) => {
  await page.goto('/entreno/rutina/b1')
  await page.getByRole('link', { name: 'Empezar B1' }).click()
  await expect(page).toHaveURL('/entreno/sesion/b1')
  await expect(page.getByText('B1 · 0 de 17 series')).toBeVisible()
  await expect(page.getByRole('button', { name: /^Tiempo de la sesión/ })).toHaveText(/^0:0\d$/)
  await expect(page.getByRole('navigation', { name: 'Pestañas' })).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Salir' })).toHaveAttribute('href', '/entreno/rutina/b1')
})

test('la vez anterior sale en gris y un toque la apunta; el descanso empieza', async ({ page }) => {
  await page.goto('/entreno/sesion/b1')
  const kg = page.getByLabel('Kilos de la serie 1')
  await expect(kg).toHaveValue('')
  await expect(kg).toHaveAttribute('placeholder', '60')
  await expect(page.getByLabel('Repeticiones de la serie 1')).toHaveAttribute('placeholder', '10')

  await page.getByRole('button', { name: 'Serie 1 hecha' }).click()
  await expect(kg).toHaveValue('60')
  await expect(page.getByLabel('Repeticiones de la serie 1')).toHaveValue('10')
  await expect(page.getByRole('progressbar', { name: 'Series hechas' })).toHaveAttribute('aria-valuenow', '1')
  // La siguiente sigue con lo suyo de la vez anterior (no cambiaste el peso) y el calentamiento se quita
  await expect(page.getByLabel('Kilos de la serie 2')).toHaveValue('')
  await expect(page.getByLabel('Kilos de la serie 2')).toHaveAttribute('placeholder', '62,5')
  await expect(page.getByRole('button', { name: /^Calentamiento:/ })).toHaveCount(0)

  const descanso = page.getByRole('timer', { name: 'Descanso' })
  // El peso muerto rumano descansa «~3 min»
  await expect(descanso).toContainText('2:5')
  await descanso.getByRole('button', { name: 'Saltar' }).click()
  await expect(descanso).toHaveCount(0)

  // Volver a tocar la deshace
  await page.getByRole('button', { name: 'Serie 1 hecha' }).click()
  await expect(page.getByRole('progressbar', { name: 'Series hechas' })).toHaveAttribute('aria-valuenow', '0')
})

test('el teclado propio escribe, suma el salto de peso y una serie mejor lleva ★', async ({ page }) => {
  await page.goto('/entreno/sesion/b1')
  await page.getByLabel('Kilos de la serie 1').click()
  const teclado = page.getByRole('group', { name: 'Teclado numérico' })
  await expect(teclado).toContainText('Serie 1 · peso en kg')
  await teclado.getByRole('button', { name: 'Más 2,5' }).click()
  await expect(page.getByLabel('Kilos de la serie 1')).toHaveValue('62,5')

  await teclado.getByRole('button', { name: 'Siguiente' }).click()
  await expect(teclado).toContainText('Serie 1 · repeticiones')
  await teclado.getByRole('button', { name: '1', exact: true }).click()
  await teclado.getByRole('button', { name: '0', exact: true }).click()
  await expect(page.getByLabel('Repeticiones de la serie 1')).toHaveValue('10')

  await page.getByRole('button', { name: 'Serie 1 hecha' }).click()
  await expect(page.getByRole('button', { name: 'Serie 1 hecha, récord' })).toBeVisible()
  // Con el teclado abierto pasa a los kilos de la serie siguiente, con el descanso encima del teclado
  await expect(teclado).toContainText('Descanso entre series')
  await expect(page.getByLabel('Kilos de la serie 2')).toHaveClass(/active/)
  await teclado.getByRole('button', { name: 'Ocultar teclado' }).click()
  await expect(teclado).toHaveCount(0)
})

test('números imposibles no entran y los muy altos se confirman', async ({ page }) => {
  await page.goto('/entreno/sesion/b1')
  const teclado = page.getByRole('group', { name: 'Teclado numérico' })
  const escribir = async (cifras: string) => {
    await page.getByLabel('Kilos de la serie 1').click()
    for (const c of cifras) await teclado.getByRole('button', { name: c, exact: true }).click()
    await teclado.getByRole('button', { name: 'Ocultar teclado' }).click()
  }
  await escribir('700')
  await page.getByRole('button', { name: 'Serie 1 hecha' }).click()
  await expect(page.getByRole('status')).toContainText('Revisa los números')
  await expect(page.getByRole('button', { name: 'Serie 1 hecha' })).toHaveAttribute('aria-pressed', 'false')

  await escribir('320')
  await page.getByRole('button', { name: 'Serie 1 hecha' }).click()
  const hoja = page.getByRole('dialog', { name: '¿Seguro?' })
  await expect(hoja).toContainText('320 kg × 10')
  await hoja.getByRole('button', { name: 'Sí, es correcto' }).click()
  await expect(page.getByRole('button', { name: /^Serie 1 hecha/ })).toHaveAttribute('aria-pressed', 'true')
})

test('al terminar las series el ejercicio se pliega y se abre el siguiente', async ({ page }) => {
  await page.goto('/entreno/sesion/b1')
  for (const n of [1, 2, 3]) await page.getByRole('button', { name: `Serie ${n} hecha` }).click()
  await expect(page.getByRole('heading', { name: 'Press inclinado con mancuernas' })).toBeVisible()
  await expect(page.getByRole('button', { name: /Peso muerto rumano.*terminado/ })).toBeVisible()
  await expect(page.getByText('B1 · 3 de 17 series')).toBeVisible()
})

test.describe('con ratón', () => {
  test.use({ hasTouch: false, isMobile: false })

  test('deslizar una serie descubre «Eliminar»; «Añadir serie» pone otra', async ({ page }) => {
    await page.goto('/entreno/sesion/b1')
    await page.getByRole('button', { name: 'Añadir serie' }).click()
    await expect(page.getByLabel('Kilos de la serie 4')).toBeVisible()

    const caja = (await page.getByLabel('Kilos de la serie 4').boundingBox())!
    const y = caja.y + caja.height / 2
    await page.mouse.move(caja.x + caja.width, y)
    await page.mouse.down()
    await page.mouse.move(caja.x - 60, y, { steps: 8 })
    await page.mouse.up()
    await page.getByRole('button', { name: 'Eliminar' }).click()
    await expect(page.getByLabel('Kilos de la serie 4')).toHaveCount(0)
  })

  test('mantener pulsada una serie la borra y «Deshacer» la devuelve', async ({ page }) => {
    await page.goto('/entreno/sesion/b1')
    const caja = (await page.getByText('3', { exact: true }).first().boundingBox())!
    await page.mouse.move(caja.x + caja.width / 2, caja.y + caja.height / 2)
    await page.mouse.down()
    await page.waitForTimeout(700)
    await page.mouse.up()
    await expect(page.getByLabel('Kilos de la serie 3')).toHaveCount(0)
    await expect(page.getByRole('status')).toContainText('Serie 3 eliminada')
    await page.getByRole('button', { name: 'Deshacer' }).click()
    await expect(page.getByLabel('Kilos de la serie 3')).toBeVisible()
  })
})

test('«Terminar» sin ninguna serie avisa y no sale', async ({ page }) => {
  await page.goto('/entreno/sesion/b1')
  await page.getByRole('button', { name: 'Terminar' }).click()
  await expect(page.getByRole('status')).toContainText('Marca al menos una serie como hecha')
  await expect(page).toHaveURL('/entreno/sesion/b1')
})

test('el calentamiento se calcula con el peso de trabajo y solo en el primer ejercicio de cada músculo', async ({
  page,
}) => {
  await page.goto('/entreno/sesion/b1')
  const calentamiento = page.getByRole('button', { name: /^Calentamiento:/ })
  await expect(calentamiento).toHaveText([
    'Calentamiento: 30kg× 8',
    'Calentamiento: 42,5kg× 5',
    'Calentamiento: 52,5kg× 3',
  ])
  // Pecho, la primera vez: 24 kg en mancuernas → 12 × 10 y 18 × 5
  await page.getByRole('button', { name: /Press inclinado con mancuernas/ }).click()
  await expect(calentamiento).toHaveText(['Calentamiento: 12kg× 10', 'Calentamiento: 18kg× 5'])
  // Femoral ya calentado con el peso muerto rumano: sin calentamiento
  await page.getByRole('button', { name: /Curl femoral tumbado/ }).click()
  await expect(calentamiento).toHaveCount(0)
})

test('tocar otro ejercicio lo abre y cierra el anterior', async ({ page }) => {
  await page.goto('/entreno/sesion/b1')
  await page.getByRole('button', { name: /Press inclinado con mancuernas/ }).click()
  await expect(page.getByRole('heading', { name: 'Press inclinado con mancuernas' })).toBeVisible()
  await expect(page.getByLabel('Kilos de la serie 1')).toHaveAttribute('placeholder', '22')
})

test('tocar el tiempo lo para y lo vuelve a poner en marcha', async ({ page }) => {
  await page.goto('/entreno/sesion/b1')
  const tiempo = page.getByRole('button', { name: /^Tiempo de la sesión/ })
  const antes = (await tiempo.boundingBox())!
  await tiempo.click()
  await expect(page.getByText('En pausa', { exact: true })).toBeVisible()
  // El tiempo se queda en su sitio, centrado (no se va a la izquierda)
  const despues = (await tiempo.boundingBox())!
  expect(Math.abs(despues.x + despues.width / 2 - (antes.x + antes.width / 2))).toBeLessThan(1)
  const parado = await tiempo.textContent()
  await page.waitForTimeout(1500)
  await expect(tiempo).toHaveText(parado!)
  await tiempo.click()
  await expect(page.getByText('B1 · 0 de 17 series')).toBeVisible()
})

test('«···»: tus notas (para siempre, en la sesión y en la ficha), cambiar ejercicio solo hoy y discos por lado', async ({
  page,
}) => {
  await page.goto('/entreno/sesion/b1')
  const opciones = page.getByRole('button', { name: 'Opciones de Peso muerto rumano' })

  await opciones.click()
  await page.getByRole('button', { name: /Tus notas/ }).click()
  await page.getByRole('textbox', { name: 'Tus notas' }).fill('Agarre mixto')
  await page.getByRole('button', { name: 'Guardar' }).click()
  await expect(page.getByText('Nota guardada en su ficha')).toBeVisible()
  await expect(page.getByText('Agarre mixto')).toBeVisible()
  // Sigue al recargar y sale en la ficha del ejercicio
  await page.reload()
  await expect(page.getByText('Agarre mixto')).toBeVisible()
  await page.goto('/entreno/ejercicio/peso_muerto_rumano')
  await expect(page.getByRole('region', { name: 'Tus notas' })).toContainText('Agarre mixto')
  await page.goto('/entreno/sesion/b1')

  await opciones.click()
  await page.getByRole('button', { name: 'Discos' }).click()
  const hoja = page.getByRole('dialog', { name: 'Discos por lado' })
  await hoja.getByLabel('Peso total').fill('62,5')
  await expect(hoja).toContainText('Por lado: 20 + 1,25')
  await hoja.getByRole('button', { name: 'Cerrar' }).click()

  await opciones.click()
  await page.getByRole('button', { name: 'Cambiar', exact: true }).click()
  await page.getByRole('button', { name: 'Hiperextensión' }).click()
  await expect(page.getByRole('heading', { name: 'Hiperextensión' })).toBeVisible()
  // Sin vez anterior: los kilos salen vacíos
  await expect(page.getByLabel('Kilos de la serie 1')).toHaveAttribute('placeholder', '')
})

test('el cronómetro de serie cuenta y guarda el tiempo', async ({ page }) => {
  await page.goto('/entreno/sesion/b1')
  await page.getByRole('button', { name: 'Opciones de Peso muerto rumano' }).click()
  await page.getByRole('button', { name: 'Cronómetro' }).click()
  const crono = page.getByRole('dialog', { name: 'Cronómetro de la serie' })
  await expect(crono).toContainText('Serie 1 de 3')
  await crono.getByRole('button', { name: 'Empezar en 3' }).click()
  await expect(crono).toContainText('Prepárate')
  await expect(crono).toContainText('En marcha', { timeout: 5000 })
  await crono.getByRole('button', { name: 'Terminar' }).click()
  await expect(crono).toHaveCount(0)
  await expect(page.getByRole('status')).toContainText('Márcala como hecha')
})

test('terminar con series sin marcar pregunta y abre el resumen', async ({ page }) => {
  await page.goto('/entreno/sesion/b1')
  for (let n = 1; n <= 3; n++) await page.getByRole('button', { name: `Serie ${n} hecha` }).click()
  await page.getByRole('button', { name: 'Terminar' }).click()
  const hoja = page.getByRole('dialog', { name: '¿Terminar con tan poco?' })
  await expect(hoja).toContainText('Solo has hecho 3 de 17 series')
  await hoja.getByRole('button', { name: 'Terminar' }).click()

  await expect(page).toHaveURL('/entreno/sesion/b1/resumen')
  await expect(page.getByRole('heading', { name: 'B1 completada', level: 1 })).toBeVisible()
  await expect(page.getByText(/días de racha/)).toBeVisible()
  await expect(page.getByText('Series superadas')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Frente a la última vez' })).toBeVisible()

  await page.getByRole('button', { name: /Me faltó un ejercicio/ }).click()
  await expect(page).toHaveURL('/entreno/sesion/b1')
  await expect(page.getByText('B1 · 3 de 17 series')).toBeVisible()
})

test('«Esta sesión»: tiempo (pausar y contar desde ahora)', async ({ page }) => {
  await page.goto('/entreno/sesion/b1')
  await page.getByRole('button', { name: /^Esta sesión/ }).click()
  const hoja = page.getByRole('dialog', { name: 'Esta sesión' })
  await expect(hoja.getByRole('button', { name: /Consejos de hoy/ })).toBeEnabled()
  await expect(hoja.getByRole('button', { name: /Añadir un ejercicio/ })).toBeEnabled()

  await hoja.getByRole('button', { name: /Tiempo de la sesión/ }).click()
  await page
    .getByRole('dialog', { name: 'Tiempo de sesión' })
    .getByRole('button', { name: 'Pausar el tiempo' })
    .click()
  await expect(page.getByText('En pausa', { exact: true })).toBeVisible()

  await page.getByRole('button', { name: /^Esta sesión/ }).click()
  await hoja.getByRole('button', { name: /Tiempo de la sesión/ }).click()
  await page.getByRole('button', { name: 'Contar desde ahora' }).click()
  await expect(page.getByRole('button', { name: /^Tiempo de la sesión/ })).toHaveText(/^0:0\d$/)
  await expect(page.getByText('B1 · 0 de 17 series')).toBeVisible()
})

test('tocar el descanso lo cambia para ese ejercicio y el descanso usa el nuevo', async ({ page }) => {
  await page.goto('/entreno/sesion/b1')
  await page.getByRole('button', { name: /Descanso 3:00, cambiar/ }).click()
  const hoja = page.getByRole('dialog', { name: 'Descanso' })
  await expect(hoja).toContainText('Se guarda para Peso muerto rumano')
  await hoja.getByRole('button', { name: '1:30' }).click()
  await expect(page.getByRole('button', { name: /Descanso 1:30, cambiar/ })).toBeVisible()
  await page.getByRole('button', { name: 'Serie 1 hecha' }).click()
  await expect(page.getByRole('timer', { name: 'Descanso' })).toContainText('1:')
})

test('cambiar de sesión pregunta si hay series y vuelve a Tu plan', async ({ page }) => {
  await page.goto('/entreno/sesion/b1')
  await page.getByRole('button', { name: 'Serie 1 hecha' }).click()
  await page.getByRole('button', { name: /^Esta sesión/ }).click()
  await page.getByRole('button', { name: /Cambiar de sesión/ }).click()
  const hoja = page.getByRole('dialog', { name: '¿Cambiar de sesión?' })
  await expect(hoja).toContainText('Se borra la serie que apuntaste en esta.')
  await hoja.getByRole('button', { name: 'Cambiar' }).click()
  await expect(page).toHaveURL('/entreno')
})

test('descartar la sesión borra lo apuntado', async ({ page }) => {
  await page.goto('/entreno/sesion/b1')
  await page.getByRole('button', { name: 'Serie 1 hecha' }).click()
  await page.getByRole('button', { name: 'Descartar sesión' }).click()
  const hoja = page.getByRole('dialog', { name: '¿Descartar la sesión?' })
  await expect(hoja).toContainText('la rotación no avanza')
  await hoja.getByRole('button', { name: 'Descartar' }).click()
  await expect(page).toHaveURL('/entreno')
  // No queda una sesión vacía contando: al volver a empezar, el tiempo empieza de cero
  await page.waitForTimeout(2500)
  await page.getByRole('link', { name: 'Empezar B1' }).click()
  await expect(page.getByText('B1 · 0 de 17 series')).toBeVisible()
  await expect(page.getByRole('button', { name: /^Tiempo de la sesión/ })).toHaveText(/^0:0[01]$/)
})

test('«Añadir ejercicio» elige uno de la biblioteca y lo abre al final, solo para hoy', async ({ page }) => {
  await page.goto('/entreno/sesion/b1')
  await page.getByRole('button', { name: 'Añadir ejercicio' }).click()
  const hoja = page.getByRole('dialog', { name: 'Elegir ejercicio' })
  await hoja.getByRole('searchbox', { name: 'Buscar ejercicio' }).fill('hip thrust')
  await hoja.getByRole('button', { name: /^Hip thrust Glúteo/ }).click()
  await expect(hoja).toHaveCount(0)
  await expect(page.getByText('Hip thrust añadido, solo para hoy')).toBeVisible()
  // Abierto, el octavo, con 3 series y sin vez anterior
  await expect(page.getByRole('heading', { name: 'Hip thrust' })).toBeVisible()
  await expect(page.getByLabel('Kilos de la serie 3')).toBeVisible()
  await expect(page.getByLabel('Kilos de la serie 1')).toHaveAttribute('placeholder', '')
  await expect(page.getByText('B1 · 0 de 20 series')).toBeVisible()
})

test('desde «Esta sesión» también se añade un ejercicio', async ({ page }) => {
  await page.goto('/entreno/sesion/b1')
  await page.getByRole('button', { name: /^Esta sesión/ }).click()
  await page.getByRole('button', { name: /Añadir un ejercicio/ }).click()
  await page
    .getByRole('dialog', { name: 'Elegir ejercicio' })
    .getByRole('button', { name: /^Face pull/ })
    .click()
  await expect(page.getByRole('heading', { name: 'Face pull' })).toBeVisible()
})

test('«Cambiar ejercicio» deja elegir cualquiera de la biblioteca, filtrada por su músculo', async ({
  page,
}) => {
  await page.goto('/entreno/sesion/b1')
  await page.getByRole('button', { name: 'Opciones de Peso muerto rumano' }).click()
  await page.getByRole('button', { name: 'Cambiar', exact: true }).click()
  await page.getByRole('button', { name: 'Elegir cualquier ejercicio' }).click()
  const hoja = page.getByRole('dialog', { name: 'Elegir ejercicio' })
  await expect(hoja.getByRole('button', { name: 'Femoral', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await hoja.getByRole('button', { name: /^Curl femoral sentado/ }).click()
  await expect(page.getByRole('heading', { name: 'Curl femoral sentado' })).toBeVisible()
})

test('lo apuntado se guarda: sigue al recargar y, al terminar, el entreno queda y toca la siguiente', async ({
  page,
}) => {
  await page.goto('/entreno/sesion/b1')
  await page.getByRole('button', { name: 'Serie 1 hecha' }).click()
  await page.reload()
  await expect(page.getByLabel('Kilos de la serie 1')).toHaveValue('60')
  await expect(page.getByText('B1 · 1 de 17 series')).toBeVisible()

  await page.getByRole('button', { name: 'Terminar' }).click()
  await page
    .getByRole('dialog', { name: '¿Terminar con tan poco?' })
    .getByRole('button', { name: 'Terminar' })
    .click()
  await expect(page).toHaveURL('/entreno/sesion/b1/resumen')
  // «Me faltó un ejercicio» deshace el guardado: B1 sigue tocando
  await page.getByRole('button', { name: /Me faltó un ejercicio/ }).click()
  await page.goto('/entreno')
  await expect(page.getByRole('link', { name: 'Empezar B1' })).toBeVisible()

  await page.goto('/entreno/sesion/b1')
  await page.getByRole('button', { name: 'Terminar' }).click()
  await page
    .getByRole('dialog', { name: '¿Terminar con tan poco?' })
    .getByRole('button', { name: 'Terminar' })
    .click()
  await page.getByRole('button', { name: 'Hecho' }).click()
  await expect(page).toHaveURL('/entreno')
  await page.reload()
  await expect(page.getByRole('link', { name: 'Empezar A2' })).toBeVisible()
  // La próxima B1 tiene como «vez anterior» lo de hoy: 60 × 10 en la serie 1
  await page.goto('/entreno/rutina/b1')
  await page.getByRole('button', { name: /Peso muerto rumano/ }).click()
  await expect(page.getByText('60 × 10')).toBeVisible()
})

test('«Cambiar ejercicio» propone los que hacen lo mismo y, en tu plan, lo cambia para las próximas veces', async ({
  page,
}) => {
  await page.goto('/entreno/sesion/b1')
  await page.getByRole('button', { name: 'Opciones de Peso muerto rumano' }).click()
  await page.getByRole('button', { name: 'Cambiar', exact: true }).click()
  const hoja = page.getByRole('dialog', { name: 'Cambiar ejercicio' })
  // El rumano trabaja el femoral estirado (bisagra): los que se proponen, también
  await expect(hoja.getByRole('heading', { name: 'Hacen lo mismo' })).toBeVisible()
  const piernasRigidas = hoja.getByRole('button', { name: /^Peso muerto piernas rígidas/ })
  await expect(piernasRigidas).toContainText('Femoral · estirado (bisagras)')
  await expect(hoja.getByRole('button', { name: /^Curl femoral/ })).toHaveCount(0)

  await hoja.getByText('En mi plan').click()
  await piernasRigidas.click()
  await expect(page.getByText('Cambiado por Peso muerto piernas rígidas en tu plan')).toBeVisible()

  // Las próximas veces, con la pauta de la rutina, y se puede volver al de la rutina
  await page.goto('/entreno/rutina/b1')
  const fila = page.getByRole('button', { name: /^Peso muerto piernas rígidas/ })
  await expect(fila).toContainText('3 series · 6–10 reps · a 2 del fallo')
  await expect(fila).toContainText('En lugar de Peso muerto rumano (cambiado en tu plan)')
  await page.reload()
  await expect(page.getByRole('button', { name: /^Peso muerto piernas rígidas/ })).toBeVisible()

  await page.goto('/entreno/sesion/b1')
  await page.getByRole('button', { name: 'Descartar sesión' }).click()
  await page
    .getByRole('dialog')
    .getByRole('button', { name: /Descartar/ })
    .last()
    .click()
  await page.goto('/entreno/sesion/b1')
  await page.getByRole('button', { name: 'Opciones de Peso muerto piernas rígidas' }).click()
  await page.getByRole('button', { name: 'Cambiar', exact: true }).click()
  await page.getByRole('dialog', { name: 'Cambiar ejercicio' }).getByText('En mi plan').click()
  await page.getByRole('button', { name: /^Volver a Peso muerto rumano/ }).click()
  await expect(page.getByText('Vuelves a Peso muerto rumano en tu plan')).toBeVisible()
  await page.goto('/entreno/rutina/b1')
  await expect(page.getByRole('button', { name: /^Peso muerto rumano/ })).not.toContainText('En lugar de')
})
