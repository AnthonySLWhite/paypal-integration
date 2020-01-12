import nodemailer from 'nodemailer';
import { EMAIL_USER, EMAIL_PASS } from 'Constants/configs';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

export async function sendEmail({
  to = '',
  subject = '',
  body = '',
  html = '',
}) {
  transporter.sendMail({
    from: {
      address: EMAIL_USER,
      name: 'Anthony White',
    },
    to,
    subject,
    text: body,
    html,
  });
}
