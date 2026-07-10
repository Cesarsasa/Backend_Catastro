import prisma from '../config/prisma.config.ts'

// ─── GET todos ───────────────────────────────────────────
export const getDepartamentos = async (req, res) => {
  try {
    const { buscar, page = 1, limit = 20 } = req.query;

    const where = {
      ...(buscar && {
        OR: [
          { nombre: { contains: buscar, mode: 'insensitive' } },
          { codigo: { contains: buscar, mode: 'insensitive' } },
        ],
      }),
    };

    const [total, departamentos] = await Promise.all([
      prisma.departamento.count({ where }),
      prisma.departamento.findMany({
        where,
        orderBy: { nombre: 'asc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
      }), // 👈 sin include
    ]);

    res.json({
      data: departamentos,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─── GET por ID ──────────────────────────────────────────
export const getDepartamentoById = async (req, res) => {
  try {
    const departamento = await prisma.departamento.findFirst({
      where: { id: parseInt(req.params.id) },
      include: {
        municipios: {
          select: { id: true, nombre: true, codigo: true }
        }
      }
    })

    if (!departamento) {
      return res.status(404).json({ error: 'Departamento no encontrado' })
    }

    res.json(departamento)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// ─── POST crear ──────────────────────────────────────────
export const crearDepartamento = async (req, res) => {
  try {
    const { codigo, nombre } = req.body

    if (!codigo || !nombre) {
      return res.status(400).json({ error: 'Código y nombre son requeridos' })
    }

    const departamento = await prisma.departamento.create({
      data: { codigo, nombre }
    })

    res.status(201).json(departamento)
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'El código ya está registrado' })
    }
    res.status(500).json({ error: error.message })
  }
}

// ─── PUT actualizar ──────────────────────────────────────
export const actualizarDepartamento = async (req, res) => {
  try {
    const { id } = req.params
    const { codigo, nombre } = req.body

    const existe = await prisma.departamento.findFirst({ where: { id: parseInt(id) } })
    if (!existe) {
      return res.status(404).json({ error: 'Departamento no encontrado' })
    }

    const departamento = await prisma.departamento.update({
      where: { id: parseInt(id) },
      data: {
        ...(codigo && { codigo }),
        ...(nombre && { nombre })
      }
    })

    res.json(departamento)
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'El código ya está registrado' })
    }
    res.status(500).json({ error: error.message })
  }
}

// ─── DELETE ──────────────────────────────────────────────
export const eliminarDepartamento = async (req, res) => {
  try {
    const { id } = req.params

    const existe = await prisma.departamento.findFirst({ where: { id: parseInt(id) } })
    if (!existe) {
      return res.status(404).json({ error: 'Departamento no encontrado' })
    }

    await prisma.departamento.delete({ where: { id: parseInt(id) } })

    res.json({ mensaje: 'Departamento eliminado correctamente' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
