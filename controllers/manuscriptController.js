const db = require("../config/database");
const upload = require("../middlewares/fileUpload");

// Create Manuscript
exports.createManuscript = [
  (req, res, next) => {
    req.body.type = "manuscript"; // Set type to "manuscript" for dynamic folder selection
    next();
  },
  upload, // Middleware to handle file uploads
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
      drafted_at,
      created_by,
      created_at,
    } = req.body;

    // Get details of uploaded files (if any)
    const fileDetails = req.files.map((file) => ({
      filePath: file.path,
      originalName: file.originalname,
    }));

    // Validate required fields
    if (!manuscript_type || !full_title || !abstract_text) {
      return res.status(400).json({
        message: "Manuscript Type, Title, and Abstract are required.",
      });
    }

    // Prepare the SQL query for inserting the manuscript data
    const query = `
      INSERT INTO manuscripts (
        manuscript_type, full_title, running_title, moreSubject, co_authors, agreement,
        abstract_text, tags, subjects, comments, suggestedReviewers, file_type,
        file_description, files, cover_letter, isDraft, drafted_at, created_by, created_at, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    // Prepare the parameters for the SQL query
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
      JSON.stringify(fileDetails || []), // Store file details as JSON
      cover_letter || null,
      isDraft ? 1 : 0,
      drafted_at || new Date().toISOString(),
      created_by || null,
      created_at || null,
      "pending",
    ];

    // Execute the query to save the manuscript into the database
    db.run(query, params, function (err) {
      if (err) {
        console.error("Error saving manuscript:", err.message);
        return res
          .status(500)
          .json({ message: "Database error.", error: err.message });
      }
      // Return the response with the manuscript ID and file details
      res.status(201).json({
        id: this.lastID,
        message: "Manuscript created successfully.",
        files: fileDetails,
      });
    });
  },
];

// Get Manuscripts by created_by and isDraft
exports.getManuscripts = (req, res) => {
  // Destructure and ensure the values are correctly typed
  const { created_by, isDraft } = req.query;
  console.log(req.query);

  // Parse created_by as an integer and isDraft as a boolean (then convert to 1/0)
  const createdBy = parseInt(created_by, 10); // Convert to integer
  const isDraftBoolean = isDraft === "true"; // Convert to boolean (true or false)

  // Validate the createdBy to make sure it's a valid integer
  if (isNaN(createdBy)) {
    return res
      .status(400)
      .json({ message: "Invalid created_by value. It must be an integer." });
  }

  // SQL query to fetch manuscripts based on created_by and isDraft
  const query = `
    SELECT * FROM manuscripts WHERE created_by = ? AND isDraft = ?
  `;
  const params = [createdBy, isDraftBoolean ? 1 : 0];

  // Execute the query
  db.all(query, params, (err, rows) => {
    if (err) {
      console.error("Error retrieving manuscripts:", err.message);
      return res
        .status(500)
        .json({ message: "Database error.", error: err.message });
    }

    console.log("Fetched manuscripts:", rows);
    return res.status(200).json({ manuscripts: rows });
  });
};

// Update Manuscript
exports.updateManuscript = [
  upload, // Handles multiple file uploads
  (req, res) => {
    const { id } = req.params; // Get manuscript ID from URL params
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
    const fileDetails = files
      ? files.map((file) => ({
          filePath: file.path,
          originalName: file.originalname,
        }))
      : [];

    // Validate required fields
    if (!manuscript_type || !full_title || !abstract_text) {
      return res.status(400).json({
        message: "Manuscript Type, Title, and Abstract are required.",
      });
    }

    const query = `
      UPDATE manuscripts
      SET
        manuscript_type = ?, 
        full_title = ?, 
        running_title = ?, 
        moreSubject = ?, 
        co_authors = ?, 
        content = ?, 
        agreement = ?, 
        abstract_text = ?, 
        tags = ?, 
        subjects = ?, 
        comments = ?, 
        suggestedReviewers = ?, 
        file_type = ?, 
        file_description = ?, 
        files = ?, 
        cover_letter = ?, 
        isDraft = ?, 
        drafted_at = ?, 
        created_by = ?, 
        created_at = ?
      WHERE id = ?
    `;

    const params = [
      manuscript_type,
      full_title,
      running_title || null,
      moreSubject || null,
      JSON.stringify(co_authors || []),
      content || null,
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
      id, // Ensure you're updating the correct manuscript
    ];

    db.run(query, params, function (err) {
      if (err) {
        console.error("Error updating manuscript:", err.message);
        return res
          .status(500)
          .json({ message: "Database error.", error: err.message });
      }

      if (this.changes === 0) {
        return res.status(404).json({ message: "Manuscript not found." });
      }

      res.status(200).json({
        message: "Manuscript updated successfully.",
        updatedFields: fileDetails,
      });
    });
  },
];

// Delete Manuscript
exports.deleteManuscript = (req, res) => {
  const { id } = req.params;

  const query = `DELETE FROM manuscripts WHERE id = ?`;

  db.run(query, [id], function (err) {
    if (err) {
      console.error("Error deleting manuscript:", err.message);
      return res
        .status(500)
        .json({ message: "Database error.", error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ message: "Manuscript not found." });
    }
    res.status(200).json({ message: "Manuscript deleted successfully." });
  });
};
