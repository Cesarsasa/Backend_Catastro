import prisma from '../config/prisma.config.ts'

// ─── GET todos ───────────────────────────────────────────
export const getMunicipios = async (req, res) => {
  try {
    const { departamento_id, buscar, page = 1, limit = 20 } = req.query

    const where = {
      ...(departamento_id && { departamento_id: parseInt(departamento_id) }),
      ...(buscar && {
        OR: [
          { nombre: { contains: buscar, mode: 'insensitive' } },
          { codigo: { contains: buscar, mode: 'insensitive' } }
        ]
      })
    }

    const [total, municipios] = await Promise.all([
      prisma.municipio.count({ where }),
      prisma.municipio.findMany({
        where,
        include: {
          departamento: { select: { id: true, nombre: true } },
          zonas: { select: { id: true, numero: true, nombre: true } },
          vias: { select: { id: true, numero: true, nombre: true } },
          propietarios: { select: { id: true, nombre: true, tipo: true } },
          inmuebles: { select: { id: true, codigo_catastral: true } }
        },
        orderBy: { nombre: 'asc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit)
      })
    ])

    res.json({
      data: municipios,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// ─── GET por ID ──────────────────────────────────────────
export const getMunicipioById = async (req, res) => {
  try {
    const municipio = await prisma.municipio.findFirst({
      where: { id: parseInt(req.params.id) },
      include: {
        departamento: { select: { id: true, nombre: true } },
        zonas: { select: { id: true, numero: true, nombre: true } },
        vias: { select: { id: true, numero: true, nombre: true } },
        propietarios: { select: { id: true, nombre: true, tipo: true } },
        inmuebles: {
          select: {
            id: true,
            codigo_catastral: true,
            direccion_completa: true,
            estado: true
          }
        }
      }
    })

    if (!municipio) {
      return res.status(404).json({ error: 'Municipio no encontrado' })
    }

    res.json(municipio)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// ─── POST crear ──────────────────────────────────────────
export const crearMunicipio = async (req, res) => {
  try {
    const { departamento_id, codigo, nombre } = req.body

    if (!departamento_id || !codigo || !nombre) {
      return res.status(400).json({ error: 'Departamento, código y nombre son requeridos' })
    }

    const municipio = await prisma.municipio.create({
      data: {
        departamento: { connect: { id: parseInt(departamento_id) } },
        codigo,
        nombre
      },
      include: { departamento: { select: { nombre: true } } }
    })

    res.status(201).json(municipio)
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'El código ya está registrado' })
    }
    res.status(500).json({ error: error.message })
  }
}

// ─── PUT actualizar ──────────────────────────────────────
export const actualizarMunicipio = async (req, res) => {
  try {
    const { id } = req.params
    const { departamento_id, codigo, nombre } = req.body

    const existe = await prisma.municipio.findFirst({ where: { id: parseInt(id) } })
    if (!existe) {
      return res.status(404).json({ error: 'Municipio no encontrado' })
    }

    const municipio = await prisma.municipio.update({
      where: { id: parseInt(id) },
      data: {
        ...(departamento_id && { departamento: { connect: { id: parseInt(departamento_id) } } }),
        ...(codigo && { codigo }),
        ...(nombre && { nombre })
      },
      include: { departamento: { select: { nombre: true } } }
    })

    res.json(municipio)
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'El código ya está registrado' })
    }
    res.status(500).json({ error: error.message })
  }
}

// ─── DELETE ──────────────────────────────────────────────
export const eliminarMunicipio = async (req, res) => {
  try {
    const { id } = req.params

    const existe = await prisma.municipio.findFirst({ where: { id: parseInt(id) } })
    if (!existe) {
      return res.status(404).json({ error: 'Municipio no encontrado' })
    }

    await prisma.municipio.delete({ where: { id: parseInt(id) } })

    res.json({ mensaje: 'Municipio eliminado correctamente' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}