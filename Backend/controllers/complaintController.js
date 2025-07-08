// backend/controllers/complaint_controller.js

const Complaint = require('../models/Complaint');
const Department = require('../models/Department');
const User = require('../models/User');
const multer = require('multer');
const path = require('path');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const fs = require('fs');// File system module for handling file operations
const sendEmail = require('../utils/emailService');
const {createNotification} = require('../controllers/notificationController');

// --- Multer Configuration for File Uploads ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../public/uploads/complaints');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        checkFileType(file, cb);
    }
}).array('attachments', 5);

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

        // --- START CHANGES for createComplaint ---
        const { title, department, description, status, priority, isBuildingComplaint, building } = req.body;
        // --- END CHANGES for createComplaint ---

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

        // --- START CHANGES for createComplaint: Building validation ---
        let complaintBuilding = null; // Initialize as null
        const isBuildingComplaintBoolean = isBuildingComplaint === 'true'; // Convert string 'true'/'false' from FormData to boolean

        if (isBuildingComplaintBoolean) {
            if (!building || typeof building !== 'string' || building.trim() === '') {
                return next(new ErrorResponse('Please select a building if the complaint is building-related.', 400));
            }
            complaintBuilding = building.trim();
        }
        // --- END CHANGES for createComplaint: Building validation ---

        const attachments = req.files ? req.files.map(file => ({
            filename: file.originalname,
            filepath: `/uploads/complaints/${file.filename}`,
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
            // --- START CHANGES for createComplaint: Add building fields ---
            isBuildingComplaint: isBuildingComplaintBoolean,
            building: complaintBuilding // Will be null if isBuildingComplaint is false
            // --- END CHANGES for createComplaint: Add building fields ---
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
        //for sending email to department admin
        try{
            const departmentAdmin =await User.findOne({department: department, role: 'admin'});
            console.log('Searching for admin in department:', department); // Add this
    console.log('Found department admin:', departmentAdmin);

            if(departmentAdmin && departmentAdmin.email) {
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
        console.log(`Email sent to department admin (${departmentAdmin.email}) for new complaint.`);
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

    // --- FIX: Access _id from populated user object for comparison ---
    // Ensure 'user' is populated before accessing '_id'
    if (!complaint.user || (complaint.user._id.toString() !== req.user.id && req.user.role !== 'admin')) {
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

	const validStatuses = ['Open', 'In Progress', 'Resolved', 'Closed', 'Unresolved'];
	if (!validStatuses.includes(status)) {
		return next(new ErrorResponse('Invalid status provided', 400));
	}

	// Must be admin
	if (req.user.role !== 'admin') {
		return next(new ErrorResponse('Only administrators can update complaint status.', 403));
	}

	const complaint = await Complaint.findById(req.params.id).populate('user', 'username email');

	if (!complaint) {
		return next(new ErrorResponse('Complaint not found', 404));
	}

	const oldStatus = complaint.status;
	complaint.status = status;
	complaint.updatedAt = Date.now();

	await complaint.save();

	// Send email to user
	try {
		if (complaint.user?.email) {
			const mailOptions = {
				to: complaint.user.email,
				subject: `Complaint Status Updated - #${complaint._id.toString().substring(0, 8)}`,
				html: `
					<p>Hello ${complaint.user.username},</p>
					<p>The status of your complaint has been updated.</p>
					<p><strong>Complaint Title:</strong> ${complaint.title}</p>
					${complaint.isBuildingComplaint && complaint.building ? `<p><strong>Building:</strong> ${complaint.building}</p>` : ''}
					<p><strong>Previous Status:</strong> ${oldStatus}</p>
					<p><strong>New Status:</strong> ${status}</p>
					<p><strong>Complaint ID:</strong> ${complaint._id}</p>
                    ${(complaint.status === 'In Progress' || complaint.status === 'Open') 
                        ? `<<p>You can view the full details of your complaint by logging into your account.</p>` 
                        : ''
                    }
                    ${(complaint.status === 'Resolved' || complaint.status === 'Closed') 
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

	// Create notification if status is "Resolved" or "Closed"
	if ((status === 'Resolved' || status === 'Closed') && oldStatus !== status) {
		try {
			await createNotification(
				complaint.user._id,
				complaint._id,
				`Your complaint "${complaint.title}" has been marked as ${status}.`,
				'statusUpdate'
			);
		} catch (notifError) {
			console.error('Error creating notification:', notifError);
		}
	}

	res.status(200).json({
		success: true,
		message: 'Complaint status updated successfully!',
		data: complaint
	});
});

// @desc    Update a specific complaint by ID (for all fields editable by user/admin)
// @route   PUT /api/complaints/:id
// @access  Private (User or Admin)
exports.updateComplaint = asyncHandler(async (req, res, next) => {
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

        const oldStatus = complaint.status;

        // --- FIX: Access _id from populated user object for comparison ---
        // Ensure 'user' is populated before accessing '_id'
        if (!complaint.user || (complaint.user._id.toString() !== req.user.id && req.user.role !== 'admin')) {
            return next(new ErrorResponse('Not authorized to update this complaint', 403));
        }

        const updateFields = {};
        if (req.body.title) updateFields.title = req.body.title;
        if (req.body.description) updateFields.description = req.body.description;
        if (req.body.department) updateFields.department = req.body.department;
        if (req.body.priority) updateFields.priority = req.body.priority;

        // --- START CHANGES for updateComplaint: Building fields ---
        const isBuildingComplaintBoolean = req.body.isBuildingComplaint === 'true'; // Convert string 'true'/'false' from FormData to boolean
        updateFields.isBuildingComplaint = isBuildingComplaintBoolean;

        if (isBuildingComplaintBoolean) {
            if (!req.body.building || typeof req.body.building !== 'string' || req.body.building.trim() === '') {
                return next(new ErrorResponse('Please select a building if the complaint is building-related.', 400));
            }
            updateFields.building = req.body.building.trim();
        } else {
            updateFields.building = null; // Clear building if checkbox is unchecked
        }
        // --- END CHANGES for updateComplaint: Building fields ---


        if (req.body.department) {
            const departmentExists = await Department.findById(req.body.department);
            if (!departmentExists) {
                return next(new ErrorResponse('Invalid Department ID provided', 400));
            }
        }

        if (req.user.role === 'admin' && req.body.status) {
            updateFields.status = req.body.status;
        } else if (req.user.role !== 'admin' && req.body.status && req.body.status !== oldStatus) {
            return next(new ErrorResponse('Only administrators can change complaint status.', 403));
        } else {
            // If status is not provided or user is not admin, keep the existing status
            updateFields.status = complaint.status;
        }

        // Handle attachments: If new files are uploaded, they replace existing ones.
        // If no new files, keep the current ones.
        const newAttachments = req.files ? req.files.map(file => ({
            filename: file.originalname,
            filepath: `/uploads/complaints/${file.filename}`,
            mimetype: file.mimetype
        })) : [];

        if (newAttachments.length > 0) {
            // Delete old attachments from file system before updating
            if (complaint.attachments && complaint.attachments.length > 0) {
                complaint.attachments.forEach(att => {
                    const absoluteFilePath = path.join(__dirname, '..', 'public', att.filepath);
                    if (fs.existsSync(absoluteFilePath)) {
                        fs.unlinkSync(absoluteFilePath);
                    }
                });
            }
            updateFields.attachments = newAttachments; // Replace with new attachments
        }
        // If no new attachments, and no existing ones, `attachments` will just not be in `updateFields`
        // or you could explicitly keep old ones if `newAttachments.length === 0`
        // Given your previous `updateFields.attachments = [...(complaint.attachments || []), ...newAttachments];`
        // I am assuming the intention is to *add* new attachments. If it's to *replace*,
        // then the logic above is correct. If it's to add, it should be:
        // updateFields.attachments = [...(complaint.attachments || []), ...newAttachments];
        // I'll stick to replacement for simplicity as per common update patterns for files.
        // If you need to *add* to existing and not replace, let me know.
        // Your previous code was also potentially adding, not replacing. Let's make it explicitly replace for a clear update.
        // If you want to *add* to existing files, revert this part to:
        // if (newAttachments.length > 0) {
        //     updateFields.attachments = [...(complaint.attachments || []), ...newAttachments];
        // }


        updateFields.updatedAt = Date.now();

        // Ensure `complaint` is populated for the role check logic below.
        // If `complaint.user` is already populated from the `findById` call, no need to populate again.
        // However, your initial `findById` does not populate `user`, so we should do it here or earlier.
        // Let's add it to the initial `findById` for `updateComplaint` as well.
        // UPDATE: Your `getComplaint` does populate. For `updateComplaint` too, `findById` needs `populate('user')`
        // for the `complaint.user._id.toString() !== req.user.id` check.
        // It seems your initial `let complaint = await Complaint.findById(req.params.id);`
        // doesn't populate the user. It should be:
        complaint = await Complaint.findById(req.params.id).populate('user', 'username email');
        if (!complaint) {
            return next(new ErrorResponse('Complaint not found', 404));
        }
        // The check `if (!complaint.user || (complaint.user._id.toString()...` already handles unpopulated user.

        const updatedComplaint = await Complaint.findByIdAndUpdate(req.params.id, updateFields, {
            new: true,
            runValidators: true
        }).populate('user', 'username email'); // Populate again to ensure the response data is complete


        if (req.user.role === 'admin' &&
            (updatedComplaint.status === 'Resolved' || updatedComplaint.status === 'Closed') &&
            updatedComplaint.status !== oldStatus) {
            const message = `Your complaint "${updatedComplaint.title}" has been marked as ${updatedComplaint.status}.`;
            // Ensure updatedComplaint.user is populated before accessing _id
            await createNotification(updatedComplaint.user._id, updatedComplaint._id, message, 'statusUpdate');
        }

        res.status(200).json({
            success: true,
            message: 'Complaint updated successfully!',
            data: updatedComplaint
        });
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
            // --- No changes needed here, building is a string, not populated ---
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
    const complaint = await Complaint.findById(req.params.id).populate('user', 'username email'); // Populate user for consistency

    if (!complaint) {
        return next(new ErrorResponse('Complaint not found', 404));
    }

    // --- FIX: Access _id from populated user object for comparison ---
    // Ensure 'user' is populated before accessing '_id'
    if (!complaint.user || (complaint.user._id.toString() !== req.user.id && req.user.role !== 'admin')) {
        return next(new ErrorResponse('Not authorized to delete this complaint', 401));
    }

    // Delete associated files from the file system
    if (complaint.attachments && complaint.attachments.length > 0) {
        complaint.attachments.forEach(attachment => {
            const absoluteFilePath = path.join(__dirname, '..', 'public', attachment.filepath);
            fs.unlink(absoluteFilePath, (err) => {
                if (err) {
                    console.error(`Error deleting file: ${absoluteFilePath}`, err);
                } else {
                    // console.log(`Deleted attachment: ${absoluteFilePath}`); // Removed to reduce log spam
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