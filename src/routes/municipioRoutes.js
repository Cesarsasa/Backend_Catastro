import { Router } from 'express'
import {
  getMunicipios,
  getMunicipioById,
  crearMunicipio,
  actualizarMunicipio,
  eliminarMunicipio
} from '../controllers/municipioController.js'
import { verificarToken, autorizar } from '../middleware/auth.js'

const router = Router()

router.get('/',       verificarToken, getMunicipios)
router.get('/:id',    verificarToken, getMunicipioById)
router.post('/',      verificarToken, autorizar('admin', 'editor'), crearMunicipio)
router.put('/:id',    verificarToken, autorizar('admin', 'editor'), actualizarMunicipio)
router.delete('/:id', verificarToken, autorizar('admin'), eliminarMunicipio)

export default router
// src/routes/municipioRoutes.js

/**
 * @swagger
 * tags:
 *   name: Municipios
 *   description: Gestión de municipios
 */

/**
 * @swagger
 * /municipios:
 *   get:
 *     summary: Lista todos los municipios
 *     tags: [Municipios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: departamento_id
 *         schema:
 *           type: integer
 *         description: Filtrar por departamento
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
 *         description: Lista de municipios
 *       401:
 *         description: Token no proporcionado
 */

/**
 * @swagger
 * /municipios/{id}:
 *   get:
 *     summary: Obtiene un municipio por ID
 *     tags: [Municipios]
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
 *         description: Datos del municipio
 *       404:
 *         description: Municipio no encontrado
 */

/**
 * @swagger
 * /municipios:
 *   post:
 *     summary: Crea un nuevo municipio
 *     tags: [Municipios]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - departamento_id
 *               - codigo
 *               - nombre
 *             properties:
 *               departamento_id:
 *                 type: integer
 *               codigo:
 *                 type: string
 *               nombre:
 *                 type: string
 *     responses:
 *       201:
 *         description: Municipio creado
 *       400:
 *         description: El código ya está registrado
 */

/**
 * @swagger
 * /municipios/{id}:
 *   put:
 *     summary: Actualiza un municipio
 *     tags: [Municipios]
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
 *               departamento_id:
 *                 type: integer
 *               codigo:
 *                 type: string
 *               nombre:
 *                 type: string
 *     responses:
 *       200:
 *         description: Municipio actualizado exitosamente
 *       404:
 *         description: Municipio no encontrado
 *       400:
 *         description: El código ya está registrado
 */

/**
 * @swagger
 * /municipios/{id}:
 *   delete:
 *     summary: Elimina un municipio
 *     tags: [Municipios]
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
 *         description: Municipio eliminado correctamente
 *       404:
 *         description: Municipio no encontrado
 *       403:
 *         description: Solo administradores pueden eliminar
 */