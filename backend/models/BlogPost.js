const mongoose = require('mongoose');

const blogPostSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    slug: { type: String, trim: true, lowercase: true },
    excerpt: { type: String, trim: true, default: '', maxlength: 500 },
    content: { type: String, trim: true, default: '' },
    image: { type: String, required: true, trim: true },
    dateLabel: { type: String, trim: true, default: '' },
    readTime: { type: String, trim: true, default: '5 min read' },
    featured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

blogPostSchema.pre('save', function (next) {
  if (!this.slug && this.title) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
  next();
});

module.exports = mongoose.model('BlogPost', blogPostSchema);
