const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true, trim: true },
    mimetype: { type: String, required: true },
    size: { type: Number, required: true },
    base64: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Media', mediaSchema);
