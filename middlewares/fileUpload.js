const multer = require("multer");
const path = require("path");

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads/"); // Directory to save files
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName); // Save file with a unique name
  },
});

// File filter to validate file types (optional)
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["application/pdf", "application/msword", "text/plain"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only PDFs, Word documents, and text files are allowed."
      )
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
}).array("files", 10); // Allows uploading up to 10 files with the key "files"

module.exports = upload;
