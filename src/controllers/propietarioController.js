/*import prisma from '../config/prisma.config.ts'

// ─── GET todos ───────────────────────────────────────────
export const getPropietarios = async (req, res) => {
  try {
    const { buscar, municipio_id, tipo, page = 1, limit = 20 } = req.query

    const where = {
      deleted_at: null,
      ...(tipo         && { tipo }),
      ...(municipio_id && { municipio_id: parseInt(municipio_id) }),
      ...(buscar && {
        OR: [
          { nombre: { contains: buscar, mode: 'insensitive' } },
          { dpi:    { contains: buscar } },
          { nit:    { contains: buscar } },
          { telefono: { contains: buscar } },
          { email:    { contains: buscar } },
        ]
      })
    }

    const [total, propietarios] = await Promise.all([
      prisma.propietario.count({ where }),
      prisma.propietario.findMany({
        where,
        include: {
          municipio: { select: { nombre: true } },
          zona:      { select: { nombre: true } },
          via:       { select: { nombre: true } },
          inmuebles: { select: { id: true, codigo_catastral: true } }
        },
        orderBy:  { nombre: 'asc' },
        skip:     (parseInt(page) - 1) * parseInt(limit),
        take:     parseInt(limit)
      })
    ])

    res.json({
      data:  propietarios,
      total,
      page:  parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// ─── GET por ID ──────────────────────────────────────────
export const getPropietarioById = async (req, res) => {
  try {
    const propietario = await prisma.propietario.findFirst({
      where: {
        id:         parseInt(req.params.id),
        deleted_at: null
      },
      include: {
        municipio: { select: { nombre: true } },
        zona:      { select: { nombre: true } },
        via:       { select: { nombre: true } },
        inmuebles: {
          where: { deleted_at: null },
          select: {
            id:                 true,
            codigo_catastral:   true,
            direccion_completa: true,
            tipo:               true,
            estado:             true,
            valor_inscrito:     true
          }
        },
        documentos: {
          select: {
            id:        true,
            tipo:      true,
            nombre:    true,
            url:       true,
            creado_en: true
          }
        }
      }
    })

    if (!propietario) {
      return res.status(404).json({ error: 'Propietario no encontrado' })
    }

    res.json(propietario)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// ─── GET por DPI ─────────────────────────────────────────
export const getPropietarioByDpi = async (req, res) => {
  try {
    const propietario = await prisma.propietario.findFirst({
      where: {
        dpi:        req.params.dpi,
        deleted_at: null
      },
      include: {
        municipio: { select: { nombre: true } },
        zona:      { select: { nombre: true } },
        via:       { select: { nombre: true } },
        inmuebles: {
          where: { deleted_at: null },
          select: {
            id:                 true,
            codigo_catastral:   true,
            direccion_completa: true,
            tipo:               true,
            estado:             true,
            valor_inscrito:     true
          }
        }
      }
    })

    if (!propietario) {
      return res.status(404).json({ error: 'Propietario no encontrado' })
    }

    res.json(propietario)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// ─── POST crear ──────────────────────────────────────────
export const crearPropietario = async (req, res) => {
  try {
    const {
      tipo, nombre, dpi, nit,
      telefono, email, direccion,
      municipio_id, zona_id, via_id,
      numero_casa, colonia, referencia,
      observaciones
    } = req.body

    if (!nombre) {
      return res.status(400).json({ error: 'El nombre es requerido' })
    }

    const propietario = await prisma.propietario.create({
      data: {
        tipo,
        nombre,
        dpi,
        nit,
        telefono,
        email,
        direccion,
        numero_casa,
        colonia,
        referencia,
        observaciones,
        ...(municipio_id && { municipio: { connect: { id: parseInt(municipio_id) } } }),
        ...(zona_id      && { zona:      { connect: { id: parseInt(zona_id) } } }),
        ...(via_id       && { via:       { connect: { id: parseInt(via_id) } } })
      },
      include: {
        municipio: { select: { nombre: true } },
        zona:      { select: { nombre: true } },
        via:       { select: { nombre: true } }
      }
    })

    res.status(201).json(propietario)
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'El DPI ya está registrado' })
    }
    res.status(500).json({ error: error.message })
  }
}

// ─── PUT actualizar ──────────────────────────────────────
export const actualizarPropietario = async (req, res) => {
  try {
    const { id } = req.params
    const {
      tipo, nombre, dpi, nit,
      telefono, email, direccion,
      municipio_id, zona_id, via_id,
      numero_casa, colonia, referencia,
      observaciones
    } = req.body

    const existe = await prisma.propietario.findFirst({
      where: { id: parseInt(id), deleted_at: null }
    })

    if (!existe) {
      return res.status(404).json({ error: 'Propietario no encontrado' })
    }

    const propietario = await prisma.propietario.update({
      where: { id: parseInt(id) },
      data: {
        tipo,
        nombre,
        dpi,
        nit,
        telefono,
        email,
        direccion,
        numero_casa,
        colonia,
        referencia,
        observaciones,
        ...(municipio_id && { municipio: { connect: { id: parseInt(municipio_id) } } }),
        ...(zona_id      && { zona:      { connect: { id: parseInt(zona_id) } } }),
        ...(via_id       && { via:       { connect: { id: parseInt(via_id) } } })
      },
      include: {
        municipio: { select: { nombre: true } },
        zona:      { select: { nombre: true } },
        via:       { select: { nombre: true } }
      }
    })

    res.json(propietario)
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'El DPI ya está registrado' })
    }
    res.status(500).json({ error: error.message })
  }
}

// ─── DELETE borrado suave ────────────────────────────────
export const eliminarPropietario = async (req, res) => {
  try {
    const { id } = req.params

    const existe = await prisma.propietario.findFirst({
      where: { id: parseInt(id), deleted_at: null }
    })

    if (!existe) {
      return res.status(404).json({ error: 'Propietario no encontrado' })
    }

    await prisma.propietario.update({
      where: { id: parseInt(id) },
      data:  { deleted_at: new Date() }
    })

    res.json({ mensaje: 'Propietario eliminado correctamente' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}*/
import prisma from '../config/prisma.config.ts'

// ─── GET todos ───────────────────────────────────────────
export const getPropietarios = async (req, res) => {
  try {
    const { buscar, municipio_id, tipo, page = 1, limit = 20 } = req.query

    const where = {
      deleted_at: null,
      ...(tipo         && { tipo }),
      ...(municipio_id && { municipio_id: parseInt(municipio_id) }),
      ...(buscar && {
        OR: [
          { nombre: { contains: buscar, mode: 'insensitive' } },
          { dpi:    { contains: buscar } },
          { nit:    { contains: buscar } },
        ]
      })
    }

    const [total, propietarios] = await Promise.all([
      prisma.propietario.count({ where }),
      prisma.propietario.findMany({
        where,
        include: {
          municipio: { select: { nombre: true } },
          inmuebles: { select: { id: true, codigo_catastral: true } }
        },
        orderBy:  { nombre: 'asc' },
        skip:     (parseInt(page) - 1) * parseInt(limit),
        take:     parseInt(limit)
      })
    ])

    res.json({
      data:  propietarios,
      total,
      page:  parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// ─── GET por ID ──────────────────────────────────────────
export const getPropietarioById = async (req, res) => {
  try {
    const propietario = await prisma.propietario.findFirst({
      where: {
        id:         parseInt(req.params.id),
        deleted_at: null
      },
      include: {
        municipio:  { select: { nombre: true } },
        inmuebles: {
          where: { deleted_at: null },
          select: {
            id:               true,
            codigo_catastral: true,
            direccion_completa: true,
            tipo:             true,
            estado:           true,
            valor_inscrito:   true
          }
        },
        documentos: {
          select: {
            id:        true,
            tipo:      true,
            nombre:    true,
            url:       true,
            creado_en: true
          }
        }
      }
    })

    if (!propietario) {
      return res.status(404).json({ error: 'Propietario no encontrado' })
    }

    res.json(propietario)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// ─── GET por DPI ─────────────────────────────────────────
export const getPropietarioByDpi = async (req, res) => {
  try {
    const propietario = await prisma.propietario.findFirst({
      where: {
        dpi:        req.params.dpi,
        deleted_at: null
      },
      include: {
        municipio: { select: { nombre: true } },
        inmuebles: {
          where: { deleted_at: null },
          select: {
            id:                 true,
            codigo_catastral:   true,
            direccion_completa: true,
            tipo:               true,
            estado:             true,
            valor_inscrito:     true
          }
        }
      }
    })

    if (!propietario) {
      return res.status(404).json({ error: 'Propietario no encontrado' })
    }

    res.json(propietario)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// ─── POST crear ──────────────────────────────────────────
export const crearPropietario = async (req, res) => {
  try {
    const {
      tipo, nombre, dpi, nit,
      telefono, email, direccion,
      municipio_id, zona_id, via_id,
      numero_casa, colonia, referencia,
      observaciones
    } = req.body

    if (!nombre) {
      return res.status(400).json({ error: 'El nombre es requerido' })
    }

    const propietario = await prisma.propietario.create({
      data: {
        tipo,
        nombre,
        dpi,
        nit,
        telefono,
        email,
        direccion,
        numero_casa,
        colonia,
        referencia,
        observaciones,
        ...(municipio_id && { municipio: { connect: { id: parseInt(municipio_id) } } }),
        ...(zona_id      && { zona:      { connect: { id: parseInt(zona_id) } } }),
        ...(via_id       && { via:       { connect: { id: parseInt(via_id) } } })
      },
      include: {
        municipio: { select: { nombre: true } },
        zona:      { select: { nombre: true } },
        via:       { select: { nombre: true } }
      }
    })

    res.status(201).json(propietario)
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'El DPI ya está registrado' })
    }
    res.status(500).json({ error: error.message })
  }
}
//─── PUT actualizar ──────────────────────────────────────
export const actualizarPropietario = async (req, res) => {
  try {
    const { id } = req.params
    const {
      tipo, nombre, dpi, nit,
      telefono, email, direccion,
      municipio_id, zona_id, via_id,
      numero_casa, colonia, referencia,
      observaciones
    } = req.body

    const existe = await prisma.propietario.findFirst({
      where: { id: parseInt(id), deleted_at: null }
    })

    if (!existe) {
      return res.status(404).json({ error: 'Propietario no encontrado' })
    }

    const propietario = await prisma.propietario.update({
      where: { id: parseInt(id) },
      data: {
        tipo,
        nombre,
        dpi,
        nit,
        telefono,
        email,
        direccion,
        numero_casa,
        colonia,
        referencia,
        observaciones,
        ...(municipio_id && { municipio: { connect: { id: parseInt(municipio_id) } } }),
        ...(zona_id      && { zona:      { connect: { id: parseInt(zona_id) } } }),
        ...(via_id       && { via:       { connect: { id: parseInt(via_id) } } })
      },
      include: {
        municipio: { select: { nombre: true } },
        zona:      { select: { nombre: true } },
        via:       { select: { nombre: true } }
      }
    })

    res.json(propietario)
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'El DPI ya está registrado' })
    }
    res.status(500).json({ error: error.message })
  }
}


// ─── DELETE borrado suave ────────────────────────────────
export const eliminarPropietario = async (req, res) => {
  try {
    const { id } = req.params

    const existe = await prisma.propietario.findFirst({
      where: { id: parseInt(id), deleted_at: null }
    })

    if (!existe) {
      return res.status(404).json({ error: 'Propietario no encontrado' })
    }

    // Borrado suave — no borra el registro, solo marca la fecha
    await prisma.propietario.update({
      where: { id: parseInt(id) },
      data:  { deleted_at: new Date() }
    })

    res.json({ mensaje: 'Propietario eliminado correctamente' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}