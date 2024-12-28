const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/database"); // Import the database connection

// Register User
exports.registerUser = async (req, res) => {
  const {
    title,
    first_name,
    middle,
    last_name,
    degree,
    specialty,
    phone,
    country,
    orcid,
    email,
    confirm_email,
    alternative_email,
    username,
    password,
    available_as_reviewer,
    receive_news,
    comments,
  } = req.body;

  // Validate required fields
  if (
    !title ||
    !first_name ||
    !last_name ||
    !degree ||
    !phone ||
    !country ||
    !orcid ||
    !email ||
    !confirm_email ||
    !username ||
    !password
  ) {
    return res
      .status(400)
      .json({ message: "All required fields must be filled out." });
  }

  if (email !== confirm_email) {
    return res.status(400).json({ message: "Emails do not match." });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    db.run(
      `INSERT INTO users (
        title, first_name, middle, last_name, degree, specialty, phone, country,
        orcid, email, alternative_email, username, password, available_as_reviewer,
        receive_news, comments
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        first_name,
        middle || null,
        last_name,
        degree,
        specialty || null,
        phone,
        country,
        orcid,
        email,
        alternative_email || null,
        username,
        hashedPassword,
        available_as_reviewer ? 1 : 0,
        receive_news ? 1 : 0,
        comments || null,
      ],
      function (err) {
        if (err) {
          if (err.message.includes("UNIQUE constraint")) {
            return res.status(400).json({ message: "User already exists." });
          }
          return res.status(500).json({
            message: "Database error.",
            error: err.message,
          });
        }
        res
          .status(201)
          .json({ id: this.lastID, first_name, last_name, email, username });
      }
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// Login User
exports.loginUser = (req, res) => {
  const { email, password } = req.body;

  // Ensure JWT_SECRET and REFRESH_SECRET are present
  const JWT_SECRET = process.env.JWT_SECRET || "defaultAccessTokenSecret"; // Use default if not found
  const REFRESH_SECRET =
    process.env.REFRESH_SECRET || "defaultRefreshTokenSecret"; // Use default if not found

  // Start by querying the user
  db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
    if (err || !user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Compare the password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Set token expiry
    const accessTokenExpiry = Date.now() + 60 * 60 * 1000; // 1 hour
    const refreshTokenExpiry = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days

    // Sign the access token
    const token = jwt.sign({ id: user.id }, JWT_SECRET, {
      expiresIn: "1h",
    });

    // Sign the refresh token
    const refreshToken = jwt.sign({ id: user.id }, REFRESH_SECRET, {
      expiresIn: "7d",
    });

    // Save refresh token in the database (for verification and rotation)
    db.run(
      `UPDATE users SET refresh_token = ? WHERE id = ?`,
      [refreshToken, user.id],
      (updateErr) => {
        if (updateErr) {
          // Return the error only if the update fails, and make sure no response has been sent already
          if (!res.headersSent) {
            return res.status(500).json({ message: "Internal server error" });
          }
        }

        // After ensuring no errors, send the response
        if (!res.headersSent) {
          return res.json({
            token,
            refreshToken,
            expiresAt: accessTokenExpiry,
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
            },
          });
        }
      }
    );
  });
};

// Get All Users
exports.getAllUsers = (req, res) => {
  db.all(`SELECT id, name, email FROM users`, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: err.message });
    }
    res.status(200).json(rows);
  });
};

// Get Specific User by ID
exports.getUserById = (req, res) => {
  const { id } = req.params;

  db.get(`SELECT id, name, email FROM users WHERE id = ?`, [id], (err, row) => {
    if (err || !row) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(row);
  });
};

exports.refreshToken = (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  db.get(
    `SELECT * FROM users WHERE refresh_token = ?`,
    [refreshToken],
    (err, user) => {
      if (err || !user) {
        return res.status(403).json({ message: "Invalid refresh token" });
      }

      // Verify refresh token
      jwt.verify(refreshToken, process.env.REFRESH_SECRET, (err, decoded) => {
        if (err) {
          return res.status(403).json({ message: "Invalid refresh token" });
        }

        const newToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
          expiresIn: "1h",
        });

        const newTokenExpiry = Date.now() + 60 * 60 * 1000; // 1 hour

        res.json({
          token: newToken,
          expiresAt: newTokenExpiry,
        });
      });
    }
  );
};
