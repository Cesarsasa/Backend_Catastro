/*import stripe from '../services/stripeService.js';
import prisma from '../config/prisma.config.ts'

// Crear sesión de pago
export const crearPagoStripe = async (req, res) => {
  try {
    const { inmueble_id} = req.body;

     const monto = 50;
     const montoFormateado = monto.toFixed(2).replace(',', '.'); // "50.00" 

    const successUrl = `${process.env.BASE_URL}/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl  = `${process.env.BASE_URL}/cancel`

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'gtq',
          product_data: { name: `Pago inmueble ${inmueble_id}` },
          unit_amount: Math.round(monto * 100),
        },
        quantity: 1,
      }],
      mode: 'payment',
       success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { inmueble_id }
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('❌ Error creando sesión:', error);
    res.status(500).json({ error: 'Error al crear sesión de pago' });
  }
};

// Webhook para confirmar pago
export const webhookStripe = async (req, res) => {
  const sig = req.headers['stripe-signature'];

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;

      await prisma.pago.create({
        data: {
          inmueble_id: parseInt(session.metadata.inmueble_id),
          monto: 50,
          estado: 'pagado',
          fecha_pago: new Date(),
          metodo_pago: 'stripe',
          num_recibo: session.id,
        },
      });

      console.log('✅ Pago confirmado y registrado');
    }

    res.json({ received: true });
  } catch (err) {
    console.error('❌ Error webhook:', err);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
};*/

// Crear sesión de pago
/*export const crearPagoStripe = async (req, res) => {
  try {
    const { inmueble_id, certificado_id, anio, trimestre, dpi } = req.body;
    const monto = 50;

    // Redirigir al mismo lugar donde el frontend navega
    const successUrl = `${process.env.BASE_URL}/certificados/propietario/${dpi}?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl  = `${process.env.BASE_URL}/certificados/propietario/${dpi}`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'gtq',
          product_data: { name: `Pago inmueble ${inmueble_id}` },
          unit_amount: Math.round(monto * 100),
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { inmueble_id, certificado_id, anio, trimestre, dpi }
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('❌ Error creando sesión:', error);
    res.status(500).json({ error: 'Error al crear sesión de pago' });
  }
};
*/

// src/controllers/pagoStripeController.js
import stripe from '../services/stripeService.js';
import prisma from '../config/prisma.config.ts'


// Crear sesión de pago
export const crearPagoStripe = async (req, res) => {
  try {
    const { inmueble_id, certificado_id, anio, trimestre, dpi } = req.body;
    const monto = 50;

    const successUrl = `${process.env.BASE_URL}/certificados/propietario/${dpi}?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl  = `${process.env.BASE_URL}/certificados/propietario/${dpi}`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'gtq',
          product_data: { name: `Pago inmueble ${inmueble_id}` },
          unit_amount: Math.round(monto * 100),
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { inmueble_id, certificado_id, anio, trimestre, dpi }
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('❌ Error creando sesión:', error);
    res.status(500).json({ error: 'Error al crear sesión de pago' });
  }
};


// Webhook para confirmar pago
export const webhookStripe = async (req, res) => {
  const sig = req.headers['stripe-signature'];

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;

      const anio = session.metadata.anio 
    ? parseInt(session.metadata.anio) 
    : new Date().getFullYear();


      const trimestre = session.metadata.trimestre 
          ? parseInt(session.metadata.trimestre) 
          : null;

      await prisma.pago.create({
        data: {
          anio,
          trimestre,
          monto: session.amount_total / 100,
          estado: 'pagado',
          fecha_pago: new Date(),
          metodo_pago: 'stripe',
          num_recibo: session.id,
          // 👇 Relación obligatoria con Inmueble
          inmueble: {
            connect: { id: parseInt(session.metadata.inmueble_id) }
          }
        },
      });

      console.log('✅ Pago confirmado y registrado');
    }

    res.json({ received: true });
  } catch (err) {
    console.error('❌ Error webhook:', err);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
};

/*
// Webhook para confirmar pago
export const webhookStripe = async (req, res) => {
  const sig = req.headers['stripe-signature'];

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;

      const certificadoId = session.metadata.certificado_id 
          ? parseInt(session.metadata.certificado_id) 
          : null;

      const anio = session.metadata.anio 
          ? parseInt(session.metadata.anio) 
          : null;

      const trimestre = session.metadata.trimestre 
          ? parseInt(session.metadata.trimestre) 
          : null;

      await prisma.pago.create({
        data: {
          inmueble_id: parseInt(session.metadata.inmueble_id),
          certificado_id: certificadoId,
          anio,
          trimestre,
          monto: session.amount_total / 100,
          estado: 'pagado',
          fecha_pago: new Date(),
          metodo_pago: 'stripe',
          num_recibo: session.id,
        },
      });

      console.log('✅ Pago confirmado y registrado');
    }

    res.json({ received: true });
  } catch (err) {
    console.error('❌ Error webhook:', err);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
};
*/