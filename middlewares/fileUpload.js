const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Configure dynamic storage
let typeURL;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const type = typeURL || "manuscript"; // Determine type from request body
    console.log("type", type);
    const folder = type === "news" ? "./uploads/news" : "./uploads/manuscript";

    // Check if folder exists, and create it if it doesn't
    fs.mkdir(folder, { recursive: true }, (err) => {
      if (err) {
        console.error("Error creating folder:", err.message);
        return cb(err);
      }
      cb(null, folder); // Proceed with the folder path
    });
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName); // Save file with a unique name
  },
});

// Remove the file filter to allow any type of file
const fileFilter = (req, file, cb) => {
  // Simply accept all files without checking file types
  cb(null, true);
};

// Create a dynamic upload function based on request type
const upload = (req, res, next) => {
  const type = req.body.type || "manuscript";
  typeURL = type;
  let uploadMiddleware;

  if (type === "news") {
    console.log("ReqFile", "Im here");

    uploadMiddleware = multer({
      storage,
      fileFilter,
    }).single("image");
  } else {
    uploadMiddleware = multer({
      storage,
      fileFilter,
    }).array("files", 10);
  }

  // Call the chosen upload middleware
  uploadMiddleware(req, res, (err) => {
    if (err) {
      console.error("File processing error:", err.message);
      return res
        .status(400)
        .json({ message: "Error processing file", error: err.message });
    }
    next(); // Proceed to the next middleware
  });
};

module.exports = upload;
