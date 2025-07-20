// Utility functions for authentication checks

/**
 * Check if the user is authenticated and ready to make API calls
 * @param {Object} auth - The auth context object
 * @returns {boolean} - True if user is authenticated and ready
 */
export const isAuthenticated = (auth) => {
  return auth && auth.token && auth.user && !auth.loading && auth.isReady;
};

/**
 * Check if the auth context is still loading
 * @param {Object} auth - The auth context object
 * @returns {boolean} - True if auth is still loading
 */
export const isAuthLoading = (auth) => {
  return auth && auth.loading;
};

/**
 * Get the auth headers for API requests
 * @param {string} token - The auth token
 * @returns {Object} - Headers object with Authorization
 */
export const getAuthHeaders = (token) => {
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

/**
 * Create a fetch wrapper that includes auth headers
 * @param {string} token - The auth token
 * @param {string} url - The URL to fetch
 * @param {Object} options - Fetch options
 * @returns {Promise} - Fetch promise
 */
export const authenticatedFetch = (token, url, options = {}) => {
  if (!token) {
    throw new Error('No authentication token available');
  }
  
  return fetch(url, {
    ...options,
    headers: {
      ...getAuthHeaders(token),
      ...options.headers,
    },
  });
}; 