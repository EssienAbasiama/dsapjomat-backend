const db = require("../config/database");

// Add Author by Email
exports.addAuthorByEmail = async (req, res) => {
  const { email } = req.body;

  // Validate email
  if (!email) {
    return res.status(400).json({ message: "Email is required." });
  }

  try {
    // Check if user exists
    db.get(
      `SELECT id, first_name, last_name, email FROM users WHERE email = ?`,
      [email],
      (err, user) => {
        if (err) {
          return res
            .status(500)
            .json({ message: "Database error.", error: err.message });
        }

        if (user) {
          // If user exists, return user details
          return res.status(200).json({ message: "User found.", user });
        }

        // If user does not exist
        return res.status(404).json({ message: "User not found." });
      }
    );
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
