const express = require("express");
const {
  registerUser,
  loginUser,
  getAllUsers,
  getUserById,
  refreshToken,
  verifyEmail,
  resendVerification,
  test,
} = require("../controllers/authController");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/register", registerUser);
router.get("/verify/:token", verifyEmail);
router.post("/login", loginUser);
router.get("/users", protect, getAllUsers);
router.get("/users/:id", protect, getUserById);
router.post("/refresh", refreshToken);
router.post("/resend-verification", resendVerification);

module.exports = router;
