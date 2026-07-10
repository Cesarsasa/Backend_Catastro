import prisma from '../config/prisma.config.ts'
import bcrypt from 'bcryptjs'

// ─── GET todos ───────────────────────────────────────────
export const getUsuarios = async (req, res) => {
  try {
    const { rol, activo, buscar, page = 1, limit = 20 } = req.query

    const where = {
      ...(rol && { rol }),
      ...(activo !== undefined && { activo: activo === 'true' }),
      ...(buscar && {
        OR: [
          { nombre: { contains: buscar, mode: 'insensitive' } },
          { email: { contains: buscar, mode: 'insensitive' } }
        ]
      })
    }

    const [total, usuarios] = await Promise.all([
      prisma.usuario.count({ where }),
      prisma.usuario.findMany({
        where,
        select: {
          id: true,
          nombre: true,
          email: true,
          rol: true,
          activo: true,
          creado_en: true
        },
        orderBy: { nombre: 'asc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit)
      })
    ])

    res.json({
      data: usuarios,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// ─── GET por ID ──────────────────────────────────────────
export const getUsuarioById = async (req, res) => {
  try {
    const usuario = await prisma.usuario.findFirst({
      where: { id: parseInt(req.params.id) },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        activo: true,
        creado_en: true
      }
    })

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    res.json(usuario)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// ─── POST crear ──────────────────────────────────────────
export const crearUsuario = async (req, res) => {
  try {
    const { nombre, email, password, rol, activo } = req.body

    if (!nombre || !email || !password) {
      return res.status(400).json({ error: 'Nombre, email y password son requeridos' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const usuario = await prisma.usuario.create({
      data: {
        nombre,
        email,
        password: hashedPassword,
        rol: rol || 'consulta',
        activo: activo !== undefined ? activo : true
      },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        activo: true,
        creado_en: true
      }
    })

    res.status(201).json(usuario)
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'El email ya está registrado' })
    }
    res.status(500).json({ error: error.message })
  }
}

// ─── PUT actualizar ──────────────────────────────────────
export const actualizarUsuario = async (req, res) => {
  try {
    const { id } = req.params
    const { nombre, email, password, rol, activo } = req.body

    const existe = await prisma.usuario.findFirst({ where: { id: parseInt(id) } })
    if (!existe) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    const data = {}
    if (nombre) data.nombre = nombre
    if (email) data.email = email
    if (rol) data.rol = rol
    if (activo !== undefined) data.activo = activo
    if (password) data.password = await bcrypt.hash(password, 10)

    const usuario = await prisma.usuario.update({
      where: { id: parseInt(id) },
      data,
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        activo: true,
        creado_en: true
      }
    })

    res.json(usuario)
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'El email ya está registrado' })
    }
    res.status(500).json({ error: error.message })
  }
}

// ─── DELETE ──────────────────────────────────────────────
export const eliminarUsuario = async (req, res) => {
  try {
    const { id } = req.params

    const existe = await prisma.usuario.findFirst({ where: { id: parseInt(id) } })
    if (!existe) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    await prisma.usuario.delete({ where: { id: parseInt(id) } })

    res.json({ mensaje: 'Usuario eliminado correctamente' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
