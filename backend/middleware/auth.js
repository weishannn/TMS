const jwt = require("jsonwebtoken");
const checkStatus = require("./checkStatus");
const checkGroup = require("./checkGroup");

const authenticateToken = (expectedStatus, userGroup) => (req, res, next) => {
  const token = req.cookies.token; // Extract token from cookies

  if (!token) {
    return res
      .status(401)
      .json({ message: "Access Denied: Token is required" });
  }

  // Verify the token
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res
        .status(403)
        .json({ message: "Access Denied: Invalid or Expired Token" });
    }

    // Extract IP address from token and request
    const tokenIpAddress = decoded.ipAddress;
    const currentIpAddress =
      req.headers["x-forwarded-for"] || req.connection.remoteAddress;

    // Check if IP addresses match
    if (tokenIpAddress !== currentIpAddress) {
      return res
        .status(403)
        .json({ message: "Access Denied: IP address mismatch" });
    }

    // Extract username from decoded token
    const username = decoded.username;

    // Attach user information to the request object
    req.user = decoded;

    // Check user status
    checkStatus(expectedStatus)(req, res, () => {
      // After status check, conditionally check user group
      if (userGroup) {
        checkGroup(username, userGroup)(req, res, next);
      } else {
        next(); // No group check needed, proceed to next middleware
      }
    });
  });
};

module.exports = authenticateToken;
