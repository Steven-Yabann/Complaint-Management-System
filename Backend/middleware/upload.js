// backend/middleware/upload.js
const multer = require('multer');
const path = require('path');
const ErrorResponse = require('../utils/errorResponse'); // Assuming you have this util

// Set storage engine
const storage = multer.diskStorage({
    destination: '../public/uploads/attachments/', // Ensure this path exists relative to your project root
    filename: function(req, file, cb) {
        // Use a unique name to avoid conflicts, e.g., fieldname-timestamp.ext
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

// Check file type
function checkFileType(file, cb) {
    // Allowed ext
    const filetypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
    // Check ext
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    // Check mime
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new ErrorResponse('Error: Images, PDFs, and Documents Only!', 400));
    }
}

// Init upload middleware
const upload = multer({
    storage: storage,
    limits: { fileSize: 10000000 }, // 10MB limit (adjust as needed)
    fileFilter: function(req, file, cb) {
        checkFileType(file, cb);
    }
});

module.exports = upload; // Export the configured upload instance