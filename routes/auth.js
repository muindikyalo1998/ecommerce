// module.exports = router;
const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/user');
const router = express.Router();

// Generate JWT Token
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// Register User
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        status: 'fail',
        message: 'User already exists with this email'
      });
    }

    // Create new user
    const newUser = await User.create({
      name,
      email,
      password,
      phone,
      address
    });
    
    // Generate token
    const token = signToken(newUser._id);
    
    // Remove password from output
    newUser.password = undefined;
    
    res.status(201).json({
      status: 'success',
      token,
      data: {
        user: newUser
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
});

// Login User
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // 1) Check if email and password exist
    if (!email || !password) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide email and password'
      });
    }
    
    // 2) Check if user exists && password is correct
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.correctPassword(password, user.password))) {
      return res.status(401).json({
        status: 'fail',
        message: 'Incorrect email or password'
      });
    }
    
    // 3) If everything ok, send token to client
    const token = signToken(user._id);
    user.password = undefined;
    
    res.status(200).json({
      status: 'success',
      token,
      data: {
        user
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
});

// Get Current User
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        status: 'fail',
        message: 'You are not logged in'
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    
    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (error) {
    res.status(401).json({
      status: 'fail',
      message: 'Invalid token'
    });
  }
});

// Forgot Password - OTP Version with SSL Fix
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        status: 'fail',
        error: 'Email is required'
      });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if email exists or not for security
      return res.json({
        status: 'success',
        message: 'If the email exists, an OTP has been sent'
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = Date.now() + 600000; // 10 minutes

    // Save OTP to user
  //  / user.resetPasswordToken = otp;
    //user.resetPasswordExpires = otpExpiry;
    user.resetPasswordOTP = otp;        // Change Token → OTP
    user.resetPasswordExpires = otpExpiry;
    await user.save();

    // Create email transporter WITH SSL FIX
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      tls: {
        rejectUnauthorized: false // ← SSL BYPASS FOR DEVELOPMENT
      }
    });

    // Email content with OTP
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Password Reset OTP - Your E-Commerce Store',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #333; text-align: center;">Password Reset OTP</h2>
          <p>Hello ${user.name},</p>
          <p>You requested to reset your password. Use the OTP below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; display: inline-block; font-size: 32px; font-weight: bold; letter-spacing: 10px; color: #007bff;">
              ${otp}
            </div>
          </div>
          <p style="color: #666; font-size: 14px;">
            <strong>This OTP will expire in 10 minutes.</strong>
          </p>
          <p>If you didn't request this password reset, please ignore this email.</p>
        </div>
      `
    };

    // Send email
    await transporter.sendMail(mailOptions);

    // Log OTP for testing (remove in production)
    console.log('📧 OTP sent to', email, ':', otp);

    res.json({
      status: 'success',
      message: 'If the email exists, an OTP has been sent'
    });

  } catch (error) {
    console.error('Forgot password error:', error.message);
    
    res.status(500).json({
      status: 'fail',
      error: 'Error sending OTP email'
    });
  }
});

// Reset Password with OTP
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        status: 'fail',
        error: 'Email, OTP, and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        status: 'fail',
        error: 'Password must be at least 6 characters'
      });
    }

    // Find user with valid OTP
    const user = await User.findOne({
      email: email,
     // resetPasswordToken: otp,
      resetPasswordOTP: otp,    
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        status: 'fail',
        error: 'Invalid or expired OTP'
      });
    }

    // Update password and clear OTP
    user.password = newPassword;
    //user.resetPasswordToken = undefined;
    user.resetPasswordOTP = undefined;   // Change Token → OTP
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({
      status: 'success',
      message: 'Password reset successfully. You can now login with your new password.'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      status: 'fail',
      error: 'Error resetting password'
    });
  }
});

// NOTE: You can remove the old reset-password/:token route since we're using OTP now
// Or keep it for backward compatibility

// Check Admin
router.get('/check-admin', async (req, res) => {
  try {
    // Get token from header
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.json({ isAdmin: false });
    }

    // Verify token and get user
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    
    // Check if user is admin
    const isAdmin = user && user.isAdmin === true;
    
    res.json({ isAdmin });
  } catch (error) {
    res.json({ isAdmin: false });
  }
});

module.exports = router;