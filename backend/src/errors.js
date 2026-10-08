class ApiError extends Error {
  constructor(statusCode, message, code = undefined, headers = undefined) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    if (typeof code === "object" && code !== null) {
      this.headers = code;
      this.code = undefined;
    } else {
      this.code = code;
      this.headers = headers;
    }
  }
}

class ValidationError extends ApiError {
  constructor(message, code = "VALIDATION_FAILED") {
    super(400, message, code);
    this.name = "ValidationError";
  }
}

class UnauthorizedError extends ApiError {
  constructor(message = "Unauthorized", code = "UNAUTHORIZED") {
    super(401, message, code);
    this.name = "UnauthorizedError";
  }
}

class NotFoundError extends ApiError {
  constructor(message = "Not found", code = "NOT_FOUND") {
    super(404, message, code);
    this.name = "NotFoundError";
  }
}

class ConflictError extends ApiError {
  constructor(message, code = "CONFLICT") {
    super(409, message, code);
    this.name = "ConflictError";
  }
}

class UnsupportedMediaTypeError extends ApiError {
  constructor(message, code = "UNSUPPORTED_MEDIA_TYPE") {
    super(415, message, code);
    this.name = "UnsupportedMediaTypeError";
  }
}

class TooLargeError extends ApiError {
  constructor(message, code = "PAYLOAD_TOO_LARGE") {
    super(413, message, code);
    this.name = "TooLargeError";
  }
}

function toApiError(error) {
  if (error instanceof ApiError) {
    return error;
  }
  return new ApiError(500, "Internal server error", "INTERNAL_SERVER_ERROR");
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
