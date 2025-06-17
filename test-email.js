const nodemailer = require('nodemailer');

// Create a test account using the credentials you provided
const transporter = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: "ba72963b9c86a0",
    pass: "ec350028a46c37"
  }
});

// Use the same email you're using for password reset
const userEmail = 'bondrenishant8@gmail.com'; // Replace with the email you're using for testing

// Setup email data for password reset
const mailOptions = {
  from: 'noreply@test-vista.com',
  to: userEmail,
  subject: 'Password Reset Request',
  text: 'This is a test password reset email.',
  html: `
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
      <h1 style="margin: 0 0 20px; font-size: 24px; color: #2563eb; text-align: center;">
        Password Reset Request
      </h1>
      <p>Hello,</p>
      <p>We received a request to reset the password for your TEST VISTA account.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="http://localhost:5173/reset-password?token=test-token"
           style="display: inline-block; padding: 12px 25px; background-color: #2563eb; 
                  color: #ffffff; text-decoration: none; border-radius: 4px; 
                  font-weight: bold; font-size: 16px;">
          Reset Password
        </a>
      </div>
      <p>Test token: test-token</p>
    </div>
  `
};

// Send mail with defined transport object
transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    console.error('Error sending email:', error);
    return;
  }
  
  console.log('Password reset email sent successfully!');
  console.log('Message ID:', info.messageId);
  console.log('Response:', info.response);
}); 