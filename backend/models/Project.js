const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    category: { type: String, required: true, trim: true, maxlength: 40 },
    image: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Project', projectSchema);
