import prisma from '../config/prisma.config.ts'
import multer from 'multer'
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import dotenv from 'dotenv'

dotenv.config()

// Configuración de S3
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
})

// Multer para manejar archivos en memoria
const upload = multer({  storage: multer.memoryStorage() })

// ============================================================
// SUBIR CERTIFICADO
// ============================================================
export const subirCertificado = [
  upload.single('file'), // un certificado por vez
  async (req, res) => {
    try {
      const { inmueble_id } = req.body

      if (!req.file) {
        return res.status(400).json({ error: 'No se envió archivo.' })
      }

      // 🔹 Si ya existe un certificado para este inmueble, eliminarlo (S3 + BD)
      if (inmueble_id) {
        const existente = await prisma.certificado.findFirst({
          where: { inmueble_id: parseInt(inmueble_id) }
        })

        if (existente) {
          try {
            await s3.send(new DeleteObjectCommand({
              Bucket: process.env.AWS_BUCKET,
              Key: existente.ruta_s3
            }))
          } catch (s3Error) {
            console.error('⚠️ No se pudo eliminar el archivo anterior de S3:', s3Error)
            // no bloqueamos la subida del nuevo por esto
          }

          await prisma.certificado.delete({ where: { id: existente.id } })
        }
      }

      // Ruta dinámica: inmueble/certificado/nombre
      const key = `Certificados/${inmueble_id}/${Date.now()}-${req.file.originalname}`

      // Subir a S3
      const params = {
        Bucket: process.env.AWS_BUCKET,
        Key: key,
        Body: req.file.buffer,
        ContentType: req.file.mimetype
      }
      await s3.send(new PutObjectCommand(params))

      // Construir URL pública
      const url = `https://${process.env.AWS_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`

      // Guardar metadatos en la tabla certificados
      const certificado = await prisma.certificado.create({
        data: {
          inmueble_id: inmueble_id ? parseInt(inmueble_id) : null,
          nombre: req.file.originalname,
          ruta_s3: key,
          url,
          tamano_bytes: req.file.size,
          mime_type: req.file.mimetype,
          subido_por: req.user?.id || null,
          estado: 'bloqueado',
          vigencia_hasta: null
        }
      })

      res.status(201).json({
        mensaje: 'Certificado subido correctamente.',
        certificado
      })
    } catch (error) {
      console.error('❌ Error al subir certificado:', error)
      res.status(500).json({ error: 'Error interno al subir certificado.' })
    }
  }
]
// ============================================================
// LISTAR CERTIFICADOS
// ============================================================
export const listarCertificados = async (req, res) => {
  try {
    const certificados = await prisma.certificado.findMany({
      orderBy: { creado_en: 'desc' }
    })
    res.json(certificados)
  } catch (error) {
    console.error('❌ Error al listar certificados:', error)
    res.status(500).json({ error: 'Error interno al listar certificados.' })
  }
}



// GET /api/certificados/:id
export const obtenerCertificadoPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const certificado = await prisma.certificado.findUnique({
      where: { id: Number(id) },
    });

    if (!certificado) {
      return res.status(404).json({ error: 'Certificado no encontrado' });
    }

    res.json(certificado);
  } catch (error) {
    console.error('❌ Error al obtener certificado:', error);
    res.status(500).json({ error: 'Error interno al obtener certificado.' });
  }
};

// GET /api/certificados/inmueble/:id
export const obtenerCertificadosPorInmueble = async (req, res) => {
  try {
    const { id } = req.params;  
    const inmuebleId = Number(id);

    if (!Number.isInteger(inmuebleId) || inmuebleId <= 0) {
      return res.status(400).json({ error: 'ID de inmueble inválido' });
    }

    const certificados = await prisma.certificado.findMany({
      where: { inmueble_id: inmuebleId },
      orderBy: { creado_en: 'desc' }, // opcional: ordenar por fecha
      // select: { id: true, nombre: true, url: true, creado_en: true } // opcional: limitar campos
      include: {
        inmueble: true, // opcional: incluir datos del inmueble
        subidor: { select: { id: true, nombre: true, email: true } }, // opcional
      },
    });

    if (!certificados || certificados.length === 0) {
      return res.status(404).json({ error: 'No se encontraron certificados para ese inmueble' });
    }

    return res.json(certificados);
  } catch (error) {
    console.error('❌ Error al obtener certificados por inmueble:', error);
    return res.status(500).json({ error: 'Error interno al obtener certificados.' });
  }
};



// ============================================================
// ELIMINAR CERTIFICADO
// ============================================================
export const eliminarCertificado = async (req, res) => {
  try {
    const { id } = req.params

    const certificado = await prisma.certificado.findUnique({
      where: { id: parseInt(id) }
    })

    if (!certificado) {
      return res.status(404).json({ error: 'Certificado no encontrado.' })
    }

    // Eliminar archivo de S3
    const params = {
      Bucket: process.env.AWS_BUCKET,
      Key: certificado.ruta_s3
    }
    await s3.send(new DeleteObjectCommand(params))

    // Eliminar registro en BD
    await prisma.certificado.delete({
      where: { id: parseInt(id) }
    })

    res.json({ mensaje: 'Certificado eliminado correctamente.' })
  } catch (error) {
    console.error('❌ Error al eliminar certificado:', error)
    res.status(500).json({ error: 'Error interno al eliminar certificado.' })
  }
}

// ─── GET certificados por DPI ───────────────────────────────
export const getCertificadosByDpi = async (req, res) => {
  try {
    const { dpi } = req.params;

    // Buscar propietario con sus inmuebles y certificados
    const propietario = await prisma.propietario.findFirst({
      where: {
        dpi,
        deleted_at: null
      },
      include: {
        inmuebles: {
          where: { deleted_at: null },
          select: {
            id: true,
            codigo_catastral: true,
            direccion_completa: true,
            certificados: {
              select: {
                id:           true,
                nombre:       true,
                url:          true,
                estado:       true,
                creado_en:    true,
                vigencia_hasta: true
              }
            }
          }
        }
      }
    });

    if (!propietario) {
      return res.status(404).json({ error: 'Propietario no encontrado' });
    }

    // Extraer certificados de todos los inmuebles
    const certificados = propietario.inmuebles.flatMap(inmueble =>
      inmueble.certificados.map(cert => ({
        inmueble_id: inmueble.id,
        codigo_catastral: inmueble.codigo_catastral,
        direccion_completa: inmueble.direccion_completa,
        ...cert
      }))
    );

    if (certificados.length === 0) {
      return res.status(404).json({ error: 'No se encontraron certificados para este propietario' });
    }

    res.json(certificados);
  } catch (error) {
    console.error('❌ Error al obtener certificados por DPI:', error);
    res.status(500).json({ error: error.message });
  }
};

// ─── GET certificados por DPI o código catastral ───────────────
export const getCertificados = async (req, res) => {
  try {
    const { dpi, codigo } = req.query; // se reciben como query params

    let inmuebles = [];

    if (dpi) {
      // Buscar por DPI del propietario
      const propietario = await prisma.propietario.findFirst({
        where: { dpi, deleted_at: null },
        include: {
          inmuebles: {
            where: { deleted_at: null },
            include: {
              certificados: {
                select: {
                  id: true,
                  nombre: true,
                  url: true,
                  estado: true,
                  creado_en: true,
                  vigencia_hasta: true
                }
              }
            }
          }
        }
      });

      if (!propietario) {
        return res.status(404).json({ error: 'Propietario no encontrado' });
      }

      inmuebles = propietario.inmuebles;
    } else if (codigo) {
      // Buscar por código catastral del inmueble
      const inmueble = await prisma.inmueble.findFirst({
        where: { codigo_catastral: codigo, deleted_at: null },
        include: {
          certificados: {
            select: {
              id: true,
              nombre: true,
              url: true,
              estado: true,
              creado_en: true,
              vigencia_hasta: true
            }
          }
        }
      });

      if (!inmueble) {
        return res.status(404).json({ error: 'Inmueble no encontrado' });
      }

      inmuebles = [inmueble];
    } else {
      return res.status(400).json({ error: 'Debe proporcionar dpi o codigo catastral' });
    }

    // Extraer certificados
    const certificados = inmuebles.flatMap(inmueble =>
      inmueble.certificados.map(cert => ({
        inmueble_id: inmueble.id,
        codigo_catastral: inmueble.codigo_catastral,
        direccion_completa: inmueble.direccion_completa,
        ...cert
      }))
    );

    if (certificados.length === 0) {
      return res.status(404).json({ error: 'No se encontraron certificados' });
    }

    res.json(certificados);
  } catch (error) {
    console.error('❌ Error al obtener certificados:', error);
    res.status(500).json({ error: error.message });
  }
};
