import jwt from 'jsonwebtoken'

export const verificarToken = (req, res, next) => {
  try {
    // El token viene en el header así:
    // Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token no proporcionado' })
    }

    const token = authHeader.split(' ')[1]

    // Verifica y decodifica el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // Guarda el usuario en req para usarlo en los controllers
    req.usuario = decoded

    next()
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado' })
    }
    return res.status(401).json({ error: 'Token inválido' })
  }
}

// Middleware de roles — úsalo después de verificarToken
export const autorizar = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.usuario.rol)) {
      return res.status(403).json({
        error: `Acceso denegado. Se requiere rol: ${roles.join(' o ')}`
      })
    }
    next()
  }
}