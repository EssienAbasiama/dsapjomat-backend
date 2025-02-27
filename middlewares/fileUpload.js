const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

let type;
// 🔹 Configure Cloudinary with your API keys
cloudinary.config({
  cloud_name: "dzhohkjsb",
  api_key: "288433775233735",
  api_secret: "3qEGdK-GZ_WMeYTWItQAxgey41Y",
});

// 🔹 Setup Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    // type = type || "manuscript";
    console.log("req", req.body);
    return {
      folder: type === "news" ? "news_uploads" : "manuscript_uploads",
      public_id: `${Date.now()}-${file.originalname}`, // Unique file name
      resource_type: "auto", // Accept all file types
    };
  },
});

// 🔹 Define upload middleware
const upload = multer({ storage });

// 🔹 Middleware function to handle file uploads
const uploadMiddleware = (req, res, next) => {
  console.log("Request", req.body.type);
  type = req.body.type || "manuscript";

  const multerUpload =
    type === "news"
      ? upload.single("image") // Single file upload for "news"
      : upload.array("files", 10); // Multiple files for "manuscript"

  multerUpload(req, res, (err) => {
    if (err) {
      console.error("File processing error:", err);
      return res
        .status(400)
        .json({ message: "Error uploading file", error: err.message });
    }
    next(); // Proceed to next middleware
  });
};

module.exports = uploadMiddleware;
