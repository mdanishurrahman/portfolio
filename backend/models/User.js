const crypto = require('crypto');
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: 60,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      default: 'user',
    },
  },
  { timestamps: true }
);

userSchema.statics.hashPassword = function (plainPassword) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(String(plainPassword), salt, 64).toString('hex');
  return `${salt}:${derived}`;
};

userSchema.methods.verifyPassword = function (plainPassword) {
  const parts = String(this.passwordHash || '').split(':');
  if (parts.length !== 2) return false;
  const [salt, storedHash] = parts;
  const derived = crypto.scryptSync(String(plainPassword), salt, 64);
  const storedBuf = Buffer.from(storedHash, 'hex');
  if (derived.length !== storedBuf.length) return false;
  return crypto.timingSafeEqual(derived, storedBuf);
};

module.exports = mongoose.model('User', userSchema);
