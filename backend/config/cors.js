/**
 * CORS Configuration
 * Handles Cross-Origin Resource Sharing settings for the API
 */

require('dotenv').config();

/**
 * Get allowed origins from environment or use defaults
 */
function getAllowedOrigins() {
  const envOrigins = process.env.ALLOWED_ORIGINS;
  
  if (envOrigins) {
    return envOrigins.split(',').map(origin => origin.trim());
  }
  
  // Default allowed origins for development
  return [
    'http://localhost:3000',
    'http://localhost:8081', 
    'http://localhost:8082',
    'http://localhost:19006',
    'http://localhost:19000',
    'http://localhost:3001'
  ];
}

/**
 * CORS origin validation function
 */
function corsOriginHandler(origin, callback) {
  const allowedOrigins = getAllowedOrigins();
  
  // Allow requests with no origin (like mobile apps or curl requests)
  if (!origin) {
    return callback(null, true);
  }
  
  // Allow all localhost origins, regardless of port (for development)
  if (process.env.NODE_ENV === 'development' && /^http:\/\/localhost:\d+$/.test(origin)) {
    return callback(null, true);
  }
  
  // Check against allowed origins list
  if (allowedOrigins.includes(origin)) {
    return callback(null, true);
  }
  
  // Reject origin
  const error = new Error(`Origin ${origin} not allowed by CORS policy`);
  error.status = 403;
  callback(error);
}

/**
 * CORS configuration object
 */
const corsConfig = {
  origin: corsOriginHandler,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'X-API-Key'
  ],
  exposedHeaders: [
    'X-Total-Count',
    'X-Page-Count',
    'X-Current-Page'
  ],
  maxAge: 86400 // 24 hours
};

/**
 * Development-specific CORS configuration (more permissive)
 */
const devCorsConfig = {
  ...corsConfig,
  origin: true, // Allow all origins in development
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
};

/**
 * Get CORS configuration based on environment
 */
function getCorsConfig() {
  return process.env.NODE_ENV === 'development' ? devCorsConfig : corsConfig;
}

/**
 * Log CORS configuration for debugging
 */
function logCorsConfig() {
  const allowedOrigins = getAllowedOrigins();
  console.log('🌐 CORS Configuration:');
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Allowed Origins: ${allowedOrigins.join(', ')}`);
  console.log(`   Credentials: ${corsConfig.credentials}`);
}

module.exports = {
  corsConfig: getCorsConfig(),
  getAllowedOrigins,
  corsOriginHandler,
  logCorsConfig
};
