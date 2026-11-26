const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: 80,
    },
    role: {
      type: String,
      trim: true,
      default: 'Visitor',
      maxlength: 80,
    },
    comment: {
      type: String,
      required: [true, 'Comment is required'],
      trim: true,
      maxlength: 1000,
    },
    approved: {
      type: Boolean,
      default: true,
    },
    ipHash: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Comment', commentSchema);
