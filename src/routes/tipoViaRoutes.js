import { Router } from 'express'
import {
  getTiposVia,
  getTipoViaById,
  crearTipoVia,
  actualizarTipoVia,
  eliminarTipoVia
} from '../controllers/tipoViaController.js'
import { verificarToken, autorizar } from '../middleware/auth.js'

const router = Router()

router.get('/',       verificarToken, getTiposVia)
router.get('/:id',    verificarToken, getTipoViaById)
router.post('/',      verificarToken, autorizar('admin', 'editor'), crearTipoVia)
router.put('/:id',    verificarToken, autorizar('admin', 'editor'), actualizarTipoVia)
router.delete('/:id', verificarToken, autorizar('admin'), eliminarTipoVia)

export default router
// src/routes/tipoViaRoutes.js

/**
 * @swagger
 * tags:
 *   name: Tipos de Vía
 *   description: Gestión de tipos de vía
 */

/**
 * @swagger
 * /tipos-via:
 *   get:
 *     summary: Lista todos los tipos de vía
 *     tags: [Tipos de Vía]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: buscar
 *         schema:
 *           type: string
 *         description: Buscar por nombre
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
 *         description: Lista de tipos de vía
 *       401:
 *         description: Token no proporcionado
 */

/**
 * @swagger
 * /tipos-via/{id}:
 *   get:
 *     summary: Obtiene un tipo de vía por ID
 *     tags: [Tipos de Vía]
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
 *         description: Datos del tipo de vía
 *       404:
 *         description: Tipo de vía no encontrado
 */

/**
 * @swagger
 * /tipos-via:
 *   post:
 *     summary: Crea un nuevo tipo de vía
 *     tags: [Tipos de Vía]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *             properties:
 *               nombre:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tipo de vía creado
 *       400:
 *         description: Nombre ya existente
 */

/**
 * @swagger
 * /tipos-via/{id}:
 *   put:
 *     summary: Actualiza un tipo de vía
 *     tags: [Tipos de Vía]
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
 *             properties:
 *               nombre:
 *                 type: string
 *     responses:
 *       200:
 *         description: Tipo de vía actualizado exitosamente
 *       404:
 *         description: Tipo de vía no encontrado
 *       400:
 *         description: Nombre ya existente
 */

/**
 * @swagger
 * /tipos-via/{id}:
 *   delete:
 *     summary: Elimina un tipo de vía
 *     tags: [Tipos de Vía]
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
 *         description: Tipo de vía eliminado correctamente
 *       404:
 *         description: Tipo de vía no encontrado
 *       403:
 *         description: Solo administradores pueden eliminar
 */
