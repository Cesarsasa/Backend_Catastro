// src/routes/auditoriaRoutes.js
import { Router } from 'express'
import {
  getAuditorias,
  getAuditoriaById,
  crearAuditoria,
  eliminarAuditoria
} from '../controllers/auditoriaController.js'
import { verificarToken, autorizar } from '../middleware/auth.js'

const router = Router()

router.get('/',       verificarToken, autorizar('admin'), getAuditorias)
router.get('/:id',    verificarToken, autorizar('admin'), getAuditoriaById)
router.post('/',      verificarToken, autorizar('admin'), crearAuditoria)
// Nota: normalmente no se elimina auditoría, pero se deja la ruta
router.delete('/:id', verificarToken, autorizar('admin'), eliminarAuditoria)

export default router

/**
 * @swagger
 * tags:
 *   name: Auditorias
 *   description: Registro de acciones en el sistema
 */

/**
 * @swagger
 * /auditorias:
 *   get:
 *     summary: Lista todas las auditorías
 *     tags: [Auditorias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: tabla
 *         schema:
 *           type: string
 *         description: Filtrar por nombre de tabla
 *       - in: query
 *         name: usuario_id
 *         schema:
 *           type: integer
 *         description: Filtrar por usuario
 *       - in: query
 *         name: accion
 *         schema:
 *           type: string
 *         description: Filtrar por acción (CREATE, UPDATE, DELETE)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Registros por página
 *     responses:
 *       200:
 *         description: Lista de auditorías
 *       401:
 *         description: Token no proporcionado
 *       403:
 *         description: Solo administradores pueden acceder
 */

/**
 * @swagger
 * /auditorias/{id}:
 *   get:
 *     summary: Obtiene una auditoría por ID
 *     tags: [Auditorias]
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
 *         description: Datos de la auditoría
 *       404:
 *         description: Auditoría no encontrada
 */

/**
 * @swagger
 * /auditorias:
 *   post:
 *     summary: Crea un registro de auditoría
 *     tags: [Auditorias]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tabla
 *               - registro_id
 *               - accion
 *             properties:
 *               tabla:
 *                 type: string
 *               registro_id:
 *                 type: integer
 *               accion:
 *                 type: string
 *               datos_antes:
 *                 type: object
 *               datos_despues:
 *                 type: object
 *               usuario_id:
 *                 type: integer
 *               ip:
 *                 type: string
 *     responses:
 *       201:
 *         description: Auditoría creada
 *       400:
 *         description: Datos incompletos
 */

/**
 * @swagger
 * /auditorias/{id}:
 *   delete:
 *     summary: Elimina una auditoría (no recomendado)
 *     tags: [Auditorias]
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
 *         description: Auditoría eliminada correctamente
 *       404:
 *         description: Auditoría no encontrada
 *       403:
 *         description: Solo administradores pueden eliminar
 */
