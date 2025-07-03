// Backend/controllers/superAdminController.js

const User = require('../models/User');
const Department = require('../models/Department');
const Complaint = require('../models/Complaint');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const sendEmail = require('../utils/emailService');

// @desc    Get all users (admins and regular users)
// @route   GET /api/super-admin/users
// @access  Private (Super Admin only)
exports.getAllUsers = asyncHandler(async (req, res, next) => {
	const { page = 1, limit = 20, role, search } = req.query;
	
	let query = {};
	
	// Filter by role if specified
	if (role && role !== 'all') {
		query.role = role;
	}
	
	// Search functionality
	if (search) {
		query.$or = [
			{ username: { $regex: search, $options: 'i' } },
			{ email: { $regex: search, $options: 'i' } }
		];
	}
	
	const users = await User.find(query)
		.populate('department', 'name')
		.select('-password')
		.sort({ createdAt: -1 })
		.limit(limit * 1)
		.skip((page - 1) * limit);
	
	const total = await User.countDocuments(query);
	
	res.status(200).json({
		success: true,
		count: users.length,
		total,
		pages: Math.ceil(total / limit),
		currentPage: page,
		data: users
	});
});

// @desc    Create new admin user
// @route   POST /api/super-admin/create-admin
// @access  Private (Super Admin only)
exports.createAdmin = asyncHandler(async (req, res, next) => {
	const { username, email, password, department } = req.body;
	
	if (!username || !email || !password) {
		return next(new ErrorResponse('Please provide username, email, and password', 400));
	}
	
	// Check if user already exists
	const existingUser = await User.findOne({
		$or: [{ email: email.toLowerCase() }, { username }]
	});
	
	if (existingUser) {
		return next(new ErrorResponse('User with this email or username already exists', 400));
	}
	
	// Check if department exists (if provided)
	if (department) {
		const deptExists = await Department.findById(department);
		if (!deptExists) {
			return next(new ErrorResponse('Department not found', 404));
		}
	}
	
	// Create admin user
	const admin = await User.create({
		username,
		email: email.toLowerCase(),
		password,
		role: 'admin',
		department: department || null,
		isVerified: true // Auto-verify admin accounts
	});
	
	// Send welcome email to new admin
	try {
		const mailOptions = {
			to: admin.email,
			subject: 'Welcome - Admin Account Created',
			html: `
				<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
					<h2 style="color: #2c3e50;">Welcome to the Admin Panel</h2>
					<p>Hello <strong>${admin.username}</strong>,</p>
					<p>Your administrator account has been created successfully.</p>
					<div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
						<h3>Account Details:</h3>
						<p><strong>Username:</strong> ${admin.username}</p>
						<p><strong>Email:</strong> ${admin.email}</p>
						<p><strong>Role:</strong> Administrator</p>
						${department ? `<p><strong>Department:</strong> ${department}</p>` : ''}
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
		message: 'Admin user created successfully',
		data: admin
	});
});

// @desc    Update user details
// @route   PUT /api/super-admin/users/:id
// @access  Private (Super Admin only)
exports.updateUser = asyncHandler(async (req, res, next) => {
	const { username, email, role, department, isVerified } = req.body;
	
	let user = await User.findById(req.params.id);
	
	if (!user) {
		return next(new ErrorResponse('User not found', 404));
	}
	
	// Prevent super admin from being demoted
	if (user.role === 'superadmin' && role !== 'superadmin') {
		return next(new ErrorResponse('Cannot change super admin role', 403));
	}
	
	// Check if department exists (if provided)
	if (department) {
		const deptExists = await Department.findById(department);
		if (!deptExists) {
			return next(new ErrorResponse('Department not found', 404));
		}
	}
	
	// Update user
	user = await User.findByIdAndUpdate(
		req.params.id,
		{
			username: username || user.username,
			email: email ? email.toLowerCase() : user.email,
			role: role || user.role,
			department: department !== undefined ? department : user.department,
			isVerified: isVerified !== undefined ? isVerified : user.isVerified
		},
		{
			new: true,
			runValidators: true
		}
	).populate('department', 'name').select('-password');
	
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
	
	// Get complaint count for each department
	const departmentsWithStats = await Promise.all(
		departments.map(async (dept) => {
			const complaintCount = await Complaint.countDocuments({ department: dept._id });
			const adminCount = await User.countDocuments({ department: dept._id, role: 'admin' });
			
			return {
				...dept.toObject(),
				complaintCount,
				adminCount
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
			return next(new ErrorResponse('Department name already exists', 400));
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
	
	// Update password
	user.password = newPassword;
	await user.save();
	
	// Send notification email
	try {
		const mailOptions = {
			to: user.email,
			subject: 'Password Reset - Admin Action',
			html: `
				<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
					<h2 style="color: #e74c3c;">Password Reset Notification</h2>
					<p>Hello <strong>${user.username}</strong>,</p>
					<p>Your password has been reset by a system administrator.</p>
					<p><strong>Important:</strong> Please log in with your new password and change it immediately for security.</p>
					<p>If you did not request this password reset, please contact support immediately.</p>
					<hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
					<p style="color: #666; font-size: 12px;">
						This is an automated message from the Complaint Management System.
					</p>
				</div>
			`,
		};
		
		await sendEmail(mailOptions.to, mailOptions.subject, '', mailOptions.html);
	} catch (emailError) {
		console.error('Error sending password reset email:', emailError);
	}
	
	res.status(200).json({
		success: true,
		message: 'Password reset successfully. User has been notified via email.'
	});
});