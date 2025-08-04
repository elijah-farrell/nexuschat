// API Configuration
const getApiUrl = () => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  if (!backendUrl) {
    throw new Error('VITE_BACKEND_URL environment variable is not set');
  }
  return backendUrl;
};

export const API_BASE_URL = getApiUrl();

// Socket.IO configuration
export const getSocketUrl = () => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  if (!backendUrl) {
    throw new Error('VITE_BACKEND_URL environment variable is not set');
  }
  return backendUrl;
}; 