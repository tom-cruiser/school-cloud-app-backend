const Joi = require('joi');
const { ValidationError } = require('../utils/errors');

/**
 * Validate request data against Joi schema
 */
const validate = (schema) => {
  return (req, res, next) => {
    const validationOptions = {
      abortEarly: false, // Return all errors
      allowUnknown: true, // Allow unknown keys
      stripUnknown: true, // Remove unknown keys
    };

    const dataToValidate = {
      body: req.body,
      query: req.query,
      params: req.params,
    };

    const { error, value } = schema.validate(dataToValidate, validationOptions);

    if (error) {
      const errorMessage = error.details
        .map((detail) => detail.message)
        .join(', ');
      return next(new ValidationError(errorMessage));
    }

    // Replace request data with validated data
    req.body = value.body || req.body;
    req.query = value.query || req.query;
    req.params = value.params || req.params;

    next();
  };
};

// Common validation schemas
const commonSchemas = {
  id: Joi.string().uuid().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  schoolId: Joi.string().uuid().required(),
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
  }),
  dateRange: Joi.object({
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')),
  }),
};

module.exports = {
  validate,
  commonSchemas,
};
