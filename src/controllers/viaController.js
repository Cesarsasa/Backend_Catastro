import prisma from '../config/prisma.config.ts'

// ─── GET todas ───────────────────────────────────────────
export const getVias = async (req, res) => {
  try {
    const { municipio_id, zona_id, tipo_via_id, buscar, page = 1, limit = 80 } = req.query

    const where = {
      ...(municipio_id && { municipio_id: parseInt(municipio_id) }),
      ...(zona_id && { zona_id: parseInt(zona_id) }),
      ...(tipo_via_id && { tipo_via_id: parseInt(tipo_via_id) }),
      ...(buscar && {
        OR: [
          { nombre: { contains: buscar, mode: 'insensitive' } },
          { numero: { contains: buscar, mode: 'insensitive' } }
        ]
      })
    }

    const [total, vias] = await Promise.all([
      prisma.via.count({ where }),
      prisma.via.findMany({
        where,
        include: {
          municipio: { select: { nombre: true } },
          zona: { select: { id: true, numero: true, nombre: true } },
          tipo_via: { select: { id: true, nombre: true } },
          inmuebles: { select: { id: true, codigo_catastral: true } },
          propietarios: { select: { id: true, nombre: true, tipo: true } }
        },
        orderBy: { numero: 'asc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit)
      })
    ])

    res.json({
      data: vias,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// ─── GET por ID ──────────────────────────────────────────
export const getViaById = async (req, res) => {
  try {
    const via = await prisma.via.findFirst({
      where: { id: parseInt(req.params.id) },
      include: {
        municipio: { select: { nombre: true } },
        zona: { select: { id: true, numero: true, nombre: true } },
        tipo_via: { select: { id: true, nombre: true } },
        inmuebles: {
          select: {
            id: true,
            codigo_catastral: true,
            direccion_completa: true,
            estado: true
          }
        },
        propietarios: { select: { id: true, nombre: true, tipo: true } }
      }
    })

    if (!via) {
      return res.status(404).json({ error: 'Vía no encontrada' })
    }

    res.json(via)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// ─── POST crear ──────────────────────────────────────────
export const crearVia = async (req, res) => {
  try {
    const { municipio_id, zona_id, tipo_via_id, numero, nombre } = req.body

    if (!municipio_id || !tipo_via_id || !numero) {
      return res.status(400).json({ error: 'Municipio, tipo de vía y número son requeridos' })
    }

    const via = await prisma.via.create({
      data: {
        municipio: { connect: { id: parseInt(municipio_id) } },
        tipo_via: { connect: { id: parseInt(tipo_via_id) } },
        numero,
        nombre,
        ...(zona_id && { zona: { connect: { id: parseInt(zona_id) } } })
      },
      include: {
        municipio: { select: { nombre: true } },
        tipo_via: { select: { nombre: true } },
        zona: { select: { numero: true, nombre: true } }
      }
    })

    res.status(201).json(via)
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Ya existe una vía con ese número y tipo en este municipio' })
    }
    res.status(500).json({ error: error.message })
  }
}


/*export const crearVia = async (req, res) => {
  try {
    const { municipio_id, zona_id, tipo_via_id, numero, nombre } = req.body

    if (!municipio_id || !tipo_via_id || !numero) {
      return res.status(400).json({ error: 'Municipio, tipo de vía y número son requeridos' })
    }

    const via = await prisma.via.create({
      data: {
        municipio: { connect: { id: parseInt(municipio_id) } },
        tipo_via: { connect: { id: parseInt(tipo_via_id) } },
        numero,
        nombre,
        ...(zona_id && { zona: { connect: { id: parseInt(zona_id) } } })
      },
      include: {
        municipio: { select: { nombre: true } },
        tipo_via: { select: { nombre: true } },
        zona: { select: { numero: true, nombre: true } }
      }
    })

    res.status(201).json(via)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}*/

// ─── PUT actualizar ──────────────────────────────────────
export const actualizarVia = async (req, res) => {
  try {
    const { id } = req.params
    const { municipio_id, zona_id, tipo_via_id, numero, nombre } = req.body

    const existe = await prisma.via.findFirst({ where: { id: parseInt(id) } })
    if (!existe) {
      return res.status(404).json({ error: 'Vía no encontrada' })
    }

    const via = await prisma.via.update({
      where: { id: parseInt(id) },
      data: {
        ...(municipio_id && { municipio: { connect: { id: parseInt(municipio_id) } } }),
        ...(zona_id && { zona: { connect: { id: parseInt(zona_id) } } }),
        ...(tipo_via_id && { tipo_via:   { connect: { id: parseInt(tipo_via_id) } } }),
        ...(numero && { numero }),
        nombre
      },
      include: {
        municipio: { select: { nombre: true } },
        tipo_via: { select: { nombre: true } },
        zona: { select: { numero: true, nombre: true } }
      }
    })

    res.json(via)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// ─── DELETE ──────────────────────────────────────────────
export const eliminarVia = async (req, res) => {
  try {
    const { id } = req.params

    const existe = await prisma.via.findFirst({ where: { id: parseInt(id) } })
    if (!existe) {
      return res.status(404).json({ error: 'Vía no encontrada' })
    }

    await prisma.via.delete({ where: { id: parseInt(id) } })

    res.json({ mensaje: 'Vía eliminada correctamente' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}