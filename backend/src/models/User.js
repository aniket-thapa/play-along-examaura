const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [60, 'Name must not exceed 60 characters'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      match: [/^\+?[\d\s\-()]{7,15}$/, 'Invalid phone number'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email address'],
    },
    gender: {
      type: String,
      required: [true, 'Gender is required'],
      enum: ['male', 'female', 'other', 'prefer_not_to_say'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    otp: {
      type: String,
      select: false,
    },
    otpExpiry: {
      type: Date,
      select: false,
    },
    otpAttempts: {
      type: Number,
      default: 0,
      select: false,
    },
    lastOtpSentAt: {
      type: Date,
      select: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

userSchema.index({ role: 1, isVerified: 1 });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.generateOTP = function () {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expMinutes = parseInt(process.env.OTP_EXPIRES_MINUTES) || 10;
  this.otp = otp;
  this.otpExpiry = new Date(Date.now() + expMinutes * 60 * 1000);
  this.otpAttempts = 0;
  this.lastOtpSentAt = new Date();
  return otp;
};

userSchema.methods.verifyOTP = function (inputOtp) {
  if (!this.otp || !this.otpExpiry)
    return { valid: false, reason: 'No OTP found' };
  if (this.otpAttempts >= 5)
    return { valid: false, reason: 'Too many attempts' };
  if (new Date() > this.otpExpiry)
    return { valid: false, reason: 'OTP expired' };
  if (this.otp !== inputOtp) {
    this.otpAttempts += 1;
    return { valid: false, reason: 'Invalid OTP' };
  }
  return { valid: true };
};

const User = mongoose.model('User', userSchema);
module.exports = User;
