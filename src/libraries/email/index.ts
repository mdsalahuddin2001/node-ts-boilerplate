import configs from '@/configs';
import nodemailer, { Transporter } from 'nodemailer';
import logger from '@/libraries/log/logger';

interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: Array<{
    filename: string;
    content?: string | Buffer;
    path?: string;
  }>;
}

let transporter: Transporter | null = null;

const getTransporter = (): Transporter => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: configs.email.secure, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
};

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    const transporter = getTransporter();

    const mailOptions = {
      from: `"${configs.email.fromName}" <${configs.email.from}>`,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      cc: options.cc,
      bcc: options.bcc,
      attachments: options.attachments,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info('Email sent successfully', { messageId: info.messageId });
  } catch (error) {
    logger.error('Failed to send email', { error });
    throw error;
  }
};

export const verifyEmailConnection = async (): Promise<boolean> => {
  try {
    const transporter = getTransporter();
    await transporter.verify();
    logger.info('Email service connection verified');
    return true;
  } catch (error) {
    logger.error('Email service connection failed', { error });
    return false;
  }
};
