const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');

const uploadToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.downloader
    streamifier.createReadStream(fileBuffer).pipe(uploadStream);
  });
};

module.exports = uploadToCloudinary;
