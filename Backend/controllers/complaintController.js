// backend/controllers/complaint_controller.js

const Complaint = require('../models/Complaint');
const Department = require('../models/Department');
const User = require('../models/User'); // NEW: Make sure this line is present and correctly imports your User model.
const multer = require('multer');
const path = require('path');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const fs = require('fs'); // Import file system module for deleting files
const sendEmail = require('../utils/emailService'); // NEW: Make sure this line is present and imports your email service.


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
            filepath: file.path,
            mimetype: file.mimetype
        })) : [];

        const complaint = await Complaint.create({
            user: req.user.id,
            title,
            department,
            description,
            status: status || 'Open', // Defaults to 'Open' if not provided
            priority: priority || 'Low', // Defaults to 'Low' if not provided
            attachments
        });

        // --- NEW CODE STARTS HERE ---
        try {
            // Assuming req.user is populated by your 'protect' middleware
            // and contains `email` and `username` from the User model.
            const userEmail = req.user.email;
            const userName = req.user.username;

            if (userEmail && userName) {
                const mailOptions = {
                    to: userEmail,
                    subject: `Complaint #${complaint._id.toString().substring(0, 8)} Submitted Successfully!`,
                    html: `
                        <p>Hello ${userName},</p>
                        <p>Your complaint has been successfully submitted to our team.</p>
                        <p><strong>Complaint Title:</strong> ${complaint.title}</p>
                        <p><strong>Description:</strong> ${complaint.description}</p>
                        <p><strong>Complaint ID:</strong> ${complaint._id}</p>
                        <p><strong>Status:</strong> ${complaint.status}</p>
                        <p>We've received your complaint and will have our team look into it as soon as possible. You can track its progress and view updates by visiting your dashboard.</p>
                        <p>Thank you for your patience and for bringing this to our attention.</p>
                        <p>Best regards,</p>
                        <p>Your Complaint Management Team</p>
                    `,
                };
                await sendEmail(mailOptions.to, mailOptions.subject, '', mailOptions.html);
                console.log(`Complaint submission email sent to ${userEmail} for complaint ID: ${complaint._id}`);
            } else {
                console.warn(`User email or username not found in req.user for complaint notification (User ID: ${req.user.id}). Email not sent.`);
            }
        } catch (emailError) {
            console.error('Error sending complaint submission email:', emailError);
            // It's crucial not to return an error here. The complaint was successfully created.
            // Just log the email failure.
        }
        // --- NEW CODE ENDS HERE ---

        res.status(201).json({
            success: true,
            message: 'Complaint submitted successfully! A confirmation email has been sent.', // Updated message for frontend
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
        .populate('user', 'username email')
        .sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        count: complaints.length,
        data: complaints
    });
});

// @desc    Get all complaints (Admin only)
// @route   GET /api/complaints/admin/all
// @access  Private (Admin)
exports.getAllComplaints = asyncHandler(async (req, res, next) => {
    const complaints = await Complaint.find({})
        .populate('department', 'name')
        .populate('user', 'username email')
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
    const complaint = await Complaint.findById(req.params.id)
        .populate('department', 'name')
        .populate('user', 'username email');

    if (!complaint) {
        return next(new ErrorResponse('Complaint not found', 404));
    }

    // Ensure user is the owner or an admin
    if (complaint.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(new ErrorResponse('Not authorized to view this complaint', 401));
    }

    res.status(200).json({
        success: true,
        data: complaint
    });
});

// @desc    Update complaint status (Admin only)
// @route   PUT /api/complaints/:id/status
// @access  Private (Admin)
exports.updateComplaintStatus = asyncHandler(async (req, res, next) => {
    const { status } = req.body;

    if (!status) {
        return next(new ErrorResponse('Please provide a status', 400));
    }

    const validStatuses = ['Open', 'In Progress', 'Resolved', 'Closed'];
    if (!validStatuses.includes(status)) {
        return next(new ErrorResponse('Invalid status provided', 400));
    }

    const complaint = await Complaint.findById(req.params.id)
        .populate('user', 'username email');

    if (!complaint) {
        return next(new ErrorResponse('Complaint not found', 404));
    }

    const oldStatus = complaint.status;
    complaint.status = status;
    complaint.updatedAt = Date.now();
    
    await complaint.save();

    // Send email notification to the user about status change
    try {
        if (complaint.user && complaint.user.email) {
            const mailOptions = {
                to: complaint.user.email,
                subject: `Complaint Status Updated - #${complaint._id.toString().substring(0, 8)}`,
                html: `
                    <p>Hello ${complaint.user.username},</p>
                    <p>The status of your complaint has been updated.</p>
                    <p><strong>Complaint Title:</strong> ${complaint.title}</p>
                    <p><strong>Previous Status:</strong> ${oldStatus}</p>
                    <p><strong>New Status:</strong> ${status}</p>
                    <p><strong>Complaint ID:</strong> ${complaint._id}</p>
                    <p>You can view the full details of your complaint by logging into your account.</p>
                    <p>Thank you for your patience.</p>
                    <p>Best regards,</p>
                    <p>Your Complaint Management Team</p>
                `,
            };
            await sendEmail(mailOptions.to, mailOptions.subject, '', mailOptions.html);
            console.log(`Status update email sent to ${complaint.user.email} for complaint ID: ${complaint._id}`);
        }
    } catch (emailError) {
        console.error('Error sending status update email:', emailError);
        // Don't fail the status update if email fails
    }

    res.status(200).json({
        success: true,
        message: 'Complaint status updated successfully!',
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
            updateFields.attachments = newAttachments;
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