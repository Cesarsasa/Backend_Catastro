import prisma from '../config/prisma.config.ts'
import pool  from '../config/database.js'
import { generarDireccion } from '../helpers/direccion.js'
import { puntosAPoligono  } from '../helpers/coordenadas.js'

// ─── GET todos ───────────────────────────────────────────
export const getInmuebles = async (req, res) => {
  try {
    const {
      buscar, municipio_id, zona_id,
      tipo, estado, propietario_id,
      page = 1, limit = 20
    } = req.query;

    const where = {
      deleted_at: null,
      ...(tipo          && { tipo }),
      ...(estado        && { estado }),
      ...(municipio_id  && { municipio_id:  parseInt(municipio_id) }),
      ...(zona_id       && { zona_id:       parseInt(zona_id) }),
      ...(propietario_id && { propietario_id: parseInt(propietario_id) }),
      ...(buscar && {
        OR: [
          { codigo_catastral:   { contains: buscar, mode: 'insensitive' } },
          { finca:              { contains: buscar, mode: 'insensitive' } },
          { direccion_completa: { contains: buscar, mode: 'insensitive' } },
          { no_inscripcion_iusi:{ contains: buscar, mode: 'insensitive' } },
        ]
      })
    };

    const [total, inmuebles] = await Promise.all([
      prisma.inmueble.count({ where }),
      prisma.inmueble.findMany({
        where,
        include: {
          propietario: { select: { nombre: true, dpi: true } },
          municipio:   { select: { nombre: true } },
          zona:        { select: { numero: true, nombre: true } },
          via:         { include: { tipo_via: { select: { nombre: true } } } },
          _count: {
        select: { certificados: true } // 👈 nuevo
      }
        },
        orderBy: { creado_en: 'desc' },
        skip:    (parseInt(page) - 1) * parseInt(limit),
        take:    parseInt(limit)
      })
    ]);

    // 🔹 Convertir coordenadas y polígono a GeoJSON
    const ids = inmuebles.map(i => i.id);
    const geo = await pool.query(`
      SELECT
        id,
        ST_AsGeoJSON(coordenadas)::json AS coordenadas,
        ST_AsGeoJSON(poligono)::json AS poligono
      FROM inmuebles
      WHERE id = ANY($1)
    `, [ids]);

    // 🔹 Mezclar los datos espaciales con los del Prisma
    const inmueblesConGeo = inmuebles.map(i => {
      const g = geo.rows.find(r => r.id === i.id);
      return {
        ...i,
        coordenadas: g?.coordenadas || null,
        poligono: g?.poligono || null,
        tiene_certificado: i._count.certificados > 0 
      };
    });

    res.json({
      data: inmueblesConGeo,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
/*
// ─── GET count de inmuebles ───────────────────────────────
export const getInmueblesCount = async (req, res) => {
  try {
    const {
      buscar, municipio_id, zona_id,
      tipo, estado, propietario_id
    } = req.query;

    const where = {
      deleted_at: null,
      ...(tipo          && { tipo }),
      ...(estado        && { estado }),
      ...(municipio_id  && { municipio_id: parseInt(municipio_id) }),
      ...(zona_id       && { zona_id: parseInt(zona_id) }),
      ...(propietario_id && { propietario_id: parseInt(propietario_id) }),
      ...(buscar && {
        OR: [
          { codigo_catastral:   { contains: buscar, mode: 'insensitive' } },
          { finca:              { contains: buscar, mode: 'insensitive' } },
          { direccion_completa: { contains: buscar, mode: 'insensitive' } },
          { no_inscripcion_iusi:{ contains: buscar, mode: 'insensitive' } },
        ]
      })
    };

    const total = await prisma.inmueble.count({ where });

    res.json({ total });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};*/


export const getInmueblesCount = async (req, res) => {
  try {
    const total = await prisma.inmueble.count({
      where: { deleted_at: null }
    });
    res.json({ total });
    console.log('Total de inmuebles:', total);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
;

export const getInmueblesByDpi = async (req, res) => {
  try {
    const { dpi } = req.params;
    const page = req.query.page ?? 1;
    const limit = req.query.limit ?? 50;

    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 50;

    // Buscar propietario por DPI e incluir solo inmuebles no borrados
    const propietario = await prisma.propietario.findUnique({
      where: { dpi },
      include: {
        inmuebles: {
          where: { deleted_at: null },
          include: {
            municipio: { select: { nombre: true } },
            zona: { select: { numero: true, nombre: true } },
            via: { include: { tipo_via: { select: { nombre: true } } } },
            _count: { select: { certificados: true } },
            pagos: {
              where: { estado: 'pagado' },
              orderBy: { fecha_pago: 'desc' },
              take: 1
            }
          },
          orderBy: { creado_en: 'desc' },
          skip: (pageNum - 1) * limitNum,
          take: limitNum
        }
      }
    });

    if (!propietario) {
      return res.status(404).json({ error: 'Propietario no encontrado' });
    }

    const inmuebles = propietario.inmuebles ?? [];
    if (inmuebles.length === 0) {
      return res.json({
        propietario: {
          nombre: propietario.nombre,
          dpi: propietario.dpi,
          telefono: propietario.telefono,
          email: propietario.email
        },
        inmuebles: []
      });
    }

    // IDs de inmuebles para traer geometrías
    const ids = inmuebles.map(i => i.id);
    const geo = await pool.query(`
      SELECT
        id,
        ST_AsGeoJSON(coordenadas)::json AS coordenadas,
        ST_AsGeoJSON(poligono)::json    AS poligono
      FROM inmuebles
      WHERE id = ANY($1)
    `, [ids]);

    // Mezclar geometrías y normalizar último pago
    const inmueblesConGeo = inmuebles.map(i => {
      const g = geo.rows.find(r => r.id === i.id);
      const ultimoPago = (i.pagos && i.pagos.length > 0) ? i.pagos[0] : null;
      return {
        ...i,
        ultimo_pago: ultimoPago ? {
          id: ultimoPago.id,
          monto: ultimoPago.monto,
          fecha_pago: ultimoPago.fecha_pago,
          metodo_pago: ultimoPago.metodo_pago,
          num_recibo: ultimoPago.num_recibo
        } : null,
        coordenadas: g?.coordenadas || null,
        poligono: g?.poligono || null,
        tiene_certificado: i._count?.certificados > 0
      };
    });

    res.json({
      propietario: {
        nombre: propietario.nombre,
        dpi: propietario.dpi,
        telefono: propietario.telefono,
        email: propietario.email
      },
      inmuebles: inmueblesConGeo,
      page: pageNum,
      limit: limitNum
    });
  } catch (error) {
    console.error('Error getInmueblesByDpi:', error);
    res.status(500).json({ error: error.message });
  }
};


// ─── GET por ID ──────────────────────────────────────────
export const getInmuebleById = async (req, res) => {
  try {
    const inmueble = await prisma.inmueble.findFirst({
      where: { id: parseInt(req.params.id), deleted_at: null },
      include: {
        propietario: true,
        municipio:   { include: { departamento: true } },
        zona:        true,
        via:         { include: { tipo_via: true } },
        pagos:       { orderBy: { anio: 'desc' } },
        documentos:  true
      }
    })

    if (!inmueble) {
      return res.status(404).json({ error: 'Inmueble no encontrado' })
    }

    // Obtener coordenadas PostGIS
    const geo = await pool.query(`
      SELECT
        ST_AsGeoJSON(coordenadas)::json AS coordenadas,
        ST_AsGeoJSON(poligono)::json    AS poligono
      FROM inmuebles WHERE id = $1
    `, [inmueble.id])

    res.json({
      ...inmueble,
      coordenadas: geo.rows[0]?.coordenadas || null,
      poligono:    geo.rows[0]?.poligono    || null
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// ─── GET por código catastral ─────────────────────────────
export const getInmuebleByCodigo = async (req, res) => {
  try {
    const inmueble = await prisma.inmueble.findFirst({
      where: { codigo_catastral: req.params.codigo, deleted_at: null },
      include: {
        propietario: { select: { nombre: true, dpi: true, telefono: true } },
        municipio:   { include: { departamento: true } },
        zona:        true,
        via:         { include: { tipo_via: true } },
        pagos:       { orderBy: { anio: 'desc' }, take: 5 },
        documentos:  { select: { id: true, tipo: true, nombre: true, url: true } }
      }
    })

    if (!inmueble) {
      return res.status(404).json({ error: 'Inmueble no encontrado' })
    }

    // Obtener coordenadas PostGIS
    const geo = await pool.query(`
      SELECT
        ST_AsGeoJSON(coordenadas)::json AS coordenadas,
        ST_AsGeoJSON(poligono)::json    AS poligono
      FROM inmuebles WHERE id = $1
    `, [inmueble.id])

    res.json({
      ...inmueble,
      coordenadas: geo.rows[0]?.coordenadas || null,
      poligono:    geo.rows[0]?.poligono    || null
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// ─── POST crear ──────────────────────────────────────────
export const crearInmueble = async (req, res) => {
  try {
    const {
      codigo_catastral, propietario_id, municipio_id,
      zona_id, via_id, numero_casa, colonia, referencia,
      tipo, uso, area_m2, area_registrada, area_real, valor_inscrito, no_inscripcion_iusi,
      finca, folio, libro, departamento_registro,
      lat, lng, poligono_puntos
    } = req.body

    if (!codigo_catastral) {
      return res.status(400).json({ error: 'El código catastral es requerido' })
    }

    // Generar dirección completa automáticamente
    let direccion_completa = null
    if (via_id && zona_id && municipio_id) {
      const via      = await prisma.via.findUnique({ where: { id: parseInt(via_id) }, include: { tipo_via: true } })
      const zona     = await prisma.zona.findUnique({ where: { id: parseInt(zona_id) } })
      const municipio = await prisma.municipio.findUnique({ where: { id: parseInt(municipio_id) } })
      direccion_completa = generarDireccion(via, numero_casa, zona, municipio)
    }

    // Crear inmueble con Prisma
    const inmueble = await prisma.inmueble.create({
      data: {
        codigo_catastral,
        numero_casa,
        colonia,
        referencia,
        direccion_completa,
        tipo,
        uso,
        area_m2:              area_m2       ? parseFloat(area_m2)       : null,
        area_registrada:      area_registrada ? parseFloat(area_registrada) : null,
        area_real:            area_real   ? parseFloat(area_real)   : null,
        valor_inscrito:       valor_inscrito ? parseFloat(valor_inscrito) : null,
        no_inscripcion_iusi,
        finca,
        folio,
        libro,
        departamento_registro,
        estado: 'activo',
        ...(propietario_id && { propietario: { connect: { id: parseInt(propietario_id) } } }),
        ...(municipio_id   && { municipio:   { connect: { id: parseInt(municipio_id) } } }),
        ...(zona_id        && { zona:        { connect: { id: parseInt(zona_id) } } }),
        ...(via_id         && { via:         { connect: { id: parseInt(via_id) } } }),
        ...(req.usuario?.id && { creador:    { connect: { id: req.usuario.id } } })
      }
    })

    // Guardar coordenadas con PostGIS si vienen
    if (lat && lng) {
      await pool.query(`
        UPDATE inmuebles
        SET coordenadas = ST_GeogFromText($1)
        WHERE id = $2
      `, [`SRID=4326;POINT(${lng} ${lat})`, inmueble.id])
    }

    // Guardar polígono si viene
    if (poligono_puntos && poligono_puntos.length >= 3) {
      const wkt = puntosAPoligono(poligono_puntos)
      await pool.query(`
        UPDATE inmuebles
        SET poligono = ST_GeogFromText($1)
        WHERE id = $2
      `, [wkt, inmueble.id])
    }

    res.status(201).json(inmueble)
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'El código catastral ya está registrado' })
    }
    res.status(500).json({ error: error.message })
  }
}

// ─── PUT actualizar ──────────────────────────────────────
export const actualizarInmueble = async (req, res) => {
  try {
    const { id } = req.params
    const {
      propietario_id, municipio_id, zona_id, via_id,
      numero_casa, colonia, referencia,
      tipo, uso, area_m2, area_registrada,area_real, valor_inscrito, no_inscripcion_iusi,
      finca, folio, libro, departamento_registro, estado,
      lat, lng, poligono_puntos
    } = req.body

    const existe = await prisma.inmueble.findFirst({
      where: { id: parseInt(id), deleted_at: null }
    })

    if (!existe) {
      return res.status(404).json({ error: 'Inmueble no encontrado' })
    }

    // Regenerar dirección si cambiaron los datos de dirección
    let direccion_completa = existe.direccion_completa
    if (via_id && zona_id && municipio_id) {
      const via       = await prisma.via.findUnique({ where: { id: parseInt(via_id) }, include: { tipo_via: true } })
      const zona      = await prisma.zona.findUnique({ where: { id: parseInt(zona_id) } })
      const municipio = await prisma.municipio.findUnique({ where: { id: parseInt(municipio_id) } })
      direccion_completa = generarDireccion(via, numero_casa, zona, municipio)
    }

    const inmueble = await prisma.inmueble.update({
      where: { id: parseInt(id) },
      data: {
        numero_casa,
        colonia,
        referencia,
        direccion_completa,
        tipo,
        uso,
        area_m2:              area_m2       ? parseFloat(area_m2)       : undefined,
        area_registrada:      area_registrada ? parseFloat(area_registrada) : undefined,
        area_real:            area_real   ? parseFloat(area_real)   : undefined,
        valor_inscrito:       valor_inscrito ? parseFloat(valor_inscrito) : undefined,
        no_inscripcion_iusi,
        finca,
        folio,
        libro,
        departamento_registro,
        estado,
        ...(propietario_id && { propietario: { connect: { id: parseInt(propietario_id) } } }),
        ...(municipio_id   && { municipio:   { connect: { id: parseInt(municipio_id) } } }),
        ...(zona_id        && { zona:        { connect: { id: parseInt(zona_id) } } }),
        ...(via_id         && { via:         { connect: { id: parseInt(via_id) } } }),
      }
    })

    // Actualizar coordenadas si vienen
    if (lat && lng) {
      await pool.query(`
        UPDATE inmuebles
        SET coordenadas = ST_GeogFromText($1)
        WHERE id = $2
      `, [`SRID=4326;POINT(${lng} ${lat})`, inmueble.id])
    }

    // Actualizar polígono si viene
    if (poligono_puntos && poligono_puntos.length >= 3) {
      const wkt = puntosAPoligono(poligono_puntos)
      await pool.query(`
        UPDATE inmuebles
        SET poligono = ST_GeogFromText($1)
        WHERE id = $2
      `, [wkt, inmueble.id])
    }

    res.json(inmueble)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// ─── DELETE borrado suave ────────────────────────────────
export const eliminarInmueble = async (req, res) => {
  try {
    const { id } = req.params

    const existe = await prisma.inmueble.findFirst({
      where: { id: parseInt(id), deleted_at: null }
    })

    if (!existe) {
      return res.status(404).json({ error: 'Inmueble no encontrado' })
    }

    await prisma.inmueble.update({
      where: { id: parseInt(id) },
      data:  { deleted_at: new Date() }
    })

    res.json({ mensaje: 'Inmueble eliminado correctamente' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}


