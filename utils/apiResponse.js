const { STATUS_CODES } = require('../constants');

class ApiResponse {
  static success(res, data, message = 'Success', statusCode = STATUS_CODES.OK) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  static error(res, message, statusCode = STATUS_CODES.SERVER_ERROR, errors = null) {
    return res.status(statusCode).json({
      success: false,
      message,
      errors,
      timestamp: new Date().toISOString(),
    });
  }

  static created(res, data, message = 'Created successfully') {
    return this.success(res, data, message, STATUS_CODES.CREATED);
  }

  static badRequest(res, message, errors = null) {
    return this.error(res, message, STATUS_CODES.BAD_REQUEST, errors);
  }

  static unauthorized(res, message = 'Unauthorized') {
    return this.error(res, message, STATUS_CODES.UNAUTHORIZED);
  }

  static forbidden(res, message = 'Forbidden') {
    return this.error(res, message, STATUS_CODES.FORBIDDEN);
  }

  static notFound(res, message = 'Not found') {
    return this.error(res, message, STATUS_CODES.NOT_FOUND);
  }

  static validationError(res, errors, message = 'Validation failed') {
    return this.error(res, message, STATUS_CODES.VALIDATION_ERROR, errors);
  }

  static serverError(res, message = 'Internal server error') {
    return this.error(res, message, STATUS_CODES.SERVER_ERROR);
  }
}

module.exports = ApiResponse;