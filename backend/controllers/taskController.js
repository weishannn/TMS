const db = require("../models/db");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const jwt = require("jsonwebtoken");
const checkGroup = require("../middleware/checkGroup");
const { activeSessions } = require("../utils/config/sessionStore");

//APPLICATION >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
//PUSH >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
//create application function
exports.createApp = catchAsyncErrors(async (req, res) => {
  console.log("CreateApp request received");
  console.log(req.body);
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

// Get application by acronym
exports.getAppByAcronym = catchAsyncErrors(async (req, res) => {
  const { appAcronym } = req.params;

  if (!appAcronym) {
    return res.status(400).json({ error: "App Acronym is required" });
  }

  db.query(
    "SELECT * FROM application WHERE App_Acronym = ?",
    [appAcronym],
    (err, result) => {
      if (err) {
        console.error("Error during application retrieval:", err);
        return res.status(500).json({ error: err.message });
      }
      res.json(result);
    }
  );
});

//PUT >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
// edit application
exports.editApp = catchAsyncErrors(async (req, res) => {
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
        "Missing fields. App Acronym, R Number, Start Date, and End Date are required.",
    });
  }

  // Prepare the query with all fields to be updated (except App_Acronym and App_Rnumber)
  const query = `
    UPDATE application
    SET
      App_Description = ?,
      App_startDate = ?,
      App_endDate = ?,
      App_permit_Create = ?,
      App_permit_Open = ?,
      App_permit_toDoList = ?,
      App_permit_Doing = ?,
      App_permit_Done = ?
    WHERE App_Acronym = ? AND App_Rnumber = ?
  `;

  // Prepare the values array for the query
  const values = [
    appDescription, // App_Description
    appStartDate, // App_startDate
    appEndDate, // App_endDate
    appPermitCreate, // App_permit_create
    appPermitOpen, // App_permit_open
    appPermitToDo, // App_permit_todo
    appPermitDoing, // App_permit_doing
    appPermitDone, // App_permit_done
    appAcronym, // WHERE App_Acronym = ?
    appRNumber, // WHERE App_Rnumber = ?
  ];

  // Execute the update query
  db.query(query, values, (err, result) => {
    if (err) {
      console.error("Error during application update:", err);
      return res.status(500).json({ error: "Internal server error" });
    }

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ error: "Application not found or no changes made." });
    }

    return res
      .status(200)
      .json({ message: "Application updated successfully." });
  });
});

//PLAN >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
//create plan
exports.createPlan = catchAsyncErrors(async (req, res) => {
  const { planName, planappAcronym, planStartDate, planEndDate, planColor } =
    req.body;

  if (
    !planName ||
    !planappAcronym ||
    !planStartDate ||
    !planEndDate ||
    !planColor
  ) {
    return res.status(400).json({
      error:
        "Missing fields. Plan Name, App Acronym, Start Date, End Date, and Color are required.",
    });
  }

  db.query(
    "SELECT * FROM plan WHERE Plan_MVP_name = ?",
    [planName],
    (err, results) => {
      if (err) {
        console.error("Error during application check:", err);
        return res.status(500).json({ error: err.message });
      }

      if (results.length > 0) {
        return res.status(409).json({
          error: "Plan already exists. Please choose a different plan name.",
        });
      }

      try {
        db.query(
          "INSERT INTO plan (Plan_MVP_name, Plan_app_Acronym, Plan_startDate, Plan_endDate, Plan_color) VALUES (?, ?, ?, ?, ?)",
          [planName, planappAcronym, planStartDate, planEndDate, planColor],
          (err, result) => {
            if (err) {
              if (err.code === "ER_DUP_ENTRY") {
                return res.status(409).json({
                  error:
                    "Plan already exists. Please choose a different plan name.",
                });
              } else {
                console.error("Error during creation:", err);
                return res.status(500).json({ error: err.message });
              }
            }
            res.json({ message: "Plan created successful" });
          }
        );
      } catch (error) {
        console.error("Error during plan creation:", error);
        return res.status(500).json({ error: error.message });
      }
    }
  );
});

//TASK >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
//create task
exports.createTask = catchAsyncErrors(async (req, res) => {
  const {
    taskId,
    taskPlan,
    taskappAcronym,
    taskName,
    taskDescription,
    taskNotes,
    taskState,
    taskCreator,
    taskOwner,
    taskcreateDate,
  } = req.body;

  // Validate required fields
  if (
    !taskId ||
    !taskappAcronym ||
    !taskName ||
    !taskState ||
    !taskCreator ||
    !taskOwner ||
    !taskcreateDate
  ) {
    return res.status(400).json({
      error:
        "Missing fields. Task ID, App Acronym, Name, State, Creator, Owner, and Create Date are required.",
    });
  }

  // Check if task already exists
  db.query("SELECT * FROM task WHERE Task_id = ?", [taskId], (err, results) => {
    if (err) {
      console.error("Error during application check:", err);
      return res.status(500).json({ error: err.message });
    }

    if (results.length > 0) {
      return res.status(409).json({
        error: "Task already exists. Please choose a different task ID.",
      });
    }

    // If the task does not exist, insert the new task
    db.query(
      "INSERT INTO task (Task_id, Task_plan, Task_app_Acronym, Task_name, Task_description, Task_notes, Task_state, Task_creator, Task_owner, Task_createDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        taskId,
        taskPlan,
        taskappAcronym,
        taskName,
        taskDescription,
        taskNotes,
        taskState,
        taskCreator,
        taskOwner,
        taskcreateDate,
      ],
      (error, result) => {
        if (error) {
          console.error("Error during task insertion:", error);
          if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
              error:
                "Task already exists. Please choose a different task name.",
            });
          }
          return res.status(500).json({ error: error.message });
        }
        return res.json({
          message: "Task created successfully",
        });
      }
    );
  });
});
