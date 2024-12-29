const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("./constants");

const generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: "1h" });
};

module.exports = generateToken;
