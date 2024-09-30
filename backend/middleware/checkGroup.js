const db = require("../models/db");
const catchAsyncErrors = require("./catchAsyncErrors");

const checkGroup = (username, groupname) =>
  catchAsyncErrors(async (req, res, next) => {
    if (!username || !groupname) {
      return res
        .status(400)
        .json({ error: "Username and user group are required" });
    }

    const groupPattern = groupname;

    try {
      const [results] = await db.query(
        "SELECT * FROM usergroup WHERE username = ? AND user_group = ?",
        [username, groupPattern]
      );

      if (results.length > 0) {
        return next(); // User is in the group, proceed
      } else {
        return res.status(403).json({
          message: "Access Denied: User is not in the required group.",
        });
      }
    } catch (err) {
      console.error("Error checking user group:", err);
      return res.status(500).json({ error: "Internal server error." });
    }
  });

module.exports = checkGroup;
