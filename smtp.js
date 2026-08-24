const nodemailer = require("nodemailer");

function getTransport() {
  const { MAIL_USERNAME, MAIL_PASSWORD, SMTP_HOST, SMTP_PORT } = process.env;

  if (!MAIL_USERNAME || !MAIL_PASSWORD) {
    throw new Error("Missing MAIL_USERNAME or MAIL_PASSWORD in .env");
  }

  return nodemailer.createTransport({
    host: SMTP_HOST || "smtp.gmail.com",
    port: Number(SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: MAIL_USERNAME,
      pass: MAIL_PASSWORD,
    },
  });
}

async function sendMail({ to, subject, text }) {
  const transport = getTransport();
  return transport.sendMail({
    from: process.env.MAIL_USERNAME,
    to,
    subject,
    text,
  });
}

module.exports = { sendMail };
