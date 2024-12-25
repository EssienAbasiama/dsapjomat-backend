const express = require("express");
const {
  registerUser,
  loginUser,
  getAllUsers,
  getUserById,
} = require("../controllers/authController");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/users", protect, getAllUsers);
router.get("/users/:id", protect, getUserById);

module.exports = router;
