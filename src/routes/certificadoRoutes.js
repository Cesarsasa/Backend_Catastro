import { Router } from 'express'
import { getCertificados,subirCertificado, listarCertificados, eliminarCertificado, obtenerCertificadoPorId,obtenerCertificadosPorInmueble} from '../controllers/certificadoController.js'
import { verificarToken } from '../middleware/auth.js'

const router = Router()

/**
 * @swagger
 * components:
 *   schemas:
 *     Certificado:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         inmueble_id:
 *           type: integer
 *         nombre:
 *           type: string
 *         ruta_s3:
 *           type: string
 *         url:
 *           type: string
 *         tamano_bytes:
 *           type: integer
 *         mime_type:
 *           type: string
 *         subido_por:
 *           type: integer
 *         creado_en:
 *           type: string
 *           format: date-time
 *         estado:
 *           type: string
 *           enum: [bloqueado, activo, vencido]
 *         vigencia_hasta:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /certificados/upload:
 *   post:
 *     summary: Subir un certificado a S3
 *     tags: [Certificados]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               inmueble_id:
 *                 type: integer
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Certificado subido correctamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Certificado'
 */
router.post('/upload', verificarToken, subirCertificado)

/**
 * @swagger
 * /certificados:
 *   get:
 *     summary: Listar certificados
 *     tags: [Certificados]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de certificados
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Certificado'
 */
router.get('/', verificarToken, listarCertificados)
/**
 * @swagger
 * /certificados/inmueble/{id}:
 *   get:
 *     summary: Obtener certificados por id de inmueble
 *     tags: [Certificados]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Id del inmueble cuyos certificados se desean obtener
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Página para paginación (opcional)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Límite por página (opcional)
 *     responses:
 *       200:
 *         description: Certificados encontrados para el inmueble
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Certificado'
 *       400:
 *         description: Id inválido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: ID de inmueble inválido
 *       404:
 *         description: No se encontraron certificados para ese inmueble
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error interno del servidor
 */
router.get('/inmueble/:id', verificarToken, obtenerCertificadosPorInmueble)

/**
 * @swagger
 * /certificados/certificados:
 *   get:
 *     summary: Obtener certificados por DPI de propietario o código catastral de inmueble
 *     tags: [Certificados]
 *     parameters:
 *       - in: query
 *         name: dpi
 *         schema:
 *           type: string
 *         description: DPI del propietario cuyos certificados se desean consultar
 *       - in: query
 *         name: codigo
 *         schema:
 *           type: string
 *         description: Código catastral del inmueble cuyos certificados se desean consultar
 *     responses:
 *       200:
 *         description: Lista de certificados encontrados
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 allOf:
 *                   - $ref: '#/components/schemas/Certificado'
 *                   - type: object
 *                     properties:
 *                       codigo_catastral:
 *                         type: string
 *                         description: Código catastral del inmueble
 *                       direccion_completa:
 *                         type: string
 *                         description: Dirección completa del inmueble
 *       400:
 *         description: Debe proporcionar dpi o código catastral
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Debe proporcionar dpi o codigo catastral
 *       404:
 *         description: No se encontraron certificados
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: No se encontraron certificados
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Error interno al obtener certificados
 */

router.get('/certificados', getCertificados);

/**
 * @swagger
 * /certificados/{id}:
 *   get:
 *     summary: Obtener un certificado por su id
 *     tags: [Certificados]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Id del certificado a obtener
 *     responses:
 *       200:
 *         description: Certificado encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Certificado'
 *       404:
 *         description: Certificado no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Certificado no encontrado
 *       400:
 *         description: Id inválido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Id inválido
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Error interno al obtener certificado.
 */
router.get('/:id', verificarToken, obtenerCertificadoPorId)


/**
 * @swagger
 * /certificados/{id}:
 *   delete:
 *     summary: Eliminar un certificado
 *     tags: [Certificados]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del certificado a eliminar
 *     responses:
 *       200:
 *         description: Certificado eliminado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje:
 *                   type: string
 *                   example: Certificado eliminado correctamente.
 *       404:
 *         description: Certificado no encontrado
 *       500:
 *         description: Error interno al eliminar certificado
 */
router.delete('/:id', verificarToken, eliminarCertificado)


export default router
