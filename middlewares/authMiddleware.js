const jwt = require("jsonwebtoken");
const db = require("../config/database"); // Import your SQLite database connection

// Protect route middleware
const protect = (req, res, next) => {
  let token;

  // Check for token in Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1]; // Extract token

      // Verify the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Query SQLite to find the user based on decoded ID
      db.get(
        `SELECT id, name, email FROM users WHERE id = ?`,
        [decoded.id],
        (err, user) => {
          if (err || !user) {
            return res
              .status(401)
              .json({ message: "Not authorized, user not found" });
          }

          req.user = user; // Attach user info to the request
          next(); // Continue to the next middleware or route handler
        }
      );
    } catch (error) {
      return res.status(401).json({
        message: "Not authorized, token failed",
        error: error.message, // Return the error message
      });
    }
  } else {
    res.status(401).json({ message: "Not authorized, no token" }); // No token in request
  }
};

module.exports = { protect };
