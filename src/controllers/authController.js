import prisma from '../config/prisma.config.ts'
import jwt    from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

export const login = async (req, res) => {
  try {
    const { email, password } = req.body

    // 1. Validar que vengan los datos
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y password son requeridos' })
    }

    // 2. Buscar usuario
    const usuario = await prisma.usuario.findUnique({
      where: { email }
    })

    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales incorrectas' })
    }

    // 3. Verificar que esté activo
    if (!usuario.activo) {
      return res.status(401).json({ error: 'Usuario inactivo' })
    }

    // 4. Verificar password
    const passwordValido = await bcrypt.compare(password, usuario.password)
    if (!passwordValido) {
      return res.status(401).json({ error: 'Credenciales incorrectas' })
    }

    // 5. Generar token JWT
    const token = jwt.sign(
      {
        id:     usuario.id,
        email:  usuario.email,
        rol:    usuario.rol,
        nombre: usuario.nombre
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
    )

    // 6. Responder sin el password
    const { password: _, ...usuarioSinPassword } = usuario

    res.json({
      token,
      usuario: usuarioSinPassword
    })

  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// Ruta protegida — devuelve el usuario actual
export const me = async (req, res) => {
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: req.usuario.id },
      select: {
        id:        true,
        nombre:    true,
        email:     true,
        rol:       true,
        activo:    true,
        creado_en: true
      }
    })

    res.json(usuario)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}