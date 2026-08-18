import PDFDocument from 'pdfkit';
import prisma from '../config/prisma.config.ts'
 // ajusta al path real de tu proyecto

// ─────────────────────────────────────────────────────────
// CONSTANTES
// ─────────────────────────────────────────────────────────

// Guatemala cae principalmente en las zonas UTM 15N y 16N.
// Ajusta este SRID a la zona que cubra tu área de trabajo:
//   32615 -> UTM 15N (occidente del país)
//   32616 -> UTM 16N (centro/oriente del país)
const SRID_UTM = 32616;

const PT_TO_M = 0.0254 / 72; // metros por cada punto de PDF (1 pt = 1/72 in)

const AZUL = '#1c3f6e';
const AZUL_CLARO = '#e8edf5';
const GRIS_BORDE = '#b9c2cf';

// ─────────────────────────────────────────────────────────
// CONTROLADOR PRINCIPAL
// ─────────────────────────────────────────────────────────
export const generarCertificacionCatastral = async (req, res) => {
  try {
    const { inmueble_id } = req.params;

    const inmuebleId = parseInt(inmueble_id, 10);
    if (Number.isNaN(inmuebleId)) {
      return res.status(400).json({ error: 'ID de inmueble inválido' });
    }

    const inmueble = await prisma.inmueble.findFirst({
      where: { id: inmuebleId, deleted_at: null },
      // omit: coordenadas/poligono están tipadas como String en el schema pero
      // la columna real en Postgres es GEOGRAPHY -> si Prisma intenta leerlas
      // directo, devuelve datos binarios ilegibles o falla. Las leemos aparte
      // más abajo con $queryRaw + ST_AsGeoJSON, que sí las decodifica bien.
      omit: {
        coordenadas: true,
        poligono: true
      },
      include: {
        propietario: true,
        municipio: { include: { departamento: true } },
        zona: true,
        via: { include: { tipo_via: true } }
      }
    });

    if (!inmueble) {
      return res.status(404).json({ error: 'Inmueble no encontrado' });
    }

    // Traemos el polígono YA PROYECTADO a metros (no en lat/lng) para
    // que la forma dibujada respete las proporciones reales del terreno.
    const geoResult = await prisma.$queryRaw`
      SELECT
        ST_AsGeoJSON(ST_Transform(poligono, ${SRID_UTM}::integer))::json AS poligono_utm,
        ST_Area(ST_Transform(poligono, ${SRID_UTM}::integer))             AS area_m2
      FROM inmuebles
      WHERE id = ${inmueble.id}
    `;

    const row = geoResult[0];

    if (!row?.poligono_utm) {
      return res.status(400).json({
        error: 'El inmueble no tiene un polígono geográfico registrado'
      });
    }

    // GeoJSON Polygon -> coordinates[0] es el anillo exterior [[x,y], [x,y], ...]
    // (Si en algún caso guardas MultiPolygon, usa row.poligono_utm.coordinates[0][0])
    const poligonoObj =
      typeof row.poligono_utm === 'string' ? JSON.parse(row.poligono_utm) : row.poligono_utm;
    const anillo = poligonoObj.coordinates[0];
    const areaM2 = Number(row.area_m2);

    // ─── Generar PDF ───────────────────────────────────
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=certificacion-${inmueble.codigo_catastral}.pdf`
    );
    doc.pipe(res);

    dibujarEncabezado(doc, inmueble);
    dibujarDatosDescriptivos(doc, inmueble, areaM2);
    dibujarTitularidad(doc, inmueble);
    dibujarDatosRegistrales(doc, inmueble);
    dibujarParcelaCatastral(doc, anillo, areaM2);
    dibujarPie(doc);

    doc.end();
  } catch (error) {
    console.error('❌ Error al generar certificación catastral:', error);
    res.status(500).json({ error: error.message });
  }
};

// ─────────────────────────────────────────────────────────
// SECCIÓN: ENCABEZADO INSTITUCIONAL
// ─────────────────────────────────────────────────────────
function dibujarEncabezado(doc, inmueble) {
  const nombreMunicipio = inmueble.municipio?.nombre
    ? `MUNICIPALIDAD DE ${inmueble.municipio.nombre.toUpperCase()}`
    : 'MUNICIPALIDAD';

  const x = 40;
  const y = 40;
  const altoCaja = 55;

  // Caja institucional (izquierda) — estilo similar al recuadro azul del
  // ejemplo oficial (GOBIERNO / MINISTERIO). Aquí va el municipio, calculado
  // dinámicamente desde inmueble.municipio.nombre, no fijo en el código.
  doc.rect(x, y, 175, altoCaja).fill(AZUL);
  doc
    .fillColor('white')
    .font('Helvetica-Bold')
    .fontSize(11)
    .text(nombreMunicipio, x + 10, y + 12, { width: 155 });
  doc
    .font('Helvetica')
    .fontSize(8)
    .text('DIRECCIÓN DE CATASTRO MUNICIPAL', x + 10, y + altoCaja - 20, { width: 155 });

  // Título (derecha)
  doc
    .fillColor(AZUL)
    .font('Helvetica-Bold')
    .fontSize(15)
    .text('CERTIFICACIÓN CATASTRAL', x + 190, y + 4, { width: 325, align: 'right' })
    .fontSize(15)
    .text('DESCRIPTIVA Y GRÁFICA', x + 190, y + 22, { width: 325, align: 'right' });

  doc
    .fillColor('black')
    .font('Helvetica')
    .fontSize(9)
    .text(`Referencia catastral: ${inmueble.codigo_catastral}`, x + 190, y + altoCaja - 14, {
      width: 325,
      align: 'right'
    });

  // Línea separadora
  doc
    .moveTo(x, y + altoCaja + 10)
    .lineTo(x + 515, y + altoCaja + 10)
    .strokeColor(AZUL)
    .lineWidth(1.2)
    .stroke();

  doc.y = y + altoCaja + 20;
  doc.lineWidth(1);
}

// ─────────────────────────────────────────────────────────
// SECCIÓN: DATOS DESCRIPTIVOS (texto libre + panel de valores)
// ─────────────────────────────────────────────────────────
function dibujarDatosDescriptivos(doc, inmueble, areaM2) {
  tituloSeccion(doc, 'DATOS DESCRIPTIVOS DEL INMUEBLE');
  doc.moveDown(0.3);

  const yInicio = doc.y;
  const anchoIzq = 330; // columna de texto libre
  const anchoPanel = 165; // panel de valores a la derecha
  const xPanel = 40 + anchoIzq + 20;

  const areaFmt = (v) => (v != null ? `${Number(v).toFixed(2)} m²` : 'N/A');
  const moneyFmt = (v) => (v != null ? `Q${Number(v).toFixed(2)}` : 'N/A');

  const via = inmueble.via
    ? `${inmueble.via.tipo_via?.nombre || ''} ${inmueble.via.numero || ''}${
        inmueble.via.nombre ? ' - ' + inmueble.via.nombre : ''
      }`.trim()
    : null;

  const zona = inmueble.zona
    ? `Zona ${inmueble.zona.numero}${inmueble.zona.nombre ? ' - ' + inmueble.zona.nombre : ''}`
    : null;

  const localizacion = [via, zona, inmueble.colonia, inmueble.municipio?.nombre]
    .filter(Boolean)
    .join(', ') || inmueble.direccion_completa || 'N/A';

  // ── Columna izquierda: texto libre (como "Localización / Clase / Uso") ──
  doc.fontSize(9);
  campo(doc, 'Localización:', localizacion, 45, anchoIzq);
  campo(doc, 'Dirección completa:', inmueble.direccion_completa || 'N/A', 45, anchoIzq);
  campo(doc, 'Referencia:', inmueble.referencia || 'N/A', 45, anchoIzq);
  campo(doc, 'Clase:', inmueble.tipo || 'N/A', 45, anchoIzq);
  campo(doc, 'Uso principal:', inmueble.uso || 'N/A', 45, anchoIzq);
  campo(doc, 'Estado:', inmueble.estado || 'N/A', 45, anchoIzq);

  const yFinIzquierda = doc.y;

  // ── Panel derecho: valores destacados (como el recuadro celeste del ejemplo) ──
  const filasPanel = [
    ['Valor inscrito:', moneyFmt(inmueble.valor_inscrito)],
    ['Área registrada:', areaFmt(inmueble.area_registrada)],
    ['Área real:', areaFmt(inmueble.area_real)],
    ['Área catastral:', areaFmt(inmueble.area_m2)],
    ['Superficie gráfica:', areaFmt(areaM2)]
  ];

  const altoPanel = 16 * filasPanel.length + 12;
  doc.rect(xPanel, yInicio, anchoPanel, altoPanel).fillAndStroke(AZUL_CLARO, GRIS_BORDE);

  let yPanel = yInicio + 8;
  filasPanel.forEach(([label, valor]) => {
    doc
      .fillColor(AZUL)
      .font('Helvetica-Bold')
      .fontSize(7.5)
      .text(label, xPanel + 8, yPanel, { width: anchoPanel - 16 });
    doc
      .fillColor('black')
      .font('Helvetica-Bold')
      .fontSize(8.5)
      .text(valor, xPanel + 8, yPanel + 9, { width: anchoPanel - 16 });
    yPanel += 16;
  });

  // El cursor baja hasta lo más largo entre las dos columnas
  doc.y = Math.max(yFinIzquierda, yInicio + altoPanel) + 12;
  doc.fillColor('black').font('Helvetica');
}

// Escribe una etiqueta en negrita seguida del valor, dejando que pdfkit
// calcule la altura real (evita el bug de sobreposición de versiones previas).
function campo(doc, label, valor, x, ancho) {
  doc
    .font('Helvetica-Bold')
    .fillColor('black')
    .text(label, x, doc.y, { continued: true, width: ancho })
    .font('Helvetica')
    .text(` ${valor}`, { width: ancho });
  doc.moveDown(0.25);
}

// ─────────────────────────────────────────────────────────
// SECCIÓN: TITULARIDAD (tabla)
// ─────────────────────────────────────────────────────────
function dibujarTitularidad(doc, inmueble) {
  tituloSeccion(doc, 'TITULARIDAD');
  doc.moveDown(0.3);

  const columnas = [
    { label: 'Propietario', key: 'propietario', width: 175 },
    { label: 'Zona', key: 'zona', width: 90 },
    { label: 'Vía', key: 'via', width: 130 },
    { label: 'Colonia', key: 'colonia', width: 120 }
  ];

  const via = inmueble.via
    ? `${inmueble.via.tipo_via?.nombre || ''} ${inmueble.via.numero || ''}`.trim()
    : 'N/A';

  const fila = {
    propietario: inmueble.propietario?.nombre || 'N/A',
    zona: inmueble.zona ? `Zona ${inmueble.zona.numero}` : 'N/A',
    via,
    colonia: inmueble.colonia || 'N/A'
  };

  dibujarTabla(doc, 40, doc.y, columnas, fila);
}

// ─────────────────────────────────────────────────────────
// SECCIÓN: DATOS REGISTRALES (tabla)
// ─────────────────────────────────────────────────────────
function dibujarDatosRegistrales(doc, inmueble) {
  tituloSeccion(doc, 'DATOS REGISTRALES');
  doc.moveDown(0.3);

  const columnas = [
    { label: 'Finca', key: 'finca', width: 100 },
    { label: 'Folio', key: 'folio', width: 90 },
    { label: 'Libro', key: 'libro', width: 90 },
    { label: 'Depto. de registro', key: 'depto', width: 135 },
    { label: 'No. inscripción IUSI', key: 'iusi', width: 100 }
  ];

  const fila = {
    finca: inmueble.finca || 'N/A',
    folio: inmueble.folio || 'N/A',
    libro: inmueble.libro || 'N/A',
    depto: inmueble.departamento_registro || 'N/A',
    iusi: inmueble.no_inscripcion_iusi || 'N/A'
  };

  dibujarTabla(doc, 40, doc.y, columnas, fila);
}

// ─────────────────────────────────────────────────────────
// UTILIDAD: dibuja una tabla de una fila con encabezado (columnas dinámicas)
// La altura de la fila se calcula según el texto más largo, para no
// repetir el bug de sobreposición por altura fija.
// ─────────────────────────────────────────────────────────
function dibujarTabla(doc, x, y, columnas, fila) {
  const anchoTotal = columnas.reduce((sum, c) => sum + c.width, 0);
  const altoHeader = 18;

  // ── Encabezado ──
  doc.rect(x, y, anchoTotal, altoHeader).fillAndStroke(AZUL, AZUL);
  let cx = x;
  doc.fillColor('white').font('Helvetica-Bold').fontSize(7.5);
  columnas.forEach((col) => {
    doc.text(col.label, cx + 5, y + 5, { width: col.width - 10 });
    cx += col.width;
  });

  // ── Fila de datos: altura dinámica según el contenido más largo ──
  doc.font('Helvetica').fontSize(8);
  const alturas = columnas.map((col) =>
    doc.heightOfString(String(fila[col.key] ?? 'N/A'), { width: col.width - 10 })
  );
  const altoFila = Math.max(...alturas, 12) + 10;

  const yFila = y + altoHeader;
  doc.rect(x, yFila, anchoTotal, altoFila).fillAndStroke('white', GRIS_BORDE);

  cx = x;
  doc.fillColor('black');
  columnas.forEach((col) => {
    doc.text(String(fila[col.key] ?? 'N/A'), cx + 5, yFila + 5, { width: col.width - 10 });
    if (cx > x) {
      doc
        .moveTo(cx, y)
        .lineTo(cx, yFila + altoFila)
        .strokeColor(GRIS_BORDE)
        .stroke();
    }
    cx += col.width;
  });

  doc.y = yFila + altoFila + 12;
  doc.fillColor('black').font('Helvetica');
}

// ─────────────────────────────────────────────────────────
// SECCIÓN: PARCELA CATASTRAL (el plano)
// ─────────────────────────────────────────────────────────
function dibujarParcelaCatastral(doc, anillo, areaM2) {
  const alturaNecesaria = 350;
  if (doc.y + alturaNecesaria > doc.page.height - doc.page.margins.bottom) {
    doc.addPage();
  }

  tituloSeccion(doc, 'PARCELA CATASTRAL');

  // Línea de superficie justo debajo del título, como en el certificado oficial
  doc
    .fontSize(8.5)
    .font('Helvetica-Bold')
    .fillColor(AZUL)
    .text(`Superficie gráfica: ${areaM2.toFixed(2)} m²`, 45, doc.y + 2);
  doc.fillColor('black').font('Helvetica');
  doc.moveDown(0.6);

  const areaDibujo = {
    x: 40,
    y: doc.y,
    width: 515,
    height: 290,
    padding: 30
  };

  doc.rect(areaDibujo.x, areaDibujo.y, areaDibujo.width, areaDibujo.height).stroke('#999');

  const { puntos, escalaPtPorMetro } = proyectarAnillo(anillo, areaDibujo);

  doc.save();
  doc.moveTo(...puntos[0]);
  for (let i = 1; i < puntos.length; i++) doc.lineTo(...puntos[i]);
  doc.closePath();
  doc.fillOpacity(0.45).fillAndStroke('#8fce8f', '#2d6a2d');
  doc.restore();

  doc.fillColor('#2d6a2d');
  puntos.forEach(([px, py]) => doc.circle(px, py, 1.3).fill());
  doc.fillColor('black');

  dibujarNorte(doc, areaDibujo.x + areaDibujo.width - 30, areaDibujo.y + 20);

  const escalaDenominador = Math.round(1 / (escalaPtPorMetro * PT_TO_M));
  doc
    .fontSize(8)
    .fillColor('black')
    .text(
      `Escala aprox. 1:${escalaDenominador}`,
      areaDibujo.x + areaDibujo.width - 150,
      areaDibujo.y + areaDibujo.height - 14,
      { width: 145, align: 'right' }
    );

  doc.y = areaDibujo.y + areaDibujo.height + 15;
}

// ─────────────────────────────────────────────────────────
// UTILIDAD: proyecta el anillo (en metros, UTM) al espacio del PDF
// manteniendo la proporción real (sin deformar la geometría)
// ─────────────────────────────────────────────────────────
function proyectarAnillo(anillo, areaDibujo) {
  const xs = anillo.map((p) => p[0]);
  const ys = anillo.map((p) => p[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const anchoReal = maxX - minX || 1;
  const altoReal = maxY - minY || 1;

  const { x: ax, y: ay, width: aw, height: ah, padding } = areaDibujo;
  const anchoDisponible = aw - padding * 2;
  const altoDisponible = ah - padding * 2;

  const escalaPtPorMetro = Math.min(anchoDisponible / anchoReal, altoDisponible / altoReal);

  const anchoFinal = anchoReal * escalaPtPorMetro;
  const altoFinal = altoReal * escalaPtPorMetro;
  const offsetX = ax + padding + (anchoDisponible - anchoFinal) / 2;
  const offsetY = ay + padding + (altoDisponible - altoFinal) / 2;

  const puntos = anillo.map(([x, y]) => {
    const px = offsetX + (x - minX) * escalaPtPorMetro;
    const py = offsetY + (altoFinal - (y - minY) * escalaPtPorMetro);
    return [px, py];
  });

  return { puntos, escalaPtPorMetro, minX, minY, maxX, maxY };
}

// ─────────────────────────────────────────────────────────
// PIE DE PÁGINA
// ─────────────────────────────────────────────────────────
function dibujarPie(doc) {
  doc.moveDown(1);
  doc
    .fontSize(7.5)
    .fillColor('#777')
    .text(
      'Este certificado refleja los datos incorporados en el sistema de Catastro Municipal. Solo podrá utilizarse para el ejercicio de las competencias del solicitante.',
      45,
      doc.y,
      { width: 470 }
    )
    .text(`Fecha de emisión: ${new Date().toLocaleDateString()}`, 45, doc.y + 4);
  doc.fillColor('black');
}

// ─────────────────────────────────────────────────────────
// UTILIDADES DE ESTILO
// ─────────────────────────────────────────────────────────
function tituloSeccion(doc, texto) {
  const y = doc.y;
  doc.rect(40, y, 515, 18).fill(AZUL);
  doc
    .fillColor('white')
    .fontSize(10)
    .font('Helvetica-Bold')
    .text(texto, 45, y + 4); // +4 centra verticalmente el texto dentro de la barra de 18pt
  doc.fillColor('black').font('Helvetica');
  doc.y = y + 18;
  doc.moveDown(0.5);
}

function dibujarNorte(doc, x, y) {
  doc.save();
  doc.moveTo(x, y + 15).lineTo(x, y - 5).stroke();
  doc.moveTo(x, y - 5).lineTo(x - 3, y).stroke();
  doc.moveTo(x, y - 5).lineTo(x + 3, y).stroke();
  doc.fontSize(7).text('N', x - 3, y - 15);
  doc.restore();
}