const { Pool } = require('pg');

// Database connection configuration
let pool = null;

const createPool = () => {
  if (!process.env.DATABASE_URL) {
    console.log('⚠️ DATABASE_URL not found - skipping database connection');
    return null;
  }
  
  try {
    console.log('🔗 Creating database connection pool...');
    console.log(`   URL: ${process.env.DATABASE_URL.replace(/:[^:@]*@/, ':****@')}`);
    
    return new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      family: 4, // Force IPv4 to avoid IPv6 timeout issues
      connectionTimeoutMillis: 10000, // 10 seconds
      idleTimeoutMillis: 30000, // 30 seconds
      max: 20, // Maximum connections
      min: 2   // Minimum connections
    });
  } catch (error) {
    console.log('⚠️ Failed to create database pool - continuing without database');
    console.error('   Error:', error.message);
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
    console.log('🧪 Testing database connection...');
    const client = await pool.connect();
    console.log('✅ Database connection test successful');
    client.release();
  } catch (error) {
    console.error('❌ Database connection test failed:');
    console.error(`   Error: ${error.message}`);
    console.error(`   Code: ${error.code}`);
    console.error(`   Detail: ${error.detail || 'No additional details'}`);
    
    if (error.code === 'ENETUNREACH') {
      console.error('   This appears to be a network connectivity issue');
      console.error('   Check if your database host is reachable');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('   Connection refused - check if database is running');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('   Connection timed out - check network/firewall');
    }
    
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
    console.error('❌ Database query attempted but database is not connected');
    throw new Error('Database not connected - please check your database configuration');
  }
  const client = await pool.connect();
  try {
    const result = await client.query(sql, params);
    return result;
  } catch (error) {
    console.error('❌ Database query error:');
    console.error(`   SQL: ${sql}`);
    console.error(`   Params: ${JSON.stringify(params)}`);
    console.error(`   Error: ${error.message}`);
    throw error;
  } finally {
    client.release();
  }
};

// Helper function for single row queries
const queryOne = async (sql, params = []) => {
  if (!pool) {
    console.error('❌ Database query attempted but database is not connected');
    throw new Error('Database not connected - please check your database configuration');
  }
  const client = await pool.connect();
  try {
    const result = await client.query(sql, params);
    return result.rows[0];
  } catch (error) {
    console.error('❌ Database query error:');
    console.error(`   SQL: ${sql}`);
    console.error(`   Params: ${JSON.stringify(params)}`);
    console.error(`   Error: ${error.message}`);
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