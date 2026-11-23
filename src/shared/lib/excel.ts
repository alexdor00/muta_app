// Un Excel (.xlsx) sencillo y cuidado, sin librerías: una hoja con título, secciones en franja oscura y filas con línea
// fina debajo. El .xlsx es un ZIP de XML; aquí se escribe sin comprimir (pesa poco: una lista de la compra).

/** Una fila del Excel: el título, la línea de debajo, una sección (franja oscura), una fila normal o una vacía. */
export type FilaExcel = {
  tipo: 'titulo' | 'subtitulo' | 'seccion' | 'fila' | 'vacia'
  /** Las celdas de izquierda a derecha (título, subtítulo y sección usan solo la primera, a todo el ancho). */
  celdas: readonly string[]
}

/** El tipo de archivo de un .xlsx. */
export const TIPO_EXCEL = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

const TABLA_CRC = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})

/** El CRC-32 de unos bytes (el que pide el ZIP). */
export function crc32(datos: Uint8Array): number {
  let c = 0xffffffff
  for (const b of datos) c = TABLA_CRC[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

/** Un ZIP sin comprimir con estos archivos (nombre → contenido). */
export function zipSinComprimir(archivos: readonly [string, Uint8Array][]): Uint8Array<ArrayBuffer> {
  const cod = new TextEncoder()
  const partes: Uint8Array[] = []
  const central: Uint8Array[] = []
  let desplazamiento = 0
  for (const [nombre, datos] of archivos) {
    const n = cod.encode(nombre)
    const crc = crc32(datos)
    const local = new DataView(new ArrayBuffer(30))
    local.setUint32(0, 0x04034b50, true)
    local.setUint16(4, 20, true)
    local.setUint16(6, 0x0800, true) // nombres en UTF-8
    local.setUint32(14, crc, true)
    local.setUint32(18, datos.length, true)
    local.setUint32(22, datos.length, true)
    local.setUint16(26, n.length, true)
    const cab = new DataView(new ArrayBuffer(46))
    cab.setUint32(0, 0x02014b50, true)
    cab.setUint16(4, 20, true)
    cab.setUint16(6, 20, true)
    cab.setUint16(8, 0x0800, true)
    cab.setUint32(16, crc, true)
    cab.setUint32(20, datos.length, true)
    cab.setUint32(24, datos.length, true)
    cab.setUint16(28, n.length, true)
    cab.setUint32(42, desplazamiento, true)
    partes.push(new Uint8Array(local.buffer), n, datos)
    central.push(new Uint8Array(cab.buffer), n)
    desplazamiento += 30 + n.length + datos.length
  }
  const tamCentral = central.reduce((s, x) => s + x.length, 0)
  const fin = new DataView(new ArrayBuffer(22))
  fin.setUint32(0, 0x06054b50, true)
  fin.setUint16(8, archivos.length, true)
  fin.setUint16(10, archivos.length, true)
  fin.setUint32(12, tamCentral, true)
  fin.setUint32(16, desplazamiento, true)
  const todo = [...partes, ...central, new Uint8Array(fin.buffer)]
  const salida = new Uint8Array(todo.reduce((s, x) => s + x.length, 0))
  let i = 0
  for (const x of todo) {
    salida.set(x, i)
    i += x.length
  }
  return salida
}

const xml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const columna = (i: number) => String.fromCharCode(65 + i)

// Estilos (índice en cellXfs): 1 título, 2 subtítulo, 3 sección, 4 texto, 5 cifra, 6 nota en gris, 7 casilla
const ESTILOS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<fonts count="5">
<font><sz val="11"/><color rgb="FF111113"/><name val="Calibri"/></font>
<font><b/><sz val="18"/><color rgb="FF111113"/><name val="Calibri"/></font>
<font><sz val="11"/><color rgb="FF6E6E73"/><name val="Calibri"/></font>
<font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>
<font><b/><sz val="11"/><color rgb="FF111113"/><name val="Calibri"/></font>
</fonts>
<fills count="3">
<fill><patternFill patternType="none"/></fill>
<fill><patternFill patternType="gray125"/></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FF111113"/></patternFill></fill>
</fills>
<borders count="2">
<border><left/><right/><top/><bottom/><diagonal/></border>
<border><left/><right/><top/><bottom style="thin"><color rgb="FFE5E5EA"/></bottom><diagonal/></border>
</borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="8">
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>
<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/>
<xf numFmtId="0" fontId="3" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment vertical="center" indent="1"/></xf>
<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment vertical="center"/></xf>
<xf numFmtId="0" fontId="4" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>
<xf numFmtId="0" fontId="2" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment vertical="center" indent="1"/></xf>
<xf numFmtId="0" fontId="2" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
</cellXfs>
</styleSheet>`

/** El estilo de cada celda de una fila normal: casilla, texto, cifra y nota. */
const ESTILO_FILA = [7, 4, 5, 6]

function hoja(anchos: readonly number[], filas: readonly FilaExcel[]): string {
  const ultima = columna(anchos.length - 1)
  const unidas: string[] = []
  const xmlFilas = filas.map((f, i) => {
    const r = i + 1
    const alto =
      f.tipo === 'titulo'
        ? ' ht="30" customHeight="1"'
        : f.tipo === 'vacia'
          ? ''
          : ' ht="22" customHeight="1"'
    if (f.tipo === 'vacia') return `<row r="${r}"/>`
    if (f.tipo !== 'fila') {
      unidas.push(`A${r}:${ultima}${r}`)
      const s = f.tipo === 'titulo' ? 1 : f.tipo === 'subtitulo' ? 2 : 3
      // La franja de la sección pinta todas sus celdas
      const resto = anchos
        .slice(1)
        .map((_, k) => `<c r="${columna(k + 1)}${r}" s="${s}"/>`)
        .join('')
      return `<row r="${r}"${alto}><c r="A${r}" s="${s}" t="inlineStr"><is><t xml:space="preserve">${xml(f.celdas[0] ?? '')}</t></is></c>${resto}</row>`
    }
    const celdas = anchos
      .map(
        (_, k) =>
          `<c r="${columna(k)}${r}" s="${ESTILO_FILA[k] ?? 4}" t="inlineStr"><is><t xml:space="preserve">${xml(f.celdas[k] ?? '')}</t></is></c>`,
      )
      .join('')
    return `<row r="${r}"${alto}>${celdas}</row>`
  })
  const cols = anchos
    .map((w, k) => `<col min="${k + 1}" max="${k + 1}" width="${w}" customWidth="1"/>`)
    .join('')
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheetViews><sheetView workbookViewId="0" showGridLines="0"/></sheetViews>
<sheetFormatPr defaultRowHeight="18"/>
<cols>${cols}</cols>
<sheetData>${xmlFilas.join('')}</sheetData>
${unidas.length ? `<mergeCells count="${unidas.length}">${unidas.map((u) => `<mergeCell ref="${u}"/>`).join('')}</mergeCells>` : ''}
<pageMargins left="0.5" right="0.5" top="0.6" bottom="0.6" header="0.3" footer="0.3"/>
<pageSetup paperSize="9" orientation="portrait" fitToWidth="1" fitToHeight="0"/>
</worksheet>`
}

/**
 * Un libro de Excel con una hoja: `anchos`, el ancho de cada columna (en caracteres); `filas`, de arriba abajo. Las filas
 * normales llevan casilla (gris, centrada), texto, cifra (en negrita, a la derecha) y nota (en gris).
 */
export function libroExcel(
  nombreHoja: string,
  anchos: readonly number[],
  filas: readonly FilaExcel[],
): Uint8Array<ArrayBuffer> {
  const cod = new TextEncoder()
  const nombre = xml(nombreHoja.slice(0, 31))
  const archivos: [string, string][] = [
    [
      '[Content_Types].xml',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`,
    ],
    [
      '_rels/.rels',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
    ],
    [
      'xl/workbook.xml',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${nombre}" sheetId="1" r:id="rId1"/></sheets></workbook>`,
    ],
    [
      'xl/_rels/workbook.xml.rels',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
    ],
    ['xl/styles.xml', ESTILOS],
    ['xl/worksheets/sheet1.xml', hoja(anchos, filas)],
  ]
  return zipSinComprimir(archivos.map(([n, t]) => [n, cod.encode(t)]))
}
