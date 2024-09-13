const bcrypt = require("bcrypt");
const db = require("../models/db");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const jwt = require("jsonwebtoken");
const checkGroup = require("../middleware/checkGroup");
const cookieOptions = {
  httpOnly: true, // Prevents JavaScript access
  secure: process.env.NODE_ENV === "production", // Use secure cookies in production
  maxAge: 3600000, // 1 hour
};
const { activeSessions } = require("../utils/config/sessionStore");

// CHECKGROUP FUNCTION >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
exports.checkAdmin = catchAsyncErrors(async (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ error: "Username is required" });
  }

  try {
    await new Promise((resolve, reject) => {
      checkGroup(username, "admin")(req, res, (err) => {
        if (err) {
          return reject;
        }
        resolve();
      });
    });

    res.status(200).json({ isAdmin: true });
  } catch (err) {
    console.error("Error checking admin status:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//for A2
exports.checkisInGroup = catchAsyncErrors(async (req, res) => {
  const { username, userGroup } = req.body;

  if (!username || !userGroup) {
    return res
      .status(400)
      .json({ error: "Username and Groupname is required" });
  }

  try {
    checkGroup(username, userGroup)(req, res, () => {
      res.status(200).json({ isInGroup: true });
    });
  } catch (err) {
    console.error("Error checking group status:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//PUT >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
// Update user own profile
exports.updateProfile = catchAsyncErrors(async (req, res) => {
  const { username, password, email } = req.body;

  // Initialize the query and values array
  let query = "UPDATE accounts SET ";
  const values = [];
  let updateMessage = [];

  // Conditionally append the fields to the query and values array
  if (password) {
    const hashedPassword = bcrypt.hashSync(password, 10);
    query += "password = ?, ";
    values.push(hashedPassword);
    updateMessage.push("Profile Password updated successfully");
  }
  if (email) {
    query += "email = ?, ";
    values.push(email);
    updateMessage.push("Profile Email updated successfully");
  }

  if (updateMessage.length === 0) {
    return res.status(400).json({ error: "No fields provided for update" });
  }

  // Remove trailing comma and add the WHERE clause
  query = query.slice(0, -2) + " WHERE username = ?";
  values.push(username);

  // Execute the query
  db.query(query, values, (err, result) => {
    if (err) {
      console.error("Error during update:", err);
      return res.status(500).json({ error: err.message });
    }
    // Combine messages if both fields were updated
    const responseMessage =
      updateMessage.length > 1 ? updateMessage.join(" and ") : updateMessage[0];
    res.json({ message: responseMessage });
  });
});

// Edit other user profile
exports.editOtherUserProfile = catchAsyncErrors(async (req, res) => {
  const { username, password, email, accountStatus, userGroups } = req.body;

  // Initialize the query and values array for account updates
  let accountQuery = "UPDATE accounts SET ";
  const accountValues = [];
  let updateMessages = []; // Array to store update messages

  // Conditionally append the fields to the query and values array
  if (password) {
    const hashedPassword = bcrypt.hashSync(password, 10);
    accountQuery += "password = ?, ";
    accountValues.push(hashedPassword);
    updateMessages.push("Profile Password updated successfully");
  }
  if (email) {
    accountQuery += "email = ?, ";
    accountValues.push(email);
    updateMessages.push("Profile Email updated successfully");
  }
  // Skip accountStatus update if the username is "Root"
  if (accountStatus && username !== "Root") {
    accountQuery += "accountStatus = ?, ";
    accountValues.push(accountStatus);
    updateMessages.push("Profile Status updated successfully");
  } else if (username === "Root" && accountStatus) {
    updateMessages.push("Root account status cannot be updated.");
  }

  // Ensure the account query has fields to update
  if (accountValues.length > 0) {
    // Remove trailing comma and add the WHERE clause
    accountQuery = accountQuery.slice(0, -2) + " WHERE username = ?";
    accountValues.push(username);

    // Execute the account update query
    await new Promise((resolve, reject) => {
      db.query(accountQuery, accountValues, (err, result) => {
        if (err) {
          console.error("Error updating account:", err);
          return reject(err);
        }
        resolve(result);
      });
    });
  }

  // Handle user group updates
  if (userGroups && Array.isArray(userGroups)) {
    try {
      // Remove existing groups for the user
      await new Promise((resolve, reject) => {
        db.query(
          "DELETE FROM usergroup WHERE username = ?",
          [username],
          (err, result) => {
            if (err) {
              console.error("Error removing existing user groups:", err);
              return reject({
                status: 500,
                message: "Internal Server Error",
              });
            }
            resolve(result);
          }
        );
      });

      // Insert new groups
      for (const group of userGroups) {
        await new Promise((resolve, reject) => {
          db.query(
            "INSERT INTO usergroup (username, user_group) VALUES (?, ?)",
            [username, group],
            (err, result) => {
              if (err) {
                if (err.code === "ER_DUP_ENTRY") {
                  // Handle duplicate entry error
                  return reject({
                    status: 411,
                    message: "User already in the group",
                  });
                } else {
                  console.error("Error inserting new user group:", err);
                  return reject({
                    status: 500,
                    message: "Internal Server Error",
                  });
                }
              }
              resolve(result);
            }
          );
        });
      }
    } catch (error) {
      console.error("An error occurred:", error);
      throw error; // Rethrow error to be caught by the global error handler
    }
  }

  // Check if any update messages are present
  if (updateMessages.length === 0) {
    return res.status(400).json({ error: "No fields provided for update" });
  }

  // Send response with update messages
  res.json({ message: updateMessages.join(" and ") });
});

//DELETE >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
exports.deleteUserGroup = catchAsyncErrors(async (req, res) => {
  const { username, userGroup } = req.query; // Changed from req.body to req.query

  if (!username || !userGroup) {
    return res
      .status(400)
      .json({ error: "Username and user group are required" });
  }

  db.query(
    "DELETE FROM usergroup WHERE username = ? AND user_group = ?",
    [username, userGroup],
    (err, result) => {
      if (err) {
        console.error("Error deleting user group:", err);
        return res.status(500).json({ error: err.message });
      } else {
        res.json({ message: "User group deleted successfully" });
      }
    }
  );
});

//GET >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
// Get all users
exports.getUsers = catchAsyncErrors(async (req, res) => {
  const usersQuery = "SELECT * FROM accounts"; // Query to get users from accounts table

  // Fetch users
  db.query(usersQuery, (err, users) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    // Send both users and groups as a response
    res.json({
      users: users, // Array of users
    });

    console.log(users);
  });
});

// Get all groups
exports.getGroups = catchAsyncErrors(async (req, res) => {
  const groupsQuery = "SELECT distinct user_group FROM usergroup"; // Query to get distinct groups

  // Fetch groups
  db.query(groupsQuery, (err, groups) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    // Send both users and groups as a response
    res.json({
      groups: groups, // Array of groups
    });

    console.log(groups);
  });
});

// Get all users and their respective groups
exports.getUsersAndGroups = catchAsyncErrors(async (req, res) => {
  const usersAndGroupsQuery = `
    SELECT accounts.username, usergroup.user_group 
    FROM accounts
    INNER JOIN usergroup ON accounts.username = usergroup.username`; // Query to get unique username and user_group pairs

  // Fetch users and groups
  db.query(usersAndGroupsQuery, (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    // Group data by username
    const usersMap = result.reduce((acc, row) => {
      if (!acc[row.username]) {
        acc[row.username] = { username: row.username, groups: [] };
      }
      acc[row.username].groups.push(row.user_group);
      return acc;
    }, {});

    // Convert the map to an array
    const usersWithGroups = Object.values(usersMap);

    // Send users and groups as a response
    res.json({
      users: usersWithGroups, // Array of users with their groups
    });

    console.log(usersWithGroups); // Log the result for debugging
  });
});

// Get the current user using the username from the token
exports.getCurrentUser = catchAsyncErrors(async (req, res) => {
  const username = req.user.username; // Fetch username from token

  const query = "SELECT * FROM accounts WHERE username = ?"; // Query the accounts table
  db.query(query, [username], (err, results) => {
    if (err) return res.status(500).json({ message: "Server Error" });
    if (results.length === 0)
      return res.status(404).json({ message: "User not found" });

    res.json(results[0]); // Return the user data
  });
});

//PUSH >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
//create user function
exports.createUser = catchAsyncErrors(async (req, res) => {
  console.log("CreateUser request received");

  const { username, password, email, accountStatus } = req.body;

  // Check if username already exists
  db.query(
    "SELECT * FROM accounts WHERE username = ?",
    [username],
    (err, results) => {
      if (err) {
        console.error("Error during user check:", err);
        return res.status(500).json({ error: err.message });
      }

      if (results.length > 0) {
        return res.status(409).json({
          error: "Username already exists. Please choose a different username.",
        });
      }

      // Hash the password and handle errors during hashing
      try {
        const hashedPassword = bcrypt.hashSync(password, 10);

        // Proceed with creating the user
        db.query(
          "INSERT INTO accounts (username, password, email, accountStatus) VALUES (?, ?, ?, ?)",
          [username, hashedPassword, email, accountStatus],
          (err, result) => {
            if (err) {
              if (err.code === "ER_DUP_ENTRY") {
                return res.status(409).json({
                  error:
                    "Username already exists. Please choose a different username.",
                });
              } else {
                console.error("Error during registration:", err);
                return res.status(500).json({ error: err.message });
              }
            }
            res.json({ message: "Registration successful" });
          }
        );
      } catch (bcryptError) {
        console.error("Error during password hashing:", bcryptError);
        return res.status(500).json({ error: "Password hashing failed." });
      }
    }
  );
});

//put user into group function
exports.putUserIntoGroup = catchAsyncErrors(async (req, res) => {
  console.log("PutUserIntoGroup request received");
  const { username, userGroup } = req.body;

  // Validate input
  if (!username || !userGroup) {
    return res
      .status(400)
      .json({ error: "Username and userGroup are required." });
  }

  try {
    // Attempt to insert the user into the group
    await new Promise((resolve, reject) => {
      db.query(
        "INSERT INTO usergroup (username, user_group) VALUES (?, ?)",
        [username, userGroup],
        (err, result) => {
          if (err) {
            // Handle specific error codes
            if (err.code === "ER_DUP_ENTRY") {
              return reject({
                status: 409, // Conflict
                message: "User already in the group.",
              });
            }
            console.error("Error during group assignment:", err);
            return reject({
              status: 500, // Internal Server Error
              message: "An error occurred while adding the user to the group.",
            });
          }
          resolve(result);
        }
      );
    });

    // Respond with success
    res.json({ message: "User added to group successfully." });
  } catch (error) {
    // Catch and respond to errors
    if (error.status && error.message) {
      res.status(error.status).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
});

//create group function
exports.createGroup = catchAsyncErrors(async (req, res) => {
  console.log("CreateGroup request received");
  const { userGroup } = req.body;
  db.query(
    "INSERT INTO usergroup (username, user_group) VALUES ('', ?)",
    [userGroup],
    (err, result) => {
      if (err) {
        console.error("Error during registration:", err);
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: "Group created successfully" });
    }
  );
});

/// Login function with JWT generation
exports.login = async (req, res) => {
  const { username, password } = req.body;
  const ipAddress =
    req.headers["x-forwarded-for"] || req.connection.remoteAddress;

  try {
    // Query database for user
    db.query(
      "SELECT * FROM accounts WHERE username = ?",
      [username],
      (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });

        if (rows.length > 0) {
          const user = rows[0];

          if (user.accountStatus === "inactive") {
            return res.status(403).json({ error: "Account is inactive" });
          }

          bcrypt.compare(password, user.password, (err, result) => {
            if (err) return res.status(500).json({ error: err.message });

            if (result) {
              // If user is already logged in, invalidate the old session
              for (const token in activeSessions) {
                const sessionData = activeSessions[token];
                if (sessionData.username === username) {
                  delete activeSessions[token]; // Invalidate previous session
                }
              }

              // Generate new token
              const token = jwt.sign(
                { username: user.username, ipAddress }, // Include IP address
                process.env.ACCESS_TOKEN_SECRET,
                { expiresIn: "1h" } // Set token expiration
              );

              // Store new token in session store
              activeSessions[token] = { username: user.username, ipAddress };

              // Set the token in cookie
              res.cookie("token", token, cookieOptions);
              return res
                .status(200)
                .json({ message: "Login successful", user });
            } else {
              return res
                .status(401)
                .json({ error: "Invalid username or password" });
            }
          });
        } else {
          return res
            .status(401)
            .json({ error: "Invalid username or password" });
        }
      }
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//logout function
exports.logout = (req, res) => {
  // Check if the 'token' cookie exists
  if (!req.cookies.token) {
    return res.status(401).json({ message: "User already logged out." });
  }

  // If the 'token' exists, clear it
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "strict",
    secure: true, // Ensure 'secure' is set to true in production
  });

  return res.status(200).json({ message: "Logged out successfully." });
};
