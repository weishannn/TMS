const express = require("express");
const router = express.Router();
const { sendEmail } = require("../controllers/emailController");
const demoController = require("../controllers/demoController");

// Define routes
//demoA3
router.post("/CreateTask", demoController.createTask);

router.post("/GetTaskbyState", demoController.getTaskbyState);

router.post("/PromoteTask2Done", demoController.promoteTask2Done);

module.exports = router;
