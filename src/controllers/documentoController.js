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
      const { inmueble_id, propietario_id} = req.body

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No se enviaron archivos.' })
      }

      const resultados = []

      for (const file of req.files) {
        // Ruta dinámica: inmueble/propietario/nombre
        const key = `Inmueble/${inmueble_id}/${propietario_id}/${Date.now()}-${file.originalname}`

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

        // Guardar metadatos en la tabla documentosporpietario
     const documento = await prisma.documento.create({
  data: {
    inmueble_id: inmueble_id ? parseInt(inmueble_id) : null,   
    propietario_id: propietario_id ? parseInt(propietario_id) : null,
    //tipo,
    nombre: file.originalname,
    ruta_s3: key,
    url,
    tamano_bytes: file.size,
    mime_type: file.mimetype,
    subido_por: req.user?.id || null
  }
})


        resultados.push(documento)
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
    const documentos = await prisma.documento.findMany({
      orderBy: { creado_en: 'desc' }
    })
    res.json(documentos)
  } catch (error) {
    console.error('❌ Error al listar documentos:', error)
    res.status(500).json({ error: 'Error interno al listar documentos.' })
  }
}
// ============================================================
// LISTAR DOCUMENTOS by ID  inmueble
// ============================================================
// GET /api/documentos-inmueble/:inmuebleId
export const listarDocumentosPorInmueble = async (req, res) => {
  try {
    const { inmuebleId } = req.params;

    const documentos = await prisma.documento.findMany({
      where: { inmueble_id: Number(inmuebleId) },
      orderBy: { creado_en: 'desc' }
    });

  /* if (!documentos || documentos.length === 0) {
        res.json(documentos);
      return res.status(404).json({ error: 'No se encontraron documentos para este propietario.' });
    }*/

    res.json(documentos);
  } catch (error) {
    console.error('❌ Error al listar documentos por inmueble:', error);
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
    const documento = await prisma.documento.findUnique({
      where: { id: parseInt(id) }
    })

    if (!documento) {
      return res.status(404).json({ error: 'Documento no encontrado.' })
    }

    // Eliminar el archivo de S3
    const params = {
      Bucket: process.env.AWS_BUCKET,
      Key: documento.ruta_s3
    }

    await s3.send(new DeleteObjectCommand(params))

    // Eliminar el registro de la base
    await prisma.documento.delete({
      where: { id: parseInt(id) }
    })

    res.json({ mensaje: 'Documento eliminado correctamente.' })
  } catch (error) {
    console.error('❌ Error al eliminar documento:', error)
    res.status(500).json({ error: 'Error interno al eliminar documento.' })
  }
}