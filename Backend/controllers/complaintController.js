// backend/controllers/complaint_controller.js

const Complaint = require('../models/Complaint');
const Department = require('../models/Department');
const User = require('../models/User'); // NEW: Make sure this line is present and correctly imports your User model.
const multer = require('multer');
const path = require('path');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const fs = require('fs'); // Import file system module for deleting files
const sendEmail = require('../utils/emailService'); // Ensure this line is present and imports your email service.
const {createNotification} = require('../controllers/notificationController'); // Import the createNotification function

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
        // file.fieldname + '-' + Date.now() + path.extname(file.originalname) ensures unique filenames
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

// Init upload middleware
// Used for createComplaint and updateComplaint (if new files are uploaded)
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB total file size limit
    fileFilter: (req, file, cb) => {
        checkFileType(file, cb);
    }
}).array('attachments', 5); // 'attachments' is the field name from your frontend FormData, max 5 files

// Check File Type helper function
function checkFileType(file, cb) {
    const filetypes = /jpeg|jpg|png|gif|pdf/; // Allowed file types
    // Check extension
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    // Check mimetype
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true); // File type is good
    } else {
        // Pass an ErrorResponse to the next middleware
        cb(new ErrorResponse('Error: Images (jpeg, jpg, png, gif) or PDFs only!', 400));
    }
}


// @desc    Create new complaint
// @route   POST /api/complaints
// @access  Private (User)
exports.createComplaint = asyncHandler(async (req, res, next) => {
    // Multer upload middleware processes the request before controller logic
    upload(req, res, async (err) => {
        if (err instanceof multer.MulterError) {
            // Handle Multer specific errors (e.g., file size limit)
            return next(new ErrorResponse(`File upload error: ${err.message}`, 400));
        } else if (err) {
            // Handle other unexpected errors during upload
            return next(err);
        }

        const { title, department, description, status, priority } = req.body;

        // Ensure user is authenticated and ID is available from req.user (from protect middleware)
        if (!req.user || !req.user.id) {
            return next(new ErrorResponse('Not authorized to create complaint without a user ID', 401));
        }

        // Basic validation for required fields
        if (!title || !department || !description) {
            return next(new ErrorResponse('Please include title, department, and description for the complaint', 400));
        }

        // Validate if the provided department ID exists
        const existingDepartment = await Department.findById(department);
        if (!existingDepartment) {
            return next(new ErrorResponse(`Department with ID ${department} not found`, 404));
        }

        // Map uploaded files to attachment objects with correct public path
        const attachments = req.files ? req.files.map(file => ({
            filename: file.originalname,
            // Store the public-facing URL path, not the absolute server path
            filepath: `/uploads/complaints/${file.filename}`,
            mimetype: file.mimetype
        })) : [];

        // Create the new complaint document
        const complaint = await Complaint.create({
            user: req.user.id,
            title,
            department,
            description,
            status: status || 'Open', // Defaults to 'Open' if not provided by frontend
            priority: priority || 'Low', // Defaults to 'Low' if not provided by frontend
            attachments
        });

        // --- Email Notification for Complaint Submission ---
        try {
            // Ensure req.user is populated by your 'protect' middleware
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
            // Log the email failure but do not return an error, as the complaint itself was created successfully.
        }

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

    // Ensure user is the owner or an admin to view this complaint
    if (complaint.user.toString() !== req.user.id && req.user.role !== 'admin') {
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
// @access  Private (User or Admin)
exports.updateComplaint = asyncHandler(async (req, res, next) => {
    // Use upload middleware to handle potential new file uploads during update
    upload(req, res, async (err) => {
        if (err instanceof multer.MulterError) {
            return next(new ErrorResponse(`File upload error: ${err.message}`, 400));
        } else if (err) {
            return next(err);
        }

        let complaint = await Complaint.findById(req.params.id);

        if (!complaint) {
            return next(new ErrorResponse('Complaint not found', 404));
        }

        // Store the original status BEFORE any updates, to detect changes later
        const oldStatus = complaint.status;

        // Authorization: Only owner or admin can update this complaint
        if (complaint.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return next(new ErrorResponse('Not authorized to update this complaint', 403));
        }

        // Prepare fields to update from request body
        // Only update fields if they are provided in the request body
        const updateFields = {};
        if (req.body.title) updateFields.title = req.body.title;
        if (req.body.description) updateFields.description = req.body.description;
        if (req.body.department) updateFields.department = req.body.department;
        if (req.body.priority) updateFields.priority = req.body.priority;


        // Validate if department ID is provided and exists
        if (req.body.department) {
            const departmentExists = await Department.findById(req.body.department);
            if (!departmentExists) {
                return next(new ErrorResponse('Invalid Department ID provided', 400));
            }
        }

        // --- Status Update Logic (Admin Only) ---
        // If an admin is making the request AND a status is provided in the body
        if (req.user.role === 'admin' && req.body.status) {
            updateFields.status = req.body.status; // Admin can change the status
        } else if (req.user.role !== 'admin' && req.body.status && req.body.status !== oldStatus) {
            // Prevent non-admins from changing status directly if they try
            return next(new ErrorResponse('Only administrators can change complaint status.', 403));
        } else {
            // If status is not provided by admin, or user is not admin, retain existing status
            // This is crucial: if status is not explicitly sent by admin, it shouldn't be changed.
            updateFields.status = complaint.status;
        }

        // Handle new attachments: Append them to existing ones.
        const newAttachments = req.files ? req.files.map(file => ({
            filename: file.originalname,
            filepath: `/uploads/complaints/${file.filename}`, // Use public URL path for frontend access
            mimetype: file.mimetype
        })) : [];

        // If new attachments are uploaded, add them to the existing array.
        // This ensures existing attachments are not lost.
        if (newAttachments.length > 0) {
            updateFields.attachments = [...(complaint.attachments || []), ...newAttachments];
        }

        // Update `updatedAt` field for tracking changes
        updateFields.updatedAt = Date.now();

        // Find and update the complaint document
        // Populate the 'user' field to get user's _id for notification creation later
        complaint = await Complaint.findByIdAndUpdate(req.params.id, updateFields, {
            new: true, // Return the updated document
            runValidators: true // Run schema validators on update
        }).populate('user', 'username email'); // Populate user data (ID, username, email)

        // --- Notification Creation Logic (NEW) ---
        // Create a notification if an admin changes the complaint status to 'Resolved' or 'Closed'
        if (req.user.role === 'admin' &&
            (complaint.status === 'Resolved' || complaint.status === 'Closed') &&
            complaint.status !== oldStatus) { // Only send notification if status actually changed
            
            const message = `Your complaint "${complaint.title}" has been marked as ${complaint.status}.`;
            // Call the helper function to create an in-app notification
            await createNotification(complaint.user._id, complaint._id, message, 'statusUpdate');
        }

        res.status(200).json({
            success: true,
            message: 'Complaint updated successfully!',
            data: complaint
        });
    });
});

// @desc    Get all complaints (for admin dashboard)
// @route   GET /api/complaints/admin/all
// @access  Private (Admin only)
exports.getAllComplaintsForAdmin = asyncHandler(async (req, res, next) => { // <<<--- DEFINITION AND EXPORT HERE
    // No role check needed here as 'authorize('admin')' middleware handles it
    const complaints = await Complaint.find()
        .populate('user', 'username email') // Populate user details who filed the complaint
        .populate('department', 'name')     // Populate department name
        .sort({ createdAt: -1 }); // Sort by newest first

    res.status(200).json({
        success: true,
        count: complaints.length,
        data: complaints
    });
});


// @desc    Delete a specific complaint by ID
// @route   DELETE /api/complaints/:id
// @access  Private (User or Admin)
// IMPORTANT: You might want to allow Admins to delete any complaint,
// current code only allows the owner. If admin delete is desired,
// add `|| req.user.role === 'admin'` to the ownership check.
exports.deleteComplaint = asyncHandler(async (req, res, next) => {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
        return next(new ErrorResponse('Complaint not found', 404));
    }

    // Ensure user is the owner of the complaint OR an admin
    if (complaint.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(new ErrorResponse('Not authorized to delete this complaint', 401));
    }

    // Delete associated files from the file system
    if (complaint.attachments && complaint.attachments.length > 0) {
        complaint.attachments.forEach(attachment => {
            // Reconstruct the absolute path from the stored public URL path
            // The stored `filepath` is `/uploads/complaints/filename.ext`
            // You need to join this with your backend's base directory for static files.
            const absoluteFilePath = path.join(__dirname, '..', 'public', attachment.filepath); // Correct path for your setup
            fs.unlink(absoluteFilePath, (err) => {
                if (err) {
                    console.error(`Error deleting file: ${absoluteFilePath}`, err);
                    // Log error, but don't prevent complaint deletion from DB
                } else {
                    console.log(`Deleted attachment: ${absoluteFilePath}`);
                }
            });
        });
    }

    await complaint.deleteOne(); // Use deleteOne() for Mongoose 5.x+

    res.status(200).json({
        success: true,
        message: 'Complaint deleted successfully!',
        data: {}
    });
});
