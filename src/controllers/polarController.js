import prisma from '../config/prisma.config.ts';
import { Polar } from "@polar-sh/sdk";
import { validateEvent, WebhookVerificationError } from "@polar-sh/sdk/webhooks";

const polar = new Polar({
  accessToken: process.env.POLAR_API_KEY,
  server: "sandbox", // "sandbox" | "production" — nota: es "server", no "environment"
});

export const crearPagoPolar = async (req, res) => {
  try {
    const { inmueble_id, certificado_id, anio, trimestre, dpi } = req.body;
    const monto = 50;

    const successUrl = `${process.env.BASE_URL}/certificados/propietario/${dpi}?checkout_id={CHECKOUT_ID}`;
    const cancelUrl  = `${process.env.BASE_URL}/certificados/propietario/${dpi}`;

    const checkout = await polar.checkouts.create({
      products: [process.env.POLAR_PRODUCT_ID], // producto creado en tu dashboard de Polar
      prices: {
        [process.env.POLAR_PRODUCT_ID]: [
          {
            amountType: "fixed",
            priceAmount: monto * 100, // centavos
            priceCurrency: "gtq",
          },
        ],
      },
      successUrl,
      // Importante: solo mandamos el valor si existe de verdad.
      // Antes usábamos String(anio) sin importar si anio era undefined,
      // lo que terminaba mandando el texto "undefined" como metadata.
      metadata: {
        inmueble_id: inmueble_id != null ? String(inmueble_id) : '',
        certificado_id: certificado_id != null ? String(certificado_id) : '',
        anio: anio != null ? String(anio) : '',
        trimestre: trimestre != null ? String(trimestre) : '',
        dpi: dpi != null ? String(dpi) : '',
      },
    });

    res.json({ url: checkout.url });
  } catch (error) {
    console.error('❌ Error creando sesión Polar:', error.message);
    res.status(500).json({ error: 'Error al crear sesión de pago' });
  }
};

export const webhookPolar = async (req, res) => {
  let event;

  try {
    // req.body debe ser un Buffer crudo (por eso el express.raw arriba)
    event = validateEvent(
      req.body,
      req.headers,
      process.env.POLAR_WEBHOOK_SECRET ?? ''
    );
  } catch (err) {
    if (err instanceof WebhookVerificationError) {
      console.error('❌ Firma inválida del webhook Polar');
      return res.status(403).send('Invalid signature');
    }
    console.error('❌ Error validando webhook Polar:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    // Para pagos únicos (one-time), el evento relevante es order.paid
    if (event.type === 'order.paid') {
      const order = event.data;
      const metadata = order.metadata ?? {};

      // parseInt sobre "undefined" (string) da NaN, así que validamos
      // con Number.isFinite antes de usar el valor.
      const anioParsed = parseInt(metadata.anio, 10);
      const anio = Number.isFinite(anioParsed) ? anioParsed : new Date().getFullYear();

      const trimestreParsed = parseInt(metadata.trimestre, 10);
      const trimestre = Number.isFinite(trimestreParsed) ? trimestreParsed : null;

      const inmuebleId = parseInt(metadata.inmueble_id, 10);
      if (!Number.isFinite(inmuebleId)) {
        console.error('❌ inmueble_id inválido o ausente en metadata:', metadata.inmueble_id);
        // Respondemos 202 igual para que Polar no reintente indefinidamente
        // un evento que nunca va a poder procesarse (metadata mal formado).
        return res.status(202).send('');
      }

      await prisma.pago.create({
        data: {
          anio,
          trimestre,
          monto: order.amount / 100,
          estado: 'pagado',
          fecha_pago: new Date(),
          metodo_pago: 'polar',
          num_recibo: order.id,
          inmueble: {
            connect: { id: inmuebleId },
          },
        },
      });

      console.log('✅ Pago Polar confirmado y registrado');
    }

    // Opcional: si quieres reaccionar también cuando el checkout cambia de estado
    if (event.type === 'checkout.updated') {
      const checkout = event.data;
      console.log('ℹ️ Checkout actualizado:', checkout.status);
    }

    res.status(202).send('');
  } catch (err) {
    console.error('❌ Error procesando webhook Polar:', err.message);
    res.status(500).send(`Webhook Error: ${err.message}`);
  }
};
/*import prisma from '../config/prisma.config.ts';
import { Polar } from "@polar-sh/sdk";

const polar = new Polar({
  accessToken: process.env.POLAR_API_KEY,
  server: "sandbox", // "sandbox" | "production" — nota: es "server", no "environment"
});

export const crearPagoPolar = async (req, res) => {
  try {
    const { inmueble_id, certificado_id, anio, trimestre, dpi } = req.body;
    const monto = 50;

    const successUrl = `${process.env.BASE_URL}/certificados/propietario/${dpi}?checkout_id={CHECKOUT_ID}`;
    const cancelUrl  = `${process.env.BASE_URL}/certificados/propietario/${dpi}`;

    const checkout = await polar.checkouts.create({
      products: [process.env.POLAR_PRODUCT_ID], // producto creado en tu dashboard de Polar
      prices: {
        [process.env.POLAR_PRODUCT_ID]: [
          {
            amountType: "fixed",
            priceAmount: monto * 100, // centavos
            priceCurrency: "gtq",
          },
        ],
      },
      successUrl,
      metadata: {
        inmueble_id: String(inmueble_id),
        certificado_id: String(certificado_id),
        anio: String(anio),
        trimestre: String(trimestre),
        dpi: String(dpi),
      },
    });

    res.json({ url: checkout.url });
  } catch (error) {
    console.error('❌ Error creando sesión Polar:', error.message);
    res.status(500).json({ error: 'Error al crear sesión de pago' });
  }
};

export const webhookPolar = async (req, res) => {
  let event;

  try {
    // req.body debe ser un Buffer crudo (por eso el express.raw arriba)
    event = validateEvent(
      req.body,
      req.headers,
      process.env.POLAR_WEBHOOK_SECRET ?? ''
    );
  } catch (err) {
    if (err instanceof WebhookVerificationError) {
      console.error('❌ Firma inválida del webhook Polar');
      return res.status(403).send('Invalid signature');
    }
    console.error('❌ Error validando webhook Polar:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    // Para pagos únicos (one-time), el evento relevante es order.paid
    if (event.type === 'order.paid') {
      const order = event.data;

      const metadata = order.metadata ?? {};
      const anio = metadata.anio ? parseInt(metadata.anio) : new Date().getFullYear();
      const trimestre = metadata.trimestre ? parseInt(metadata.trimestre) : null;

      await prisma.pago.create({
        data: {
          anio,
          trimestre,
          monto: order.amount / 100,
          estado: 'pagado',
          fecha_pago: new Date(),
          metodo_pago: 'polar',
          num_recibo: order.id,
          inmueble: {
            connect: { id: parseInt(metadata.inmueble_id) },
          },
        },
      });

      console.log('✅ Pago Polar confirmado y registrado');
    }

    // Opcional: si quieres reaccionar también cuando el checkout cambia de estado
    if (event.type === 'checkout.updated') {
      const checkout = event.data;
      console.log('ℹ️ Checkout actualizado:', checkout.status);
    }

    res.status(202).send('');
  } catch (err) {
    console.error('❌ Error procesando webhook Polar:', err.message);
    res.status(500).send(`Webhook Error: ${err.message}`);
  }
};*/
//import axios from 'axios';
/*
// Configuración base de Polar
const polar = axios.create({
baseURL: 'https://sandbox-api.polar.sh/v1',
  headers: {
    Authorization: `Bearer ${process.env.POLAR_API_KEY}`, // usa sandbox_xxx en pruebas
    'Content-Type': 'application/json',
  },
});

// Crear sesión de pago (similar a Stripe Checkout)
export const crearPagoPolar = async (req, res) => {
  try {
    const { inmueble_id, certificado_id, anio, trimestre, dpi } = req.body;
    const monto = 50;

    const successUrl = `${process.env.BASE_URL}/certificados/propietario/${dpi}?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl  = `${process.env.BASE_URL}/certificados/propietario/${dpi}`;

    // Polar: crear Payment Intent
    const response = await polar.post('/checkout/sessions', {
      amount: monto * 100, // centavos
      currency: 'GTQ',
      description: `Pago inmueble ${inmueble_id}`,
      metadata: { inmueble_id, certificado_id, anio, trimestre, dpi },
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    res.json({ url: response.data.checkout_url });
  } catch (error) {
    console.error('❌ Error creando pago Polar:', error.response?.data || error.message);
    res.status(500).json({ error: 'Error al crear sesión de pago' });
  }
};

// Webhook para confirmar pago
export const webhookPolar = async (req, res) => {
  try {
    const event = req.body; // Polar manda JSON directo

    if (event.type === 'payment.succeeded') {
      const session = event.data;

      const anio = session.metadata?.anio
        ? parseInt(session.metadata.anio)
        : new Date().getFullYear();

      const trimestre = session.metadata?.trimestre
        ? parseInt(session.metadata.trimestre)
        : null;

      await prisma.pago.create({
        data: {
          anio,
          trimestre,
          monto: session.amount / 100,
          estado: 'pagado',
          fecha_pago: new Date(),
          metodo_pago: 'polar',
          num_recibo: session.id,
          inmueble: {
            connect: { id: parseInt(session.metadata.inmueble_id) },
          },
        },
      });

      console.log('✅ Pago Polar confirmado y registrado');
    }

    res.json({ received: true });
  } catch (err) {
    console.error('❌ Error webhook Polar:', err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
};*/