const db = require("../config/database");
const upload = require("../middlewares/fileUpload");

// Create Manuscript
exports.createManuscript = [
  upload, // Handles multiple file uploads
  (req, res) => {
    const {
      manuscript_type,
      full_title,
      running_title,
      moreSubject,
      co_authors,
      content,
      agreement,
      abstract_text,
      tags,
      subjects,

      comments,
      suggestedReviewers,
      file_type,
      file_description,
      cover_letter,
      isDraft,
      files,
      drafted_at,
      created_by,
      created_at,
    } = req.body;

    // Gather file information
    const fileDetails = files.map((file) => ({
      filePath: file.path,
      originalName: file.originalname,
    }));

    // Validate required fields
    if (!manuscript_type || !full_title || !abstract_text) {
      return res.status(400).json({
        message: "Manuscript Type, Title, and Abstract are required.",
      });
    }

    const query = `
      INSERT INTO manuscripts (
        manuscript_type, full_title, running_title, moreSubject, co_authors, agreement,
        abstract_text, tags, subjects, comments, suggestedReviewers, file_type,
        file_description, files, cover_letter, isDraft, drafted_at, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      manuscript_type,
      full_title,
      running_title,
      moreSubject || null,
      JSON.stringify(co_authors || []),

      agreement || null,
      abstract_text,
      JSON.stringify(tags || []),
      JSON.stringify(subjects || []),

      comments || null,
      JSON.stringify(suggestedReviewers || []),
      file_type || null,
      file_description || null,
      JSON.stringify(files || []),
      cover_letter || null,
      isDraft ? 1 : 0,
      drafted_at || null,
      created_by || null,
      created_at || null,
    ];
    console.log(params);
    db.run(query, params, function (err) {
      if (err) {
        console.error("Error saving manuscript:", err.message); // Log the error message
        return res
          .status(500)
          .json({ message: "Database error.", error: err.message });
      }
      res.status(201).json({
        id: this.lastID,
        message: "Manuscript created successfully.",
        files: fileDetails,
      });
    });
  },
];

// Update Manuscript
exports.updateManuscript = [
  upload, // Handles multiple file uploads
  (req, res) => {
    const { id } = req.params;
    const {
      type,
      title,
      co_authors,
      abstract_text,
      tags,
      subjects,
      other_subjects,
      comments,
      termsAndCondition,
      suggestedReviewers,
      responsibility,
      file_type,
      file_description,
      cover_letter,
      isDraft,
    } = req.body;

    // Gather new file information if files were uploaded
    const fileDetails = req.files.map((file) => ({
      filePath: file.path,
      originalName: file.originalname,
    }));

    const query = `
      UPDATE manuscripts
      SET type = ?, title = ?, co_authors = ?, abstract_text = ?, tags = ?, subjects = ?,
          other_subjects = ?, comments = ?, termsAndCondition = ?, suggestedReviewers = ?,
          responsibility = ?, file_type = ?, file_description = ?, files = ?, cover_letter = ?,
          isDraft = ?
      WHERE id = ?
    `;

    const params = [
      type,
      title,
      JSON.stringify(co_authors || []), // Serialize co_authors
      abstract_text,
      JSON.stringify(tags || []), // Serialize tags
      JSON.stringify(subjects || []), // Serialize subjects
      other_subjects || null,
      comments || null,
      termsAndCondition || null,
      JSON.stringify(suggestedReviewers || []), // Serialize suggestedReviewers
      responsibility || null,
      file_type || null,
      file_description || null,
      JSON.stringify(fileDetails.length > 0 ? fileDetails : undefined), // Update file details if new ones
      cover_letter || null,
      isDraft ? 1 : 0,
      id,
    ];

    db.run(query, params, function (err) {
      if (err) {
        return res
          .status(500)
          .json({ message: "Database error.", error: err.message });
      }
      res.status(200).json({ message: "Manuscript updated successfully." });
    });
  },
];

// Delete Manuscript
exports.deleteManuscript = (req, res) => {
  const { id } = req.params;

  db.run(`DELETE FROM manuscripts WHERE id = ?`, [id], function (err) {
    if (err) {
      return res
        .status(500)
        .json({ message: "Database error.", error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ message: "Manuscript not found." });
    }
    res.json({ message: "Manuscript deleted successfully." });
  });
};
