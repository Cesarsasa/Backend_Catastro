import swaggerJsdoc from 'swagger-jsdoc'

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title:       'Sistema Catastral Municipal - API',
      version:     '1.0.0',
      description: 'API REST para el Sistema Catastral Municipal de Guatemala',
    },
    servers: [
      {
        url:         'http://localhost:3000/api',
        description: 'Servidor de desarrollo'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type:         'http',
          scheme:       'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [{ bearerAuth: [] }]
  },
  // Aquí le dices dónde están los comentarios de documentación
  apis: ['./src/routes/*.js']
}

export default swaggerJsdoc(options)