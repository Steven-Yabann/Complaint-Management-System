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