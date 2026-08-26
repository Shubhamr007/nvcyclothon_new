class ApiError extends Error {
  constructor(statusCode, message, headers = undefined) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.headers = headers;
  }
}

class ValidationError extends ApiError {
  constructor(message) {
    super(400, message);
    this.name = "ValidationError";
  }
}

class UnauthorizedError extends ApiError {
  constructor(message = "Unauthorized") {
    super(401, message);
    this.name = "UnauthorizedError";
  }
}

class NotFoundError extends ApiError {
  constructor(message = "Not found") {
    super(404, message);
    this.name = "NotFoundError";
  }
}

class ConflictError extends ApiError {
  constructor(message) {
    super(409, message);
    this.name = "ConflictError";
  }
}

class UnsupportedMediaTypeError extends ApiError {
  constructor(message) {
    super(415, message);
    this.name = "UnsupportedMediaTypeError";
  }
}

class TooLargeError extends ApiError {
  constructor(message) {
    super(413, message);
    this.name = "TooLargeError";
  }
}

function toApiError(error) {
  if (error instanceof ApiError) {
    return error;
  }
  return new ApiError(500, "Internal server error");
}

module.exports = {
  ApiError,
  ValidationError,
  UnauthorizedError,
  NotFoundError,
  ConflictError,
  UnsupportedMediaTypeError,
  TooLargeError,
  toApiError,
};
