const nodemailer = require("nodemailer");
const dotenv = require("dotenv");

dotenv.config();

const sendEmail = async (req, res) => {
  const { recipientEmail } = req.body;

  // Check if recipientEmail is provided
  if (!recipientEmail) {
    return res.status(400).json({ error: "Recipient email not found" });
  }

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
    to: recipientEmail, // Accepts email from the request body
    subject: "TMS Task To Review",
    text:
      "Dear Project Leads, \n\n" +
      "You have a new task to review. \n\n" +
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
