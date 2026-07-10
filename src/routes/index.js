import { Router } from 'express'
import authRoutes        from './authRoutes.js'
import municipioRoutes   from './municipioRoutes.js'
import zonaRoutes        from './zonaRoutes.js'
import viaRoutes         from './viaRoutes.js'
import propietarioRoutes from './propietarioRoutes.js'
import inmuebleRoutes    from './inmuebleRoutes.js'
import documentoRoutes   from './documentoRoutes.js'
import departamentoRoutes from './departamentoRoutes.js'
import tipoViaRoutes      from './tipoViaRoutes.js'
import userRoutes         from './usersRoutes.js'
import documentoPropietariosRoutes   from './documentoPropietariosRoutes.js'

const router = Router()

router.use('/auth',         authRoutes)       // ← nuevo
router.use('/municipios',   municipioRoutes)
router.use('/departamentos',   departamentoRoutes)
router.use('/zonas',        zonaRoutes)
router.use('/vias',         viaRoutes)
router.use('/propietarios', propietarioRoutes)
router.use('/inmuebles',    inmuebleRoutes)
router.use('/tipos-via',    tipoViaRoutes)
router.use('/documentos',   documentoRoutes)
router.use('/users',   userRoutes)
router.use('/documentos-propietarios', documentoPropietariosRoutes)
export default router

/*
```

---
## Prueba en Postman

**Login:**
```
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "admin@catastro.gob.gt",
  "password": "Admin123!"
}*/