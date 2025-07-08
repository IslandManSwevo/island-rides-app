const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config();

class EmailService {
  constructor() {
    // Configure your email transport
    // For production, use a service like SendGrid, AWS SES, or Mailgun
    this.transporter = nodemailer.createTransport({
      // For development, you can use Gmail
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD // Use app-specific password for Gmail
      }
    });

    // For production, use something like:
    // this.transporter = nodemailer.createTransport({
    //   host: process.env.SMTP_HOST,
    //   port: process.env.SMTP_PORT,
    //   secure: true,
    //   auth: {
    //     user: process.env.SMTP_USER,
    //     pass: process.env.SMTP_PASS,
    //   },
    // });
  }

  async sendVerificationEmail(email, firstName, verificationToken) {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
    
    const mailOptions = {
      from: `"Island Rides" <${process.env.EMAIL_FROM || 'noreply@islandrides.com'}>`,
      to: email,
      subject: '🏝️ Verify Your Island Rides Account',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #00B8D4; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { 
              display: inline-block; 
              padding: 12px 30px; 
              background-color: #00B8D4; 
              color: white; 
              text-decoration: none; 
              border-radius: 5px; 
              font-weight: bold;
              margin: 20px 0;
            }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏝️ Welcome to Island Rides!</h1>
            </div>
            <div class="content">
              <h2>Hi ${firstName},</h2>
              <p>Thanks for signing up! We're excited to have you on board.</p>
              <p>Please verify your email address by clicking the button below:</p>
              <div style="text-align: center;">
                <a href="${verificationUrl}" class="button">Verify Email Address</a>
              </div>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; background-color: #eee; padding: 10px; border-radius: 5px;">
                ${verificationUrl}
              </p>
              <p>This link will expire in 24 hours.</p>
              <p>If you didn't create an account with Island Rides, you can safely ignore this email.</p>
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
              <p><strong>Why verify?</strong></p>
              <ul>
                <li>Secure your account</li>
                <li>Receive booking confirmations</li>
                <li>Get exclusive deals and updates</li>
              </ul>
            </div>
            <div class="footer">
              <p>© 2024 Island Rides. All rights reserved.</p>
              <p>Questions? Contact us at support@islandrides.com</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Welcome to Island Rides, ${firstName}!
        
        Please verify your email address by visiting:
        ${verificationUrl}
        
        This link will expire in 24 hours.
        
        If you didn't create an account with Island Rides, you can safely ignore this email.
      `
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Verification email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending verification email:', error);
      throw new Error('Failed to send verification email');
    }
  }

  async sendPasswordResetEmail(email, firstName, resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: `"Island Rides" <${process.env.EMAIL_FROM || 'noreply@islandrides.com'}>`,
      to: email,
      subject: '🔐 Reset Your Island Rides Password',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #F59E0B; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { 
              display: inline-block; 
              padding: 12px 30px; 
              background-color: #F59E0B; 
              color: white; 
              text-decoration: none; 
              border-radius: 5px; 
              font-weight: bold;
              margin: 20px 0;
            }
            .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Password Reset Request</h1>
            </div>
            <div class="content">
              <h2>Hi ${firstName},</h2>
              <p>We received a request to reset your password for your Island Rides account.</p>
              <p>Click the button below to create a new password:</p>
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </div>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; background-color: #eee; padding: 10px; border-radius: 5px;">
                ${resetUrl}
              </p>
              <div class="warning">
                <p><strong>⚠️ Important:</strong></p>
                <ul style="margin: 5px 0;">
                  <li>This link will expire in 2 hours</li>
                  <li>If you didn't request this reset, please ignore this email</li>
                  <li>Your password won't change until you create a new one</li>
                </ul>
              </div>
              <p>For security reasons, we recommend:</p>
              <ul>
                <li>Using a strong, unique password</li>
                <li>Not sharing your password with anyone</li>
                <li>Enabling two-factor authentication (coming soon!)</li>
              </ul>
            </div>
            <div class="footer">
              <p>© 2024 Island Rides. All rights reserved.</p>
              <p>Questions? Contact us at support@islandrides.com</p>
              <p>This email was sent to ${email}</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Hi ${firstName},
        
        We received a request to reset your password for your Island Rides account.
        
        Reset your password by visiting:
        ${resetUrl}
        
        This link will expire in 2 hours.
        
        If you didn't request this reset, please ignore this email.
        Your password won't change until you create a new one.
        
        Questions? Contact us at support@islandrides.com
      `
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Password reset email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw new Error('Failed to send password reset email');
    }
  }

  async sendWelcomeEmail(email, firstName) {
    const mailOptions = {
      from: `"Island Rides" <${process.env.EMAIL_FROM || 'noreply@islandrides.com'}>`,
      to: email,
      subject: '🎉 Welcome to Island Rides - Your Account is Verified!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #00B8D4; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { 
              display: inline-block; 
              padding: 12px 30px; 
              background-color: #00B8D4; 
              color: white; 
              text-decoration: none; 
              border-radius: 5px; 
              font-weight: bold;
              margin: 20px 0;
            }
            .feature { margin: 15px 0; padding-left: 30px; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome to Island Rides!</h1>
            </div>
            <div class="content">
              <h2>Hi ${firstName},</h2>
              <p>Your email has been verified successfully! You're all set to start exploring the beautiful islands of the Bahamas.</p>
              
              <h3>🚗 What you can do now:</h3>
              <div class="feature">✅ Browse vehicles in Nassau, Freeport, and Exuma</div>
              <div class="feature">✅ Book your perfect island ride</div>
              <div class="feature">✅ Chat with vehicle owners</div>
              <div class="feature">✅ Manage your bookings</div>
              
              <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL}/islands" class="button">Start Exploring</a>
              </div>
              
              <h3>🏝️ Popular Destinations:</h3>
              <ul>
                <li><strong>Nassau:</strong> Capital city with beaches, resorts, and cultural attractions</li>
                <li><strong>Freeport:</strong> Duty-free shopping, pristine beaches, and water sports</li>
                <li><strong>Exuma:</strong> Swimming pigs, iguanas, and crystal-clear waters</li>
              </ul>
              
              <p>Need help? Our support team is here for you at support@islandrides.com</p>
            </div>
            <div class="footer">
              <p>© 2024 Island Rides. All rights reserved.</p>
              <p>Follow us on social media for updates and special offers!</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Welcome email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending welcome email:', error);
      // Don't throw here - welcome email is not critical
      return { success: false, error: error.message };
    }
  }
}

module.exports = new EmailService();