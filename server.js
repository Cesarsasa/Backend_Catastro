import express      from 'express'
import cors         from 'cors'
import helmet       from 'helmet'
import morgan       from 'morgan'
import dotenv       from 'dotenv'
import pool         from './src/config/database.js'
import routes   from './src/routes/index.js'
import swaggerUi      from 'swagger-ui-express'
import swaggerSpec    from './src/config/swagger.js'


dotenv.config()

const app  = express()
const PORT = process.env.PORT || 3000

// ─── Middlewares globales ─────────────────────────────
app.use(cors())
app.use(helmet())
app.use(morgan('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
// ─── Swagger ─────────────────────────────────────────────
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

// ─── Ruta de prueba ───────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    mensaje: '🏛️ Sistema Catastral Municipal - API funcionando',
    version: '1.0.0',
    estado:  'activo',
    documentacion: `http://localhost:${PORT}/api/docs`
  })
})

// ─── Rutas (las iremos agregando) ────────────────────
// import inmuebleRoutes     from './src/routes/inmuebleRoutes.js'
// import propietarioRoutes  from './src/routes/propietarioRoutes.js'
// app.use('/api/inmuebles',    inmuebleRoutes)
// app.use('/api/propietarios', propietarioRoutes)
app.use('/api', routes)
// ─── Manejo de rutas no encontradas ──────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' })
})

// ─── Manejo global de errores ─────────────────────────
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message)
  res.status(500).json({ error: 'Error interno del servidor' })
})

// ─── Iniciar servidor ─────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`)
    console.log(`📚 Documentación en http://localhost:${PORT}/api/docs`)
})