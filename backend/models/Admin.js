const crypto = require('crypto');
const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      default: 'admin',
    },
  },
  { timestamps: true }
);

adminSchema.statics.hashPassword = function (plainPassword) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(String(plainPassword), salt, 64).toString('hex');
  return `${salt}:${derived}`;
};

adminSchema.methods.verifyPassword = function (plainPassword) {
  const parts = String(this.passwordHash || '').split(':');
  if (parts.length !== 2) return false;
  const [salt, storedHash] = parts;
  const derived = crypto.scryptSync(String(plainPassword), salt, 64);
  const storedBuf = Buffer.from(storedHash, 'hex');
  if (derived.length !== storedBuf.length) return false;
  return crypto.timingSafeEqual(derived, storedBuf);
};

module.exports = mongoose.model('Admin', adminSchema);
