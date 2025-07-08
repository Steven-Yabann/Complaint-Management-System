// backend/controllers/complaint_controller.js

const Complaint = require('../models/Complaint');
const Department = require('../models/Department');
const User = require('../models/User');
// REMOVED: const multer = require('multer'); // Multer is now handled in server.js
const path = require('path'); // Still needed for path.join in file deletion/path construction
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const fs = require('fs'); // File system module for handling file operations
const sendEmail = require('../utils/emailService');
const { createNotification } = require('../controllers/notificationController');

// --- REMOVED: All Multer Configuration (storage, upload, checkFileType) ---


// @desc    Create new complaint
// @route   POST /api/complaints
// @access  Private (User)
exports.createComplaint = asyncHandler(async (req, res, next) => {
    // --- NO MORE 'upload(req, res, async (err) => { ... })' WRAPPER HERE ---
    // Multer middleware in server.js has already processed the request.
    // req.body and req.files are directly available.

    const { title, department, description, status, priority, isBuildingComplaint, building } = req.body;

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

    let complaintBuilding = null;
    const isBuildingComplaintBoolean = isBuildingComplaint === 'true';

    if (isBuildingComplaintBoolean) {
        if (!building || typeof building !== 'string' || building.trim() === '') {
            return next(new ErrorResponse('Please select a building if the complaint is building-related.', 400));
        }
        complaintBuilding = building.trim();
    }

    // req.files will be populated by Multer from server.js
    const attachments = req.files ? req.files.map(file => ({
        filename: file.originalname,
        filepath: `/uploads/attachments/${file.filename}`, // Changed from /uploads/complaints/ to /uploads/attachments/
        mimetype: file.mimetype
    })) : [];

    const complaint = await Complaint.create({
        user: req.user.id,
        title,
        department,
        description,
        status: status || 'Open',
        priority: priority || 'Low',
        attachments,
        isBuildingComplaint: isBuildingComplaintBoolean,
        building: complaintBuilding
    });

    try {
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
                    ${complaint.isBuildingComplaint && complaint.building ? `<p><strong>Building:</strong> ${complaint.building}</p>` : ''}
                    <p><strong>Complaint ID:</strong> ${complaint._id}</p>
                    <p><strong>Status:</strong> ${complaint.status}</p>
                    <p>We've received your complaint and will have our team look into it as soon as possible. You can track its progress and view updates by visiting your dashboard.</p>
                    <p>Thank you for your patience and for bringing this to our attention.</p>
                    <p>Best regards,</p>
                    <p>Your Complaint Management Team</p>
                `,
            };
            await sendEmail(mailOptions.to, mailOptions.subject, '', mailOptions.html);
        } else {
            console.warn(`User email or username not found in req.user for complaint notification (User ID: ${req.user.id}). Email not sent.`);
        }
    } catch (emailError) {
        console.error('Error sending complaint submission email:', emailError);
    }

    try {
        const departmentAdmin = await User.findOne({ department: department, role: 'admin' });
        console.log('Searching for admin in department:', department);
        console.log('Found department admin:', departmentAdmin);

        if (departmentAdmin && departmentAdmin.email) {
            const adminMailOptions = {
                to: departmentAdmin.email,
                subject: `New Complaint Submitted for ${existingDepartment.name} Department`,
                html: `
                    <p>Hello ${departmentAdmin.username},</p>
                    <p>A new complaint has been submitted to the ${existingDepartment.name} department.</p>
                    <p>Please log in to the admin dashboard to review and manage this complaint.</p>
                    <p>Best regards,</p>
                    <p>Your Complaint Management System</p>
                `
            };
            await sendEmail(adminMailOptions.to, adminMailOptions.subject, '', adminMailOptions.html);
            console.log(`Email sent to department admin (${departmentAdmin.email}) for new complaint.`);
        } else {
            console.warn(`No admin found or admin email not set for department ID: ${department}. Admin notification email not sent.`);
        }
    } catch (adminEmailError) {
        console.error('Error sending new complaint notification email to department admin:', adminEmailError);
    }

    res.status(201).json({
        success: true,
        message: 'Complaint submitted successfully! A confirmation email has been sent.',
        data: complaint,
        complaintId: complaint._id
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
        .sort({ createdAt: -1 }); //for sorting by most recent first

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

    // Ensure 'user' is populated before accessing '_id'
    if (!complaint.user || (complaint.user._id.toString() !== req.user.id && req.user.role !== 'admin')) {
        return next(new ErrorResponse('Not authorized to view this complaint', 401));
    }

    res.status(200).json({
        success: true,
        data: complaint
    });
});


// REMOVED: exports.updateComplaintStatus - its logic is now merged into exports.updateComplaint


// @desc    Update a specific complaint by ID (for all fields editable by user/admin)
// @route   PUT /api/complaints/:id
// @access  Private (User or Admin)
exports.updateComplaint = asyncHandler(async (req, res, next) => {
    // --- NO MORE 'upload(req, res, async (err) => { ... })' WRAPPER HERE ---
    // Multer middleware in server.js has already processed the request.
    // req.body and req.files are directly available.

    // Populate user here to ensure the authorization check works correctly
    let complaint = await Complaint.findById(req.params.id).populate('user', 'username email');

    if (!complaint) {
        return next(new ErrorResponse('Complaint not found', 404));
    }

    const oldStatus = complaint.status;

    // Authorization check
    if (!complaint.user || (complaint.user._id.toString() !== req.user.id && req.user.role !== 'admin')) {
        return next(new ErrorResponse('Not authorized to update this complaint', 403));
    }

    const { title, department, description, status, priority, isBuildingComplaint, building } = req.body;

    const updateFields = {};

    if (title) updateFields.title = title;
    if (description) updateFields.description = description;
    if (department) updateFields.department = department;
    if (priority) updateFields.priority = priority;

    const isBuildingComplaintBoolean = isBuildingComplaint === 'true';
    updateFields.isBuildingComplaint = isBuildingComplaintBoolean;

    if (isBuildingComplaintBoolean) {
        if (!building || typeof building !== 'string' || building.trim() === '') {
            return next(new ErrorResponse('Please select a building if the complaint is building-related.', 400));
        }
        updateFields.building = building.trim();
    } else {
        updateFields.building = null;
    }

    if (department) {
        const departmentExists = await Department.findById(department);
        if (!departmentExists) {
            return next(new ErrorResponse('Invalid Department ID provided', 400));
        }
    }

    const validStatuses = ['Open', 'In Progress', 'Resolved', 'Closed', 'Unresolved'];
    if (req.user.role === 'admin' && status) {
        if (!validStatuses.includes(status)) {
            return next(new ErrorResponse('Invalid status provided', 400));
        }
        updateFields.status = status;
    } else if (req.user.role !== 'admin' && status && status !== oldStatus) {
        return next(new ErrorResponse('Only administrators can change complaint status.', 403));
    } else {
        updateFields.status = complaint.status;
    }

    const newAttachments = req.files ? req.files.map(file => ({
        filename: file.originalname,
        filepath: `/uploads/attachments/${file.filename}`, // Changed from /uploads/complaints/ to /uploads/attachments/
        mimetype: file.mimetype
    })) : [];

    if (newAttachments.length > 0) {
        if (complaint.attachments && complaint.attachments.length > 0) {
            complaint.attachments.forEach(att => {
                const absoluteFilePath = path.join(__dirname, '..', 'public', att.filepath);
                if (fs.existsSync(absoluteFilePath)) {
                    fs.unlinkSync(absoluteFilePath);
                }
            });
        }
        updateFields.attachments = newAttachments;
    }

    updateFields.updatedAt = Date.now();

    const updatedComplaint = await Complaint.findByIdAndUpdate(req.params.id, updateFields, {
        new: true,
        runValidators: true
    }).populate('user', 'username email');

    if (req.user.role === 'admin' && updatedComplaint.status !== oldStatus) {
        try {
            if (updatedComplaint.user?.email) {
                const mailOptions = {
                    to: updatedComplaint.user.email,
                    subject: `Complaint Status Updated - #${updatedComplaint._id.toString().substring(0, 8)}`,
                    html: `
                        <p>Hello ${updatedComplaint.user.username},</p>
                        <p>The status of your complaint has been updated.</p>
                        <p><strong>Complaint Title:</strong> ${updatedComplaint.title}</p>
                        ${updatedComplaint.isBuildingComplaint && updatedComplaint.building ? `<p><strong>Building:</strong> ${updatedComplaint.building}</p>` : ''}
                        <p><strong>Previous Status:</strong> ${oldStatus}</p>
                        <p><strong>New Status:</strong> ${updatedComplaint.status}</p>
                        <p><strong>Complaint ID:</strong> ${updatedComplaint._id}</p>
                        ${(updatedComplaint.status === 'In Progress' || updatedComplaint.status === 'Open')
                            ? `<p>You can view the full details of your complaint by logging into your account.</p>`
                            : ''
                        }
                        ${(updatedComplaint.status === 'Resolved' || updatedComplaint.status === 'Closed')
                            ? `<p>Thank you for your patience. You can provide feedback to us by logging into your account.</p>`
                            : ''
                        }
                        <p>Thank you for your patience.</p>
                        <p>Best regards,<br>Your Complaint Management Team</p>
                    `,
                };
                await sendEmail(mailOptions.to, mailOptions.subject, '', mailOptions.html);
            }
        } catch (emailError) {
            console.error('Error sending status update email:', emailError);
        }

        if (updatedComplaint.user?._id) {
            try {
                const message = `Your complaint "${updatedComplaint.title}" has been marked as ${updatedComplaint.status}.`;
                await createNotification(
                    updatedComplaint.user._id,
                    updatedComplaint._id,
                    message,
                    'statusUpdate'
                );
            } catch (notifError) {
                console.error('Error creating notification:', notifError);
            }
        }
    }

    res.status(200).json({
        success: true,
        message: 'Complaint updated successfully!',
        data: updatedComplaint
    });
});


// @desc    Get all complaints (for admin dashboard)
// @route   GET /api/complaints/admin/department
// @access  Private (Admin only)
exports.getAllComplaintsForAdmin = asyncHandler(async (req, res, next) => {
    const adminDepartmentId = req.user.department;

    if (!adminDepartmentId) {
        return next(new ErrorResponse('Admin user does not have a department assigned', 400));
    }

    try {
        const complaints = await Complaint.find({ department: adminDepartmentId })
            .populate('user', 'username email')
            .populate('department', 'name')
            .sort({ createdAt: -1 });

        const adminDepartmentName = complaints.length > 0
            ? complaints[0].department?.name
            : 'Unknown Department';

        res.status(200).json({
            success: true,
            count: complaints.length,
            data: complaints,
            adminDepartment: adminDepartmentName,
            adminDepartmentId: adminDepartmentId
        });

    } catch (error) {
        console.error('Error fetching department-filtered complaints:', error);
        return next(new ErrorResponse('Error retrieving complaints for department', 500));
    }
});


// @desc    Delete a specific complaint by ID
// @route   DELETE /api/complaints/:id
// @access  Private (User or Admin)
exports.deleteComplaint = asyncHandler(async (req, res, next) => {
    const complaint = await Complaint.findById(req.params.id).populate('user', 'username email');

    if (!complaint) {
        return next(new ErrorResponse('Complaint not found', 404));
    }

    if (!complaint.user || (complaint.user._id.toString() !== req.user.id && req.user.role !== 'admin')) {
        return next(new ErrorResponse('Not authorized to delete this complaint', 401));
    }

    // Delete associated files from the file system
    if (complaint.attachments && complaint.attachments.length > 0) {
        complaint.attachments.forEach(attachment => {
            const absoluteFilePath = path.join(__dirname, '..', 'public', attachment.filepath);
            if (fs.existsSync(absoluteFilePath)) {
                fs.unlink(absoluteFilePath, (err) => {
                    if (err) {
                        console.error(`Error deleting file: ${absoluteFilePath}`, err);
                    }
                });
            }
        });
    }

    await complaint.deleteOne();

    res.status(200).json({
        success: true,
        message: 'Complaint deleted successfully!',
        data: {}
    });
});