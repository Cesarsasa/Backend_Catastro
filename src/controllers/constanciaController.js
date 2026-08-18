import PDFDocument from 'pdfkit';
import prisma from '../config/prisma.config.ts';

const AZUL = '#1c3f6e';
const AZUL_CLARO = '#e8edf5';
const VERDE_VIGENCIA = '#e6f4ea';
const VERDE_BORDE = '#3f8a4f';
const GRIS_BORDE = '#b9c2cf';

// ─────────────────────────────────────────────────────────
// CONTROLADOR PRINCIPAL
// ─────────────────────────────────────────────────────────
export const generarConstanciaPago = async (req, res) => {
  try {
    const pagoId = parseInt(req.params.pago_id, 10);
    if (Number.isNaN(pagoId)) {
      return res.status(400).json({ error: 'ID de pago inválido' });
    }

    const pago = await prisma.pago.findUnique({
      where: { id: pagoId },
      include: {
        inmueble: {
          omit: { coordenadas: true, poligono: true },
          include: { propietario: true, municipio: true }
        }
      }
    });

    if (!pago) {
      return res.status(404).json({ error: 'Pago no encontrado' });
    }

    const inmueble = pago.inmueble;

    // ─── Crear PDF ───────────────────────────────────────
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=constancia-${inmueble.codigo_catastral}.pdf`
    );
    doc.pipe(res);

    marcoDocumento(doc);
    dibujarEncabezado(doc, inmueble, pago);
    dibujarDatosInmueble(doc, inmueble);
    dibujarDetallePago(doc, pago);
    dibujarVigencia(doc, pago);
    dibujarPie(doc);

    doc.end();
  } catch (error) {
    console.error('❌ Error al generar constancia:', error);
    res.status(500).json({ error: error.message });
  }
};

// ─────────────────────────────────────────────────────────
// MARCO GENERAL DEL DOCUMENTO
// ─────────────────────────────────────────────────────────
function marcoDocumento(doc) {
  doc
    .rect(20, 20, doc.page.width - 40, doc.page.height - 40)
    .strokeColor(GRIS_BORDE)
    .lineWidth(1)
    .stroke();
}

// ─────────────────────────────────────────────────────────
// SECCIÓN: ENCABEZADO INSTITUCIONAL
// ─────────────────────────────────────────────────────────
function dibujarEncabezado(doc, inmueble, pago) {
  const nombreMunicipio = inmueble.municipio?.nombre
    ? `MUNICIPALIDAD DE ${inmueble.municipio.nombre.toUpperCase()}`
    : 'MUNICIPALIDAD';

  const x = 40;
  const y = 40;
  const altoCaja = 55;

  doc.rect(x, y, 175, altoCaja).fill(AZUL);
  doc
    .fillColor('white')
    .font('Helvetica-Bold')
    .fontSize(11)
    .text(nombreMunicipio, x + 10, y + 12, { width: 155 });
  doc
    .font('Helvetica')
    .fontSize(8)
    .text('TESORERÍA MUNICIPAL', x + 10, y + altoCaja - 20, { width: 155 });

  doc
    .fillColor(AZUL)
    .font('Helvetica-Bold')
    .fontSize(15)
    .text('CONSTANCIA DE PAGO', x + 190, y + 4, { width: 325, align: 'right' })
    .fontSize(15)
    .text('DE BIENES INMUEBLES', x + 190, y + 22, { width: 325, align: 'right' });

  doc
    .fillColor('black')
    .font('Helvetica')
    .fontSize(9)
    .text(`Pago No. ${pago.id} · Año ${pago.anio}`, x + 190, y + altoCaja - 14, {
      width: 325,
      align: 'right'
    });

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
// SECCIÓN: DATOS DEL INMUEBLE
// ─────────────────────────────────────────────────────────
function dibujarDatosInmueble(doc, inmueble) {
  tituloSeccion(doc, 'DATOS DEL INMUEBLE');
  doc.moveDown(0.3);

  doc.fontSize(9);
  campo(doc, 'Código catastral:', inmueble.codigo_catastral || 'N/A');
  campo(doc, 'Propietario:', inmueble.propietario?.nombre || 'N/A');
  campo(doc, 'Dirección:', inmueble.direccion_completa || 'N/A');
  campo(doc, 'Municipio:', inmueble.municipio?.nombre || 'N/A');

  doc.moveDown(0.5);
}

// ─────────────────────────────────────────────────────────
// SECCIÓN: DETALLE DEL PAGO (tabla + fila de recibo aparte)
// ─────────────────────────────────────────────────────────
function dibujarDetallePago(doc, pago) {
  tituloSeccion(doc, 'DETALLE DEL PAGO');
  doc.moveDown(0.3);

  const columnas = [
    { label: 'Monto pagado', key: 'monto', width: 130 },
    { label: 'Fecha de pago', key: 'fecha', width: 130 },
    { label: 'Método de pago', key: 'metodo', width: 130 },
    { label: 'Trimestre', key: 'trimestre', width: 125 }
  ];

  const fila = {
    monto: `Q${Number(pago.monto).toFixed(2)}`,
    fecha: pago.fecha_pago ? new Date(pago.fecha_pago).toLocaleDateString() : 'N/A',
    metodo: pago.metodo_pago || 'N/A',
    trimestre: pago.trimestre != null ? String(pago.trimestre) : 'N/A'
  };

  dibujarTabla(doc, 40, doc.y, columnas, fila);

  // El número de recibo va aparte porque puede ser largo (ej. un id de
  // pasarela de pago como Stripe) y necesita poder envolver sin desalinear
  // el resto de la tabla.
  doc.fontSize(9);
  campo(doc, 'Número de recibo:', pago.num_recibo || 'N/A');

  doc.moveDown(0.5);
}

// ─────────────────────────────────────────────────────────
// SECCIÓN: VIGENCIA (panel destacado)
// ─────────────────────────────────────────────────────────
function dibujarVigencia(doc, pago) {
  const vigencia = new Date(pago.fecha_pago);
  vigencia.setFullYear(vigencia.getFullYear() + 1);

  const x = 40;
  const y = doc.y;
  const ancho = 515;
  const alto = 34;

  doc.rect(x, y, ancho, alto).fillAndStroke(VERDE_VIGENCIA, VERDE_BORDE);
  doc
    .fillColor('#2d6a2d')
    .font('Helvetica-Bold')
    .fontSize(11)
    .text(`Vigencia hasta: ${vigencia.toLocaleDateString()}`, x + 15, y + 10);

  doc.fillColor('black').font('Helvetica');
  doc.y = y + alto + 15;
}

// ─────────────────────────────────────────────────────────
// UTILIDAD: dibuja una tabla de una fila con encabezado (columnas dinámicas)
// La altura de la fila se calcula según el texto más largo, para evitar
// que un valor largo se sobreponga con el contenido siguiente.
// ─────────────────────────────────────────────────────────
function dibujarTabla(doc, x, y, columnas, fila) {
  const anchoTotal = columnas.reduce((sum, c) => sum + c.width, 0);
  const altoHeader = 18;

  doc.rect(x, y, anchoTotal, altoHeader).fillAndStroke(AZUL, AZUL);
  let cx = x;
  doc.fillColor('white').font('Helvetica-Bold').fontSize(7.5);
  columnas.forEach((col) => {
    doc.text(col.label, cx + 5, y + 5, { width: col.width - 10 });
    cx += col.width;
  });

  doc.font('Helvetica').fontSize(8.5);
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
// PIE DE PÁGINA
// ─────────────────────────────────────────────────────────
function dibujarPie(doc) {
  doc.moveDown(1);
  doc
    .fontSize(7.5)
    .fillColor('#777')
    .text(
      'Esta constancia certifica el pago registrado en el sistema municipal. No sustituye recibos fiscales emitidos por otras entidades.',
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
function campo(doc, label, valor) {
  doc
    .font('Helvetica-Bold')
    .fillColor('black')
    .text(label, 45, doc.y, { continued: true, width: 505 })
    .font('Helvetica')
    .text(` ${valor}`, { width: 505 });
  doc.moveDown(0.25);
}

function tituloSeccion(doc, texto) {
  const y = doc.y;
  doc.rect(40, y, 515, 18).fill(AZUL);
  doc
    .fillColor('white')
    .fontSize(10)
    .font('Helvetica-Bold')
    .text(texto, 45, y + 4);
  doc.fillColor('black').font('Helvetica');
  doc.y = y + 18;
  doc.moveDown(0.5);
}

/*
export const generarConstanciaPago = async (req, res) => {
  try { 
    const { pago_id } = req.params;

    const pago = await prisma.pago.findUnique({
      where: { id: parseInt(pago_id) },
      include: { inmueble: { include: { propietario: true, municipio: true } } }
    });

    if (!pago) {
      return res.status(404).json({ error: 'Pago no encontrado' });
    }

    const inmueble = pago.inmueble;

    // Crear PDF
    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=constancia-${inmueble.codigo_catastral}.pdf`);
    doc.pipe(res);

    doc.fontSize(18).text('Constancia de Pago de Inmueble', { align: 'center' });
    doc.moveDown();

    doc.fontSize(12).text(`Código Catastral: ${inmueble.codigo_catastral}`);
    doc.text(`Propietario: ${inmueble.propietario?.nombre}`);
    doc.text(`Dirección: ${inmueble.direccion_completa || 'N/A'}`);
    doc.text(`Municipio: ${inmueble.municipio?.nombre || 'N/A'}`);
    doc.moveDown();

    doc.text(`Número de recibo: ${pago.num_recibo}`);
    doc.text(`Monto pagado: Q${pago.monto}`);
    doc.text(`Fecha de pago: ${new Date(pago.fecha_pago).toLocaleDateString()}`);
    doc.text(`Método de pago: ${pago.metodo_pago}`);
    doc.moveDown();

    // Vigencia
    const vigencia = new Date(pago.fecha_pago);
    vigencia.setFullYear(vigencia.getFullYear() + 1);
    doc.text(`Vigencia hasta: ${vigencia.toLocaleDateString()}`);

    doc.end();
  } catch (error) {
    console.error('❌ Error al generar constancia:', error);
    res.status(500).json({ error: error.message });
  }
};*/


export const validarPagoVigente = async (req, res) => {
  try {
    console.log('validarPagoVigente params:', req.params);
    const { inmueble_id } = req.params;

    const pago = await prisma.pago.findFirst({
      where: { inmueble_id: parseInt(inmueble_id), estado: 'pagado' },
      orderBy: { fecha_pago: 'desc' } // último pago
    });

    console.log('Pago encontrado (validarPagoVigente):', pago);

    if (!pago) {
      // Responder 200 con pago: null para simplificar el manejo en frontend
      return res.json({ mensaje: 'No hay pagos registrados', pago: null });
    }

    const vigencia = new Date(pago.fecha_pago);
    vigencia.setFullYear(vigencia.getFullYear() + 1);

    if (new Date() > vigencia) {
      // Si quieres seguir indicando vencido, devuelves 200 con estado
      return res.json({ mensaje: 'Pago vencido', pago: { ...pago, vigente: false } });
    }

    // Pago vigente
    res.json({ mensaje: 'Pago vigente', pago: { ...pago, vigente: true } });
  } catch (error) {
    console.error('Error validarPagoVigente:', error);
    res.status(500).json({ error: error.message });
  }
};
