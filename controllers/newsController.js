const db = require("../config/database");

const upload = require("../middlewares/fileUpload");

exports.publishNews = (req, res) => {
  // Set type to 'news' for file upload
  req.body.type = "news";

  // Use the upload middleware for single file upload
  upload(req, res, (err) => {
    if (err) {
      console.error("File processing error:", err.message);
      return res
        .status(400)
        .json({ message: "Error processing file", error: err.message });
    }

    const { title, description, mainText, created_by, created_at } = req.body;
    const uploadedFile = req.file; // File uploaded for the news

    // Log the received body and uploaded file
    console.log("Parsed Body:", req.body);
    console.log("Uploaded File:", uploadedFile);

    // Validation checks for required fields
    if (!title || !description || !mainText || !uploadedFile) {
      const error =
        "All fields (title, description, main text, and file) are required.";
      console.error("Validation error:", error);
      return res.status(400).json({ message: error });
    }

    try {
      // Insert news data into the database
      db.run(
        `INSERT INTO news (title, description, main_text, created_by, created_at, image) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          title,
          description,
          mainText,
          created_by,
          created_at,
          uploadedFile.path,
        ], // Save the file path in the database
        function (err) {
          if (err) {
            console.error("Database error:", err.message);
            return res
              .status(500)
              .json({ message: "Database error", error: err.message });
          }
          console.log("News published successfully. ID:", this.lastID);
          return res.status(201).json({
            message: "News published successfully.",
            newsId: this.lastID,
          });
        }
      );
    } catch (error) {
      console.error("Unexpected error:", error.message);
      return res
        .status(500)
        .json({ message: "Unexpected error", error: error.message });
    }
  });
};

// Get News by ID
exports.getNewsById = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: "News ID is required." });
  }

  try {
    db.get(`SELECT * FROM news WHERE id = ?`, [id], (err, news) => {
      if (err) {
        return res
          .status(500)
          .json({ message: "Database error.", error: err.message });
      }

      if (!news) {
        return res.status(404).json({ message: "News not found." });
      }

      return res.status(200).json({ message: "News retrieved.", news });
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Get News by Created By
exports.getNewsByCreatedBy = async (req, res) => {
  const { created_by } = req.query;

  if (!created_by) {
    return res.status(400).json({ message: "Created_by is required." });
  }

  try {
    db.all(
      `SELECT * FROM news WHERE created_by = ? ORDER BY created_at DESC`,
      [created_by],
      (err, newsList) => {
        if (err) {
          return res
            .status(500)
            .json({ message: "Database error.", error: err.message });
        }

        if (newsList.length === 0) {
          return res
            .status(404)
            .json({ message: "No news found for the given creator." });
        }

        return res
          .status(200)
          .json({ message: "News retrieved.", news: newsList });
      }
    );
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Delete News
exports.deleteNews = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: "News ID is required." });
  }

  try {
    db.run(`DELETE FROM news WHERE id = ?`, [id], function (err) {
      if (err) {
        return res
          .status(500)
          .json({ message: "Database error.", error: err.message });
      }

      if (this.changes === 0) {
        return res.status(404).json({ message: "News not found." });
      }

      return res.status(200).json({ message: "News deleted successfully." });
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.getAllNews = (req, res) => {
  // Query to fetch all news along with the respective user's data
  const query = `
      SELECT news.*, users.id AS user_id, users.username AS users_username, users.email AS user_email,users.title AS user_title
      FROM news
      JOIN users ON news.created_by = users.id
    `;

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error("Database error:", err.message);
      return res
        .status(500)
        .json({ message: "Error fetching news", error: err.message });
    }

    if (rows.length === 0) {
      return res.status(404).json({ message: "No news found." });
    }

    // Map through the rows to structure the data
    const newsWithUsers = rows.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      main_text: row.main_text,
      image: row.image,
      created_by: {
        id: row.user_id,
        title: row.user_title,
        username: row.users_username,
        email: row.user_email,
      },
      created_at: row.created_at,
    }));

    res.status(200).json({
      message: "News fetched successfully.",
      news: newsWithUsers,
    });
  });
};
