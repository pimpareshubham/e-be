const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path'); // Import the 'path' module
const fs = require('fs')

// Define storage configuration for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

// Define file filter function
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === 'image/jpg' ||
    file.mimetype === 'image/png' ||
    file.mimetype === 'image/jpeg'
  ) {
    cb(null, true);
  } else {
    cb(null, false);
    res.status(400).json({ message: 'Allowed filetypes are jpg, jpeg, png' });
  }
};

// Create multer instance with storage and file filter
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 20,
  },
  fileFilter: fileFilter, // Use the fileFilter function
});

// POST route for uploading a file
router.post('/addproduct', upload.single('file'), (req, res) => {
  res.status(200).json({ fileName: req.file.filename });
});

// Define the downloadFile function
const downloadFile = (req, res) => {
  const fileName = req.params.filename;
  const filePath = path.join(__dirname, 'uploads', fileName); // Construct the file path

  res.download(filePath, (error) => {
    if (error) {
      res.status(400).json({ message: 'Cannot download file' });
    }
  });
};

// GET route for downloading a file
router.get('/files/:filename', downloadFile);

// Serve uploaded images
router.use('/uploads', express.static(path.join(__dirname, '../uploads')));

router.get('/files', (req, res) => {
  // Read the 'uploads' directory
  fs.readdir('uploads', (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'Error reading files' });
    }
    
    // If no files were found, you might want to handle this case too
    if (files.length === 0) {
      return res.status(200).json({ files: [] });
    }
    
    // Respond with the list of files
    res.status(200).json({ files });
  });
});

module.exports = router;
