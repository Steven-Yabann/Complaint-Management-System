// backend/controllers/adminController.js

const Complaint = require('../models/Complaint');
const Department = require('../models/Department');
const User = require('../models/User');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const sendEmail = require('../utils/emailService');

// Get all complaints for admin dashboard
exports.getAllComplaints = asyncHandler(async (req, res, next) => {
	const complaints = await Complaint.find()
		.populate('user', 'username email')
		.populate('department', 'name')
		.sort({ createdAt: -1 });

	const complaintsWithSubmittedBy = complaints.map(complaint => ({
		...complaint.toObject(),
		submittedBy: {
			username: complaint.user?.username,
			email: complaint.user?.email
		}
	}));

	res.status(200).json({
		success: true,
		count: complaints.length,
		data: complaintsWithSubmittedBy
	});
});

//Update complaint status by admin
exports.updateComplaintStatus = asyncHandler(async (req, res, next) => {
	const { status } = req.body;
	const complaintId = req.params.id;

	// Validate status
	const validStatuses = ['Open', 'In Progress', 'Resolved', 'Closed'];
	if (!validStatuses.includes(status)) {
		return next(new ErrorResponse('Invalid status provided', 400));
	}

	let complaint = await Complaint.findById(complaintId)
		.populate('user', 'username email')
		.populate('department', 'name');

	if (!complaint) {
		return next(new ErrorResponse('Complaint not found', 404));
	}

	const oldStatus = complaint.status;

	// Update the complaint status
	complaint = await Complaint.findByIdAndUpdate(
		complaintId,
		{ 
			status: status,
			updatedAt: Date.now()
		},
		{
			new: true,
			runValidators: true
		}
	).populate('user', 'username email').populate('department', 'name');

	// Send email notification to user if status changed
	if (oldStatus !== status && complaint.user?.email) {
		try {
			const statusMessages = {
				'Open': 'has been reopened and is now under review',
				'In Progress': 'is currently being worked on by our team',
				'Resolved': 'has been resolved',
				'Closed': 'has been closed'
			};

			const mailOptions = {
				to: complaint.user.email,
				subject: `Complaint #${complaint._id.toString().substring(0, 8)} Status Update`,
				html: `
					<p>Hello ${complaint.user.username},</p>
					<p>Your complaint <strong>"${complaint.title}"</strong> ${statusMessages[status]}.</p>
					<p><strong>Previous Status:</strong> ${oldStatus}</p>
					<p><strong>Current Status:</strong> ${status}</p>
					<p><strong>Complaint ID:</strong> ${complaint._id}</p>
					<p>You can view more details by logging into your dashboard.</p>
					<p>Thank you for your patience.</p>
					<p>Best regards,</p>
					<p>Your Complaint Management Team</p>
				`,
			};

			await sendEmail(mailOptions.to, mailOptions.subject, '', mailOptions.html);
			console.log(`Status update email sent to ${complaint.user.email} for complaint ID: ${complaint._id}`);
		} catch (emailError) {
			console.error('Error sending status update email:', emailError);
			// Don't fail the request if email fails
		}
	}

	res.status(200).json({
		success: true,
		message: 'Complaint status updated successfully',
		data: complaint
	});
});

// Get admin profile information
exports.getAdminProfile = asyncHandler(async (req, res, next) => {
	const admin = await User.findById(req.user.id).select('username email role');

	if (!admin) {
		return next(new ErrorResponse('Admin not found', 404));
	}

	res.status(200).json({
		success: true,
		data: {
			username: admin.username,
			email: admin.email,
			role: admin.role
		}
	});
});

// Get dashboard statistics
exports.getDashboardStats = asyncHandler(async (req, res, next) => {
	// Get all complaints
	const allComplaints = await Complaint.find();

	// Calculate basic stats
	const totalComplaints = allComplaints.length;
	const openComplaints = allComplaints.filter(c => c.status === 'Open').length;
	const inProgressComplaints = allComplaints.filter(c => c.status === 'In Progress').length;
	const resolvedComplaints = allComplaints.filter(c => 
		c.status === 'Resolved' || c.status === 'Closed'
	).length;

	// Calculate this month's complaints
	const now = new Date();
	const thisMonthComplaints = allComplaints.filter(complaint => {
		const complaintDate = new Date(complaint.createdAt);
		return complaintDate.getMonth() === now.getMonth() && 
			   complaintDate.getFullYear() === now.getFullYear();
	}).length;

	// Calculate average resolution time (for resolved/closed complaints)
	const resolvedComplaintsWithDates = allComplaints.filter(c => 
		(c.status === 'Resolved' || c.status === 'Closed') && c.updatedAt && c.createdAt
	);

	let avgResolutionTime = 0;
	if (resolvedComplaintsWithDates.length > 0) {
		const totalResolutionTime = resolvedComplaintsWithDates.reduce((total, complaint) => {
			const resolutionTime = new Date(complaint.updatedAt) - new Date(complaint.createdAt);
			return total + resolutionTime;
		}, 0);
		
		const avgResolutionMs = totalResolutionTime / resolvedComplaintsWithDates.length;
		avgResolutionTime = Math.round(avgResolutionMs / (1000 * 60 * 60 * 24 * 10)) / 10; // Convert to days with 1 decimal
	}

	// For now, satisfaction rate is placeholder - you'd calculate this from feedback
	const satisfactionRate = "87%";

	res.status(200).json({
		success: true,
		data: {
			totalComplaints,
			openComplaints,
			inProgressComplaints,
			resolvedComplaints,
			thisMonthComplaints,
			avgResolutionTime: avgResolutionTime > 0 ? `${avgResolutionTime} days` : "N/A",
			satisfactionRate
		}
	});
});

// Get detailed complaint information for admin
exports.getComplaintDetails = asyncHandler(async (req, res, next) => {
	const complaint = await Complaint.findById(req.params.id)
		.populate('user', 'username email')
		.populate('department', 'name description');

	if (!complaint) {
		return next(new ErrorResponse('Complaint not found', 404));
	}

	res.status(200).json({
		success: true,
		data: complaint
	});
});

// Mark complaint as seen by admin
exports.markComplaintAsSeen = asyncHandler(async (req, res, next) => {
	const complaint = await Complaint.findByIdAndUpdate(
		req.params.id,
		{ seen: true },
		{
			new: true,
			runValidators: true
		}
	);

	if (!complaint) {
		return next(new ErrorResponse('Complaint not found', 404));
	}

	res.status(200).json({
		success: true,
		message: 'Complaint marked as seen',
		data: complaint
	});
});

// Backend/controllers/adminController.js


// @desc    Get admin profile
// @route   GET /api/admin/profile
// @access  Private (Admin)
exports.getAdminProfile = asyncHandler(async (req, res, next) => {
	if (req.user) {
		res.json({
			username: req.user.username,
			email: req.user.email,
			role: req.user.role
		});
	} else {
		return next(new ErrorResponse('Admin not found', 404));
	}
});

// @desc    Update admin username
// @route   PUT /api/admin/profile/username
// @access  Private (Admin)
exports.updateAdminUsername = asyncHandler(async (req, res, next) => {
	const { newUsername } = req.body;

	if (!newUsername || newUsername.trim().length < 3) {
		return next(new ErrorResponse('New username must be at least 3 characters long', 400));
	}

	const user = req.user;

	// Check if username already exists for another user
	const usernameExists = await User.findOne({ username: newUsername });
	if (usernameExists && usernameExists._id.toString() !== user._id.toString()) {
		return next(new ErrorResponse('Username already taken', 400));
	}

	user.username = newUsername;
	await user.save();

	res.json({ 
		message: 'Username updated successfully!', 
		username: user.username 
	});
});

// @desc    Request password reset OTP for admin (2FA)
// @route   POST /api/admin/request-password-reset-otp
// @access  Private (Admin)
exports.requestPasswordResetOTP = asyncHandler(async (req, res, next) => {
	const user = req.user;

	// Generate a 6-digit numeric OTP
	const otp = Math.floor(100000 + Math.random() * 900000).toString();

	// Set OTP expiry (10 minutes from now)
	user.otp = otp;
	user.otpExpires = Date.now() + 10 * 60 * 1000;
	await user.save();

	const mailOptions = {
		to: user.email,
		subject: 'Admin Password Reset OTP - Complaint Management System',
		html: `
			<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
				<h2 style="color: #e43939;">Admin Password Reset Request</h2>
				<p>Hello <strong>${user.username}</strong>,</p>
				<p>You recently requested to reset your admin account password. Your One-Time Password (OTP) is:</p>
				<div style="background-color: #f8f9fa; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
					<h1 style="color: #e43939; font-size: 32px; margin: 0; letter-spacing: 4px;">${otp}</h1>
				</div>
				<p><strong>Important Security Notice:</strong></p>
				<ul>
					<li>This OTP is valid for <strong>10 minutes only</strong></li>
					<li>Do not share this code with anyone</li>
					<li>Only use this code if you requested a password reset</li>
					<li>If you did not request this reset, please contact IT support immediately</li>
				</ul>
				<p>If you did not request a password reset, please ignore this email and contact your system administrator.</p>
				<hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
				<p style="color: #666; font-size: 12px;">
					This is an automated message from the Strathmore Complaint Management System.<br>
					Admin Panel Security Notice
				</p>
			</div>
		`,
	};

	try {
		await sendEmail(mailOptions.to, mailOptions.subject, '', mailOptions.html);
		
		res.status(200).json({ 
			message: 'OTP sent to your registered admin email.',
			email: user.email.replace(/(.{2})(.*)(@.*)/, '$1***$3') // Mask email for security
		});
	} catch (error) {
		// Clear OTP if email fails
		user.otp = null;
		user.otpExpires = null;
		await user.save();
		
		return next(new ErrorResponse('Failed to send OTP email', 500));
	}
});

// @desc    Reset admin password with OTP
// @route   POST /api/admin/reset-password-with-otp
// @access  Private (Admin)
exports.resetPasswordWithOTP = asyncHandler(async (req, res, next) => {
	const { otp, newPassword } = req.body;

	if (!otp || !newPassword) {
		return next(new ErrorResponse('Please provide OTP and new password', 400));
	}

	const user = req.user;

	// Enhanced password validation for admin accounts
	if (newPassword.length < 8) {
		return next(new ErrorResponse('Admin password must be at least 8 characters long', 400));
	}

	// Check password complexity
	const hasUpperCase = /[A-Z]/.test(newPassword);
	const hasLowerCase = /[a-z]/.test(newPassword);
	const hasNumbers = /\d/.test(newPassword);
	
	if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
		return next(new ErrorResponse('Admin password must contain at least one uppercase letter, one lowercase letter, and one number', 400));
	}

	// Verify OTP and expiry
	if (!user.otp || user.otp !== otp || user.otpExpires < Date.now()) {
		// Clear OTP fields to prevent brute-forcing
		user.otp = null;
		user.otpExpires = null;
		await user.save();
		return next(new ErrorResponse('Invalid or expired OTP', 400));
	}

	// Update password
	user.password = newPassword;
	user.otp = null;
	user.otpExpires = null;
	await user.save();

	// Log security event
	console.log(`Admin password reset completed for user: ${user.username} at ${new Date().toISOString()}`);

	res.status(200).json({ 
		message: 'Admin password reset successfully! You will be logged out for security.' 
	});
});


// @desc    Get complaint details by ID (Admin)
// @route   GET /api/admin/complaints/:id
// @access  Private (Admin)
exports.getComplaintById = asyncHandler(async (req, res, next) => {
	const complaint = await Complaint.findById(req.params.id)
		.populate('user', 'username email')
		.populate('department', 'name description');

	if (!complaint) {
		return next(new ErrorResponse('Complaint not found', 404));
	}

	res.status(200).json({
		success: true,
		data: complaint
	});
});