const express = require("express");
const dotenv = require("dotenv");
const authRoutes = require("./routes/authRoutes");
const db = require("./config/database");
const cors = require("cors");

dotenv.config();

const app = express();

// CORS options
const corsOptions = {
  origin: "http://localhost:5173", // Replace with your frontend URL
  methods: ["GET", "POST", "PUT", "DELETE"], // Allowed methods
  allowedHeaders: ["Content-Type", "Authorization"], // Allowed headers
  credentials: true, // Allow credentials (cookies, authorization headers)
};

// Middleware
app.use(cors(corsOptions)); // Apply CORS middleware with options
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
