// Utility functions for handling images and URLs

/**
 * Get the full URL for a profile picture
 * @param {string} profilePicture - The profile picture path from the database
 * @returns {string} The full URL to the image
 */
export const getProfilePictureUrl = (profilePicture) => {
  if (!profilePicture) return null;
  
  // If it's already a full URL, return as is
  if (profilePicture.startsWith('http://') || profilePicture.startsWith('https://')) {
    return profilePicture;
  }

  // If it starts with /uploads/, serve directly from uploads
  if (profilePicture.startsWith('/uploads/')) {
    return `${import.meta.env.VITE_BACKEND_URL}${profilePicture}`;
  }

  // If it doesn't start with /, assume it's a filename and use uploads
  if (!profilePicture.startsWith('/')) {
    return `${import.meta.env.VITE_BACKEND_URL}/uploads/${profilePicture}`;
  }

  // Fallback to direct path
  return `${import.meta.env.VITE_BACKEND_URL}${profilePicture}`;
};

/**
 * Get a fallback avatar with user's initial
 * @param {string} username - The username to get initial from
 * @param {string} displayName - Optional display name as fallback
 * @returns {string} The first character of the username or display name
 */
export const getAvatarInitial = (username, displayName = null) => {
  if (username) {
    return username.charAt(0).toUpperCase();
  }
  if (displayName) {
    return displayName.charAt(0).toUpperCase();
  }
  return '?';
};

/**
 * Check if an image URL is valid
 * @param {string} url - The image URL to check
 * @returns {Promise<boolean>} Whether the image exists
 */
export const isValidImageUrl = async (url) => {
  if (!url) return false;
  
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    return false;
  }
}; 