const { Pool } = require('pg');

// Database connection configuration
let pool = null;

const createPool = () => {
  if (!process.env.DATABASE_URL) {
    console.log('⚠️ DATABASE_URL not found - skipping database connection');
    return null;
  }
  
  try {
    return new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      family: 4 // Force IPv4 to avoid IPv6 timeout issues
    });
  } catch (error) {
    console.log('⚠️ Failed to create database pool - continuing without database');
    return null;
  }
};

// Test database connection
const testConnection = async () => {
  if (!pool) {
    console.log('⚠️ No database pool - skipping connection test');
    return;
  }
  
  try {
    const client = await pool.connect();
    client.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    throw error;
  }
};

// Initialize database connection only
const initializeDatabase = async () => {
  try {
    pool = createPool();
    if (pool) {
      try {
        await testConnection();
      } catch (dbError) {
        console.error('❌ Database connection failed:', dbError.message);
        pool = null; // Clear the pool since connection failed
      }
    }
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    console.log('⚠️ Continuing without database connection');
    pool = null;
  }
};

// Helper function for queries
const query = async (sql, params = []) => {
  if (!pool) {
    throw new Error('Database not connected');
  }
  const client = await pool.connect();
  try {
    const result = await client.query(sql, params);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Helper function for single row queries
const queryOne = async (sql, params = []) => {
  if (!pool) {
    throw new Error('Database not connected');
  }
  const client = await pool.connect();
  try {
    const result = await client.query(sql, params);
    return result.rows[0];
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  pool,
  query,
  queryOne,
  initializeDatabase
}; 