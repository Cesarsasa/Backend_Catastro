import { Router } from 'express'
import {
  getZonas,
  getZonaById,
  crearZona,
  actualizarZona,
  eliminarZona
} from '../controllers/zonaController.js'
import { verificarToken, autorizar } from '../middleware/auth.js'

const router = Router()

router.get('/',       verificarToken, getZonas)
router.get('/:id',    verificarToken, getZonaById)
router.post('/',      verificarToken, autorizar('admin', 'editor'), crearZona)
router.put('/:id',    verificarToken, autorizar('admin', 'editor'), actualizarZona)
router.delete('/:id', verificarToken, autorizar('admin'), eliminarZona)

export default router
// src/routes/zonaRoutes.js

/**
 * @swagger
 * tags:
 *   name: Zonas
 *   description: Gestión de zonas catastrales
 */

/**
 * @swagger
 * /zonas:
 *   get:
 *     summary: Lista todas las zonas
 *     tags: [Zonas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: municipio_id
 *         schema:
 *           type: integer
 *         description: Filtrar por municipio
 *       - in: query
 *         name: buscar
 *         schema:
 *           type: string
 *         description: Buscar por nombre o número de zona
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
 *         description: Lista de zonas
 *       401:
 *         description: Token no proporcionado
 */

/**
 * @swagger
 * /zonas/{id}:
 *   get:
 *     summary: Obtiene una zona por ID
 *     tags: [Zonas]
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
 *         description: Datos de la zona
 *       404:
 *         description: Zona no encontrada
 */

/**
 * @swagger
 * /zonas:
 *   post:
 *     summary: Crea una nueva zona
 *     tags: [Zonas]
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
 *               - numero
 *             properties:
 *               municipio_id:
 *                 type: integer
 *               numero:
 *                 type: integer
 *               nombre:
 *                 type: string
 *     responses:
 *       201:
 *         description: Zona creada
 *       400:
 *         description: Ya existe una zona con ese número en el municipio
 */

/**
 * @swagger
 * /zonas/{id}:
 *   put:
 *     summary: Actualiza una zona
 *     tags: [Zonas]
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
 *               numero:
 *                 type: integer
 *               nombre:
 *                 type: string
 *     responses:
 *       200:
 *         description: Zona actualizada exitosamente
 *       404:
 *         description: Zona no encontrada
 *       400:
 *         description: Ya existe una zona con ese número en el municipio
 */

/**
 * @swagger
 * /zonas/{id}:
 *   delete:
 *     summary: Elimina una zona
 *     tags: [Zonas]
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
 *         description: Zona eliminada correctamente
 *       404:
 *         description: Zona no encontrada
 *       403:
 *         description: Solo administradores pueden eliminar
 */