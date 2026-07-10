import prisma from '../config/prisma.config.ts'

// ─── GET todas ───────────────────────────────────────────
export const getZonas = async (req, res) => {
  try {
    const { municipio_id, buscar, page = 1, limit = 20 } = req.query

    const where = {
      ...(municipio_id && { municipio_id: parseInt(municipio_id) }),
      ...(buscar && {
        OR: [
          { nombre: { contains: buscar, mode: 'insensitive' } },
          { numero: { equals: parseInt(buscar) || undefined } }
        ]
      })
    }

    const [total, zonas] = await Promise.all([
      prisma.zona.count({ where }),
      prisma.zona.findMany({
        where,
        include: {
          municipio: { select: { nombre: true } },
          vias: { select: { id: true, nombre: true } },
          inmuebles: { select: { id: true, codigo_catastral: true } },
          propietarios: { select: { id: true, nombre: true, tipo: true } }
        },
        orderBy: { numero: 'asc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit)
      })
    ])

    res.json({
      data: zonas,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// ─── GET por ID ──────────────────────────────────────────
export const getZonaById = async (req, res) => {
  try {
    const zona = await prisma.zona.findFirst({
      where: { id: parseInt(req.params.id) },
      include: {
        municipio: { select: { nombre: true } },
        vias: { select: { id: true, nombre: true } },
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

    if (!zona) {
      return res.status(404).json({ error: 'Zona no encontrada' })
    }

    res.json(zona)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// ─── POST crear ──────────────────────────────────────────
export const crearZona = async (req, res) => {
  try {
    const { municipio_id, numero, nombre } = req.body

    if (!municipio_id || !numero) {
      return res.status(400).json({ error: 'Municipio y número son requeridos' })
    }

    const zona = await prisma.zona.create({
      data: {
        municipio: { connect: { id: parseInt(municipio_id) } },
        numero: parseInt(numero),
        nombre
      },
      include: { municipio: { select: { nombre: true } } }
    })

    res.status(201).json(zona)
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Ya existe una zona con ese número en el municipio' })
    }
    res.status(500).json({ error: error.message })
  }
}

// ─── PUT actualizar ──────────────────────────────────────
export const actualizarZona = async (req, res) => {
  try {
    const { id } = req.params
    const { municipio_id, numero, nombre } = req.body

    const existe = await prisma.zona.findFirst({ where: { id: parseInt(id) } })
    if (!existe) {
      return res.status(404).json({ error: 'Zona no encontrada' })
    }

    const zona = await prisma.zona.update({
      where: { id: parseInt(id) },
      data: {
        ...(municipio_id && { municipio: { connect: { id: parseInt(municipio_id) } } }),
        ...(numero && { numero: parseInt(numero) }),
        nombre
      },
      include: { municipio: { select: { nombre: true } } }
    })

    res.json(zona)
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Ya existe una zona con ese número en el municipio' })
    }
    res.status(500).json({ error: error.message })
  }
}

// ─── DELETE ──────────────────────────────────────────────
export const eliminarZona = async (req, res) => {
  try {
    const { id } = req.params

    const existe = await prisma.zona.findFirst({ where: { id: parseInt(id) } })
    if (!existe) {
      return res.status(404).json({ error: 'Zona no encontrada' })
    }

    await prisma.zona.delete({ where: { id: parseInt(id) } })

    res.json({ mensaje: 'Zona eliminada correctamente' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}