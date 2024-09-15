const jwt = require("jsonwebtoken");
const checkStatus = require("./checkStatus");
const checkGroup = require("./checkGroup");
const { activeSessions } = require("../utils/config/sessionStore");

const authenticateToken = (expectedStatus, userGroup) => (req, res, next) => {
  const token = req.cookies.token; // Extract token from cookies

  // Check if token exists and is in the active session store
  if (!token || !activeSessions[token]) {
    return res
      .status(401)
      .json({ message: "Access Denied: Token is required" });
  }

  // Verify the token
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      // Invalidate the session if the token is expired or invalid
      if (activeSessions[token]) {
        delete activeSessions[token]; // Remove from session store
      }
      return res
        .status(403)
        .json({ message: "Access Denied: Invalid or Expired Token" });
    }

    // Extract IP address from token and request
    const tokenIpAddress = decoded.ipAddress;
    const currentIpAddress =
      req.headers["x-forwarded-for"] || req.connection.remoteAddress;

    // Normalize IP addresses if necessary
    const normalizedTokenIp = tokenIpAddress.trim().toLowerCase();
    const normalizedCurrentIp = currentIpAddress.trim().toLowerCase();

    // Check if IP addresses match
    if (normalizedTokenIp !== normalizedCurrentIp) {
      // Invalidate the session if IPs mismatch
      if (activeSessions[token]) {
        delete activeSessions[token]; // Remove from session store
      }
      return res
        .status(403)
        .json({ message: "Access Denied: IP address mismatch" });
    }

    // Attach user information to the request object
    req.user = decoded;

    // Check user status and group membership
    checkStatus(expectedStatus)(req, res, () => {
      if (userGroup) {
        checkGroup(decoded.username, userGroup)(req, res, next);
      } else {
        next(); // No group check, proceed to next middleware
      }
    });
  });
};

module.exports = authenticateToken;
