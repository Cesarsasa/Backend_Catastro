import express, { Router } from 'express';
import { crearPagoPolar, webhookPolar } from '../controllers/polarController.js';

const router = Router();

// Crear sesión de pago
router.post('/crear-sesion', crearPagoPolar);

// Webhook (Polar manda JSON directo, no requiere raw body en sandbox)
router.post('/webhook', express.raw({ type: 'application/json' }), webhookPolar);

export default router;


/**
 * @swagger
 * tags:
 *   name: Polar
 *   description: Integración de pagos con Polar
 */

/**
 * @swagger
 * /polar/crear-sesion:
 *   post:
 *     summary: Crear sesión de pago en Polar
 *     tags: [Polar]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - inmueble_id
 *               - certificado_id
 *               - anio
 *             properties:
 *               inmueble_id:
 *                 type: integer
 *                 description: ID del inmueble a pagar
 *               certificado_id:
 *                 type: integer
 *                 description: ID del certificado asociado
 *               anio:
 *                 type: integer
 *                 description: Año del pago
 *               trimestre:
 *                 type: integer
 *                 description: Trimestre del pago (opcional)
 *               dpi:
 *                 type: string
 *                 description: DPI del propietario
 *     responses:
 *       200:
 *         description: URL de sesión de pago creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *                   example: https://sandbox.polar.sh/checkout/session_123456
 *       500:
 *         description: Error al crear sesión de pago
 */

/**
 * @swagger
 * /polar/webhook:
 *   post:
 *     summary: Webhook de Polar para confirmar pagos
 *     tags: [Polar]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Evento enviado por Polar
 *     responses:
 *       200:
 *         description: Webhook recibido y procesado correctamente
 *       400:
 *         description: Error en la validación del webhook
 */
