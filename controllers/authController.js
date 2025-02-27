const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/database");
const { JWT_SECRET, REFRESH_SECRET } = require("../Utils/constants");
const sendEmail = require("../Utils/sendEmail");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

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
    const verificationToken = crypto.randomBytes(32).toString("hex");

    db.run(
      `INSERT INTO users (
        title, first_name, middle, last_name, degree, specialty, phone, country,
        orcid, email, alternative_email, username, password, available_as_reviewer,
        receive_news, comments,role,verification_token, is_verified
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,'user',?,0)`,
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
        verificationToken,
      ],
      async function (err) {
        if (err) {
          if (err.message.includes("UNIQUE constraint")) {
            return res.status(400).json({ message: "User already exists." });
          }
          return res.status(500).json({
            message: "Database error.",
            error: err.message,
          });
        }

        // Send verification email
        const verificationLink = `https://www.dsapjomat.com/verify-email/${verificationToken}`;
        const emailSubject = "Verify Your Email";

        //   const emailHTML = `
        //   <div style="font-family: Arial, sans-serif; text-align: center;">
        //     <h2>Welcome to Our Platform!</h2>
        //     <p>Click the button below to verify your email:</p>
        //     <a href="${verificationLink}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
        //       Verify Email
        //     </a>
        //     <p>If you didn't request this, please ignore this email.</p>
        //   </div>
        // `;
        const templatePath = path.join(
          __dirname,
          "emailTemplates",
          "verificationEmail.html"
        );
        let emailHTML = fs.readFileSync(templatePath, "utf8");
        emailHTML = emailHTML.replace(
          "{{VERIFICATION_LINK}}",
          verificationLink
        );
        await sendEmail(email, emailSubject, emailHTML);

        res
          .status(201)
          .json({ message: "User registered! Please verify your email." });
      }
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Login User
exports.loginUser = (req, res) => {
  const { email, password } = req.body;

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
    console.log("Token", token);
    console.log("refreshToken", refreshToken);

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
            expiresAt: refreshTokenExpiry,
            user,
          });
        }
      }
    );
  });
};

// Get All Users
exports.getAllUsers = (req, res) => {
  db.all(`SELECT id, email FROM users`, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: err.message });
    }
    res.status(200).json(rows);
  });
};

// Get Specific User by ID
exports.getUserById = (req, res) => {
  const { id } = req.params;

  db.get(`SELECT id, email FROM users WHERE id = ?`, [id], (err, row) => {
    if (err || !row) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(row);
  });
};

exports.refreshToken = (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const refreshToken = authHeader.split(" ")[1]; // Extract the token after 'Bearer '

  console.log("refreshToken", refreshToken);

  if (!refreshToken) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  db.get(
    `SELECT * FROM users WHERE refresh_token = ?`,
    [refreshToken],
    (err, user) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ message: "Database error" });
      }

      if (!user) {
        return res.status(403).json({ message: "Invalid refresh token" });
      }
      console.log("User", user);

      // Verify the refresh token
      jwt.verify(refreshToken, REFRESH_SECRET, (err, decoded) => {
        if (err) {
          return res.status(403).json({ message: "Token Verification Failed" });
        }

        // Generate a new refresh token
        const newRefreshToken = jwt.sign({ id: user.id }, REFRESH_SECRET, {
          expiresIn: "7d", // Set an expiration time for refresh token, e.g., 7 days
        });

        // Generate a new access token
        const newAccessToken = jwt.sign({ id: user.id }, JWT_SECRET, {
          expiresIn: "1h", // 1 hour
        });

        const newTokenExpiry = Date.now() + 60 * 60 * 1000; // 1 hour

        // Save the new refresh token in the database
        db.run(
          `UPDATE users SET refresh_token = ? WHERE id = ?`,
          [newRefreshToken, user.id],
          (err) => {
            if (err) {
              console.error("Database error:", err);
              return res
                .status(500)
                .json({ message: "Error saving new refresh token" });
            }

            // Return the new tokens to the client
            res.json({
              token: newAccessToken,
              refreshToken: newRefreshToken,
              expiresAt: newTokenExpiry,
            });
          }
        );
      });
    }
  );
};

exports.verifyEmail = async (req, res) => {
  const { token } = req.params;

  db.get(
    "SELECT * FROM users WHERE verification_token = ?",
    [token],
    (err, user) => {
      if (err) {
        return res.status(500).json({ message: "Database error." });
      }
      console.log("token", token);

      if (!user) {
        return res.status(400).json({ message: "Invalid or expired token." });
      }

      // Update user verification status
      db.run(
        "UPDATE users SET is_verified = 1, verification_token = NULL WHERE id = ?",
        [user.id],
        (updateErr) => {
          if (updateErr) {
            return res
              .status(500)
              .json({ message: "Error updating verification status." });
          }
          res.status(200).json({ message: "Email verified successfully!" });
        }
      );
    }
  );
};

exports.resendVerification = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required." });
  }

  try {
    db.get(
      "SELECT id, is_verified FROM users WHERE email = ?",
      [email],
      async (err, user) => {
        if (err) {
          return res
            .status(500)
            .json({ message: "Database error.", error: err.message });
        }

        if (!user) {
          return res.status(404).json({ message: "User not found." });
        }
        console.log("user", user);

        if (user.is_verified) {
          return res
            .status(400)
            .json({ message: "Email is already verified." });
        }

        // Generate a new verification token
        const newVerificationToken = crypto.randomBytes(32).toString("hex");

        // Update the verification token in the database
        db.run(
          "UPDATE users SET verification_token = ? WHERE email = ?",
          [newVerificationToken, email],
          async (updateErr) => {
            if (updateErr) {
              return res
                .status(500)
                .json({ message: "Database error.", error: updateErr.message });
            }

            // Send the verification email
            const verificationLink = `http://localhost:5173/verify-email/${newVerificationToken}`;
            const emailSubject = "JMAT:Resend: Verify Your Email";
            const emailHTML = `
              <div style="font-family: Arial, sans-serif; text-align: center;">
                <h2>Email Verification</h2>
                <p>Click the button below to verify your email:</p>
                <a href="${verificationLink}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                  Verify Email
                </a>
                <p>If you didn't request this, please ignore this email.</p>
              </div>
            `;

            await sendEmail(email, emailSubject, emailHTML);

            return res
              .status(200)
              .json({ message: "Verification email resent successfully." });
          }
        );
      }
    );
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.test = () => {
  console.log("Testing Testing Testing");
};
