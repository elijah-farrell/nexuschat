const { Pool } = require('pg');

// Lazy database pool creation
let pool = null;

const getPool = () => {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is required');
    }
    
    console.log('🔗 Creating database pool...');
    console.log(`   Environment: ${process.env.NODE_ENV}`);
    console.log(`   SSL: ${process.env.NODE_ENV === 'production' ? 'enabled' : 'disabled'}`);
    
    pool = new Pool({
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
  }
  return pool;
};

// Simple query helper
const query = async (sql, params = []) => {
  try {
    const client = await getPool().connect();
    try {
      return await client.query(sql, params);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Database query failed:');
    console.error(`   SQL: ${sql}`);
    console.error(`   Error: ${error.message}`);
    console.error(`   Code: ${error.code}`);
    throw error;
  }
};

// Single row query helper
const queryOne = async (sql, params = []) => {
  const result = await query(sql, params);
  return result.rows[0];
};

module.exports = {
  pool: getPool,
  query,
  queryOne
}; 