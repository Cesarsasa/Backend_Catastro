// src/routes/stripeRoutes.js
import express, { Router } from 'express';
import { crearPagoStripe, webhookStripe } from '../controllers/stripeController.js';

const router = Router();

// Crear sesión de pago
router.post('/crear-sesion', crearPagoStripe);

// Webhook (usa raw body para validar firma de Stripe)
router.post('/webhook', express.raw({ type: 'application/json' }), webhookStripe);

export default router;


/**
 * @swagger
 * tags:
 *   name: Stripe
 *   description: Integración de pagos con Stripe
 */

/**
 * @swagger
 * /stripe/crear-sesion:
 *   post:
 *     summary: Crear sesión de pago en Stripe
 *     tags: [Stripe]
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
 *                   example: https://checkout.stripe.com/pay/cs_test_123456
 *       500:
 *         description: Error al crear sesión de pago
 */

/**
 * @swagger
 * /stripe/webhook:
 *   post:
 *     summary: Webhook de Stripe para confirmar pagos
 *     tags: [Stripe]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Evento enviado por Stripe
 *     responses:
 *       200:
 *         description: Webhook recibido y procesado correctamente
 *       400:
 *         description: Error en la validación del webhook
 */
