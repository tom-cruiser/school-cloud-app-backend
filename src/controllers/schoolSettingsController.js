const schoolService = require('../services/schoolService');
const { asyncHandler } = require('../utils/errors');
const { sendSuccess } = require('../utils/helpers');
const Joi = require('joi');

class SchoolSettingsController {
  /**
   * Get current school template settings
   * GET /api/v1/schools/template-settings
   */
  getTemplateSettings = asyncHandler(async (req, res) => {
    const settings = await schoolService.getSchoolTemplateSettings(req.user.schoolId);
    sendSuccess(res, settings, 'Template settings retrieved successfully');
  });

  /**
   * Update current school template settings
   * PUT /api/v1/schools/template-settings
   */
  updateTemplateSettings = asyncHandler(async (req, res) => {
    const reportTemplateFile = req.files?.reportTemplateFile?.[0];
    const idCardTemplateFile = req.files?.idCardTemplateFile?.[0];

    const updatePayload = {
      ...req.body,
    };

    if (reportTemplateFile) {
      updatePayload.reportTemplateFileUrl = `/uploads/templates/${reportTemplateFile.filename}`;
    }

    if (idCardTemplateFile) {
      updatePayload.idCardTemplateFileUrl = `/uploads/templates/${idCardTemplateFile.filename}`;
    }

    if (String(req.body?.clearReportTemplateFile || '').toLowerCase() === 'true') {
      updatePayload.reportTemplateFileUrl = null;
    }

    if (String(req.body?.clearIdCardTemplateFile || '').toLowerCase() === 'true') {
      updatePayload.idCardTemplateFileUrl = null;
    }

    const settings = await schoolService.updateSchoolTemplateSettings(req.user.schoolId, updatePayload);
    sendSuccess(res, settings, 'Template settings updated successfully');
  });
}

const updateTemplateSettingsSchema = Joi.object({
  body: Joi.object({
    reportTemplateModel: Joi.string().allow('', null).max(10000).optional(),
    idCardTemplateModel: Joi.string().allow('', null).max(10000).optional(),
    clearReportTemplateFile: Joi.boolean().optional(),
    clearIdCardTemplateFile: Joi.boolean().optional(),
  }),
});

module.exports = {
  schoolSettingsController: new SchoolSettingsController(),
  updateTemplateSettingsSchema,
};
