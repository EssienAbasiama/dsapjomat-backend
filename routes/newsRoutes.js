const express = require("express");
const {
  publishNews,
  getNewsById,
  getNewsByCreatedBy,
  deleteNews,
  getAllNews,
} = require("../controllers/newsController");

const router = express.Router();

router.get("/news", getAllNews);

// Route to publish news
router.post("/news", publishNews);

// Route to get news by ID
router.get("/news/:id", getNewsById);

// Route to get news by created_by
router.get("/news", getNewsByCreatedBy);

// Route to delete news by ID
router.delete("/news/:id", deleteNews);

module.exports = router;
