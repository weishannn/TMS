const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const authenticateToken = require("../middleware/auth");

// Define routes
//login
router.post("/login", userController.login);

// Routes that require authentication
router.get("/currentUser", authenticateToken, userController.getCurrentUser);

// checkGroup
router.post("/checkAdmin", authenticateToken, userController.checkAdmin);
router.post(
  "/checkisInGroup",
  authenticateToken,
  userController.checkisInGroup
);

//createuser
router.post("/createUser", authenticateToken, userController.createUser);
//putuserintogroup
router.post(
  "/putUserIntoGroup",
  authenticateToken,
  userController.putUserIntoGroup
);
//creategroup
router.post("/createGroup", authenticateToken, userController.createGroup);

//getdata
router.get(
  "/getUsersAndGroups",
  authenticateToken,
  userController.getUsersAndGroups
);
router.get("/getUsers", authenticateToken, userController.getUsers);
router.get("/getGroups", authenticateToken, userController.getGroups);

//updatedata
router.put("/updateProfile", authenticateToken, userController.updateProfile);

//editOtherUserProfile
router.put(
  "/editOtherUserProfile",
  authenticateToken,
  userController.editOtherUserProfile
);

//deleteUserGroup
router.delete(
  "/deleteUserGroup",
  authenticateToken,
  userController.deleteUserGroup
);

module.exports = router;
