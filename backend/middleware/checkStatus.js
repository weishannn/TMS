const db = require("../models/db");
const catchAsyncErrors = require("./catchAsyncErrors");

// Middleware function to check if user is active
const checkStatus = (expectedStatus) =>
  catchAsyncErrors(async (req, res, next) => {
    // Ensure the user information is present
    if (!req.user || !req.user.username) {
      return res.status(400).json({ error: "User information is required" });
    }

    const username = req.user.username;

    try {
      const results = await db.query(
        "SELECT accountStatus FROM accounts WHERE username = ?",
        [username]
      );

      // Check if any results were returned
      if (results.length === 0 || results[0].length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      // Access the accountStatus from the nested structure
      const accountStatus = results[0][0].accountStatus; // Accessing the first element of the first array

      // Check if the account status matches the expected status
      if (accountStatus.trim() !== expectedStatus.trim()) {
        return res
          .status(403)
          .json({ error: "Access Denied: User is inactive" });
      }

      // User is active, proceed to the next middleware or route handler
      next();
    } catch (err) {
      console.error("Error checking user status:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

module.exports = checkStatus;
