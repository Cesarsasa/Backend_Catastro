import { Router } from 'express'
import {
  getPagos,
  getPagoById,
  crearPago,
  actualizarPago,
  eliminarPago,
  actualizarIdentificacionPago
} from '../controllers/pagoController.js'
import { verificarToken, autorizar } from '../middleware/auth.js'

const router = Router()

router.get('/',       verificarToken, getPagos)
router.get('/:id',    verificarToken, getPagoById)
router.post('/',      verificarToken, autorizar('admin', 'editor'), crearPago)
router.put('/:id',    verificarToken, autorizar('admin', 'editor'), actualizarPago)
router.delete('/:id', verificarToken, autorizar('admin'), eliminarPago)

// Nueva ruta para actualizar NIT o CF
router.patch('/identificacion', actualizarIdentificacionPago)

export default router
// src/routes/pagoRoutes.js

/**
 * @swagger
 * tags:
 *   name: Pagos
 *   description: Gestión de pagos
 */

/**
 * @swagger
 * /pagos:
 *   get:
 *     summary: Lista todos los pagos
 *     tags: [Pagos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: inmueble_id
 *         schema:
 *           type: integer
 *         description: Filtrar por inmueble
 *       - in: query
 *         name: anio
 *         schema:
 *           type: integer
 *         description: Filtrar por año
 *       - in: query
 *         name: trimestre
 *         schema:
 *           type: integer
 *         description: Filtrar por trimestre
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *         description: Filtrar por estado
 *       - in: query
 *         name: nit
 *         schema:
 *           type: string
 *         description: Filtrar por NIT
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
 *         description: Lista de pagos
 *       401:
 *         description: Token no proporcionado
 */

/**
 * @swagger
 * /pagos/{id}:
 *   get:
 *     summary: Obtiene un pago por ID
 *     tags: [Pagos]
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
 *         description: Datos del pago
 *       404:
 *         description: Pago no encontrado
 */

/**
 * @swagger
 * /pagos:
 *   post:
 *     summary: Crea un nuevo pago
 *     tags: [Pagos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - inmueble_id
 *               - anio
 *               - monto
 *               - num_recibo
 *             properties:
 *               inmueble_id:
 *                 type: integer
 *               anio:
 *                 type: integer
 *               trimestre:
 *                 type: integer
 *               monto:
 *                 type: number
 *               metodo_pago:
 *                 type: string
 *               num_recibo:
 *                 type: string
 *               nit:
 *                 type: string
 *     responses:
 *       201:
 *         description: Pago creado
 *       400:
 *         description: Número de recibo ya registrado
 */

/**
 * @swagger
 * /pagos/{id}:
 *   put:
 *     summary: Actualiza un pago
 *     tags: [Pagos]
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
 *               anio:
 *                 type: integer
 *               trimestre:
 *                 type: integer
 *               monto:
 *                 type: number
 *               estado:
 *                 type: string
 *               metodo_pago:
 *                 type: string
 *               nit:
 *                 type: string
 *     responses:
 *       200:
 *         description: Pago actualizado exitosamente
 *       404:
 *         description: Pago no encontrado
 */

/**
 * @swagger
 * /pagos/{id}:
 *   delete:
 *     summary: Elimina un pago
 *     tags: [Pagos]
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
 *         description: Pago eliminado correctamente
 *       404:
 *         description: Pago no encontrado
 *       403:
 *         description: Solo administradores pueden eliminar
 */

/**
 * @swagger
 * /pagos/identificacion:
 *   patch:
 *     summary: Actualiza NIT o CF de un pago
 *     tags: [Pagos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - num_recibo
 *             properties:
 *               num_recibo:
 *                 type: string
 *               nit:
 *                 type: string
 *                 description: NIT del contribuyente o vacío para CF
 *     responses:
 *       200:
 *         description: Identificación agregada y pago confirmado
 *       404:
 *         description: Pago no encontrado
 */
