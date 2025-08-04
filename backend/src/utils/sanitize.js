// Input sanitization utilities

// Sanitize string input to prevent SQL injection
const sanitizeString = (input) => {
  if (typeof input !== 'string') return '';
  
  // Remove SQL injection patterns
  const sqlPatterns = [
    /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute|script|javascript)\b)/gi,
    /(['";])/g,
    /(--)/g,
    /(\/\*|\*\/)/g,
    /(xp_|sp_)/gi
  ];
  
  let sanitized = input;
  sqlPatterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });
  
  // Trim and limit length
  return sanitized.trim().substring(0, 255);
};

// Sanitize username (alphanumeric + underscore only)
const sanitizeUsername = (username) => {
  if (typeof username !== 'string') return '';
  
  // Only allow letters, numbers, and underscores
  const sanitized = username.replace(/[^a-zA-Z0-9_]/g, '');
  
  return sanitized.trim().substring(0, 20);
};

// Sanitize password (remove dangerous characters)
const sanitizePassword = (password) => {
  if (typeof password !== 'string') return '';
  
  // Remove null bytes and other dangerous characters
  const sanitized = password.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  return sanitized.substring(0, 128);
};

// Validate email format (basic)
const isValidEmail = (email) => {
  if (typeof email !== 'string') return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Sanitize HTML content to prevent XSS
const sanitizeHTML = (html) => {
  if (typeof html !== 'string') return '';
  
  // Remove script tags and dangerous attributes
  const dangerousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi
  ];
  
  let sanitized = html;
  dangerousPatterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });
  
  return sanitized.trim().substring(0, 1000);
};

module.exports = {
  sanitizeString,
  sanitizeUsername,
  sanitizePassword,
  isValidEmail,
  sanitizeHTML
}; 