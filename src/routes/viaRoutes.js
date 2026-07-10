import { Router } from 'express'
import {
  getVias,
  getViaById,
  crearVia,
  actualizarVia,
  eliminarVia
} from '../controllers/viaController.js'
import { verificarToken, autorizar } from '../middleware/auth.js'

const router = Router()

router.get('/',       verificarToken, getVias)
router.get('/:id',    verificarToken, getViaById)
router.post('/',      verificarToken, autorizar('admin', 'editor'), crearVia)
router.put('/:id',    verificarToken, autorizar('admin', 'editor'), actualizarVia)
router.delete('/:id', verificarToken, autorizar('admin'), eliminarVia)

export default router
// src/routes/viaRoutes.js

/**
 * @swagger
 * tags:
 *   name: Vías
 *   description: Gestión de vías catastrales
 */

/**
 * @swagger
 * /vias:
 *   get:
 *     summary: Lista todas las vías
 *     tags: [Vías]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: municipio_id
 *         schema:
 *           type: integer
 *         description: Filtrar por municipio
 *       - in: query
 *         name: zona_id
 *         schema:
 *           type: integer
 *         description: Filtrar por zona
 *       - in: query
 *         name: tipo_via_id
 *         schema:
 *           type: integer
 *         description: Filtrar por tipo de vía
 *       - in: query
 *         name: buscar
 *         schema:
 *           type: string
 *         description: Buscar por nombre o número de vía
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
 *         description: Lista de vías
 *       401:
 *         description: Token no proporcionado
 */

/**
 * @swagger
 * /vias/{id}:
 *   get:
 *     summary: Obtiene una vía por ID
 *     tags: [Vías]
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
 *         description: Datos de la vía
 *       404:
 *         description: Vía no encontrada
 */

/**
 * @swagger
 * /vias:
 *   post:
 *     summary: Crea una nueva vía
 *     tags: [Vías]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - municipio_id
 *               - tipo_via_id
 *               - numero
 *             properties:
 *               municipio_id:
 *                 type: integer
 *               zona_id:
 *                 type: integer
 *               tipo_via_id:
 *                 type: integer
 *               numero:
 *                 type: string
 *               nombre:
 *                 type: string
 *     responses:
 *       201:
 *         description: Vía creada
 *       400:
 *         description: Datos inválidos
 */

/**
 * @swagger
 * /vias/{id}:
 *   put:
 *     summary: Actualiza una vía
 *     tags: [Vías]
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
 *               municipio_id:
 *                 type: integer
 *               zona_id:
 *                 type: integer
 *               tipo_via_id:
 *                 type: integer
 *               numero:
 *                 type: string
 *               nombre:
 *                 type: string
 *     responses:
 *       200:
 *         description: Vía actualizada exitosamente
 *       404:
 *         description: Vía no encontrada
 */

/**
 * @swagger
 * /vias/{id}:
 *   delete:
 *     summary: Elimina una vía
 *     tags: [Vías]
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
 *         description: Vía eliminada correctamente
 *       404:
 *         description: Vía no encontrada
 *       403:
 *         description: Solo administradores pueden eliminar
 */