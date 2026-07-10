import prisma from '../config/prisma.config.ts'
import pool from '../config/database.js'
import multer from 'multer'
import { S3Client, PutObjectCommand,DeleteObjectCommand} from '@aws-sdk/client-s3'
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
const upload = multer({ storage: multer.memoryStorage() })

// ============================================================
// SUBIR DOCUMENTOS
// ============================================================
export const subirDocumentos = [
  upload.array('files'), // permite múltiples archivos
  async (req, res) => {
    try {
      const { propietario_id} = req.body

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No se enviaron archivos.' })
      }

      const resultados = []

      for (const file of req.files) {
        // Ruta dinámica: inmueble/propietario/nombre
        const key = `Propietario/${propietario_id}/${Date.now()}-${file.originalname}`

        // Subir a S3
        const params = {
          Bucket: process.env.AWS_BUCKET,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype
        }
        await s3.send(new PutObjectCommand(params))

        // Construir URL pública
        const url = `https://${process.env.AWS_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`

        // Guardar metadatos en la tabla documentos
       const documentoPropietario = await prisma.documento_Propietario.create({
  data: {
    propietario_id: propietario_id ? parseInt(propietario_id) : null,
    nombre: file.originalname,
    ruta_s3: key,
    url,
    tamano_bytes: file.size,
    mime_type: file.mimetype,
    subido_por: req.user?.id || null
  }
})


        resultados.push(documentoPropietario)
      }

      res.status(201).json({
        mensaje: 'Documentos subidos correctamente.',
        documentos: resultados
      })
    } catch (error) {
      console.error('❌ Error al subir documentos:', error)
      res.status(500).json({ error: 'Error interno al subir documentos.' })
    }
  }
]

// ============================================================
// LISTAR DOCUMENTOS
// ============================================================
export const listarDocumentos = async (req, res) => {
  try {
    console.log(Object.keys(prisma));
    const documentopropietario = await prisma.documento_Propietario.findMany({
      orderBy: { creado_en: 'desc' }
    })
    res.json(documentopropietario)
  } catch (error) {
    console.error('❌ Error al listar documentos:', error)
    res.status(500).json({ error: 'Error interno al listar documentos.' })
  }
}


// ============================================================
// LISTAR DOCUMENTOS by ID PROPIETARIO
// ============================================================
// GET /api/documentos-propietarios/:propietarioId
export const listarDocumentosPorPropietario = async (req, res) => {
  try {
    const { propietarioId } = req.params;

    const documentos = await prisma.documento_Propietario.findMany({
      where: { propietario_id: Number(propietarioId) },
      orderBy: { creado_en: 'desc' }
    });

  /* if (!documentos || documentos.length === 0) {
        res.json(documentos);
      return res.status(404).json({ error: 'No se encontraron documentos para este propietario.' });
    }*/

    res.json(documentos);
  } catch (error) {
    console.error('❌ Error al listar documentos por propietario:', error);
    res.status(500).json({ error: 'Error interno al listar documentos.' });
  }
};

// ============================================================
// ELIMINAR DOCUMENTO
// ============================================================
export const eliminarDocumento = async (req, res) => {
  try {
    const { id } = req.params

    // Buscar el documento en la base
    const documentopropietario = await prisma.documento_Propietario.findUnique({
      where: { id: parseInt(id) }
    })

    if (!documentopropietario) {
      return res.status(404).json({ error: 'Documento no encontrado.' })
    }

    // Eliminar el archivo de S3
    const params = {
      Bucket: process.env.AWS_BUCKET,
      Key: documentopropietario.ruta_s3
    }

    await s3.send(new DeleteObjectCommand(params))

    // Eliminar el registro de la base
    await prisma.documento_Propietario.delete({
      where: { id: parseInt(id) }
    })

    res.json({ mensaje: 'Documento eliminado correctamente.' })
  } catch (error) {
    console.error('❌ Error al eliminar documento:', error)
    res.status(500).json({ error: 'Error interno al eliminar documento.' })
  }
}