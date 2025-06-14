// backend/controllers/complaint_controller.js

const Complaint = require('../models/Complaint');
const Department = require('../models/department'); // Assuming you have this model
const multer = require('multer');
const path = require('path');
const asyncHandler = require('../middleware/async'); // Assuming you have this for error handling
const ErrorResponse = require('../utils/errorResponse'); // Assuming you have this for custom errors

// --- Multer Configuration for File Uploads ---

// Set storage engine for Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Ensure the uploads directory exists
        const uploadPath = path.join(__dirname, '../public/uploads/complaints');
        // You might want to add fs.mkdirSync(uploadPath, { recursive: true }); here
        // or ensure the directory exists manually/via script
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

// Init upload
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB total file size limit (matching frontend)
    fileFilter: (req, file, cb) => {
        checkFileType(file, cb);
    }
}).array('attachments', 5); // 'attachments' is the field name from your frontend FormData, max 5 files

// Check File Type
function checkFileType(file, cb) {
    // Allowed ext
    const filetypes = /jpeg|jpg|png|gif|pdf/;
    // Check ext
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    // Check mime
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new ErrorResponse('Error: Images (jpeg, jpg, png, gif) or PDFs only!', 400));
    }
}


// @desc    Create new complaint
// @route   POST /api/complaints
// @access  Private (User)
exports.createComplaint = asyncHandler(async (req, res, next) => {
    // This multer middleware will process the files and body fields
    upload(req, res, async (err) => {
        if (err instanceof multer.MulterError) {
            // A Multer error occurred when uploading.
            return next(new ErrorResponse(`File upload error: ${err.message}`, 400));
        } else if (err) {
            // An unknown error occurred when uploading. (e.g., from checkFileType)
            return next(err); // Pass custom ErrorResponse from checkFileType
        }

        // After files are processed by Multer, req.body and req.files are available
        const { title, department, description, status, priority } = req.body;

        // Ensure user is authenticated and attached by protect middleware
        if (!req.user || !req.user.id) {
            return next(new ErrorResponse('Not authorized to create complaint without a user ID', 401));
        }

        // Basic validation (more comprehensive validation might be in the model or a separate validator)
        if (!title || !department || !description) {
            return next(new ErrorResponse('Please include title, department, and description for the complaint', 400));
        }

        // Validate if the department exists
        const existingDepartment = await Department.findById(department);
        if (!existingDepartment) {
            return next(new ErrorResponse(`Department with ID ${department} not found`, 404));
        }

        // Prepare attachments data for Mongoose schema
        const attachments = req.files ? req.files.map(file => ({
            filename: file.originalname,
            filepath: file.path, // Full path where Multer saved the file
            mimetype: file.mimetype
        })) : [];

        // Create new complaint object
        const complaint = await Complaint.create({
            user: req.user.id, // User ID from the authenticated user
            title,
            department,
            description,
            status,
            priority,
            attachments
        });

        res.status(201).json({
            success: true,
            message: 'Complaint submitted successfully!',
            data: complaint,
            complaintId: complaint._id // Return the ID for the frontend modal
        });
    });
});


// exports.getComplaints = asyncHandler(async (req, res, next) => { /* ... */ });

exports.getUserComplaints = asyncHandler(async (req, res, next) => {
    // req.user.id is available thanks to the 'protect' middleware
    if (!req.user || !req.user.id) {
        return next(new ErrorResponse('Not authorized to view complaints without a user ID', 401));
    }

    // Find complaints where the 'user' field matches the authenticated user's ID
    // .populate('department') is optional, but good for displaying department name later
    const complaints = await Complaint.find({ user: req.user.id })
                                    .populate('department', 'name') // Only get the 'name' field of the department
                                    .sort({ createdAt: -1 }); // Sort by newest first

    res.status(200).json({
        success: true,
        count: complaints.length,
        data: complaints
    });
});