import prisma from '../config/prisma.config.ts'

// ─── GET todos ───────────────────────────────────────────
export const getPagos = async (req, res) => {
  try {
    const { inmueble_id, anio, trimestre, estado, nit, page = 1, limit = 20 } = req.query

    const where = {
      ...(inmueble_id && { inmueble_id: parseInt(inmueble_id) }),
      ...(anio && { anio: parseInt(anio) }),
      ...(trimestre && { trimestre: parseInt(trimestre) }),
      ...(estado && { estado }),
      ...(nit && { nit: { contains: nit, mode: 'insensitive' } })
    }

    const [total, pagos] = await Promise.all([
      prisma.pago.count({ where }),
      prisma.pago.findMany({
        where,
        include: {
          inmueble: { select: { id: true, codigo_catastral: true, direccion_completa: true } },
          registrador: { select: { id: true, nombre: true } }
        },
        orderBy: { creado_en: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit)
      })
    ])

    res.json({
      data: pagos,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// ─── GET por ID ──────────────────────────────────────────
export const getPagoById = async (req, res) => {
  try {
    const pago = await prisma.pago.findFirst({
      where: { id: parseInt(req.params.id) },
      include: {
        inmueble: { select: { id: true, codigo_catastral: true, direccion_completa: true } },
        registrador: { select: { id: true, nombre: true } }
      }
    })

    if (!pago) {
      return res.status(404).json({ error: 'Pago no encontrado' })
    }

    res.json(pago)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// ─── POST crear ──────────────────────────────────────────
export const crearPago = async (req, res) => {
  try {
    const { inmueble_id, anio, trimestre, monto, metodo_pago, num_recibo, nit, registrado_por } = req.body

    if (!inmueble_id || !anio || !monto || !num_recibo) {
      return res.status(400).json({ error: 'Inmueble, año, monto y número de recibo son requeridos' })
    }

    const pago = await prisma.pago.create({
      data: {
        inmueble: { connect: { id: parseInt(inmueble_id) } },
        anio: parseInt(anio),
        trimestre: trimestre ? parseInt(trimestre) : null,
        monto,
        estado: 'pagado',
        fecha_pago: new Date(),
        metodo_pago,
        num_recibo,
        nit,
        ...(registrado_por && { registrador: { connect: { id: parseInt(registrado_por) } } })
      },
      include: {
        inmueble: { select: { codigo_catastral: true } },
        registrador: { select: { nombre: true } }
      }
    })

    res.status(201).json(pago)
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'El número de recibo ya está registrado' })
    }
    res.status(500).json({ error: error.message })
  }
}

// ─── PUT actualizar ──────────────────────────────────────
export const actualizarPago = async (req, res) => {
  try {
    const { id } = req.params
    const { anio, trimestre, monto, estado, metodo_pago, nit } = req.body

    const existe = await prisma.pago.findFirst({ where: { id: parseInt(id) } })
    if (!existe) {
      return res.status(404).json({ error: 'Pago no encontrado' })
    }

    const pago = await prisma.pago.update({
      where: { id: parseInt(id) },
      data: {
        ...(anio && { anio: parseInt(anio) }),
        ...(trimestre && { trimestre: parseInt(trimestre) }),
        ...(monto && { monto }),
        ...(estado && { estado }),
        ...(metodo_pago && { metodo_pago }),
        ...(nit && { nit })
      }
    })

    res.json(pago)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// ─── DELETE ──────────────────────────────────────────────
export const eliminarPago = async (req, res) => {
  try {
    const { id } = req.params

    const existe = await prisma.pago.findFirst({ where: { id: parseInt(id) } })
    if (!existe) {
      return res.status(404).json({ error: 'Pago no encontrado' })
    }

    await prisma.pago.delete({ where: { id: parseInt(id) } })

    res.json({ mensaje: 'Pago eliminado correctamente' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// ─── PATCH actualizar NIT o CF ──────────────────────────
export const actualizarIdentificacionPago = async (req, res) => {
  try {
    const { num_recibo, nit } = req.body

    if (!num_recibo) {
      return res.status(400).json({ error: 'Número de recibo es requerido' })
    }

    // Si el NIT viene vacío o null, asignamos "CF"
    const valorNit = nit && nit.trim() !== '' ? nit.trim() : 'CF'

    const pago = await prisma.pago.findFirst({ where: { num_recibo } })
    if (!pago) {
      return res.status(404).json({ error: 'Pago no encontrado' })
    }

    const pagoActualizado = await prisma.pago.update({
      where: { num_recibo },
      data: {
        nit: valorNit,
        estado: 'pagado'
      }
    })

    res.json({ mensaje: 'Identificación agregada y pago confirmado', pago: pagoActualizado })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
