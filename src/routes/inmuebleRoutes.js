import { Router } from 'express'
import {
  getInmuebles,
  getInmuebleById,
  getInmuebleByCodigo,
  crearInmueble,
  actualizarInmueble,
  eliminarInmueble
} from '../controllers/inmuebleController.js'
import { verificarToken, autorizar } from '../middleware/auth.js'

const router = Router()

/**
 * @swagger
 * tags:
 *   name: Inmuebles
 *   description: Gestión de inmuebles y propiedades
 */

/**
 * @swagger
 * /inmuebles:
 *   get:
 *     summary: Lista todos los inmuebles
 *     tags: [Inmuebles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: buscar
 *         schema:
 *           type: string
 *         description: Buscar por código catastral, finca o dirección
 *       - in: query
 *         name: municipio_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: zona_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *           enum: [urbano, rural, comercial, industrial]
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [activo, inactivo, en_disputa, en_proceso]
 *       - in: query
 *         name: propietario_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Lista paginada de inmuebles
 *       401:
 *         description: Token no proporcionado
 */
router.get('/', verificarToken, getInmuebles)

/**
 * @swagger
 * /inmuebles/codigo/{codigo}:
 *   get:
 *     summary: Busca un inmueble por código catastral
 *     tags: [Inmuebles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: codigo
 *         required: true
 *         schema:
 *           type: string
 *         example: 040901020001
 *     responses:
 *       200:
 *         description: Datos del inmueble con propietario y coordenadas
 *       404:
 *         description: Inmueble no encontrado
 */
router.get('/codigo/:codigo', verificarToken, getInmuebleByCodigo)

/**
 * @swagger
 * /inmuebles/{id}:
 *   get:
 *     summary: Obtiene un inmueble por ID
 *     tags: [Inmuebles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Datos completos del inmueble
 *       404:
 *         description: Inmueble no encontrado
 */
router.get('/:id', verificarToken, getInmuebleById)

/**
 * @swagger
 * /inmuebles:
 *   post:
 *     summary: Crea un nuevo inmueble
 *     tags: [Inmuebles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - codigo_catastral
 *             properties:
 *               codigo_catastral:
 *                 type: string
 *                 example: 040901020002
 *               propietario_id:
 *                 type: integer
 *               municipio_id:
 *                 type: integer
 *               zona_id:
 *                 type: integer
 *               via_id:
 *                 type: integer
 *               numero_casa:
 *                 type: string
 *                 example: 4-39
 *               colonia:
 *                 type: string
 *               referencia:
 *                 type: string
 *               tipo:
 *                 type: string
 *                 enum: [urbano, rural, comercial, industrial]
 *               uso:
 *                 type: string
 *                 example: Vivienda Unifamiliar
 *               area_m2:
 *                 type: number
 *                 example: 241.15
 *               area_registrada:
 *                 type: number
 *                 example: 241.15
 *               area_real:
 *                 type: number
 *                 example: 241.15
 *               valor_inscrito:
 *                 type: number
 *                 example: 50000
 *               no_inscripcion_iusi:
 *                 type: string
 *               finca:
 *                 type: string
 *               folio:
 *                 type: string
 *               libro:
 *                 type: string
 *               departamento_registro:
 *                 type: string
 *               lat:
 *                 type: number
 *                 example: 14.631206
 *               lng:
 *                 type: number
 *                 example: -90.922253
 *               poligono_puntos:
 *                 type: array
 *                 description: Array de puntos [[lat,lng], ...]
 *     responses:
 *       201:
 *         description: Inmueble creado exitosamente
 *       400:
 *         description: Código catastral ya registrado
 */
router.post('/', verificarToken, autorizar('admin', 'editor'), crearInmueble)

/**
 * @swagger
 * /inmuebles/{id}:
 *   put:
 *     summary: Actualiza un inmueble
 *     tags: [Inmuebles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Inmueble actualizado
 *       404:
 *         description: Inmueble no encontrado
 */
router.put('/:id', verificarToken, autorizar('admin', 'editor'), actualizarInmueble)

/**
 * @swagger
 * /inmuebles/{id}:
 *   delete:
 *     summary: Elimina un inmueble (borrado suave)
 *     tags: [Inmuebles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Inmueble eliminado correctamente
 *       404:
 *         description: Inmueble no encontrado
 */
router.delete('/:id', verificarToken, autorizar('admin'), eliminarInmueble)

export default router