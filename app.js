const express = require("express");
const dotenv = require("dotenv");
const authRoutes = require("./routes/authRoutes");
const db = require("./config/database"); // Use the existing database connection

dotenv.config();

const app = express();

// Middleware
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
