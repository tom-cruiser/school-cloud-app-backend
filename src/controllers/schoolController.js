const schoolService = require('../services/schoolService');
const { asyncHandler } = require('../utils/errors');
const { sendSuccess, sendPaginatedResponse, getPagination } = require('../utils/helpers');
const Joi = require('joi');

class SchoolController {
  /**
   * Create a new school
   * POST /api/v1/super-admin/schools
   */
  createSchool = asyncHandler(async (req, res) => {
    const school = await schoolService.createSchool(req.body);
    sendSuccess(res, school, 'School created successfully', 201);
  });

  /**
   * Get all schools
   * GET /api/v1/super-admin/schools
   */
  getAllSchools = asyncHandler(async (req, res) => {
    const { page, limit, search, isActive } = req.query;
    const { skip, take } = getPagination(page, limit);

    const { schools, total } = await schoolService.getAllSchools({
      skip,
      take,
      search,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
    });

    sendPaginatedResponse(res, schools, page || 1, limit || 10, total, 'Schools retrieved successfully');
  });

  /**
   * Get school by ID
   * GET /api/v1/super-admin/schools/:id
   */
  getSchoolById = asyncHandler(async (req, res) => {
    const school = await schoolService.getSchoolById(req.params.id);
    sendSuccess(res, school, 'School retrieved successfully');
  });

  /**
   * Update school
   * PUT /api/v1/super-admin/schools/:id
   */
  updateSchool = asyncHandler(async (req, res) => {
    const school = await schoolService.updateSchool(req.params.id, req.body);
    sendSuccess(res, school, 'School updated successfully');
  });

  /**
   * Toggle school active status
   * PATCH /api/v1/super-admin/schools/:id/toggle-status
   */
  toggleSchoolStatus = asyncHandler(async (req, res) => {
    const school = await schoolService.toggleSchoolStatus(req.params.id);
    sendSuccess(res, school, `School ${school.isActive ? 'activated' : 'deactivated'} successfully`);
  });

  /**
   * Delete school
   * DELETE /api/v1/super-admin/schools/:id
   */
  deleteSchool = asyncHandler(async (req, res) => {
    await schoolService.deleteSchool(req.params.id);
    sendSuccess(res, null, 'School deleted successfully');
  });

  /**
   * Get school statistics
   * GET /api/v1/super-admin/schools/:id/stats
   */
  getSchoolStats = asyncHandler(async (req, res) => {
    const stats = await schoolService.getSchoolStats(req.params.id);
    sendSuccess(res, stats, 'School statistics retrieved successfully');
  });

  /**
   * Create school admin
   * POST /api/v1/super-admin/schools/:id/admin
   */
  createSchoolAdmin = asyncHandler(async (req, res) => {
    const admin = await schoolService.createSchoolAdmin(req.params.id, req.body);
    sendSuccess(res, admin, 'School admin created successfully', 201);
  });
}

// Validation schemas
const createSchoolSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().required(),
    domain: Joi.string().required(),
    email: Joi.string().email().required(),
    phone: Joi.string().optional(),
    address: Joi.string().optional(),
    primaryColor: Joi.string().optional(),
    secondaryColor: Joi.string().optional(),
    logo: Joi.string().uri().optional(),
    reportTemplateModel: Joi.string().allow('', null).optional(),
    idCardTemplateModel: Joi.string().allow('', null).optional(),
    reportTemplateFileUrl: Joi.string().allow('', null).optional(),
    idCardTemplateFileUrl: Joi.string().allow('', null).optional(),
    maxTeachers: Joi.number().integer().min(1).default(20),
  }),
});

const updateSchoolSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().optional(),
    domain: Joi.string().optional(),
    email: Joi.string().email().optional(),
    phone: Joi.string().optional(),
    address: Joi.string().optional(),
    primaryColor: Joi.string().optional(),
    secondaryColor: Joi.string().optional(),
    logo: Joi.string().uri().optional(),
    reportTemplateModel: Joi.string().allow('', null).optional(),
    idCardTemplateModel: Joi.string().allow('', null).optional(),
    reportTemplateFileUrl: Joi.string().allow('', null).optional(),
    idCardTemplateFileUrl: Joi.string().allow('', null).optional(),
    maxTeachers: Joi.number().integer().min(1).optional(),
    isActive: Joi.boolean().optional(),
  }),
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
});

const createAdminSchema = Joi.object({
  body: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
  }),
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
});

module.exports = {
  schoolController: new SchoolController(),
  createSchoolSchema,
  updateSchoolSchema,
  createAdminSchema,
};
