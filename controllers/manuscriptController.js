const db = require("../config/database");
const upload = require("../middlewares/fileUpload");
const moment = require("moment");

// Create Manuscript
exports.createManuscript = [
  (req, res, next) => {
    req.body.type = "manuscript";
    next();
  },
  upload,
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
      files,
    } = req.body;

    const fileDetails = req.files.map((file) => ({
      filePath: file.path,
      originalName: file.originalname,
    }));

    console.log("OutSideFiles", req.files);
    console.log("FilesDetails", fileDetails);
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
      co_authors || [],
      agreement === false ? 0 : 1,
      abstract_text,
      JSON.stringify(tags || []),
      JSON.stringify(subjects || []),
      comments || null,
      suggestedReviewers || [],
      file_type || null,
      file_description || null,
      JSON.stringify(fileDetails || []), // Store file details as JSON
      cover_letter || null,
      isDraft === "false" ? 0 : 1,
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

    // Map over rows to add file URLs to the response
    const manuscriptsWithUrls = rows.map((manuscript) => {
      const fileDetails = JSON.parse(manuscript.files); // Assuming files is a JSON string in the database

      // Check if fileDetails is an array and is not empty
      if (!Array.isArray(fileDetails) || fileDetails.length === 0) {
        return { ...manuscript, files: [] }; // No files, return an empty array
      }

      const filesWithUrls = fileDetails.map((file, index) => {
        if (!file || !file.filePath) {
          console.error(`File at index ${index} is missing filePath:`, file);
          return file; // Return the file as-is if filePath is missing
        }

        // Replace backslashes with forward slashes in filePath
        const filePath = file.filePath.replace(/\\/g, "/");

        // Construct the full URL for each file
        const fileUrl = `${req.protocol}://${req.get("host")}/${filePath}`;
        return { ...file, fileUrl }; // Add the fileUrl to each file detail
      });

      return {
        ...manuscript,
        files: filesWithUrls, // Include the file URLs in the response
      };
    });

    return res.status(200).json({ manuscripts: manuscriptsWithUrls });
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

exports.getManuscriptsByUser = (req, res) => {
  const { created_by } = req.query;

  const createdBy = parseInt(created_by, 10);

  if (isNaN(createdBy)) {
    return res.status(400).json({
      message: "Invalid created_by value. It must be an integer.",
    });
  }

  const query = `
    SELECT * FROM manuscripts WHERE created_by = ?
  `;
  const params = [createdBy];

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error("Error retrieving manuscripts:", err.message);
      return res.status(500).json({
        message: "Database error.",
        error: err.message,
      });
    }

    // Get the current date and calculate the start date (12 months ago)
    const endDate = moment();
    const startDate = moment().subtract(12, "months");

    // Initialize an object to store the counts for each of the last 12 months
    const months = {};

    for (let i = 0; i < 12; i++) {
      const month = moment().subtract(i, "months").format("MMM");
      months[month] = 0;
    }

    const filteredManuscripts = rows.filter((manuscript) => {
      const createdAt = moment(manuscript.created_at);
      return createdAt.isBetween(startDate, endDate, "month", "[]"); // Inclusive range
    });

    const baseUrl = `${req.protocol}://${req.get("host")}/`;

    const manuscriptsWithUrl = filteredManuscripts.map((manuscript) => {
      // Replace backslashes with forward slashes
      const filePath = manuscript.filePath?.replace(/\\/g, "/");

      return {
        ...manuscript,
        fileUrl: `${baseUrl}${filePath}`,
      };
    });

    // Count manuscripts for each of the last 12 months
    manuscriptsWithUrl.forEach((manuscript) => {
      const month = moment(manuscript.created_at).format("MMM");
      if (months.hasOwnProperty(month)) {
        months[month] += 1;
      }
    });

    const formattedData = Object.keys(months)
      .reverse()
      .map((month) => ({
        name: month,
        uv: months[month].toString(),
      }));

    return res.status(200).json({
      data: formattedData,
      manuscripts: manuscriptsWithUrl,
    });
  });
};

exports.getManuscriptsByCoAuthor = (req, res) => {
  const { email } = req.query;

  // Validate email
  if (!email || typeof email !== "string") {
    return res.status(400).json({
      message: "Invalid email. It must be a non-empty string.",
    });
  }

  const query = `SELECT * FROM manuscripts`;

  // Execute the query
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error("Error retrieving manuscripts:", err.message);
      return res.status(500).json({
        message: "Database error.",
        error: err.message,
      });
    }

    // Filter manuscripts by checking the coauthor email
    const filteredManuscripts = rows.filter((manuscript) => {
      try {
        const coauthors = JSON.parse(manuscript.co_authors || "[]"); // Parse coauthor JSON
        return coauthors.some((coauthor) => coauthor.email === email); // Check if email matches
      } catch (parseError) {
        console.error(
          `Error parsing coauthor field for manuscript ID ${manuscript.id}:`,
          parseError.message
        );
        return false;
      }
    });

    // Get the base URL using req.protocol and req.get('host')
    const baseUrl = `${req.protocol}://${req.get("host")}`;

    // Add file URLs to the filtered manuscripts
    const manuscriptsWithUrls = filteredManuscripts.map((manuscript) => {
      let files = [];
      try {
        files = JSON.parse(manuscript.files || "[]").map((file) => {
          // Replace backslashes with forward slashes for file paths
          const filePath = file.filePath.replace(/\\/g, "/");
          return {
            ...file,
            fileUrl: `${baseUrl}/${filePath}`, // Construct the file URL
          };
        });
      } catch (fileError) {
        console.error(
          `Error parsing files for manuscript ID ${manuscript.id}:`,
          fileError.message
        );
      }

      return {
        ...manuscript,
        files, // Attach processed files with URLs
      };
    });

    // Return the filtered manuscripts with the file URLs
    return res.status(200).json({ data: manuscriptsWithUrls });
  });
};
exports.getManuscriptsByReviewRequest = (req, res) => {
  const { email } = req.query;

  // Validate email
  if (!email || typeof email !== "string") {
    return res.status(400).json({
      message: "Invalid email. It must be a non-empty string.",
    });
  }

  // SQL query to fetch all manuscripts
  const query = `SELECT * FROM manuscripts`;

  // Execute the query
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error("Error retrieving manuscripts:", err.message);
      return res.status(500).json({
        message: "Database error.",
        error: err.message,
      });
    }

    // Filter manuscripts by checking the coauthor email
    const filteredManuscripts = rows.filter((manuscript) => {
      try {
        const reviewers = JSON.parse(manuscript.suggestedReviewers || "[]"); // Parse coauthor JSON
        return reviewers.some((reviewer) => reviewer.email === email); // Check if email matches
      } catch (parseError) {
        console.error(
          `Error parsing coauthor field for manuscript ID ${manuscript.id}:`,
          parseError.message
        );
        return false;
      }
    });

    // Get the base URL using req.protocol and req.get('host')
    const baseUrl = `${req.protocol}://${req.get("host")}`;

    // Add file URLs to the filtered manuscripts
    const manuscriptsWithUrls = filteredManuscripts.map((manuscript) => {
      let files = [];
      try {
        files = JSON.parse(manuscript.files || "[]").map((file) => {
          // Replace backslashes with forward slashes for file paths
          const filePath = file.filePath.replace(/\\/g, "/");
          return {
            ...file,
            fileUrl: `${baseUrl}/${filePath}`, // Construct the file URL
          };
        });
      } catch (fileError) {
        console.error(
          `Error parsing files for manuscript ID ${manuscript.id}:`,
          fileError.message
        );
      }

      return {
        ...manuscript,
        files, // Attach processed files with URLs
      };
    });

    // Return the filtered manuscripts with the file URLs
    return res.status(200).json({ data: manuscriptsWithUrls });
  });
};

exports.updateManuscriptStatus = (req, res) => {
  const { id, status } = req.body; // Get status from the request body

  // Validate required fields
  if (!id || !status) {
    return res
      .status(400)
      .json({ message: "Manuscript ID and status are required." });
  }

  // SQL query to update the manuscript status
  const query = `
    UPDATE manuscripts
    SET status = ?
    WHERE id = ?
  `;

  const params = [status, id];

  db.run(query, params, function (err) {
    if (err) {
      console.error("Error updating manuscript status:", err.message);
      return res
        .status(500)
        .json({ message: "Database error.", error: err.message });
    }

    if (this.changes === 0) {
      return res.status(404).json({ message: "Manuscript not found." });
    }

    res.status(200).json({
      message: "Manuscript status updated successfully.",
      manuscriptId: id,
      updatedStatus: status,
    });
  });
};

exports.getManuscriptsByDraftAndStatus = (req, res) => {
  // Destructure query parameters
  const { isDraft, status } = req.query;

  const isDraftBoolean = isDraft === "true";

  if (!status || typeof status !== "string") {
    return res
      .status(400)
      .json({ message: "Invalid status value. It must be a string." });
  }

  // SQL query to fetch manuscripts along with user details
  const query = `
  SELECT 
    manuscripts.*, 
    users.id AS userId, 
    users.email AS userEmail,
    users.username AS userUsername
  FROM manuscripts
  JOIN users ON manuscripts.created_by = users.id
  WHERE manuscripts.isDraft = ? AND manuscripts.status = ?
`;

  const params = [isDraftBoolean ? 1 : 0, status];
  console.log("Params", params);

  // Execute the query
  db.all(query, params, (err, rows) => {
    if (err) {
      console.error("Error retrieving manuscripts:", err.message);
      return res
        .status(500)
        .json({ message: "Database error.", error: err.message });
    }

    // Map over rows to process file URLs
    const manuscriptsWithUrls = rows.map((manuscript) => {
      const fileDetails = JSON.parse(manuscript.files || "[]");

      const filesWithUrls = fileDetails.map((file) => {
        if (!file || !file.filePath) return file;

        const filePath = file.filePath.replace(/\\/g, "/");
        const fileUrl = `${req.protocol}://${req.get("host")}/${filePath}`;
        return { ...file, fileUrl };
      });

      return {
        ...manuscript,
        files: filesWithUrls,
        created_by: {
          id: manuscript.userId,
          email: manuscript.userEmail,
          username: manuscript.userUsername,
        },
      };
    });

    return res.status(200).json({ manuscripts: manuscriptsWithUrls });
  });
};

exports.getManuscriptsById = (req, res) => {
  const manuscriptId = req.params.id;

  // SQL query to fetch manuscript by ID along with user details
  const query = `
    SELECT 
      manuscripts.*, 
      users.id AS userId, 
      users.email AS userEmail,
      users.username AS userUsername
    FROM manuscripts
    JOIN users ON manuscripts.created_by = users.id
    WHERE manuscripts.id = ?
  `;

  // Execute the query
  db.get(query, [manuscriptId], (err, row) => {
    if (err) {
      console.error("Error fetching manuscript:", err.message);
      return res
        .status(500)
        .json({ message: "Database error.", error: err.message });
    }

    if (!row) {
      return res.status(404).json({ message: "Manuscript not found." });
    }

    // Process the manuscript data
    try {
      // Parse JSON fields
      const tags = JSON.parse(row.tags || "[]");
      const subjects = JSON.parse(row.subjects || "[]");
      const files = JSON.parse(row.files || "[]");
      const co_authors = JSON.parse(row.co_authors || "[]");
      const suggestedReviewers = JSON.parse(row.suggestedReviewers || "[]");

      // Generate file URLs
      const filesWithUrls = files.map((file) => {
        if (!file || !file.filePath) return file;

        const filePath = file.filePath.replace(/\\/g, "/");
        const fileUrl = `${req.protocol}://${req.get("host")}/${filePath}`;
        return { ...file, fileUrl };
      });

      // Structure the response
      const manuscriptWithUrls = {
        ...row,
        tags,
        subjects,
        files: filesWithUrls,
        co_authors,
        suggestedReviewers,
        created_by: {
          id: row.userId,
          email: row.userEmail,
          username: row.userUsername,
        },
      };

      // Send the response
      res.status(200).json(manuscriptWithUrls);
    } catch (parseError) {
      console.error("Error processing manuscript data:", parseError.message);
      return res
        .status(500)
        .json({
          message: "Error processing manuscript data.",
          error: parseError.message,
        });
    }
  });
};
