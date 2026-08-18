// src/routes/pagoRoutes.js
import { Router } from 'express';
import { generarConstanciaPago, validarPagoVigente } from '../controllers/constanciaController.js';
import {generarCertificacionCatastral } from '../controllers/certificadoautoController.js';
import { verificarToken } from '../middleware/auth.js';

const router = Router();

// ─── Generar constancia PDF ─────────────────────────────
router.get('/:pago_id/constancia',  generarConstanciaPago);

// ─── Validar último pago vigente ───────────────────────
router.get('/validar/:inmueble_id', validarPagoVigente);


// ─── Certificación catastral ─────────────────────────────
router.get('/inmueble/:inmueble_id/certificacion',generarCertificacionCatastral );

export default router;
/**
 * @swagger
 * tags:
 *   name: Pagos
 *   description: Gestión de pagos y constancias
 */

/**
 * @swagger
 * /pagos/{pago_id}/constancia:
 *   get:
 *     summary: Generar constancia de pago en PDF
 *     tags: [Pagos]
 *     parameters:
 *       - in: path
 *         name: pago_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del pago para generar la constancia
 *     responses:
 *       200:
 *         description: Constancia PDF generada exitosamente
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Pago no encontrado
 *       500:
 *         description: Error interno al generar constancia
 */

/**
 * @swagger
 * /pagos/validar/{inmueble_id}:
 *   get:
 *     summary: Validar si el último pago de un inmueble está vigente
 *     tags: [Pagos]
 *     parameters:
 *       - in: path
 *         name: inmueble_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del inmueble a validar
 *     responses:
 *       200:
 *         description: Pago vigente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje:
 *                   type: string
 *                   example: Pago vigente
 *                 pago:
 *                   type: object
 *                   description: Datos del último pago
 *       404:
 *         description: No hay pagos registrados
 *       403:
 *         description: El último pago ha vencido, debe realizar uno nuevo
 *       500:
 *         description: Error interno al validar pago
 */
