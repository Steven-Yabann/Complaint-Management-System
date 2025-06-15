// backend/controllers/complaint_controller.js

const Complaint = require('../models/Complaint');
const Department = require('../models/department');
const multer = require('multer');
const path = require('path');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const fs = require('fs'); // Import file system module for deleting files


// --- Multer Configuration for File Uploads ---

// Set storage engine for Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../public/uploads/complaints');
        // Ensure the directory exists. This is important!
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

// Init upload
// Used for createComplaint and updateComplaint (if new files are uploaded)
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB total file size limit
    fileFilter: (req, file, cb) => {
        checkFileType(file, cb);
    }
}).array('attachments', 5); // 'attachments' is the field name from your frontend FormData, max 5 files

// Check File Type
function checkFileType(file, cb) {
    const filetypes = /jpeg|jpg|png|gif|pdf/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
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
    upload(req, res, async (err) => {
        if (err instanceof multer.MulterError) {
            return next(new ErrorResponse(`File upload error: ${err.message}`, 400));
        } else if (err) {
            return next(err);
        }

        const { title, department, description, status, priority } = req.body;

        if (!req.user || !req.user.id) {
            return next(new ErrorResponse('Not authorized to create complaint without a user ID', 401));
        }

        if (!title || !department || !description) {
            return next(new ErrorResponse('Please include title, department, and description for the complaint', 400));
        }

        const existingDepartment = await Department.findById(department);
        if (!existingDepartment) {
            return next(new ErrorResponse(`Department with ID ${department} not found`, 404));
        }

        const attachments = req.files ? req.files.map(file => ({
            filename: file.originalname,
            // Multer's file.path usually gives an absolute path.
            // We store it directly for deletion later.
            filepath: file.path, // This is the absolute path to the uploaded file
            mimetype: file.mimetype
        })) : [];

        const complaint = await Complaint.create({
            user: req.user.id,
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
            complaintId: complaint._id
        });
    });
});


// @desc    Get all complaints for the logged-in user
// @route   GET /api/complaints/me
// @access  Private (User)
exports.getUserComplaints = asyncHandler(async (req, res, next) => {
    if (!req.user || !req.user.id) {
        return next(new ErrorResponse('Not authorized to view complaints without a user ID', 401));
    }

    const complaints = await Complaint.find({ user: req.user.id })
        .populate('department', 'name')
        .sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        count: complaints.length,
        data: complaints
    });
});

// @desc    Get single complaint by ID
// @route   GET /api/complaints/:id
// @access  Private (User/Admin) - Added for edit functionality
exports.getComplaint = asyncHandler(async (req, res, next) => {
    const complaint = await Complaint.findById(req.params.id).populate('department', 'name');

    if (!complaint) {
        return next(new ErrorResponse('Complaint not found', 404));
    }

    // Ensure user is the owner or an admin
    if (complaint.user.toString() !== req.user.id && req.user.role !== 'admin') { // Assuming admin role
        return next(new ErrorResponse('Not authorized to view this complaint', 401));
    }

    res.status(200).json({
        success: true,
        data: complaint
    });
});


// @desc    Update a specific complaint by ID
// @route   PUT /api/complaints/:id
// @access  Private (User) - Only the owner can update
exports.updateComplaint = asyncHandler(async (req, res, next) => {
    upload(req, res, async (err) => { // Use upload middleware for updates too
        if (err instanceof multer.MulterError) {
            return next(new ErrorResponse(`File upload error: ${err.message}`, 400));
        } else if (err) {
            return next(err);
        }

        let complaint = await Complaint.findById(req.params.id);

        if (!complaint) {
            return next(new ErrorResponse('Complaint not found', 404));
        }

        // Ensure user is the owner of the complaint
        if (complaint.user.toString() !== req.user.id) {
            return next(new ErrorResponse('Not authorized to update this complaint', 401));
        }

        // If department ID is provided, ensure it's a valid ID
        if (req.body.department) {
            const departmentExists = await Department.findById(req.body.department);
            if (!departmentExists) {
                return next(new ErrorResponse('Invalid Department ID provided', 400));
            }
        }

        const { title, description, department, status, priority } = req.body;
        const updateFields = { title, description, department, status, priority };

        // Handle new attachments: Append them to existing ones
        const newAttachments = req.files ? req.files.map(file => ({
            filename: file.originalname,
            filepath: file.path, // Absolute path
            mimetype: file.mimetype
        })) : [];

        // If there are new attachments, add them to the existing ones
        if (newAttachments.length > 0) {
            // This assumes frontend will re-send existing attachments if they want to keep them.
            // Or, you can explicitly manage removal by sending attachment IDs to delete from frontend.
            // For now, we are replacing the attachments array if new ones are provided.
            // If you want to APPEND, you would do: updateFields.attachments = [...complaint.attachments, ...newAttachments];
            // But this requires more complex UI to manage existing attachments.
            // For simplicity, for now, we'll replace the attachments if new ones are uploaded.
            // If the user wants to keep old and add new, the frontend needs to resend the old ones.
            // A more robust solution would involve separate routes for adding/removing attachments.

            // Let's go with a simple model: If files are provided in an update, replace all current attachments.
            // Otherwise, keep existing attachments. This implies the UI handles existing attachments.
            // If you want to ONLY add new, then 'attachments' should be optional on update.
            // For now, if req.files exists, it assumes replacement or appending.
            // Simplest for now: if files are passed, update the 'attachments' field.
            // If no files are passed, the 'attachments' field is not updated, retaining old ones.
            updateFields.attachments = newAttachments;
            // TODO: If you replace, you should also delete the old files from storage!
            // This requires storing old attachment filepaths and deleting them here.
            // For initial implementation, we'll leave old files on disk for simplicity.
        }

        // It's generally better to use findOneAndUpdate directly to return the updated doc
        complaint = await Complaint.findByIdAndUpdate(req.params.id, updateFields, {
            new: true, // Return the updated document
            runValidators: true // Run schema validators on update
        });

        res.status(200).json({
            success: true,
            message: 'Complaint updated successfully!',
            data: complaint
        });
    });
});


// @desc    Delete a specific complaint by ID
// @route   DELETE /api/complaints/:id
// @access  Private (User) - Only the owner can delete
exports.deleteComplaint = asyncHandler(async (req, res, next) => {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
        return next(new ErrorResponse('Complaint not found', 404));
    }

    // Ensure user is the owner of the complaint
    if (complaint.user.toString() !== req.user.id) {
        return next(new ErrorResponse('Not authorized to delete this complaint', 401));
    }

    // Delete associated files from the file system
    if (complaint.attachments && complaint.attachments.length > 0) {
        complaint.attachments.forEach(attachment => {
            fs.unlink(attachment.filepath, (err) => { // attachment.filepath should be the absolute path
                if (err) {
                    console.error(`Error deleting file: ${attachment.filepath}`, err);
                    // Log error, but don't prevent complaint deletion from DB
                } else {
                    console.log(`Deleted attachment: ${attachment.filepath}`);
                }
            });
        });
    }

    await complaint.deleteOne();

    res.status(200).json({
        success: true,
        message: 'Complaint deleted successfully!',
        data: {}
    });
});