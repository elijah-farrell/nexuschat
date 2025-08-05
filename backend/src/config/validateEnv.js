const validateEnv = () => {
  const required = [
    'JWT_SECRET',
    'PORT',
    'FRONTEND_URL',
    'DATABASE_URL'
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(key => {
      console.error(`   - ${key}`);
    });
    console.error('\nPlease check your .env file and ensure all required variables are set.');
    process.exit(1);
  }



  // Validate JWT secret length
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    console.error('❌ JWT_SECRET must be at least 32 characters long for security.');
    process.exit(1);
  }

  // Validate PORT is a number
  if (isNaN(parseInt(process.env.PORT))) {
    console.error('❌ PORT must be a valid number.');
    process.exit(1);
  }

  // Validate FRONTEND_URL is a valid URL
  try {
    new URL(process.env.FRONTEND_URL);
  } catch {
    console.error('❌ FRONTEND_URL must be a valid URL.');
    process.exit(1);
  }



  // Show minimal environment info for development
  if (process.env.NODE_ENV === 'development') {
    console.log(`🚀 Starting on port ${process.env.PORT}`);
  }

  // Environment validation passed silently
};

module.exports = validateEnv; 