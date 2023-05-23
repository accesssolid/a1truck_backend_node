const multer = require('multer');
const path = require('path')

var storage = multer.memoryStorage()

const fileFilter = (req, file, cb) => {
  cb(null, true);
}

const upload_s3 = multer({
  fileFilter,
  storage
});

module.exports = upload_s3;