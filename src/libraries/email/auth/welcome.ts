interface WelcomeEmailParams {
  name: string;
  email: string;
}

export const welcomeEmail = ({ name, email }: WelcomeEmailParams) => ({
  subject: 'Welcome to Our Platform!',
  html: `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome!</h1>
          </div>
          <div class="content">
            <h2>Hi ${name},</h2>
            <p>Thank you for joining us! We're excited to have you on board.</p>
            <p>Your account has been successfully created with the email: <strong>${email}</strong></p>
            <p>If you have any questions, feel free to reach out to our support team.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ModuleVerse. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `,
  text: `Hi ${name},\n\nThank you for joining us! Your account has been successfully created with the email: ${email}\n\nBest regards,\n${'ModuleVerse'} Team`,
});
