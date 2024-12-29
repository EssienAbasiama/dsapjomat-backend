const express = require("express");
const {
  createManuscript,
  updateManuscript,
  deleteManuscript,
} = require("../controllers/manuscriptController");
const router = express.Router();
// const manuscriptController = require("../controllers/manuscriptController");

router.post("/manuscripts", createManuscript);
router.put("/manuscripts/:id", updateManuscript);
router.delete("/manuscripts/:id", deleteManuscript);

module.exports = router;
