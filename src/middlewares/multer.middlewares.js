import multer from "multer";
import path from "path";
import fs from "fs";

// Create the upload directory if it doesn't exist
const uploadDir = "./public/temp";
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

// File cleanup middleware
const handleFileCleanup = (req, res, next) => {
    const cleanupFiles = () => {
        if (req.files) {
            Object.values(req.files).forEach(fileArray => {
                fileArray.forEach(file => {
                    if (file.path && fs.existsSync(file.path)) {
                        fs.unlinkSync(file.path);
                    }
                });
            });
        }
    };

    // Cleanup files on response finish if there was an error
    res.on('finish', () => {
        if (res.statusCode >= 400) {
            cleanupFiles();
        }
    });

    next();
};

export const upload = multer({ 
    storage,
    limits: { fileSize: 5 * 1024 * 1024 } // Optional: limit file size to 5MB
});

export { handleFileCleanup };