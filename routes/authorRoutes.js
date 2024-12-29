const express = require("express");

const { protect } = require("../middlewares/authMiddleware");
const { addAuthorByEmail } = require("../controllers/authorController");

const router = express.Router();

router.post("/add-author", protect, addAuthorByEmail);

module.exports = router;
