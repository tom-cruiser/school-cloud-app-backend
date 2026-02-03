const authService = require('../services/authService');
const { asyncHandler } = require('../utils/errors');
const { sendSuccess } = require('../utils/helpers');
const Joi = require('joi');

class AuthController {
  /**
   * @swagger
   * /auth/register:
   *   post:
   *     tags:
   *       - Authentication
   *     summary: Register a new user
   *     description: Create a new user account in the system
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - password
   *               - firstName
   *               - lastName
   *               - role
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *                 example: teacher@example.com
   *               password:
   *                 type: string
   *                 format: password
   *                 minLength: 8
   *                 example: SecurePassword123!
   *               firstName:
   *                 type: string
   *                 example: John
   *               lastName:
   *                 type: string
   *                 example: Doe
   *               role:
   *                 type: string
   *                 enum: [SUPER_ADMIN, SCHOOL_ADMIN, TEACHER, STUDENT, PARENT]
   *                 example: TEACHER
   *               schoolId:
   *                 type: string
   *                 format: uuid
   *                 description: Required for non-SUPER_ADMIN roles
   *     responses:
   *       201:
   *         description: User registered successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: User registered successfully
   *                 data:
   *                   $ref: '#/components/schemas/User'
   *       400:
   *         description: Invalid input data
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       409:
   *         description: User already exists
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *     security: []
   */
  register = asyncHandler(async (req, res) => {
    const user = await authService.register(req.body);
    sendSuccess(res, user, 'User registered successfully', 201);
  });

  /**
   * @swagger
   * /auth/login:
   *   post:
   *     tags:
   *       - Authentication
   *     summary: Login user
   *     description: Authenticate user and return access and refresh tokens
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - password
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *                 example: admin@example.com
   *               password:
   *                 type: string
   *                 format: password
   *                 example: password123
   *     responses:
   *       200:
   *         description: Login successful
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: Login successful
   *                 data:
   *                   type: object
   *                   properties:
   *                     user:
   *                       $ref: '#/components/schemas/User'
   *                     accessToken:
   *                       type: string
   *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   *                       description: JWT access token (valid for 24 hours)
   *                     refreshToken:
   *                       type: string
   *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   *                       description: JWT refresh token (valid for 7 days)
   *       401:
   *         description: Invalid credentials
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *     security: []
   */
  login = asyncHandler(async (req, res) => {
    const result = await authService.login(req.body);
    sendSuccess(res, result, 'Login successful');
  });

  /**
   * @swagger
   * /auth/refresh:
   *   post:
   *     tags:
   *       - Authentication
   *     summary: Refresh access token
   *     description: Get a new access token using a valid refresh token
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - refreshToken
   *             properties:
   *               refreshToken:
   *                 type: string
   *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   *     responses:
   *       200:
   *         description: Token refreshed successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: Token refreshed successfully
   *                 data:
   *                   type: object
   *                   properties:
   *                     accessToken:
   *                       type: string
   *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   *                     refreshToken:
   *                       type: string
   *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   *       401:
   *         description: Invalid or expired refresh token
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *     security: []
   */
  refreshToken = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    const result = await authService.refreshAccessToken(refreshToken);
    sendSuccess(res, result, 'Token refreshed successfully');
  });

  /**
   * @swagger
   * /auth/logout:
   *   post:
   *     tags:
   *       - Authentication
   *     summary: Logout user
   *     description: Invalidate the refresh token and logout the user
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - refreshToken
   *             properties:
   *               refreshToken:
   *                 type: string
   *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   *     responses:
   *       200:
   *         description: Logout successful
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: Logout successful
   *                 data:
   *                   type: null
   *       400:
   *         description: Invalid request
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *     security: []
   */
  logout = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    await authService.logout(refreshToken);
    sendSuccess(res, null, 'Logout successful');
  });

  /**
   * @swagger
   * /auth/change-password:
   *   post:
   *     tags:
   *       - Authentication
   *     summary: Change password
   *     description: Change the password for the authenticated user
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - currentPassword
   *               - newPassword
   *             properties:
   *               currentPassword:
   *                 type: string
   *                 format: password
   *                 example: OldPassword123!
   *               newPassword:
   *                 type: string
   *                 format: password
   *                 minLength: 8
   *                 example: NewPassword123!
   *     responses:
   *       200:
   *         description: Password changed successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: Password changed successfully
   *                 data:
   *                   type: null
   *       401:
   *         description: Current password is incorrect
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    await authService.changePassword(req.user.id, currentPassword, newPassword);
    sendSuccess(res, null, 'Password changed successfully');
  });

  /**
   * @swagger
   * /auth/me:
   *   get:
   *     tags:
   *       - Authentication
   *     summary: Get current user profile
   *     description: Retrieve the profile information of the authenticated user
   *     responses:
   *       200:
   *         description: Profile retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: Profile retrieved successfully
   *                 data:
   *                   $ref: '#/components/schemas/User'
   *       401:
   *         description: Unauthorized - Invalid or missing token
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  getProfile = asyncHandler(async (req, res) => {
    sendSuccess(res, req.user, 'Profile retrieved successfully');
  });

  /**
   * Update user profile
   * PUT /api/v1/auth/profile
   */
  updateProfile = asyncHandler(async (req, res) => {
    const updatedUser = await authService.updateProfile(req.user.id, req.body);
    sendSuccess(res, updatedUser, 'Profile updated successfully');
  });
}

// Validation schemas
const registerSchema = Joi.object({
  body: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    role: Joi.string().valid('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT').required(),
    schoolId: Joi.string().uuid().when('role', {
      is: Joi.string().valid('SCHOOL_ADMIN', 'TEACHER', 'STUDENT'),
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
  }),
});

const loginSchema = Joi.object({
  body: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),
});

const refreshTokenSchema = Joi.object({
  body: Joi.object({
    refreshToken: Joi.string().required(),
  }),
});

const changePasswordSchema = Joi.object({
  body: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(8).required(),
  }),
});

const updateProfileSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().optional(),
    email: Joi.string().email().optional(),
    firstName: Joi.string().optional(),
    lastName: Joi.string().optional(),
  }).min(1),
});

module.exports = {
  authController: new AuthController(),
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  changePasswordSchema,
  updateProfileSchema,
};
