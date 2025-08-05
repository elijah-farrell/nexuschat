const { Pool } = require('pg');

// Simple database pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Test connection on startup
pool.on('connect', () => {
  console.log('✅ Database connected');
});

pool.on('error', (err) => {
  console.error('❌ Database error:', err.message);
});

// Simple query helper
const query = async (sql, params = []) => {
  const client = await pool.connect();
  try {
    return await client.query(sql, params);
  } finally {
    client.release();
  }
};

// Single row query helper
const queryOne = async (sql, params = []) => {
  const result = await query(sql, params);
  return result.rows[0];
};

module.exports = {
  pool,
  query,
  queryOne
}; 