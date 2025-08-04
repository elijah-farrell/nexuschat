// API Configuration
const getApiUrl = () => {
  // In production, use the Railway backend URL
  if (import.meta.env.PROD) {
    return import.meta.env.VITE_BACKEND_URL || 'https://nexuschat-backend-production.up.railway.app';
  }
  
  // In development, use local backend
  return import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
};

export const API_BASE_URL = getApiUrl();

// Socket.IO configuration
export const getSocketUrl = () => {
  if (import.meta.env.PROD) {
    return import.meta.env.VITE_BACKEND_URL || 'https://nexuschat-backend-production.up.railway.app';
  }
  
  return import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
}; 