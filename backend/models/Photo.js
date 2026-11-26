const mongoose = require('mongoose');

const photoSchema = new mongoose.Schema(
  {
    albumId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Album',
      required: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    caption: { type: String, trim: true, default: '', maxlength: 300 },
    imageUrl: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Photo', photoSchema);
