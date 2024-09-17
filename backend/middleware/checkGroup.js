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

const checkGroup = (username, groupname) =>
  catchAsyncErrors(async (req, res, next) => {
    if (!username || !groupname) {
      return res
        .status(400)
        .json({ error: "Username and user group are required" });
    }

    const groupPattern = `%${groupname}%`;

    try {
      const results = await queryAsync(
        "SELECT * FROM usergroup WHERE username = ? AND user_group LIKE ?",
        [username, groupPattern]
      );

      if (results.length > 0) {
        // User is in the group, proceed with the next middleware
        return next();
      } else {
        // User is not in the group, redirect to /login
        console.log("User is not in the group");
        return res.status(401).json({ message: "Access Denied." });
      }
    } catch (err) {
      console.error("Error checking user group:", err);
      res.status(500).json({ error: err.message });
    }
  });

module.exports = checkGroup;
