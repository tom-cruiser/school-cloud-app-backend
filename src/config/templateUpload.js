const multer = require('multer');
const path = require('path');
const fs = require('fs');

const templateUploadDir = path.join(__dirname, '../../uploads/templates');
if (!fs.existsSync(templateUploadDir)) {
  fs.mkdirSync(templateUploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, templateUploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const safeFieldName = (file.fieldname || 'template').replace(/[^a-zA-Z0-9_-]/g, '');
    cb(null, `${safeFieldName}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new Error('Invalid file type. Only PNG, JPG, JPEG, WEBP, and SVG files are allowed.');
    error.statusCode = 400;
    cb(error, false);
  }
};

const templateUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

module.exports = templateUpload;
