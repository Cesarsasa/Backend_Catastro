import prisma from '../config/prisma.config.ts'

// ─── GET todos ───────────────────────────────────────────
export const getAuditorias = async (req, res) => {
  try {
    const { tabla, usuario_id, accion, page = 1, limit = 20 } = req.query

    const where = {
      ...(tabla && { tabla: { contains: tabla, mode: 'insensitive' } }),
      ...(usuario_id && { usuario_id: parseInt(usuario_id) }),
      ...(accion && { accion })
    }

    const [total, auditorias] = await Promise.all([
      prisma.auditoria.count({ where }),
      prisma.auditoria.findMany({
        where,
        include: {
          usuario: { select: { id: true, nombre: true, email: true } }
        },
        orderBy: { creado_en: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit)
      })
    ])

    res.json({
      data: auditorias,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// ─── GET por ID ──────────────────────────────────────────
export const getAuditoriaById = async (req, res) => {
  try {
    const auditoria = await prisma.auditoria.findFirst({
      where: { id: parseInt(req.params.id) },
      include: {
        usuario: { select: { id: true, nombre: true, email: true } }
      }
    })

    if (!auditoria) {
      return res.status(404).json({ error: 'Auditoría no encontrada' })
    }

    res.json(auditoria)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// ─── POST crear ──────────────────────────────────────────
export const crearAuditoria = async (req, res) => {
  try {
    const { tabla, registro_id, accion, datos_antes, datos_despues, usuario_id, ip } = req.body

    if (!tabla || !registro_id || !accion) {
      return res.status(400).json({ error: 'Tabla, registro y acción son requeridos' })
    }

    const auditoria = await prisma.auditoria.create({
      data: {
        tabla,
        registro_id: parseInt(registro_id),
        accion,
        datos_antes,
        datos_despues,
        ...(usuario_id && { usuario: { connect: { id: parseInt(usuario_id) } } }),
        ip
      },
      include: { usuario: { select: { id: true, nombre: true } } }
    })

    res.status(201).json(auditoria)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// ─── DELETE ──────────────────────────────────────────────
// Nota: normalmente las auditorías no se eliminan, pero te dejo la ruta por consistencia
export const eliminarAuditoria = async (req, res) => {
  try {
    const { id } = req.params

    const existe = await prisma.auditoria.findFirst({ where: { id: parseInt(id) } })
    if (!existe) {
      return res.status(404).json({ error: 'Auditoría no encontrada' })
    }

    await prisma.auditoria.delete({ where: { id: parseInt(id) } })

    res.json({ mensaje: 'Auditoría eliminada correctamente' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
