import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  //connectionString: process.env.DATABASE_URL, // ej: postgresql://usuario:pass@localhost:5432/tu_db
  // O bien, por variables separadas:
host: process.env.DB_HOST,
  port: process.env.DB_PORT,
   user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
   database: process.env.DB_NAME,
});

pool.on('error', (err) => {
  console.error('❌ Error inesperado en el pool de PostgreSQL:', err);
});

export default pool;