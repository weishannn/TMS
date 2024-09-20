const db = require("../models/db");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const jwt = require("jsonwebtoken");
const checkGroup = require("../middleware/checkGroup");
const { activeSessions } = require("../utils/config/sessionStore");

//PUSH >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
//create application function
exports.createApp = catchAsyncErrors(async (req, res) => {
  const {
    appAcronym,
    appDescription,
    appRNumber,
    appStartDate,
    appEndDate,
    appPermitCreate,
    appPermitOpen,
    appPermitToDo,
    appPermitDoing,
    appPermitDone,
  } = req.body;

  if (!appAcronym || !appRNumber || !appStartDate || !appEndDate) {
    return res.status(400).json({
      error:
        "Missing fields. App Acroynm, R Number, Start Date, End Date are required.",
    });
  }

  db.query(
    "SELECT * FROM application WHERE App_Acronym = ?",
    [appAcronym],
    (err, results) => {
      if (err) {
        console.error("Error during application check:", err);
        return res.status(500).json({ error: err.message });
      }

      if (results.length > 0) {
        return res.status(409).json({
          error:
            "Application already exists. Please choose a different Acronym.",
        });
      }

      try {
        // Proceed with creating the application
        db.query(
          "INSERT INTO application (App_Acronym, App_Description, App_Rnumber, App_startDate, App_endDate, App_permit_Create, App_permit_Open, App_permit_toDoList, App_permit_Doing, App_permit_Done) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [
            appAcronym,
            appDescription,
            appRNumber,
            appStartDate,
            appEndDate,
            appPermitCreate,
            appPermitOpen,
            appPermitToDo,
            appPermitDoing,
            appPermitDone,
          ],
          (err, result) => {
            if (err) {
              if (err.code === "ER_DUP_ENTRY") {
                return res.status(409).json({
                  error:
                    "Acronym already exists. Please choose a different acronym.",
                });
              } else {
                console.error("Error during creation:", err);
                return res.status(500).json({ error: err.message });
              }
            }
            res.json({ message: "Application created successful" });
          }
        );
      } catch (error) {
        console.error("Error during application creation:", error);
        return res.status(500).json({ error: error.message });
      }
    }
  );
});

//GET >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
// Get all applications
exports.getApps = catchAsyncErrors(async (req, res) => {
  const appsQuery = "SELECT * FROM application"; // Query to get applications from application table
  db.query(appsQuery, (err, result) => {
    if (err) {
      console.error("Error during application retrieval:", err);
      return res.status(500).json({ error: err.message });
    }
    res.json(result);
  });
});
