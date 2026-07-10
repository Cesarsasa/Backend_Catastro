import { Router } from 'express'
import { subirDocumentos, listarDocumentos, eliminarDocumento, listarDocumentosPorPropietario} from '../controllers/DocumentoPropietarioController.js'
import { verificarToken } from '../middleware/auth.js'

const router = Router()

/**
 * @swagger
 * components:
 *   schemas:
 *     DocumentoPropetario:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         propietario_id:
 *           type: integer
 *      
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
 * /documentos-propietarios/upload:
 *   post:
 *     summary: Subir documentos a S3
 *     tags: [DocumentosPropietarios]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
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
 *                     $ref: '#/components/schemas/DocumentoPropetario'
 */
router.post('/upload', verificarToken, subirDocumentos)

/**
 * @swagger
 * /documentos-propietarios:
 *   get:
 *     summary: Listar documentos
 *     tags: [DocumentosPropietarios]
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
 *                 $ref: '#/components/schemas/DocumentoPropetario'
 */
router.get('/', verificarToken, listarDocumentos)

/**
 * @swagger
 * /documentos-propietarios/{id}:
 *   delete:
 *     summary: Eliminar un documento
 *     tags: [DocumentosPropietarios]
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

router.get('/:propietarioId', verificarToken, listarDocumentosPorPropietario) 

export default router