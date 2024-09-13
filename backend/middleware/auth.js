const jwt = require("jsonwebtoken");

function authenticateToken(req, res, next) {
  const token = req.cookies.token; // Extract token from cookies

  if (!token) {
    return res
      .status(401)
      .json({ message: "Access Denied: Token is required" });
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) {
      return res
        .status(403)
        .json({ message: "Access Denied: Invalid or Expired Token" });
    }
    req.user = user;
    next(); // Proceed to the next middleware or route handler
  });
}

module.exports = authenticateToken;
