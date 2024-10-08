const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const Msg = require("./utils/config/message");

// Load environment variables from .env file
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cookieParser());

// Enable CORS
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true, // Allow credentials (cookies, authorization headers)
  })
);

// Ensure the `Access-Control-Allow-Credentials` header is set for all responses
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  next();
});

// Middleware
app.use(express.json());

// Import and use routes
const userRoutes = require("./routes/userRoutes");

app.use("/api/users", userRoutes);

const demoRoutes = require("./routes/demoRoutes");

app.use("/api/demo", demoRoutes);

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
