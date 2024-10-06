const db = require("../models/db");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const bcrypt = require("bcryptjs");
const Msg = require("../utils/config/message");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");

dotenv.config();

//create task
exports.createTask = catchAsyncErrors(async (req, res) => {
  const {
    username,
    password,
    appAcronym,
    taskName,
    description,
    taskPlan,
    taskNotes,
  } = req.body;

  const tasknamePattern =
    /^[a-zA-Z0-9\s!@#$%^&*()\-_=+{};:'",.<>?/|\\~`[\]]{1,255}$/;

  if (!username || !password) {
    return res.status(401).json({
      msgCode: Msg.INVALID_INPUT,
    });
  }

  if (!appAcronym || !taskName) {
    return res.status(400).json({
      msgCode: Msg.INVALID_INPUT,
    });
  }

  if (!tasknamePattern.test(taskName)) {
    return res.status(400).json({
      msgCode: Msg.INVALID_INPUT,
    });
  }

  let newtaskNotes = taskNotes || "";

  // Get current date and time
  const now = new Date();
  const formattedDate = `${String(now.getDate()).padStart(2, "0")}/${String(
    now.getMonth() + 1
  ).padStart(2, "0")}/${now.getFullYear()}`;
  const formattedTime = `${String(now.getHours()).padStart(2, "0")}:${String(
    now.getMinutes()
  ).padStart(2, "0")}`;

  // Append or initialize taskNotes
  if (newtaskNotes) {
    // Append new information if taskNotes already exists
    newtaskNotes = `Commented by: ${username}\nDated on: ${formattedDate} ${formattedTime}\n${newtaskNotes}\n\nCreated by: ${username}\nDated on: ${formattedDate} ${formattedTime}\nState: Open\n`;
  } else {
    // Initialize taskNotes if it doesn't exist
    newtaskNotes = `Created by: ${username}\nDated on: ${formattedDate} ${formattedTime}\nState: Open\n`;
  }

  try {
    //check user on accounts
    const [user] = await db.query("SELECT * FROM accounts WHERE username = ?", [
      username,
    ]);
    if (!user.length || user[0].accountStatus !== "active") {
      return res.status(404).json({ msgCode: Msg.INVALID_CREDENTIALS });
    }

    const isMatch = await bcrypt.compare(password, user[0].password);
    if (!isMatch) {
      return res.status(401).json({ msgCode: Msg.INVALID_CREDENTIALS });
    }

    //check user on usergroup
    const [userGroups] = await db.query(
      "SELECT user_group FROM usergroup WHERE username = ?",
      [username]
    );
    if (!userGroups.length) {
      return res.status(404).json({ msgCode: Msg.NOT_AUTHORIZED });
    }

    //check app exists
    const [validApp] = await db.query(
      "SELECT * FROM application WHERE App_Acronym = ?",
      [appAcronym]
    );
    if (!validApp.length) {
      return res.status(404).json({ msgCode: Msg.NOT_FOUND });
    }

    // Check user on application permits
    const [permitCreate] = await db.query(
      "SELECT App_permit_Create FROM application WHERE App_Acronym = ?",
      [appAcronym]
    );
    if (!permitCreate.length) {
      return res.status(404).json({ msgCode: Msg.NOT_AUTHORIZED });
    }

    const permittedGroup = permitCreate[0].App_permit_Create;

    // Check if any user group matches the permitted group
    const userGroupsArray = userGroups.map((group) => group.user_group);
    if (!userGroupsArray.includes(permittedGroup)) {
      return res.status(403).json({ msgCode: Msg.NOT_AUTHORIZED });
    }

    //check taskplan valid on plan
    const [validPlan] = await db.query(
      "SELECT * FROM plan WHERE Plan_MVP_name = ?",
      [taskPlan]
    );
    if (!validPlan.length) {
      return res.status(404).json({ msgCode: Msg.NOT_FOUND });
    }

    // Start transaction
    await db.query("START TRANSACTION"); // Start the transaction

    const [app] = await db.query(
      "SELECT App_Rnumber FROM application WHERE App_Acronym = ? FOR UPDATE",
      [appAcronym]
    );

    if (app.length === 0) {
      throw new Error({ msgCode: Msg.INVALID_INPUT });
    }

    // Get and increment the Rnumber
    const currentRnumber = app[0].App_Rnumber;
    const taskId = appAcronym + "_" + currentRnumber;

    // Check if task already exists
    const [results] = await db.query("SELECT * FROM task WHERE Task_id = ?", [
      taskId,
    ]);

    if (results.length > 0) {
      await db.query("ROLLBACK"); // Rollback if task already exists
      return res.status(409).json({
        msgCode: Msg.ENTRY_EXISTS,
      });
    }

    const taskState = "Open";
    const taskCreator = username;
    const taskOwner = username;
    const taskcreateDate = Math.floor(new Date().getTime() / 1000);

    // If the task does not exist, insert the new task
    await db.query(
      "INSERT INTO task (Task_id, Task_plan, Task_app_Acronym, Task_name, Task_description, Task_notes, Task_state, Task_creator, Task_owner, Task_createDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        taskId,
        taskPlan,
        appAcronym,
        taskName,
        description,
        newtaskNotes,
        taskState,
        taskCreator,
        taskOwner,
        taskcreateDate,
      ]
    );

    // Increment the App_Rnumber
    await db.query(
      "UPDATE application SET App_Rnumber = App_Rnumber + 1 WHERE App_Acronym = ?",
      [appAcronym]
    );

    // Commit transaction
    await db.query("COMMIT"); // Commit the transaction

    // Retrieve the created task to return as response
    const [createdTask] = await db.query(
      "SELECT * FROM task WHERE Task_id = ?",
      [taskId]
    );

    // Return the created task details
    return res.json({
      msgCode: Msg.SUCCESS,
      result: createdTask[0], // Send the task details as response
    });
  } catch (error) {
    console.error("Transaction error:", error);
    await db.query("ROLLBACK"); // Rollback on error

    if (error.message === Msg.INVALID_INPUT) {
      return res.status(404).json({ msgCode: Msg.INVALID_INPUT });
    } else if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ msgCode: Msg.ENTRY_EXISTS });
    } else {
      return res.status(500).json({ msgCode: Msg.INTERNAL });
    }
  }
});

//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
// Get tasks
exports.getTaskbyState = catchAsyncErrors(async (req, res) => {
  const { username, password, taskState, appAcronym } = req.body;

  if (!username || !password) {
    return res.status(401).json({
      msgCode: Msg.INVALID_INPUT,
    });
  }

  if (!appAcronym || !taskState) {
    return res.status(400).json({
      msgCode: Msg.INVALID_INPUT,
    });
  }

  try {
    //check user on accounts
    const [user] = await db.query("SELECT * FROM accounts WHERE username = ?", [
      username,
    ]);
    if (!user.length || user[0].accountStatus !== "active") {
      return res.status(404).json({ msgCode: Msg.INVALID_CREDENTIALS });
    }

    const isMatch = await bcrypt.compare(password, user[0].password);
    if (!isMatch) {
      return res.status(401).json({ msgCode: Msg.INVALID_CREDENTIALS });
    }

    const [result] = await db.query(
      `SELECT * FROM task WHERE Task_app_Acronym = ? AND Task_state = ?`,
      [appAcronym, taskState]
    );

    if (!result.length) {
      return res.status(404).json({ msgCode: Msg.NOT_FOUND });
    }

    return res.json({
      msgCode: Msg.SUCCESS,
      result: result,
    });
  } catch (err) {
    console.error("Error during task retrieval:", err);
    return res.status(500).json({ msgCode: Msg.INTERNAL });
  }
});

//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
// promote task
exports.promoteTask2Done = catchAsyncErrors(async (req, res) => {
  const { username, password, taskId, appAcronym, taskNotes } = req.body;

  if (!username || !password) {
    return res.status(401).json({
      msgCode: Msg.INVALID_INPUT,
    });
  }

  if (!appAcronym || !taskId) {
    return res.status(400).json({
      msgCode: Msg.INVALID_INPUT,
    });
  }

  // Assuming `taskNotes` comes from the request body or somewhere else
  let newtaskNotes = taskNotes || ""; // Declare with `let` to allow reassignment

  // Get current date and time
  const now = new Date();
  const formattedDate = `${String(now.getDate()).padStart(2, "0")}/${String(
    now.getMonth() + 1
  ).padStart(2, "0")}/${now.getFullYear()}`;
  const formattedTime = `${String(now.getHours()).padStart(2, "0")}:${String(
    now.getMinutes()
  ).padStart(2, "0")}`;

  // Append or initialize taskNotes
  if (newtaskNotes) {
    // Append new information if taskNotes already exists
    newtaskNotes = `Commented by: ${username}\nDated on: ${formattedDate} ${formattedTime}\n${newtaskNotes}\n\nCreated by: ${username}\nDated on: ${formattedDate} ${formattedTime}\nState: Done\n`;
  } else {
    // Initialize taskNotes if it doesn't exist
    newtaskNotes = `Submitted to review by: ${username}\nDated on: ${formattedDate} ${formattedTime}\nState: Done\n`;
  }

  try {
    // Validate user credentials
    const [user] = await db.query("SELECT * FROM accounts WHERE username = ?", [
      username,
    ]);
    if (!user.length || user[0].accountStatus !== "active") {
      return res.status(401).json({ msgCode: Msg.INVALID_CREDENTIALS });
    }

    const isMatch = await bcrypt.compare(password, user[0].password);
    if (!isMatch) {
      return res.status(401).json({ msgCode: Msg.INVALID_CREDENTIALS });
    }

    // Check if the user belongs to the permitted group
    const [userGroups] = await db.query(
      "SELECT user_group FROM usergroup WHERE username = ?",
      [username]
    );
    if (!userGroups.length) {
      return res.status(403).json({ msgCode: Msg.NOT_AUTHORIZED });
    }

    //check app exists
    const [validApp] = await db.query(
      "SELECT * FROM application WHERE App_Acronym = ?",
      [appAcronym]
    );
    if (!validApp.length) {
      return res.status(404).json({ msgCode: Msg.NOT_FOUND });
    }

    const [permitDoing] = await db.query(
      "SELECT App_permit_Doing FROM application WHERE App_Acronym = ?",
      [appAcronym]
    );
    if (!permitDoing.length) {
      return res.status(403).json({ msgCode: Msg.NOT_AUTHORIZED });
    }

    const permittedGroup = permitDoing[0].App_permit_Doing;
    const userGroupList = userGroups.map((group) => group.user_group);
    if (!userGroupList.includes(permittedGroup)) {
      return res.status(403).json({ msgCode: Msg.NOT_AUTHORIZED });
    }

    // Fetch current task details
    const [currentTask] = await db.query(
      "SELECT Task_notes, Task_name, Task_state FROM task WHERE Task_id = ?",
      [taskId]
    );
    if (!currentTask.length) {
      return res.status(404).json({ msgCode: Msg.NOT_FOUND });
    }

    if (currentTask[0].Task_state == "Done") {
      return res.status(400).json({ msgCode: Msg.ENTRY_EXISTS });
    }

    if (currentTask[0].Task_state !== "Doing") {
      return res.status(400).json({ msgCode: Msg.INVALID_STATE_CHANGE });
    }

    // Prepare task update data
    const updatedNotes =
      (currentTask[0].Task_notes || "") +
      (newtaskNotes ? `\n${newtaskNotes}` : "");
    const taskState = "Done";
    const taskOwner = username;

    // Execute the task update
    await db.query(
      "UPDATE task SET Task_state = ?, Task_owner = ?, Task_notes = ? WHERE Task_id = ?",
      [taskState, taskOwner, updatedNotes, taskId]
    );

    // Email notification to reviewers
    const [emailResults] = await db.query(
      `
      SELECT acc.email 
      FROM accounts acc 
      JOIN usergroup u ON u.username = acc.username 
      JOIN application app ON u.user_group = app.App_permit_Done 
      WHERE app.App_Acronym = ? AND acc.email IS NOT NULL
    `,
      [appAcronym]
    );
    const recipientEmails = emailResults.map((user) => user.email);

    if (recipientEmails.length > 0) {
      // Create email transporter
      let transporter = nodemailer.createTransport({
        service: "gmail",
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      // Prepare email data
      let mailOptions = {
        from: '"TMS-Do-Not-Reply" <d45046990@gmail.com>',
        to: recipientEmails.join(", "),
        subject: "TMS Task To Review",
        text: `
          Dear Project Leads,

          You have a new task to review.

          Task Name: ${currentTask[0].Task_name}
          Task ID: ${taskId}

          Please login to the system to review the task.

          Thanks,
          TMS Team
        `,
      };

      // Send email
      try {
        let info = await transporter.sendMail(mailOptions);
        console.log("Message sent: %s", info.messageId);
      } catch (error) {
        console.error("Email sending error:", error.message);
        return res.status(500).json({ msgCode: Msg.INTERNAL });
      }
    }

    // Retrieve the created task to return as response
    const [updatedTask] = await db.query(
      "SELECT * FROM task WHERE Task_id = ?",
      [taskId]
    );

    // Return the created task details
    return res.json({
      msgCode: Msg.SUCCESS,
      task: updatedTask[0], // Send the task details as response
    });
  } catch (error) {
    console.error("Transaction error:", error);
    return res.status(500).json({ msgCode: Msg.INTERNAL });
  }
});
