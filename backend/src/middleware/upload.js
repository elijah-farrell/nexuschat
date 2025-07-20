const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with user ID for better organization
    const userId = req.user ? req.user.id : 'anonymous';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const safeFilename = `${userId}-${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`;
    cb(null, safeFilename);
  }
});

// File filter - restrict to images only for profile pictures
const fileFilter = (req, file, cb) => {
  // Get allowed types from environment or use defaults
  const allowedTypes = process.env.ALLOWED_FILE_TYPES 
    ? process.env.ALLOWED_FILE_TYPES.split(',')
    : [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp'
      ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const errorMessage = process.env.FILE_TYPE_ERROR_MESSAGE || 
      'Invalid file type. Only images (JPEG, PNG, GIF, WebP) are allowed.';
    cb(new Error(errorMessage), false);
  }
};

// Configure multer with environment variables
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB default
    files: parseInt(process.env.MAX_FILES_PER_REQUEST) || 1 // 1 file default
  }
});

module.exports = upload; 