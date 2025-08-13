// import { Resend } from 'resend';

// // Initialize Resend client (store API key in environment variables)
// const resend = new Resend('re_aVS4q3YB_DemdpmVNF7zUHDNPA4HKUmHp');

// /**
//  * Send email using Resend service (testing version)
//  * @param {Object} options - Email configuration
//  * @param {string|string[]} options.to - Recipient(s)
//  * @param {string} options.subject - Email subject
//  * @param {string} options.text - Plain text body
//  * @param {string} [options.html] - HTML body (optional)
//  * @param {string} [options.from] - Sender (optional)
//  * @returns {Promise<Object>} Send result
//  */
// export const sendEmail = async ({
//   to,
//   subject,
//   text,
//   from = 'ShopSmart <onboarding@resend.dev>', // Use Resend's test sender
// }) => {
//   try {
//     console.log('Preparing to send email to:', to);
//     console.log('Email subject:', subject);
//     console.log('From:', from);

//     const { data, error } = await resend.emails.send({
//       from: from,
//       to: Array.isArray(to) ? to : [to], // Ensure recipient is array
//       subject: subject,
//       text: text,
//     });

//     if (error) {
//       console.error('Error sending email:', error);
//       throw new Error(`Email sending failed: ${error.message}`);
//     }

//     console.log('Email sent successfully. Message ID:', data?.id);
//     return data;
//   } catch (error) {
//     console.error('Failed to send email:', error);
//     throw error; // Re-throw for calling function to handle
//   }
// };

import dotenv from 'dotenv';
dotenv.config();


import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // your gmail address
    pass: process.env.EMAIL_PASS, // app password (not your Gmail login password)
  },
});

export const sendEmail = async ({ to, subject, text }) => {
  try {
    const info = await transporter.sendMail({
      from: `"ShopSmart" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
    });
    console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Email send failed:', error);
    throw error;
  }
};
