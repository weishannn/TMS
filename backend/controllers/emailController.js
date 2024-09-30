const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
const db = require("../models/db");

dotenv.config();

const sendEmail = async (req, res) => {
  const { appAcronym, taskId, taskName } = req.body;

  // Check if recipientEmail is provided
  if (!appAcronym) {
    return res.status(400).json({ error: "App Acronym not found" });
  }

  const queryGetEmail = `SELECT acc.email FROM accounts acc JOIN usergroup u ON u.username = acc.username JOIN application app ON u.user_group = app.App_permit_Done WHERE app.App_Acronym = ?`;

  const results = await db.query(queryGetEmail, [appAcronym]);
  console.log(results);
  const recipientEmail = results
    .flat() // Flatten the array of arrays
    .filter((user) => user.email !== "") // Filter out entries with empty email fields
    .map((user) => user.email); // Extract the emails

  // Create a transporter
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

  // Set up email data
  let mailOptions = {
    from: '"TMS-Do-Not-Reply" <d45046990@gmail.com>',
    to: recipientEmail.join(", "), // Accepts email from the request body
    subject: "TMS Task To Review",
    text:
      "Dear Project Leads, \n\n" +
      "You have a new task to review. \n\n" +
      "Task Name: " +
      taskName +
      "\n\n" +
      "Task ID: " +
      taskId +
      "\n\n" +
      "Please login to the system to review the task. \n\n" +
      "Thanks, \n" +
      "TMS Team",
  };

  // Send mail
  try {
    let info = await transporter.sendMail(mailOptions);
    console.log("Message sent: %s", info.messageId);
    res.status(200).send("Email sent successfully!");
  } catch (error) {
    console.log("Error occurred: " + error.message);
    res.status(500).send("Error sending email");
  }
};

module.exports = { sendEmail };
