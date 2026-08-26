const crypto = require("crypto");
const { UnauthorizedError } = require("../errors");

function base64UrlEncode(input) {
  return Buffer.from(input).toString("base64url");
}

function safeCompare(left, right) {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  if (a.length !== b.length) {
    return false;
  }
  return crypto.timingSafeEqual(a, b);
}

function issueScopedToken({ scope, expiresInSeconds, secret, claims = {} }) {
  const payload = {
    scope,
    exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
    ...claims,
  };
  const encoded = base64UrlEncode(JSON.stringify(payload));
  const signature = crypto
    .createHmac("sha256", secret)
    .update(encoded)
    .digest("base64url");
  return `${encoded}.${signature}`;
}

function verifyScopedToken(token, { expectedScope, secret, errorMessage }) {
  const [encoded, providedSignature] = String(token || "").split(".");
  if (!encoded || !providedSignature) {
    throw new UnauthorizedError(errorMessage);
  }

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(encoded)
    .digest("base64url");

  if (!safeCompare(providedSignature, expectedSignature)) {
    throw new UnauthorizedError(errorMessage);
  }

  let payload;
  try {
    payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
  } catch {
    throw new UnauthorizedError(errorMessage);
  }

  if (
    payload.scope !== expectedScope ||
    typeof payload.exp !== "number" ||
    payload.exp < Math.floor(Date.now() / 1000)
  ) {
    throw new UnauthorizedError(errorMessage);
  }

  return payload;
}

function issueAdminToken(config) {
  return issueScopedToken({
    scope: "admin",
    expiresInSeconds: config.adminSessionTtlSeconds,
    secret: config.adminApiKey,
    claims: { subject: "admin" },
  });
}

function verifyAdminToken(token, config) {
  return verifyScopedToken(token, {
    expectedScope: "admin",
    secret: config.adminApiKey,
    errorMessage: "Invalid or expired admin session",
  });
}

function issueVolunteerToken(config, volunteerName) {
  const resolvedName = String(volunteerName || "Volunteer").trim() || "Volunteer";
  return issueScopedToken({
    scope: "volunteer_checkin",
    expiresInSeconds: config.volunteerSessionTtlSeconds,
    secret: config.volunteerTokenSecret,
    claims: {
      volunteer_name: resolvedName,
    },
  });
}

function verifyVolunteerToken(token, config) {
  return verifyScopedToken(token, {
    expectedScope: "volunteer_checkin",
    secret: config.volunteerTokenSecret,
    errorMessage: "Invalid or expired volunteer session",
  });
}

function requireAdmin(config) {
  return (req, _res, next) => {
    try {
      const authorization = req.header("authorization") || "";
      const [scheme, token] = authorization.split(" ");
      if ((scheme || "").toLowerCase() !== "bearer" || !token) {
        throw new UnauthorizedError("Admin authentication is required");
      }
      req.adminSession = verifyAdminToken(token, config);
      next();
    } catch (error) {
      next(error);
    }
  };
}

function requireVolunteer(config) {
  return (req, _res, next) => {
    try {
      const authorization = req.header("authorization") || "";
      const [scheme, token] = authorization.split(" ");
      if ((scheme || "").toLowerCase() !== "bearer" || !token) {
        throw new UnauthorizedError("Volunteer authentication is required");
      }
      const payload = verifyVolunteerToken(token, config);
      req.volunteerSession = payload;
      next();
    } catch (error) {
      next(error);
    }
  };
}

module.exports = {
  safeCompare,
  issueAdminToken,
  verifyAdminToken,
  issueVolunteerToken,
  verifyVolunteerToken,
  requireAdmin,
  requireVolunteer,
};
