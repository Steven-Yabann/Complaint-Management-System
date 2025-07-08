const User = require('../models/User');
const Department = require('../models/Department');
const Complaint = require('../models/Complaint');
const Feedback = require('../models/Feedback');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const sendEmail = require('../utils/emailService');

const checkAdminLimitInDepartment = async (departmentId, excludeUserId = null) => {
	const query = {
		role: 'admin',
		department: departmentId
	};
	
	// If updating an existing user, exclude them from the count
	if (excludeUserId) {
		query._id = { $ne: excludeUserId };
	}
	
	const adminCount = await User.countDocuments(query);
	return adminCount;
};


// @desc    Get all users with pagination and filtering
// @route   GET /api/super-admin/users
// @access  Private (Super Admin only)
exports.getAllUsers = asyncHandler(async (req, res, next) => {
	const page = parseInt(req.query.page, 10) || 1;
	const limit = parseInt(req.query.limit, 10) || 20;
	const startIndex = (page - 1) * limit;
	const { role, search } = req.query;
	
	// Build filter object
	const filter = { role: { $ne: 'superadmin' } };
	
	if (role && role !== 'all') {
		filter.role = role;
	}
	
	if (search) {
		filter.$or = [
			{ username: { $regex: search, $options: 'i' } },
			{ email: { $regex: search, $options: 'i' } }
		];
	}
	
	const users = await User.find(filter)
		.populate('department', 'name')
		.select('-password')
		.sort({ createdAt: -1 })
		.skip(startIndex)
		.limit(limit);
	
	const total = await User.countDocuments(filter);
	const pages = Math.ceil(total / limit);
	
	res.status(200).json({
		success: true,
		count: users.length,
		pages,
		total,
		data: users
	});
});

// Updated createAdmin function in superAdminController.js
// @desc    Create admin user
// @route   POST /api/super-admin/create-admin
// @access  Private (Super Admin only)
// Updated createAdmin function with limit validation
exports.createAdmin = asyncHandler(async (req, res, next) => {
	const { username, email, password, department } = req.body;
	
	if (!username || !email || !password) {
		return next(new ErrorResponse('Please provide username, email, and password', 400));
	}
	
	if (password.length < 6) {
		return next(new ErrorResponse('Password must be at least 6 characters long', 400));
	}
	
	// Validate department if provided
	if (department) {
		const departmentExists = await Department.findById(department);
		if (!departmentExists) {
			return next(new ErrorResponse('Department not found', 400));
		}
		
		// Check admin limit for the department
		const currentAdminCount = await checkAdminLimitInDepartment(department);
		if (currentAdminCount >= 2) {
			return next(new ErrorResponse(
				`Cannot assign admin to this department. Maximum of 2 admins allowed per department. Current count: ${currentAdminCount}`, 
				400
			));
		}
	}
	
	// Check if user already exists
	const existingUser = await User.findOne({ 
		$or: [{ email: email.toLowerCase() }, { username }] 
	});
	
	if (existingUser) {
		return next(new ErrorResponse('User with this email or username already exists', 400));
	}
	
	// Create admin user with department assignment
	const adminData = {
		username,
		email: email.toLowerCase(),
		password,
		role: 'admin',
		isVerified: true // Auto-verify admin accounts
	};
	
	// Add department if provided
	if (department) {
		adminData.department = department;
	}
	
	const admin = await User.create(adminData);
	
	// Populate department for response
	await admin.populate('department', 'name');
	
	// Send welcome email to new admin
	try {
		const departmentInfo = admin.department ? ` for ${admin.department.name} department` : '';
		const mailOptions = {
			to: admin.email,
			subject: 'Welcome - Admin Account Created',
			html: `
				<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
					<h2 style="color: #2c3e50;">Welcome to the Admin Panel</h2>
					<p>Hello <strong>${admin.username}</strong>,</p>
					<p>Your administrator account has been created successfully${departmentInfo}.</p>
					<div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
						<h3>Account Details:</h3>
						<p><strong>Username:</strong> ${admin.username}</p>
						<p><strong>Email:</strong> ${admin.email}</p>
						<p><strong>Role:</strong> Administrator</p>
						${admin.department ? `<p><strong>Department:</strong> ${admin.department.name}</p>` : ''}
					</div>
					<p>You can now log in to the admin panel using your credentials.</p>
					<p>Please change your password after your first login for security.</p>
					<hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
					<p style="color: #666; font-size: 12px;">
						This is an automated message from the Complaint Management System.
					</p>
				</div>
			`,
		};
		
		await sendEmail(mailOptions.to, mailOptions.subject, '', mailOptions.html);
	} catch (emailError) {
		console.error('Error sending welcome email:', emailError);
		// Don't fail the request if email fails
	}
	
	// Remove password from response
	admin.password = undefined;
	
	res.status(201).json({
		success: true,
		message: `Admin user created successfully${admin.department ? ` and assigned to ${admin.department.name} department` : ''}`,
		data: admin
	});
});

// Updated updateUser function with limit validation
exports.updateUser = asyncHandler(async (req, res, next) => {
	const { username, email, role, department } = req.body;
	
	let user = await User.findById(req.params.id);
	
	if (!user) {
		return next(new ErrorResponse('User not found', 404));
	}
	
	// Prevent super admin from being demoted
	if (user.role === 'superadmin' && role !== 'superadmin') {
		return next(new ErrorResponse('Cannot change super admin role', 403));
	}
	
	// Validate department if provided and user is being assigned admin role
	if (department && (role === 'admin' || (role === undefined && user.role === 'admin'))) {
		const departmentExists = await Department.findById(department);
		if (!departmentExists) {
			return next(new ErrorResponse('Department not found', 400));
		}
		
		// Check admin limit for the department (exclude current user if they're already an admin in this dept)
		const currentAdminCount = await checkAdminLimitInDepartment(department, req.params.id);
		if (currentAdminCount >= 2) {
			return next(new ErrorResponse(
				`Cannot assign admin to this department. Maximum of 2 admins allowed per department. Current count: ${currentAdminCount}`, 
				400
			));
		}
	}
	
	// Additional check: if user is being promoted to admin and assigned to a department
	if (role === 'admin' && department && user.role !== 'admin') {
		const currentAdminCount = await checkAdminLimitInDepartment(department);
		if (currentAdminCount >= 2) {
			return next(new ErrorResponse(
				`Cannot assign admin to this department. Maximum of 2 admins allowed per department. Current count: ${currentAdminCount}`, 
				400
			));
		}
	}
	
	// Prepare update data
	const updateData = {
		username: username || user.username,
		email: email ? email.toLowerCase() : user.email,
		role: role || user.role
	};
	
	// Handle department assignment
	if (department !== undefined) {
		// If department is empty string or null, remove department assignment
		updateData.department = department || null;
	}
	
	// Update user
	user = await User.findByIdAndUpdate(
		req.params.id,
		updateData,
		{
			new: true,
			runValidators: true
		}
	).populate('department', 'name').select('-password');
	
	// Send notification email if role or department changed
	if ((role && role !== user.role) || (department !== undefined)) {
		try {
			const roleChanged = role && role !== user.role;
			const departmentChanged = department !== undefined;
			
			let subject = 'Account Updated';
			let message = `Hello ${user.username},\n\nYour account has been updated by an administrator.\n\n`;
			
			if (roleChanged) {
				message += `Your role has been changed to: ${role}\n`;
			}
			
			if (departmentChanged) {
				if (user.department) {
					message += `You have been assigned to the ${user.department.name} department.\n`;
				} else {
					message += `Your department assignment has been removed.\n`;
				}
			}
			
			message += `\nIf you have any questions, please contact your system administrator.`;
			
			const mailOptions = {
				to: user.email,
				subject,
				html: `
					<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
						<h2 style="color: #2c3e50;">Account Updated</h2>
						<p>Hello <strong>${user.username}</strong>,</p>
						<p>Your account has been updated by an administrator.</p>
						<div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
							<h3>Updated Information:</h3>
							${roleChanged ? `<p><strong>New Role:</strong> ${role}</p>` : ''}
							${departmentChanged ? (user.department ? 
								`<p><strong>Department:</strong> ${user.department.name}</p>` : 
								`<p><strong>Department:</strong> No department assigned</p>`) : ''}
						</div>
						<p>If you have any questions, please contact your system administrator.</p>
						<hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
						<p style="color: #666; font-size: 12px;">
							This is an automated message from the Complaint Management System.
						</p>
					</div>
				`,
			};
			
			await sendEmail(mailOptions.to, mailOptions.subject, '', mailOptions.html);
		} catch (emailError) {
			console.error('Error sending update notification email:', emailError);
			// Don't fail the request if email fails
		}
	}
	
	res.status(200).json({
		success: true,
		message: 'User updated successfully',
		data: user
	});
});
// @desc    Delete user
// @route   DELETE /api/super-admin/users/:id
// @access  Private (Super Admin only)
exports.deleteUser = asyncHandler(async (req, res, next) => {
	const user = await User.findById(req.params.id);
	
	if (!user) {
		return next(new ErrorResponse('User not found', 404));
	}
	
	// Prevent deletion of super admin
	if (user.role === 'superadmin') {
		return next(new ErrorResponse('Cannot delete super admin', 403));
	}
	
	// Prevent self-deletion
	if (user._id.toString() === req.user.id) {
		return next(new ErrorResponse('Cannot delete your own account', 403));
	}
	
	await user.deleteOne();
	
	res.status(200).json({
		success: true,
		message: 'User deleted successfully'
	});
});

// @desc    Get all departments
// @route   GET /api/super-admin/departments
// @access  Private (Super Admin only)
exports.getAllDepartments = asyncHandler(async (req, res, next) => {
	const departments = await Department.find().sort({ name: 1 });
	
	// Get complaint count and admin info for each department
	const departmentsWithStats = await Promise.all(
		departments.map(async (dept) => {
			const complaintCount = await Complaint.countDocuments({ department: dept._id });
			const adminCount = await User.countDocuments({ department: dept._id, role: 'admin' });
			const admins = await User.find({ department: dept._id, role: 'admin' }).select('username email');
			
			return {
				...dept.toObject(),
				complaintCount,
				adminCount,
				maxAdmins: 2,
				availableSlots: Math.max(0, 2 - adminCount),
				isFull: adminCount >= 2,
				admins
			};
		})
	);
	
	res.status(200).json({
		success: true,
		count: departments.length,
		data: departmentsWithStats
	});
});

// @desc    Create new department
// @route   POST /api/super-admin/departments
// @access  Private (Super Admin only)
exports.createDepartment = asyncHandler(async (req, res, next) => {
	const { name, description } = req.body;
	
	if (!name) {
		return next(new ErrorResponse('Department name is required', 400));
	}
	
	// Check if department already exists
	const existingDept = await Department.findOne({ 
		name: { $regex: new RegExp(`^${name}$`, 'i') } 
	});
	
	if (existingDept) {
		return next(new ErrorResponse('Department already exists', 400));
	}
	
	const department = await Department.create({
		name: name.trim(),
		description: description ? description.trim() : ''
	});
	
	res.status(201).json({
		success: true,
		message: 'Department created successfully',
		data: department
	});
});

// @desc    Update department
// @route   PUT /api/super-admin/departments/:id
// @access  Private (Super Admin only)
exports.updateDepartment = asyncHandler(async (req, res, next) => {
	const { name, description } = req.body;
	
	let department = await Department.findById(req.params.id);
	
	if (!department) {
		return next(new ErrorResponse('Department not found', 404));
	}
	
	// Check if new name already exists (excluding current department)
	if (name && name !== department.name) {
		const existingDept = await Department.findOne({ 
			name: { $regex: new RegExp(`^${name}$`, 'i') },
			_id: { $ne: req.params.id }
		});
		
		if (existingDept) {
			return next(new ErrorResponse('Department with this name already exists', 400));
		}
	}
	
	department = await Department.findByIdAndUpdate(
		req.params.id,
		{
			name: name ? name.trim() : department.name,
			description: description !== undefined ? description.trim() : department.description
		},
		{
			new: true,
			runValidators: true
		}
	);
	
	res.status(200).json({
		success: true,
		message: 'Department updated successfully',
		data: department
	});
});

// @desc    Delete department
// @route   DELETE /api/super-admin/departments/:id
// @access  Private (Super Admin only)
exports.deleteDepartment = asyncHandler(async (req, res, next) => {
	const department = await Department.findById(req.params.id);
	
	if (!department) {
		return next(new ErrorResponse('Department not found', 404));
	}
	
	// Check if department has complaints
	const complaintCount = await Complaint.countDocuments({ department: req.params.id });
	if (complaintCount > 0) {
		return next(new ErrorResponse(`Cannot delete department. It has ${complaintCount} associated complaints`, 400));
	}
	
	// Check if department has admins
	const adminCount = await User.countDocuments({ department: req.params.id, role: 'admin' });
	if (adminCount > 0) {
		return next(new ErrorResponse(`Cannot delete department. It has ${adminCount} associated admins`, 400));
	}
	
	await department.deleteOne();
	
	res.status(200).json({
		success: true,
		message: 'Department deleted successfully'
	});
});

// @desc    Get system statistics
// @route   GET /api/super-admin/stats
// @access  Private (Super Admin only)
exports.getSystemStats = asyncHandler(async (req, res, next) => {
	const [
		totalUsers,
		totalAdmins,
		totalDepartments,
		totalComplaints,
		recentComplaints,
		recentUsers
	] = await Promise.all([
		User.countDocuments({ role: { $ne: 'superadmin' } }),
		User.countDocuments({ role: 'admin' }),
		Department.countDocuments(),
		Complaint.countDocuments(),
		Complaint.find().populate('user', 'username').populate('department', 'name').sort({ createdAt: -1 }).limit(10),
		User.find({ role: { $ne: 'superadmin' } }).populate('department', 'name').select('-password').sort({ createdAt: -1 }).limit(10)
	]);
	
	// Get complaints by status
	const complaintsByStatus = await Complaint.aggregate([
		{
			$group: {
				_id: '$status',
				count: { $sum: 1 }
			}
		}
	]);
	
	// Get users by role
	const usersByRole = await User.aggregate([
		{
			$match: { role: { $ne: 'superadmin' } }
		},
		{
			$group: {
				_id: '$role',
				count: { $sum: 1 }
			}
		}
	]);
	
	res.status(200).json({
		success: true,
		data: {
			overview: {
				totalUsers,
				totalAdmins,
				totalDepartments,
				totalComplaints
			},
			complaintsByStatus,
			usersByRole,
			recentComplaints,
			recentUsers
		}
	});
});

// @desc    Get all complaints for analytics
// @route   GET /api/super-admin/complaints
// @access  Private (Super Admin only)
exports.getAllComplaints = asyncHandler(async (req, res, next) => {
	const complaints = await Complaint.find()
		.populate('user', 'username email')
		.populate('department', 'name')
		.sort({ createdAt: -1 });
	
	res.status(200).json({
		success: true,
		count: complaints.length,
		data: complaints
	});
});

// @desc    Get feedback analytics for super admin
// @route   GET /api/super-admin/feedback-analytics
// @access  Private (Super Admin only)
exports.getFeedbackAnalytics = asyncHandler(async (req, res, next) => {
	const feedback = await Feedback.find()
		.populate({
			path: 'submittedBy',
			select: 'username email'
		})
		.populate({
			path: 'complaint',
			select: 'title status createdAt',
			populate: {
				path: 'department',
				select: 'name'
			}
		})
		.sort({ createdAt: -1 });

	res.status(200).json({
		success: true,
		data: feedback
	});
});

// @desc    Reset user password
// @route   POST /api/super-admin/users/:id/reset-password
// @access  Private (Super Admin only)
exports.resetUserPassword = asyncHandler(async (req, res, next) => {
	const { newPassword } = req.body;
	
	if (!newPassword || newPassword.length < 6) {
		return next(new ErrorResponse('Password must be at least 6 characters long', 400));
	}
	
	const user = await User.findById(req.params.id);
	
	if (!user) {
		return next(new ErrorResponse('User not found', 404));
	}
	
	// Prevent password reset for super admin
	if (user.role === 'superadmin') {
		return next(new ErrorResponse('Cannot reset super admin password', 403));
	}
	
	user.password = newPassword;
	await user.save();
	
	res.status(200).json({
		success: true,
		message: 'Password reset successfully'
	});
});