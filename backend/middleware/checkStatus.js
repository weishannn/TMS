const db = require("../models/db");
const catchAsyncErrors = require("./catchAsyncErrors");

const queryAsync = (query, params) => {
  return new Promise((resolve, reject) => {
    db.query(query, params, (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
};

// Middleware function to check if user is active
const checkStatus = (expectedStatus) =>
  catchAsyncErrors(async (req, res, next) => {
    if (!req.user || !req.user.username) {
      return res.status(400).json({ error: "User information is required" });
    }

    const username = req.user.username;

    try {
      const results = await queryAsync(
        "SELECT accountStatus FROM accounts WHERE username = ?",
        [username]
      );

      if (results.length > 0) {
        const accountStatus = results[0].accountStatus;

        if (accountStatus !== expectedStatus) {
          return res
            .status(403)
            .json({ error: "Access Denied: User is inactive" });
        }

        next(); // User is active, proceed to the next middleware or route handler
      } else {
        return res.status(404).json({ error: "User not found" });
      }
    } catch (err) {
      console.error("Error checking user status:", err);
      res.status(500).json({ error: err.message });
    }
  });

module.exports = checkStatus;
