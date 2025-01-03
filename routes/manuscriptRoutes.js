const express = require("express");
const {
  createManuscript,
  updateManuscript,
  deleteManuscript,
  getManuscripts,
  getManuscriptsByUser,
  getManuscriptsByCoAuthor,
  getManuscriptsByReviewRequest,
  updateManuscriptStatus,
} = require("../controllers/manuscriptController");
const router = express.Router();
// const manuscriptController = require("../controllers/manuscriptController");

router.post("/manuscripts", createManuscript);
// router.put("/manuscripts/:id", updateManuscript);
router.delete("/manuscripts/:id", deleteManuscript);
// Route for getting manuscripts by created_by and isDraft
router.get("/manuscripts", getManuscripts);
router.get("/manuscriptsbyuser", getManuscriptsByUser);
router.get("/getManuscriptsByCoAuthor", getManuscriptsByCoAuthor);
router.get("/getManuscriptsByReviewRequest", getManuscriptsByReviewRequest);
router.post("/manuscripts/update-status", updateManuscriptStatus);

module.exports = router;
