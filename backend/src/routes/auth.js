const express = require('express');
const User = require('../models/User');
const { sendOTPEmail } = require('../utils/email');
const { generateToken, authenticate } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validate');
const logger = require('../utils/logger');

const router = express.Router();

// POST /api/auth/register
router.post('/register', validate(schemas.register), async (req, res) => {
  try {
    const { name, phone, email, gender, password } = req.body;

    const existingUser = await User.findOne({ email }).select(
      '+otp +otpExpiry +isVerified',
    );
    if (existingUser) {
      if (existingUser.isVerified) {
        return res.status(409).json({
          success: false,
          message: 'Email already registered. Please login.',
        });
      }
      // Resend OTP for unverified account
      const otp = existingUser.generateOTP();
      await existingUser.save();
      await sendOTPEmail(email, existingUser.name, otp);
      return res.status(200).json({
        success: true,
        message: 'OTP resent to your email address',
        email,
      });
    }

    const user = new User({ name, phone, email, gender, password });
    const otp = user.generateOTP();
    await user.save();

    try {
      await sendOTPEmail(email, name, otp);
    } catch (emailError) {
      // Don't fail registration if email fails — log it
      logger.error('Failed to send OTP email:', emailError);
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful! Please verify your email.',
      email,
    });
  } catch (error) {
    logger.error('Register error:', error);
    if (error.code === 11000) {
      return res
        .status(409)
        .json({ success: false, message: 'Email already registered' });
    }
    res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.',
    });
  }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', validate(schemas.verifyOtp), async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email }).select(
      '+otp +otpExpiry +otpAttempts',
    );
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email',
      });
    }
    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email already verified. Please login.',
      });
    }

    const result = user.verifyOTP(otp);
    if (!result.valid) {
      await user.save();
      return res.status(400).json({ success: false, message: result.reason });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    user.otpAttempts = 0;
    await user.save();

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Email verified successfully!',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        gender: user.gender,
      },
    });
  } catch (error) {
    logger.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Verification failed. Please try again.',
    });
  }
});

// POST /api/auth/resend-otp
router.post('/resend-otp', validate(schemas.resendOtp), async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email }).select(
      '+otp +otpExpiry +lastOtpSentAt',
    );
    if (!user) {
      // Generic message for security
      return res.status(200).json({
        success: true,
        message: 'If the email exists, an OTP has been sent.',
      });
    }
    if (user.isVerified) {
      return res
        .status(400)
        .json({ success: false, message: 'Email already verified' });
    }

    // Rate limit: 60 seconds between resends
    if (user.lastOtpSentAt && Date.now() - user.lastOtpSentAt < 10 * 1000) {
      const wait = Math.ceil(
        (10 * 1000 - (Date.now() - user.lastOtpSentAt)) / 1000,
      );
      return res.status(429).json({
        success: false,
        message: `Please wait ${wait} seconds before resending`,
      });
    }

    const otp = user.generateOTP();
    await user.save();
    await sendOTPEmail(email, user.name, otp);

    res
      .status(200)
      .json({ success: true, message: 'OTP sent to your email address' });
  } catch (error) {
    logger.error('Resend OTP error:', error);
    res.status(500).json({ success: false, message: 'Failed to resend OTP' });
  }
});

// POST /api/auth/login
router.post('/login', validate(schemas.login), async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: 'Invalid email or password' });
    }
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is disabled. Contact support.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: 'Invalid email or password' });
    }

    if (!user.isVerified && user.role !== 'admin') {
      // Re-send OTP
      const otp = user.generateOTP();
      await user.save();
      try {
        await sendOTPEmail(email, user.name, otp);
      } catch (_) {}
      return res.status(403).json({
        success: false,
        message: 'Email not verified. A new OTP has been sent.',
        requiresVerification: true,
        email,
      });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        gender: user.gender,
        phone: user.phone,
      },
    });
  } catch (error) {
    logger.error('Login error:', error);
    res
      .status(500)
      .json({ success: false, message: 'Login failed. Please try again.' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, (req, res) => {
  res.status(200).json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      gender: req.user.gender,
      phone: req.user.phone,
    },
  });
});

module.exports = router;
