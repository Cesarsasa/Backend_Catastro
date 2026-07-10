import { Router } from 'express'
import { login, me } from '../controllers/authController.js'
import { verificarToken } from '../middleware/auth.js'

const router = Router()

router.post('/login', login)
router.get('/me', verificarToken, me)  // ruta protegida

export default router

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Obtiene el usuario autenticado actual
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Datos del usuario actual
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 nombre:
 *                   type: string
 *                 email:
 *                   type: string
 *                 rol:
 *                   type: string
 *                   enum: [admin, editor, consulta]
 *                 activo:
 *                   type: boolean
 *                 creado_en:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Token no proporcionado o inválido
 */
/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Autenticación del sistema
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Iniciar sesión
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: admin@catastro.gob.gt
 *               password:
 *                 type: string
 *                 example: Admin123!
 *     responses:
 *       200:
 *         description: Login exitoso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiJ9...
 *                 usuario:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     nombre:
 *                       type: string
 *                     email:
 *                       type: string
 *                     rol:
 *                       type: string
 *                       enum: [admin, editor, consulta]
 *       400:
 *         description: Email y password son requeridos
 *       401:
 *         description: Credenciales incorrectas o usuario inactivo
 */