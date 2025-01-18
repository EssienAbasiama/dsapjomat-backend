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
  getManuscriptsByDraftAndStatus,
  getManuscriptsById,
} = require("../controllers/manuscriptController");
const router = express.Router();

router.post("/manuscripts", createManuscript);

router.delete("/manuscripts/:id", deleteManuscript);
router.get("/manuscripts/:id", getManuscriptsById);
// Route for getting manuscripts by created_by and isDraft
router.get("/manuscripts", getManuscripts);
router.get("/manuscriptsbyuser", getManuscriptsByUser);
router.get("/getManuscriptsByCoAuthor", getManuscriptsByCoAuthor);
router.get("/getManuscriptsByReviewRequest", getManuscriptsByReviewRequest);
router.post("/manuscripts/update-status", updateManuscriptStatus);
router.get("/manuscriptsByDraftAndStatus", getManuscriptsByDraftAndStatus);
module.exports = router;
