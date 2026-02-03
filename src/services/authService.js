const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('../config');
const prisma = require('../config/database');
const { AuthenticationError, ValidationError, ConflictError } = require('../utils/errors');
const logger = require('../config/logger');

class AuthService {
  /**
   * Register a new user
   */
  async register(userData) {
    const { email, password, firstName, lastName, role, schoolId } = userData;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, config.bcryptRounds);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role,
        schoolId,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        schoolId: true,
        createdAt: true,
      },
    });

    logger.info(`User registered: ${user.email}`);

    return user;
  }

  /**
   * Login user
   */
  async login(credentials) {
    const { email, password } = credentials;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        school: {
          select: {
            id: true,
            name: true,
            domain: true,
            isActive: true,
          },
        },
      },
    });

    if (!user) {
      throw new AuthenticationError('Invalid email or password');
    }

    if (!user.isActive) {
      throw new AuthenticationError('Account is inactive');
    }

    // Check if user's school is active (for non-super-admin users)
    if (user.schoolId && user.school && !user.school.isActive) {
      throw new AuthenticationError('School is deactivated. Please contact support.');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AuthenticationError('Invalid email or password');
    }

    // Generate tokens
    const accessToken = this.generateAccessToken(user.id, user.role, user.schoolId);
    const refreshToken = this.generateRefreshToken(user.id);

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    logger.info(`User logged in: ${user.email}`);

    // Remove password from response and format user object
    const { password: _, ...userWithoutPassword } = user;
    const formattedUser = {
      ...userWithoutPassword,
      name: `${user.firstName} ${user.lastName}`,
    };

    return {
      user: formattedUser,
      accessToken,
      refreshToken,
    };
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken) {
    try {
      // Verify refresh token
      let decoded;
      try {
        decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
      } catch (jwtError) {
        if (jwtError.name === 'TokenExpiredError') {
          throw new AuthenticationError('Refresh token expired. Please login again.');
        } else if (jwtError.name === 'JsonWebTokenError') {
          throw new AuthenticationError('Invalid refresh token');
        }
        throw new AuthenticationError('Token verification failed');
      }

      // Check if refresh token exists in database
      const storedToken = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: {
          user: {
            select: {
              id: true,
              role: true,
              schoolId: true,
              isActive: true,
            },
          },
        },
      });

      if (!storedToken) {
        throw new AuthenticationError('Invalid refresh token');
      }

      if (storedToken.expiresAt < new Date()) {
        // Delete expired token
        await prisma.refreshToken.delete({
          where: { id: storedToken.id },
        });
        throw new AuthenticationError('Refresh token expired');
      }

      if (!storedToken.user.isActive) {
        throw new AuthenticationError('User account is inactive');
      }

      // Generate new access token
      const accessToken = this.generateAccessToken(
        storedToken.user.id,
        storedToken.user.role,
        storedToken.user.schoolId
      );

      return { accessToken };
    } catch (error) {
      throw new AuthenticationError('Invalid or expired refresh token');
    }
  }

  /**
   * Logout user
   */
  async logout(refreshToken) {
    if (refreshToken) {
      await prisma.refreshToken.deleteMany({
        where: { token: refreshToken },
      });
    }
    logger.info('User logged out');
  }

  /**
   * Change password
   */
  async changePassword(userId, currentPassword, newPassword) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new ValidationError('User not found');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new ValidationError('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, config.bcryptRounds);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    // Delete all refresh tokens for this user
    await prisma.refreshToken.deleteMany({
      where: { userId },
    });

    logger.info(`Password changed for user: ${user.email}`);
  }

  /**
   * Update user profile
   */
  async updateProfile(userId, updateData) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new ValidationError('User not found');
    }

    // Prepare update data
    const dataToUpdate = {};

    // Handle name field (combine to firstName/lastName or update directly)
    if (updateData.name) {
      const nameParts = updateData.name.trim().split(' ');
      if (nameParts.length >= 2) {
        dataToUpdate.firstName = nameParts[0];
        dataToUpdate.lastName = nameParts.slice(1).join(' ');
      } else {
        dataToUpdate.firstName = nameParts[0];
      }
    }

    // Handle firstName and lastName separately if provided
    if (updateData.firstName) {
      dataToUpdate.firstName = updateData.firstName;
    }
    if (updateData.lastName) {
      dataToUpdate.lastName = updateData.lastName;
    }

    // Handle email
    if (updateData.email && updateData.email !== user.email) {
      // Check if email is already taken
      const existingUser = await prisma.user.findUnique({
        where: { email: updateData.email },
      });

      if (existingUser) {
        throw new ConflictError('Email is already in use');
      }

      dataToUpdate.email = updateData.email;
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        schoolId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        school: {
          select: {
            id: true,
            name: true,
            domain: true,
          },
        },
      },
    });

    logger.info(`Profile updated for user: ${updatedUser.email}`);

    // Format user object with name field
    const formattedUser = {
      ...updatedUser,
      name: `${updatedUser.firstName} ${updatedUser.lastName}`,
    };

    return formattedUser;
  }

  /**
   * Generate access token
   */
  generateAccessToken(userId, role, schoolId) {
    return jwt.sign(
      {
        userId,
        role,
        schoolId,
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );
  }

  /**
   * Generate refresh token
   */
  generateRefreshToken(userId) {
    return jwt.sign(
      { userId },
      config.jwt.refreshSecret,
      { expiresIn: config.jwt.refreshExpiresIn }
    );
  }
}

module.exports = new AuthService();
