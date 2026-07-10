import prisma from '../config/prisma.config.ts'

// ─── GET todos ───────────────────────────────────────────
export const getTiposVia = async (req, res) => {
  try {
    const { buscar, page = 1, limit = 50 } = req.query

    const where = {
      ...(buscar && {
        OR: [
          { nombre: { contains: buscar, mode: 'insensitive' } }
        ]
      })
    }

    const [total, tipos] = await Promise.all([
      prisma.tipoVia.count({ where }),
      prisma.tipoVia.findMany({
        where,
        include: { vias: { select: { id: true, numero: true, nombre: true } } },
        orderBy: { nombre: 'asc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit)
      })
    ])

    res.json({
      data: tipos,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// ─── GET por ID ──────────────────────────────────────────
export const getTipoViaById = async (req, res) => {
  try {
    const tipo = await prisma.tipoVia.findFirst({
      where: { id: parseInt(req.params.id) },
      include: { vias: { select: { id: true, numero: true, nombre: true } } }
    })

    if (!tipo) {
      return res.status(404).json({ error: 'Tipo de vía no encontrado' })
    }

    res.json(tipo)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// ─── POST crear ──────────────────────────────────────────
export const crearTipoVia = async (req, res) => {
  try {
    const { nombre } = req.body

    if (!nombre) {
      return res.status(400).json({ error: 'El nombre es requerido' })
    }

    const tipo = await prisma.tipoVia.create({
      data: { nombre },
      include: { vias: true }
    })

    res.status(201).json(tipo)
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Ya existe un tipo de vía con ese nombre' })
    }
    res.status(500).json({ error: error.message })
  }
}

// ─── PUT actualizar ──────────────────────────────────────
export const actualizarTipoVia = async (req, res) => {
  try {
    const { id } = req.params
    const { nombre } = req.body

    const existe = await prisma.tipoVia.findFirst({ where: { id: parseInt(id) } })
    if (!existe) {
      return res.status(404).json({ error: 'Tipo de vía no encontrado' })
    }

    const tipo = await prisma.tipoVia.update({
      where: { id: parseInt(id) },
      data: { nombre },
      include: { vias: true }
    })

    res.json(tipo)
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Ya existe un tipo de vía con ese nombre' })
    }
    res.status(500).json({ error: error.message })
  }
}

// ─── DELETE ──────────────────────────────────────────────
export const eliminarTipoVia = async (req, res) => {
  try {
    const { id } = req.params

    const existe = await prisma.tipoVia.findFirst({ where: { id: parseInt(id) } })
    if (!existe) {
      return res.status(404).json({ error: 'Tipo de vía no encontrado' })
    }

    await prisma.tipoVia.delete({ where: { id: parseInt(id) } })

    res.json({ mensaje: 'Tipo de vía eliminado correctamente' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
