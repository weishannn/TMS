const bcrypt = require("bcryptjs");
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
exports.checkAdmin = catchAsyncErrors(async (req, res, next) => {
  const { username } = req.body;

  // Check if username is provided
  if (!username) {
    return res.status(400).json({ error: "Username is required" });
  }

  // Use the checkGroup middleware directly
  checkGroup(username, "Admin")(req, res, (err) => {
    if (err) {
      // If an error is thrown by checkGroup, it will handle the response
      console.error("Error checking admin status:", err);
      return; // No need to return a response, checkGroup already did
    }

    // If checkGroup didn't send a response, user is admin
    return res.status(200).json({ isAdmin: true });
  });
});

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
  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  // Initialize the query and values array
  let query = "UPDATE accounts SET ";
  const values = [];
  const updateMessage = []; // Use const since we don't reassign

  // Conditionally append the fields to the query and values array
  if (password) {
    const hashedPassword = bcrypt.hashSync(password, 10);
    query += "password = ?, ";
    values.push(hashedPassword);
    updateMessage.push("Profile Password updated successfully");
  }

  if (email) {
    // Validate the email format
    if (!emailPattern.test(email)) {
      return res.status(400).json({
        error: "Invalid email format. Please enter a valid email address.",
      });
    }

    // If the email is valid, proceed with the update query
    query += "email = ?, ";
    values.push(email);
    updateMessage.push("Profile Email updated successfully");
  }

  // Check if any updates are to be made
  if (updateMessage.length === 0) {
    return res.status(400).json({ error: "No fields provided for update" });
  }

  // Remove trailing comma and add the WHERE clause
  query = query.slice(0, -2) + " WHERE username = ?";
  values.push(username);

  // Execute the query
  try {
    await db.query(query, values);
    // Combine messages if both fields were updated
    const responseMessage =
      updateMessage.length > 1 ? updateMessage.join(" and ") : updateMessage[0];
    res.json({ message: responseMessage });
  } catch (err) {
    console.error("Error during update:", err);
    res.status(500).json({ error: err.message });
  }
});

// Edit other user profile
exports.editOtherUserProfile = catchAsyncErrors(async (req, res) => {
  const { username, password, email, accountStatus, userGroups } = req.body;
  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

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
    // Validate the email format
    if (!emailPattern.test(email)) {
      return res.status(400).json({
        error: "Invalid email format. Please enter a valid email address.",
      });
    }

    accountQuery += "email = ?, ";
    accountValues.push(email);
    updateMessages.push("Profile Email updated successfully");
  }

  // Skip accountStatus update if the username is "Admin"
  if (accountStatus && username !== "Admin") {
    accountQuery += "accountStatus = ?, ";
    accountValues.push(accountStatus);
    updateMessages.push("Profile Status updated successfully");
  } else if (username === "Admin" && accountStatus) {
    updateMessages.push("Admin account status cannot be updated.");
  }

  // Ensure the account query has fields to update
  if (accountValues.length > 0) {
    // Remove trailing comma and add the WHERE clause
    accountQuery = accountQuery.slice(0, -2) + " WHERE username = ?";
    accountValues.push(username);

    // Execute the account update query
    await db.query(accountQuery, accountValues);
  }

  // Handle user group updates
  if (userGroups && Array.isArray(userGroups)) {
    try {
      // Remove existing groups for the user
      await db.query("DELETE FROM usergroup WHERE username = ?", [username]);

      // Insert new groups
      for (const group of userGroups) {
        try {
          await db.query(
            "INSERT INTO usergroup (username, user_group) VALUES (?, ?)",
            [username, group]
          );
        } catch (err) {
          if (err.code === "ER_DUP_ENTRY") {
            // Handle duplicate entry error
            return res
              .status(411)
              .json({ message: "User already in the group" });
          } else {
            console.error("Error inserting new user group:", err);
            return res.status(500).json({ error: "Internal Server Error" });
          }
        }
      }
    } catch (err) {
      console.error("Error removing existing user groups:", err);
      return res.status(500).json({ error: "Internal Server Error" });
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

  try {
    // Execute the DELETE query using async/await
    const [result] = await db.query(
      "DELETE FROM usergroup WHERE username = ? AND user_group = ?",
      [username, userGroup]
    );

    // Check if the query affected any rows
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "User group not found" });
    }

    // Send success response
    res.json({ message: "User group deleted successfully" });
  } catch (err) {
    // Handle errors
    console.error("Error deleting user group:", err);
    return res.status(500).json({ error: err.message });
  }
});

//GET >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
// Get all users
exports.getUsers = catchAsyncErrors(async (req, res) => {
  const usersQuery = "SELECT * FROM accounts"; // Query to get users from accounts table

  try {
    // Fetch users using async/await
    const [users] = await db.query(usersQuery);

    // Send users as a response
    res.json({
      users: users, // Array of users
    });

    console.log(users); // Log the result for debugging
  } catch (err) {
    // Handle any errors during the query
    return res.status(500).json({ error: err.message });
  }
});

// Get all groups
exports.getGroups = catchAsyncErrors(async (req, res) => {
  const groupsQuery = "SELECT DISTINCT user_group FROM usergroup"; // Query to get distinct groups

  try {
    // Fetch groups using async/await
    const [groups] = await db.query(groupsQuery);

    // Send groups as a response
    res.json({
      groups: groups, // Array of groups
    });

    console.log(groups); // Log the result for debugging
  } catch (err) {
    // Handle any errors during the query
    return res.status(500).json({ error: err.message });
  }
});

// Get all users and their respective groups
exports.getUsersAndGroups = catchAsyncErrors(async (req, res) => {
  const usersAndGroupsQuery = `
    SELECT accounts.username, usergroup.user_group 
    FROM accounts
    INNER JOIN usergroup ON accounts.username = usergroup.username`; // Query to get unique username and user_group pairs

  try {
    // Fetch users and groups using async/await
    const [result] = await db.query(usersAndGroupsQuery);

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
  } catch (err) {
    // Handle any errors during the query
    return res.status(500).json({ error: err.message });
  }
});

// Get the current user using the username from the token
exports.getCurrentUser = catchAsyncErrors(async (req, res) => {
  const token = req.cookies.token; // Extract token from cookies

  // Check if token exists and is in the active session store
  if (!token || !activeSessions[token]) {
    return res
      .status(401)
      .json({ message: "Access Denied: Token is required" });
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const username = decoded.username;

    // Query the accounts table using async/await
    const query = "SELECT * FROM accounts WHERE username = ?";
    const [results] = await db.query(query, [username]);

    // Check if user was found
    if (results.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // Return the user data
    res.json(results[0]);
  } catch (err) {
    // Handle token verification and query errors
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      return res.status(403).json({ message: "Invalid or expired token" });
    }
    return res.status(500).json({ message: "Server Error" });
  }
});

exports.getUserEmail = catchAsyncErrors(async (req, res) => {
  const { userGroup } = req.body;

  // Check if userGroup is provided
  if (!userGroup) {
    return res.status(400).json({ error: "Groupname is required" });
  }

  const query = `
    SELECT email 
    FROM accounts 
    JOIN usergroup ON accounts.username = usergroup.username 
    WHERE user_group = ?`;

  try {
    const [results] = await db.query(query, [userGroup]);

    // Check if any user with the group was found
    if (results.length === 0) {
      return res.status(404).json({ error: "No user with this group found" });
    }

    // Respond with the email
    res.json({ email: results[0].email });
  } catch (err) {
    console.error("Error retrieving email:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//PUSH >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
//create user function
exports.createUser = catchAsyncErrors(async (req, res) => {
  console.log("CreateUser request received");

  const { username, password, email, accountStatus } = req.body;

  // Define validation patterns
  const usernamePattern = /^[a-zA-Z0-9]+$/; // Alphanumeric with no spaces
  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/; // Email pattern

  // Validate username
  if (!usernamePattern.test(username) || username.length > 50) {
    return res.status(400).json({
      error:
        "Username must be alphanumeric and contain no spaces. Max length is 50 characters.",
    });
  }

  // Validate email
  if (email && !emailPattern.test(email)) {
    return res.status(400).json({
      error: "Invalid email format. Please enter a valid email address.",
    });
  }

  try {
    // Check if username already exists
    const [results] = await db.query(
      "SELECT * FROM accounts WHERE username = ?",
      [username]
    );

    if (results.length > 0) {
      return res.status(409).json({
        error: "Username already exists. Please choose a different username.",
      });
    }

    // Hash the password using bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    // Proceed with creating the user
    const [result] = await db.query(
      "INSERT INTO accounts (username, password, email, accountStatus) VALUES (?, ?, ?, ?)",
      [username, hashedPassword, email, accountStatus]
    );

    // Respond with success
    res.json({ message: "Registration successful" });
  } catch (err) {
    // Handle any errors
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        error: "Username already exists. Please choose a different username.",
      });
    } else {
      console.error("Error during registration:", err);
      res.status(500).json({ error: "An error occurred during registration." });
    }
  }
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
    // Attempt to insert the user into the group using async/await
    const [result] = await db.query(
      "INSERT INTO usergroup (username, user_group) VALUES (?, ?)",
      [username, userGroup]
    );

    // Respond with success
    res.json({ message: "User added to group successfully." });
  } catch (err) {
    // Handle specific error codes
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "User already in the group." }); // Conflict
    }

    // Log and respond with a general error
    console.error("Error during group assignment:", err);
    res
      .status(500)
      .json({ error: "An error occurred while adding the user to the group." });
  }
});

//create group function
exports.createGroup = catchAsyncErrors(async (req, res) => {
  console.log("CreateGroup request received");

  const { userGroup } = req.body;

  // Define the alphanumeric pattern (no spaces allowed)
  const groupNamePattern = /^[a-zA-Z0-9_]+$/;

  // Validate group name
  if (!groupNamePattern.test(userGroup) || userGroup.length > 50) {
    return res.status(400).json({
      error:
        "Group name must be alphanumeric (including underscores) and no more than 50 characters long.",
    });
  }

  try {
    // Use await to handle the database query with mysql2/promise
    const [result] = await db.query(
      "INSERT INTO usergroup (username, user_group) VALUES ('', ?)",
      [userGroup]
    );

    // If query is successful, return success message
    res.json({ message: "Group created successfully" });
  } catch (err) {
    // Handle any errors
    console.error("Error during group creation:", err);
    res.status(500).json({ error: err.message });
  }
});

// Login function with JWT generation
exports.login = async (req, res) => {
  const { username, password } = req.body;
  const ipAddress =
    req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  const browser = req.headers["user-agent"];

  try {
    // Query database for user using async/await
    const [rows] = await db.query("SELECT * FROM accounts WHERE username = ?", [
      username,
    ]);

    if (rows.length > 0) {
      const user = rows[0];

      if (user.accountStatus === "inactive") {
        return res.status(403).json({ error: "Invalid Credentials" });
      }

      // Use async/await for bcrypt.compare
      const passwordMatch = await bcrypt.compare(password, user.password);

      if (passwordMatch) {
        // If user is already logged in, invalidate the old session
        for (const token in activeSessions) {
          const sessionData = activeSessions[token];
          if (sessionData.username === username) {
            delete activeSessions[token]; // Invalidate previous session
          }
        }

        // Generate new token
        const token = jwt.sign(
          { username: user.username, ipAddress, browser }, // Include IP address
          process.env.ACCESS_TOKEN_SECRET,
          { expiresIn: "1h" } // Set token expiration
        );

        // Store new token in session store
        activeSessions[token] = { username: user.username, ipAddress };

        // Set the token in cookie
        res.cookie("token", token, cookieOptions);
        return res.status(200).json({ message: "Login successful", user });
      } else {
        return res.status(401).json({ error: "Invalid Credentials" });
      }
    } else {
      return res.status(401).json({ error: "Invalid Credentials" });
    }
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
