const express = require("express");
const {
  createManuscript,
  updateManuscript,
  deleteManuscript,
  getManuscripts,
} = require("../controllers/manuscriptController");
const router = express.Router();
// const manuscriptController = require("../controllers/manuscriptController");

router.post("/manuscripts", createManuscript);
router.put("/manuscripts/:id", updateManuscript);
router.delete("/manuscripts/:id", deleteManuscript);
// Route for getting manuscripts by created_by and isDraft
router.get("/manuscripts", getManuscripts);

module.exports = router;
