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

  const appnamePattern = /^[a-zA-Z0-9_]{1,50}$/;
  const rnumberPattern = /^[1-9]\d*$/;

  // Validate required fields
  if (!appAcronym || !appRNumber || !appStartDate || !appEndDate) {
    return res.status(400).json({
      error:
        "Missing fields. App Acronym, R Number, Start Date, End Date are required.",
    });
  }
  if (!appnamePattern.test(appAcronym)) {
    return res.status(400).json({
      error: "App Acronym can only contain letters, numbers, and underscores.",
    });
  }
  if (!rnumberPattern.test(appRNumber)) {
    return res.status(400).json({
      error: "R Number must be a positive integer.",
    });
  }

  try {
    // Check if the application already exists
    const existingApps = await db.query(
      "SELECT * FROM application WHERE App_Acronym = ?",
      [appAcronym]
    );

    if (existingApps[0].length > 0) {
      return res.status(409).json({
        error: "Application already exists. Please choose a different Acronym.",
      });
    }

    // Proceed with creating the application
    await db.query(
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
      ]
    );

    res.json({ message: "Application created successfully" });
  } catch (error) {
    console.error("Error during application creation:", error);
    return res.status(500).json({ error: error.message });
  }
});

//GET >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
// Get all applications
exports.getApps = catchAsyncErrors(async (req, res) => {
  const appsQuery = "SELECT * FROM application"; // Query to get applications from application table

  try {
    const [result] = await db.query(appsQuery); // Use await to get the result
    res.json(result); // Send the result as JSON
  } catch (err) {
    console.error("Error during application retrieval:", err);
    return res.status(500).json({ error: err.message });
  }
});

// Get application by acronym
exports.getAppByAcronym = catchAsyncErrors(async (req, res) => {
  const { appAcronym } = req.params;

  if (!appAcronym) {
    return res.status(400).json({ error: "App Acronym is required" });
  }

  try {
    const [result] = await db.query(
      "SELECT * FROM application WHERE App_Acronym = ?",
      [appAcronym]
    ); // Use await to get the result

    if (result.length === 0) {
      return res.status(404).json({ error: "Application not found" });
    }

    res.json(result[0]); // Return the first result as the application
  } catch (err) {
    console.error("Error during application retrieval:", err);
    return res.status(500).json({ error: err.message });
  }
});

// get by permit group
exports.getAppsByPermitGroup = catchAsyncErrors(async (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({
      error: "Username is required.",
    });
  }

  try {
    const [result] = await db.query(
      `SELECT DISTINCT A.* 
       FROM application A
       JOIN usergroup U 
       ON U.user_group = A.App_permit_Create 
       OR U.user_group = A.App_permit_Open 
       OR U.user_group = A.App_permit_toDoList 
       OR U.user_group = A.App_permit_Doing 
       OR U.user_group = A.App_permit_Done
       WHERE U.username = ?`,
      [username]
    );

    if (result.length === 0) {
      return res
        .status(404)
        .json({ error: "No applications found for this user." });
    }

    res.json(result); // Return the result as the application(s)
  } catch (err) {
    console.error("Error during application retrieval:", err);
    return res.status(500).json({ error: err.message });
  }
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

  try {
    const [result] = await db.query(query, values); // Execute the update query

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ error: "Application not found or no changes made." });
    }

    return res
      .status(200)
      .json({ message: "Application updated successfully." });
  } catch (err) {
    console.error("Error during application update:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

//PLAN >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
//create plan
exports.createPlan = catchAsyncErrors(async (req, res) => {
  const { planName, planappAcronym, planStartDate, planEndDate, planColor } =
    req.body;

  const plannamePattern =
    /^[a-zA-Z0-9\s!@#$%^&*()\-_=+{};:'",.<>?/|\\~`[\]]{1,255}$/;

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

  if (!plannamePattern.test(planName)) {
    return res.status(400).json({
      error:
        "Plan Name can only contain letters, numbers, spaces, and special characters.",
    });
  }

  // Check if the plan already exists
  const checkPlanQuery = "SELECT * FROM plan WHERE Plan_MVP_name = ?";
  const [existingPlans] = await db.query(checkPlanQuery, [planName]);

  if (existingPlans.length > 0) {
    return res.status(409).json({
      error: "Plan already exists. Please choose a different plan name.",
    });
  }

  // Proceed to create the new plan
  const insertPlanQuery = `
    INSERT INTO plan (Plan_MVP_name, Plan_app_Acronym, Plan_startDate, Plan_endDate, Plan_color)
    VALUES (?, ?, ?, ?, ?)
  `;

  const values = [
    planName,
    planappAcronym,
    planStartDate,
    planEndDate,
    planColor,
  ];

  try {
    await db.query(insertPlanQuery, values);
    return res.json({ message: "Plan created successfully" });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        error: "Plan already exists. Please choose a different plan name.",
      });
    } else {
      console.error("Error during plan creation:", err);
      return res.status(500).json({ error: err.message });
    }
  }
});

//GET >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
// Get all plans
exports.getPlans = catchAsyncErrors(async (req, res) => {
  const { planappAcronym } = req.body;

  // Check if planappAcronym is provided
  if (!planappAcronym) {
    return res.status(400).json({ error: "App Acronym is required" });
  }

  const plansQuery = "SELECT * FROM plan WHERE Plan_app_Acronym = ?"; // Query to get plans based on the app acronym

  try {
    const [result] = await db.query(plansQuery, [planappAcronym]);
    res.json(result);
  } catch (err) {
    console.error("Error during plans retrieval:", err);
    return res.status(500).json({ error: err.message });
  }
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

  const tasknamePattern =
    /^[a-zA-Z0-9\s!@#$%^&*()\-_=+{};:'",.<>?/|\\~`[\]]{1,255}$/;

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

  if (!tasknamePattern.test(taskName)) {
    return res.status(400).json({
      error:
        "Task Name can only contain letters, numbers, spaces, and special characters.",
    });
  }

  try {
    // Start transaction
    await db.query("BEGIN"); // Start the transaction

    // Check if task already exists
    const [results] = await db.query("SELECT * FROM task WHERE Task_id = ?", [
      taskId,
    ]);

    if (results.length > 0) {
      await db.query("ROLLBACK"); // Rollback if task already exists
      return res.status(409).json({
        error: "Error...TaskID already exists.",
      });
    }

    // If the task does not exist, insert the new task
    await db.query(
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
      ]
    );

    // Increment the App_Rnumber
    await db.query(
      "UPDATE application SET App_Rnumber = App_Rnumber + 1 WHERE App_Acronym = ?",
      [taskappAcronym]
    );

    // Commit transaction
    await db.query("COMMIT"); // Commit the transaction

    return res.json({
      message: "Task created successfully",
    });
  } catch (error) {
    console.error("Transaction error:", error);
    await db.query("ROLLBACK"); // Rollback on error
    return res.status(500).json({ error: error.message });
  }
});

//GET >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
// Get all tasks
exports.getTasks = catchAsyncErrors(async (req, res) => {
  const { taskappAcronym } = req.body;

  // Check if taskappAcronym is provided
  if (!taskappAcronym) {
    return res.status(400).json({ error: "App Acronym is required" });
  }

  const tasksQuery = "SELECT * FROM task WHERE Task_app_Acronym = ?"; // Query to get tasks based on the app acronym

  try {
    const [result] = await db.query(tasksQuery, [taskappAcronym]);
    res.json(result);
  } catch (err) {
    console.error("Error during task retrieval:", err);
    return res.status(500).json({ error: err.message });
  }
});

//PUT >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
// edit task
exports.editTask = catchAsyncErrors(async (req, res) => {
  const {
    taskId,
    taskPlan,
    taskName,
    taskDescription,
    taskNotes,
    taskState,
    taskOwner,
  } = req.body;

  // Validate required fields
  if (!taskId) {
    return res.status(400).json({
      error: "Missing field. Task ID is required.",
    });
  }

  try {
    // Fetch the current task from the database
    const [currentTask] = await db.query(
      "SELECT Task_notes FROM task WHERE Task_id = ?",
      [taskId]
    );

    if (!currentTask.length) {
      return res.status(404).json({ error: "Task not found." });
    }

    // Start constructing the update query and values
    const fieldsToUpdate = [];
    const values = [];

    // Check each field and add to the update statement if it's present
    if (taskPlan !== undefined) {
      fieldsToUpdate.push("Task_plan = ?");
      values.push(taskPlan);
    }
    if (taskName !== undefined) {
      fieldsToUpdate.push("Task_name = ?");
      values.push(taskName);
    }
    if (taskDescription !== undefined) {
      fieldsToUpdate.push("Task_description = ?");
      values.push(taskDescription);
    }
    if (taskState !== undefined) {
      fieldsToUpdate.push("Task_state = ?");
      values.push(taskState);
    }
    if (taskOwner !== undefined) {
      fieldsToUpdate.push("Task_owner = ?");
      values.push(taskOwner);
    }

    // Handle taskNotes: append if provided
    if (taskNotes !== undefined) {
      const existingNotes = currentTask[0].Task_notes || ""; // Fetch existing notes
      const updatedNotes =
        existingNotes + (existingNotes ? "\n" : "") + taskNotes; // Append new notes
      fieldsToUpdate.push("Task_notes = ?");
      values.push(updatedNotes);
    }

    // If no fields to update, return a message
    if (fieldsToUpdate.length === 0) {
      return res.status(400).json({
        error: "No fields to update.",
      });
    }

    // Construct the final SQL query
    const sql = `UPDATE task SET ${fieldsToUpdate.join(
      ", "
    )} WHERE Task_id = ?`;
    values.push(taskId); // Add taskId for the WHERE clause

    // Execute the query
    await db.query(sql, values);
    return res.json({
      message: "Task updated successfully",
    });
  } catch (error) {
    console.error("Transaction error:", error);
    return res.status(500).json({ error: error.message });
  }
});
