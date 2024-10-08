const express = require("express");
const router = express.Router();
const demoController = require("../controllers/demoController");
const Msg = require("../utils/config/message");

// Define routes
router.use((req, res, next) => {
  if (Object.keys(req.query).length != 0) {
    return res.status(400).json({
      msgCode: Msg.INVALID_PARAMETER,
    });
  }
  console.log(`req.originalUrl: ${req.originalUrl}`);
  const validUrls = [
    "/api/demo/CreateTask",
    "/api/demo/GetTaskbyState",
    "/api/demo/PromoteTask2Done",
  ];
  const url = req.originalUrl;
  console.log("incoming url:", url);
  let isValidUrl = false;
  for (const i of validUrls) {
    if (i.toLowerCase() === url.toLowerCase()) {
      isValidUrl = true;
      break;
    }
  }
  if (isValidUrl) {
    next();
    return;
  }
  res.status(400).json({ msgCode: Msg.INVALID_URL });
  return;
});

//demoA3
router.post("/CreateTask", demoController.createTask);

router.post("/GetTaskbyState", demoController.getTaskbyState);

router.post("/PromoteTask2Done", demoController.promoteTask2Done);

module.exports = router;
