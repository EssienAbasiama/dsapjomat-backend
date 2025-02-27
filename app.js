const express = require("express");
const dotenv = require("dotenv");
const authRoutes = require("./routes/authRoutes");
const authorRoutes = require("./routes/authorRoutes");
const manuscriptRoutes = require("./routes/manuscriptRoutes");
const newsRoutes = require("./routes/newsRoutes");
const db = require("./config/database");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const path = require("path");

dotenv.config();

const app = express();

// CORS options
const corsOptions = {
  origin: [
    "https://www.dsapjomat.com",
    "https://dsapjomat-backend.onrender.com",
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

// Middleware

app.use(cors(corsOptions)); // Apply CORS middleware with options
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/authors", authorRoutes);
app.use("/api", manuscriptRoutes);
app.use("/api/news", newsRoutes);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
