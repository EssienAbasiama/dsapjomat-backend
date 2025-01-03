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

  // Parse created_by as an integer
  const createdBy = parseInt(created_by, 10);

  // Validate created_by
  if (isNaN(createdBy)) {
    return res.status(400).json({
      message: "Invalid created_by value. It must be an integer.",
    });
  }

  // SQL query to fetch all manuscripts for the specific user
  const query = `
    SELECT * FROM manuscripts WHERE created_by = ?
  `;
  const params = [createdBy];

  // Execute the query
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

    // Generate keys for the last 12 months as short month names (e.g., "Jan", "Feb")
    for (let i = 0; i < 12; i++) {
      const month = moment().subtract(i, "months").format("MMM");
      months[month] = 0;
    }

    // Filter manuscripts to include only those within the last 12 months
    const filteredManuscripts = rows.filter((manuscript) => {
      const createdAt = moment(manuscript.created_at);
      return createdAt.isBetween(startDate, endDate, "month", "[]"); // Inclusive range
    });

    // Get the base URL using req.protocol and req.get('host')
    const baseUrl = `${req.protocol}://${req.get("host")}/`;

    // Add the complete file URL for each manuscript
    const manuscriptsWithUrl = filteredManuscripts.map((manuscript) => {
      // Replace backslashes with forward slashes
      const filePath = manuscript.filePath?.replace(/\\/g, "/");

      // Return the manuscript with an additional property for the complete file URL
      return {
        ...manuscript,
        fileUrl: `${baseUrl}${filePath}`, // Append the file path to the base URL
      };
    });

    // Count manuscripts for each of the last 12 months
    manuscriptsWithUrl.forEach((manuscript) => {
      const month = moment(manuscript.created_at).format("MMM"); // Format month as "MMM"
      if (months.hasOwnProperty(month)) {
        months[month] += 1; // Increment count for the corresponding month
      }
    });

    // Convert the months object into an array of the required format
    const formattedData = Object.keys(months)
      .reverse() // Reverse to maintain chronological order
      .map((month) => ({
        name: month,
        uv: months[month].toString(), // Convert count to string (if needed)
      }));

    // Return the formatted data along with the file URLs
    return res.status(200).json({
      data: formattedData,
      manuscripts: manuscriptsWithUrl, // Include the manuscripts with file URLs
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
