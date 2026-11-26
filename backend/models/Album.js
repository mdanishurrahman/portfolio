const mongoose = require('mongoose');

const albumSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 100 },
    category: { type: String, trim: true, default: 'Photography', maxlength: 40 },
    description: { type: String, trim: true, default: '', maxlength: 300 },
    coverImage: { type: String, required: true, trim: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Album', albumSchema);
