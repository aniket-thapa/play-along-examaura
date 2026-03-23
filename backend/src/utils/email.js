const nodemailer = require('nodemailer');
const logger = require('./logger');

let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: 465,
      secure: true, // process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }
  return transporter;
};

const sendOTPEmail = async (to, name, otp) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>QuizLive - Email Verification</title>
    </head>
    <body style="margin:0;padding:0;background:#0a0a0f;font-family:'Segoe UI',Arial,sans-serif;">
      <div style="max-width:480px;margin:0 auto;padding:40px 20px;">
        <div style="background:linear-gradient(135deg,#1a1a2e,#16213e);border:1px solid #00d4ff22;border-radius:16px;padding:40px;text-align:center;">
          <div style="width:60px;height:60px;background:linear-gradient(135deg,#00d4ff,#0066ff);border-radius:50%;margin:0 auto 20px;display:flex;align-items:center;justify-content:center;font-size:28px;">⚡</div>
          <h1 style="color:#ffffff;font-size:24px;margin:0 0 8px;font-weight:700;letter-spacing:-0.5px;">QuizLive</h1>
          <p style="color:#8892a4;font-size:14px;margin:0 0 32px;">Live Event Quiz Platform</p>
          
          <p style="color:#ccd6f6;font-size:16px;margin:0 0 8px;">Hi <strong style="color:#00d4ff;">${name}</strong>,</p>
          <p style="color:#8892a4;font-size:14px;margin:0 0 32px;line-height:1.6;">
            Welcome to QuizLive! Use the verification code below to confirm your account.
          </p>
          
          <div style="background:#0a0a0f;border:2px solid #00d4ff;border-radius:12px;padding:24px;margin:0 0 32px;">
            <p style="color:#8892a4;font-size:12px;text-transform:uppercase;letter-spacing:2px;margin:0 0 12px;">Your OTP Code</p>
            <div style="font-size:42px;font-weight:700;color:#00d4ff;letter-spacing:8px;font-family:monospace;">${otp}</div>
            <p style="color:#8892a4;font-size:12px;margin:12px 0 0;">Expires in ${process.env.OTP_EXPIRES_MINUTES || 10} minutes</p>
          </div>
          
          <p style="color:#8892a4;font-size:13px;margin:0;line-height:1.6;">
            If you didn't request this, please ignore this email.<br>
            Never share this code with anyone.
          </p>
        </div>
        <p style="color:#4a5568;font-size:12px;text-align:center;margin:20px 0 0;">
          © ${new Date().getFullYear()} QuizLive. All rights reserved.
        </p>
      </div>
    </body>
    </html>
  `;

  try {
    const info = await getTransporter().sendMail({
      from: `"QuizLive" <${process.env.EMAIL_USER}>`,
      to,
      subject: `${otp} - Your QuizLive Verification Code`,
      html,
    });
    logger.info(`OTP email sent to ${to}: ${info.messageId}`);
    return true;
  } catch (error) {
    logger.error('Email send error:', error);
    throw new Error('Failed to send verification email');
  }
};

module.exports = { sendOTPEmail };
