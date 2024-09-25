const mysql = require("mysql2");
const dotenv = require("dotenv");

dotenv.config();

const pool = mysql.createPool({
  connectionLimit: 100,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  debug: false,
});

pool.getConnection((err, connection) => {
  if (err) {
    console.error("Error connecting to the database:", err);
    return;
  }
  console.log("Connected to the MySQL database");

  // // Perform queries here
  // connection.query("SELECT * FROM accounts", (err, accounts) => {
  //   if (err) {
  //     console.error("Error fetching accounts:", err);
  //     connection.release();
  //     return;
  //   }

  //   console.log("Accounts:", accounts);

  //   connection.query("SELECT * FROM usergroup", (err, userGroups) => {
  //     if (err) {
  //       console.error("Error fetching user groups:", err);
  //     } else {
  //       console.log("User Groups:", userGroups);
  //     }
  //     connection.release();
  //   });
  // });
});

module.exports = pool.promise();
