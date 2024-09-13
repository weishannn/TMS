const express = require("express");
const cors = require("cors");
const session = require("express-session");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");

// Load environment variables from .env file
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cookieParser());
// Route to clear the cookie
app.get("/login", (req, res) => {
  res.clearCookie("token", cookieOptions); // Clear the cookie
  res.redirect("/login"); // Redirect to login page or handle as needed
});

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
app.use(
  session({
    secret: process.env.SESSION_SECRET, // Use session secret from .env file
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // Set to true if using HTTPS
  })
);

// Import and use routes
const userRoutes = require("./routes/userRoutes");

app.use("/api/users", userRoutes);

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
