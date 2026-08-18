import { Router } from 'express'
import {
  getPropietarios,
  getPropietarioById,
  getPropietarioByDpi,
  crearPropietario,
  actualizarPropietario,
  eliminarPropietario,
  getPropietarioCount
} from '../controllers/propietarioController.js'
import { verificarToken, autorizar } from '../middleware/auth.js'

const router = Router()

router.get('/',           verificarToken, getPropietarios)
router.get('/count',      verificarToken, getPropietarioCount)
router.get('/:id',        verificarToken, getPropietarioById)
router.get('/dpi-user/:dpi',   getPropietarioByDpi)
router.get('/dpi/:dpi',   verificarToken, getPropietarioByDpi)
router.post('/',          verificarToken, autorizar('admin', 'editor'), crearPropietario)
router.put('/:id',        verificarToken, autorizar('admin', 'editor'), actualizarPropietario)
router.delete('/:id',     verificarToken, autorizar('admin'), eliminarPropietario)

export default router
// src/routes/propietarioRoutes.js

/**
 * @swagger
 * tags:
 *   name: Propietarios
 *   description: Gestión de propietarios y contribuyentes
 */

/**
 * @swagger
 * /propietarios:
 *   get:
 *     summary: Lista todos los propietarios
 *     tags: [Propietarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: buscar
 *         schema:
 *           type: string
 *         description: Buscar por nombre, DPI o NIT
 *       - in: query
 *         name: municipio_id
 *         schema:
 *           type: integer
 *         description: Filtrar por municipio
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
 *         description: Lista de propietarios
 *       401:
 *         description: Token no proporcionado
 */
//router.get('/', verificarToken, getPropietarios)

/**
 * @swagger
 * /propietarios/{id}:
 *   get:
 *     summary: Obtiene un propietario por ID
 *     tags: [Propietarios]
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
 *         description: Datos del propietario
 *       404:
 *         description: Propietario no encontrado
 */
//router.get('/:id', verificarToken, getPropietarioById)

/**
 * @swagger
 * /propietarios:
 *   post:
 *     summary: Crea un nuevo propietario
 *     tags: [Propietarios]
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
 *               tipo:
 *                 type: string
 *                 enum: [persona, empresa]
 *               nombre:
 *                 type: string
 *               dpi:
 *                 type: string
 *               nit:
 *                 type: string
 *               telefono:
 *                 type: string
 *               email:
 *                 type: string
 *               direccion:
 *                 type: string
 *               municipio_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Propietario creado
 *       400:
 *         description: DPI ya registrado
 */
//router.post('/', verificarToken, autorizar('admin', 'editor'), crearPropietario)
/**
 * @swagger
 * /propietarios/{id}:
 *   delete:
 *     summary: Elimina un propietario (borrado suave)
 *     tags: [Propietarios]
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
 *         description: Propietario eliminado correctamente
 *       404:
 *         description: Propietario no encontrado
 *       403:
 *         description: Solo administradores pueden eliminar
 */

/**
 * @swagger
 * /propietarios/{id}:
 *   put:
 *     summary: Actualiza un propietario
 *     tags: [Propietarios]
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
 *               tipo:
 *                 type: string
 *                 enum: [persona, empresa]
 *               nombre:
 *                 type: string
 *               dpi:
 *                 type: string
 *               nit:
 *                 type: string
 *               telefono:
 *                 type: string
 *               email:
 *                 type: string
 *               direccion:
 *                 type: string
 *               municipio_id:
 *                 type: integer
 *               observaciones:
 *                 type: string
 *     responses:
 *       200:
 *         description: Propietario actualizado exitosamente
 *       404:
 *         description: Propietario no encontrado
 *       400:
 *         description: El DPI ya está registrado
 */