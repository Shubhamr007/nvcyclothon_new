/**
 * Client-Side Error Sanitizer and Normalized Error Catalog
 *
 * Ensures NO raw backend errors, stack traces, or cryptic technical
 * jargon (such as "authentication Failed", "ECONNREFUSED", or SQL errors)
 * are ever displayed to users in the UI.
 *
 * All errors are mapped into friendly, accessible, action-oriented messages
 * with standardized error codes for effortless support and debugging.
 */

export class AppError extends Error {
  constructor({
    status = 0,
    code = "ERR_UNKNOWN",
    title = "Something Went Wrong",
    message = "An unexpected error occurred. Please try again.",
    actionText = "Try Again",
    retryable = true,
    rawDetail = null,
  }) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.code = code;
    this.title = title;
    this.userMessage = message;
    this.actionText = actionText;
    this.retryable = retryable;
    this.rawDetail = rawDetail;
  }
}

/**
 * Standard error mappings by HTTP status or backend error code
 */
const STATUS_ERROR_MAP = {
  400: {
    code: "ERR_VALIDATION_FAILED",
    title: "Check Your Details",
    message: "Some information you entered needs attention. Please review the highlighted fields.",
    actionText: "Review Fields",
    retryable: true,
  },
  401: {
    code: "ERR_UNAUTHORIZED",
    title: "Session Expired",
    message: "Your session has timed out or is unauthorized. Please log in or refresh the page.",
    actionText: "Log In",
    retryable: false,
  },
  403: {
    code: "ERR_ACCESS_DENIED",
    title: "Action Not Permitted",
    message: "Registrations or this action are currently closed or restricted. Wave allocations reopen soon.",
    actionText: "View Schedule",
    retryable: false,
  },
  404: {
    code: "ERR_NOT_FOUND",
    title: "Not Found",
    message: "The requested route, registration, or document could not be located.",
    actionText: "Back to Home",
    retryable: false,
  },
  409: {
    code: "ERR_DUPLICATE_REGISTRATION",
    title: "Already Registered",
    message: "This email address or phone number is already registered for NV Cyclothon 2026. Check your inbox for your pass.",
    actionText: "Check Email",
    retryable: false,
  },
  413: {
    code: "ERR_FILE_TOO_LARGE",
    title: "File Too Large",
    message: "The uploaded file exceeds the maximum size limit (25 MB). Please choose a smaller file.",
    actionText: "Choose Another File",
    retryable: true,
  },
  415: {
    code: "ERR_UNSUPPORTED_FORMAT",
    title: "Unsupported File Format",
    message: "Please upload an accepted file format (PDF, JPG, PNG).",
    actionText: "Choose Another File",
    retryable: true,
  },
  429: {
    code: "ERR_RATE_LIMITED",
    title: "Too Many Attempts",
    message: "You have made multiple attempts in a short period. For your security and to prevent duplicate entries, please wait a few minutes before trying again.",
    actionText: "Wait a Few Minutes",
    retryable: true,
  },
  502: {
    code: "ERR_GATEWAY_TIMEOUT",
    title: "Connection Temporarily Interrupted",
    message: "The server is taking longer than usual to respond. Please try again in a moment.",
    actionText: "Retry",
    retryable: true,
  },
  503: {
    code: "ERR_PAYMENT_UNAVAILABLE",
    title: "Payment Gateway Updating",
    message: "Our secure payment system is temporarily updating. No amount has been deducted. Please wait a moment and retry.",
    actionText: "Try Again in a Moment",
    retryable: true,
  },
  504: {
    code: "ERR_GATEWAY_TIMEOUT",
    title: "Request Timed Out",
    message: "The server took too long to complete your request. Please check your connection and retry.",
    actionText: "Retry",
    retryable: true,
  },
};

/**
 * Normalizes any caught error (API responses, network failures, JS exceptions)
 * into a structured, sanitized AppError instance.
 *
 * @param {any} error
 * @returns {AppError}
 */
export function normalizeError(error) {
  if (error instanceof AppError) {
    return error;
  }

  // Already structured error from our fetch wrapper
  if (error && typeof error === "object" && error.name === "ApiError") {
    const status = error.status || 500;
    const rawDetail = String(error.rawDetail || error.message || "");
    const base = STATUS_ERROR_MAP[status] || {
      code: "ERR_SERVER_ERROR",
      title: "Service Temporarily Unavailable",
      message: "We encountered an unexpected server error. Our engineering team has been alerted. Please try again shortly.",
      actionText: "Retry",
      retryable: true,
    };

    // Specific backend detail matches mapped to clear user messages
    let customMessage = base.message;
    let customTitle = base.title;
    let customCode = error.code || base.code;

    const lower = rawDetail.toLowerCase();

    if (lower.includes("rate") || lower.includes("too many") || status === 429) {
      customCode = "ERR_RATE_LIMITED";
      customTitle = "Too Many Attempts";
      customMessage =
        "You have made multiple registration attempts recently. Please pause for a few minutes before trying again.";
    } else if (lower.includes("authentication") || lower.includes("cashfree") || status === 503) {
      customCode = "ERR_PAYMENT_UNAVAILABLE";
      customTitle = "Payment Service Updating";
      customMessage =
        "Our secure payment gateway is temporarily updating. No payment was deducted. Please wait a moment and try again.";
    } else if (lower.includes("already registered") || lower.includes("already exists") || status === 409) {
      customCode = "ERR_DUPLICATE_REGISTRATION";
      customTitle = "Already Registered";
      customMessage =
        "A participant with this email address or phone number is already registered. If you already signed up, please check your inbox for your confirmation.";
    } else if (lower.includes("registration is currently closed") || (status === 403 && lower.includes("closed"))) {
      customCode = "ERR_REGISTRATION_CLOSED";
      customTitle = "Registrations Paused";
      customMessage =
        "Registrations are currently closed while category allocations are prepared. The next wave will open soon.";
    } else if (lower.includes("waiver") || lower.includes("privacy")) {
      customCode = "ERR_CONSENT_REQUIRED";
      customTitle = "Terms Acceptance Required";
      customMessage =
        "Please accept the rider waiver and privacy notice to continue with registration.";
    }

    return new AppError({
      status,
      code: customCode,
      title: customTitle,
      message: customMessage,
      actionText: base.actionText,
      retryable: base.retryable,
      rawDetail,
    });
  }

  // Network / Abort / Fetch errors
  const errString = String(error?.message || error || "");
  const errLower = errString.toLowerCase();

  if (
    error?.name === "AbortError" ||
    errLower.includes("aborted") ||
    errLower.includes("timeout")
  ) {
    return new AppError({
      status: 408,
      code: "ERR_TIMEOUT",
      title: "Request Timed Out",
      message: "The server took too long to respond. Please check your connection and try again.",
      actionText: "Retry Request",
      retryable: true,
      rawDetail: errString,
    });
  }

  if (
    errLower.includes("failed to fetch") ||
    errLower.includes("networkerror") ||
    errLower.includes("network request failed") ||
    errLower.includes("internet") ||
    !navigator.onLine
  ) {
    return new AppError({
      status: 0,
      code: "ERR_NETWORK_OFFLINE",
      title: "Connection Problem",
      message: "Unable to reach NV Cyclothon servers. Please check your internet connection and try again.",
      actionText: "Retry Connection",
      retryable: true,
      rawDetail: errString,
    });
  }

  // Catch-all runtime error
  return new AppError({
    status: 500,
    code: "ERR_CLIENT_EXCEPTION",
    title: "Unexpected Issue",
    message: "Something didn't go as planned on this page. Please refresh or retry.",
    actionText: "Reload Page",
    retryable: true,
    rawDetail: errString,
  });
}
