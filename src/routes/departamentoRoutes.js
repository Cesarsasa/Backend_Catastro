// src/routes/departamentoRoutes.js
import { Router } from 'express'
import {
  getDepartamentos,
  getDepartamentoById,
  crearDepartamento,
  actualizarDepartamento,
  eliminarDepartamento
} from '../controllers/departamentoController.js'
import { verificarToken, autorizar } from '../middleware/auth.js'

const router = Router()

router.get('/',       verificarToken, getDepartamentos)
router.get('/:id',    verificarToken, getDepartamentoById)
router.post('/',      verificarToken, autorizar('admin', 'editor'), crearDepartamento)
router.put('/:id',    verificarToken, autorizar('admin', 'editor'), actualizarDepartamento)
router.delete('/:id', verificarToken, autorizar('admin'), eliminarDepartamento)

export default router

/**
 * @swagger
 * tags:
 *   name: Departamentos
 *   description: Gestión de departamentos
 */

/**
 * @swagger
 * /departamentos:
 *   get:
 *     summary: Lista todos los departamentos
 *     tags: [Departamentos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: buscar
 *         schema:
 *           type: string
 *         description: Buscar por nombre o código
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
 *         description: Lista de departamentos
 *       401:
 *         description: Token no proporcionado
 */

/**
 * @swagger
 * /departamentos/{id}:
 *   get:
 *     summary: Obtiene un departamento por ID
 *     tags: [Departamentos]
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
 *         description: Datos del departamento
 *       404:
 *         description: Departamento no encontrado
 */

/**
 * @swagger
 * /departamentos:
 *   post:
 *     summary: Crea un nuevo departamento
 *     tags: [Departamentos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - codigo
 *               - nombre
 *             properties:
 *               codigo:
 *                 type: string
 *               nombre:
 *                 type: string
 *     responses:
 *       201:
 *         description: Departamento creado
 *       400:
 *         description: El código ya está registrado
 */

/**
 * @swagger
 * /departamentos/{id}:
 *   put:
 *     summary: Actualiza un departamento
 *     tags: [Departamentos]
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
 *               codigo:
 *                 type: string
 *               nombre:
 *                 type: string
 *     responses:
 *       200:
 *         description: Departamento actualizado exitosamente
 *       404:
 *         description: Departamento no encontrado
 *       400:
 *         description: El código ya está registrado
 */

/**
 * @swagger
 * /departamentos/{id}:
 *   delete:
 *     summary: Elimina un departamento
 *     tags: [Departamentos]
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
 *         description: Departamento eliminado correctamente
 *       404:
 *         description: Departamento no encontrado
 *       403:
 *         description: Solo administradores pueden eliminar
 */
