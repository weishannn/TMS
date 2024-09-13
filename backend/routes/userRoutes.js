const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const authenticateToken = require("../middleware/auth");

// Define routes
//all users function
//login
router.post("/login", userController.login);

//logout
router.post("/logout", authenticateToken("active"), userController.logout);

// Routes that require authentication
router.get(
  "/currentUser",
  authenticateToken("active"),
  userController.getCurrentUser
);

//updatedata
router.put(
  "/updateProfile",
  authenticateToken("active"),
  userController.updateProfile
);

// checkGroup - admin
router.post(
  "/checkAdmin",
  authenticateToken("active"),
  userController.checkAdmin
);

//not use yet,,, for A2
// router.post(
//   "/checkisInGroup",
//   authenticateToken,
//   userController.checkisInGroup
// );

//admin functions
//createuser
router.post(
  "/createUser",
  authenticateToken("active", "admin"),
  userController.createUser
);

//putuserintogroup
router.post(
  "/putUserIntoGroup",
  authenticateToken("active", "admin"),
  userController.putUserIntoGroup
);

//creategroup
router.post(
  "/createGroup",
  authenticateToken("active", "admin"),
  userController.createGroup
);

//getdata
router.get(
  "/getUsersAndGroups",
  authenticateToken("active", "admin"),
  userController.getUsersAndGroups
);

router.get(
  "/getUsers",
  authenticateToken("active", "admin"),
  userController.getUsers
);
router.get(
  "/getGroups",
  authenticateToken("active", "admin"),
  userController.getGroups
);

//editOtherUserProfile
router.put(
  "/editOtherUserProfile",
  authenticateToken("active", "admin"),
  userController.editOtherUserProfile
);

//deleteUserGroup
router.delete(
  "/deleteUserGroup",
  authenticateToken("active", "admin"),
  userController.deleteUserGroup
);

module.exports = router;
