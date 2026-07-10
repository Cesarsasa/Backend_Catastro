import { Router } from 'express'
import { subirDocumentos, listarDocumentos, eliminarDocumento, listarDocumentosPorInmueble} from '../controllers/documentoController.js'
import { verificarToken } from '../middleware/auth.js'

const router = Router()

/**
 * @swagger
 * components:
 *   schemas:
 *     Documento:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         inmueble_id:
 *           type: integer
 *         propietario_id:
 *           type: integer
 *         tipo:
 *           type: string
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
 */

/**
 * @swagger
 * /documentos/upload:
 *   post:
 *     summary: Subir documentos a S3
 *     tags: [Documentos]
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
 *               propietario_id:
 *                 type: integer
 *               tipo:
 *                 type: string
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Documentos subidos correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje:
 *                   type: string
 *                 documentos:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Documento'
 */
router.post('/upload', verificarToken, subirDocumentos)

/**
 * @swagger
 * /documentos:
 *   get:
 *     summary: Listar documentos
 *     tags: [Documentos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de documentos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Documento'
 */
router.get('/', verificarToken, listarDocumentos)

/**
 * @swagger
 * /documentos/{id}:
 *   delete:
 *     summary: Eliminar un documento
 *     tags: [Documentos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del documento a eliminar
 *     responses:
 *       200:
 *         description: Documento eliminado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje:
 *                   type: string
 *                   example: Documento eliminado correctamente.
 *       404:
 *         description: Documento no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Documento no encontrado.
 *       500:
 *         description: Error interno al eliminar documento
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Error interno al eliminar documento.
 */
router.delete('/:id', verificarToken, eliminarDocumento)

router.get('/:inmuebleId', verificarToken, listarDocumentosPorInmueble) 

export default router